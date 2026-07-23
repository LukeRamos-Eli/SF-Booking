using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SFBooking.Server.Data;
using System.Security.Claims;

namespace SFBooking.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FacilitiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FacilitiesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

        private async Task<int> GetCurrentUserOrgId()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            return user!.OrganizationId;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var facilities = await _context.Facilities
                    .Where(f => f.OrganizationId == orgId && f.IsActive)
                    .Select(f => new
                    {
                        f.Id, f.Name, f.Type,
                        Category = f.Category.ToString(),
                        f.Capacity, f.IsActive, f.CreatedAt
                    })
                    .OrderBy(f => f.Name).ToListAsync();

                return Ok(facilities);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var facility = await _context.Facilities
                    .Where(f => f.Id == id && f.OrganizationId == orgId)
                    .Select(f => new
                    {
                        f.Id, f.Name, f.Type,
                        Category = f.Category.ToString(),
                        f.Capacity, f.IsActive, f.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                return Ok(facility);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // GET: api/facilities/{id}/bookings
        [HttpGet("{id}/bookings")]
        public async Task<IActionResult> GetBookings(int id)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var facility = await _context.Facilities
                    .FirstOrDefaultAsync(f => f.Id == id && f.OrganizationId == orgId);

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                var bookings = await _context.Bookings
                    .Where(b => b.FacilityId == id &&
                                (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Approved) &&
                                b.EndTime > DateTime.UtcNow)
                    .OrderBy(b => b.StartTime)
                    .Select(b => new
                    {
                        b.Id,
                        b.StartTime,
                        b.EndTime,
                        Status = b.Status.ToString()
                    })
                    .ToListAsync();

                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable(
            [FromQuery] DateTime date,
            [FromQuery] TimeSpan startTime,
            [FromQuery] TimeSpan endTime)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var requestedStart = DateTime.SpecifyKind(date.Date + startTime, DateTimeKind.Utc);
                var requestedEnd = DateTime.SpecifyKind(date.Date + endTime, DateTimeKind.Utc);

                if (requestedEnd <= requestedStart)
                    return BadRequest(new { message = "End time must be after start time." });

                var allFacilities = await _context.Facilities
                    .Where(f => f.OrganizationId == orgId && f.IsActive)
                    .ToListAsync();

                var bookedFacilityIds = await _context.Bookings
                    .Where(b =>
                        b.Facility!.OrganizationId == orgId &&
                        b.Status == BookingStatus.Approved &&
                        b.StartTime < requestedEnd &&
                        b.EndTime > requestedStart)
                    .Select(b => b.FacilityId)
                    .Distinct()
                    .ToListAsync();

                var result = allFacilities.Select(f => new
                {
                    f.Id, f.Name, f.Type,
                    Category = f.Category.ToString(),
                    f.Capacity,
                    IsAvailable = !bookedFacilityIds.Contains(f.Id)
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreateFacilityDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest(new { message = "Facility name is required." });
                if (string.IsNullOrWhiteSpace(dto.Type))
                    return BadRequest(new { message = "Facility type is required." });
                if (dto.Capacity <= 0)
                    return BadRequest(new { message = "Capacity must be greater than 0." });
                if (!Enum.TryParse<FacilityCategory>(dto.Category, true, out var category))
                    return BadRequest(new { message = "Invalid category. Valid values: LibraryAndLearning, InnovationTechnologyAndResearch, SportsRecreationAndCommunity" });

                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                var exists = await _context.Facilities
                    .AnyAsync(f => f.OrganizationId == orgId &&
                        f.Name.ToLower() == dto.Name.ToLower());

                if (exists)
                    return BadRequest(new { message = "A facility with that name already exists." });

                var facility = new Facility
                {
                    OrganizationId = orgId,
                    Name = dto.Name,
                    Type = dto.Type,
                    Category = category,
                    Capacity = dto.Capacity,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Facilities.Add(facility);
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "facility_created",
                    TargetTable = "Facilities",
                    TargetId = facility.Id,
                    Details = $"Facility '{facility.Name}' created",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = facility.Id }, new
                {
                    facility.Id, facility.Name, facility.Type,
                    Category = facility.Category.ToString(),
                    facility.Capacity, facility.IsActive, facility.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFacilityDto dto)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                var facility = await _context.Facilities
                    .FirstOrDefaultAsync(f => f.Id == id && f.OrganizationId == orgId);

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                if (!string.IsNullOrWhiteSpace(dto.Name)) facility.Name = dto.Name;
                if (!string.IsNullOrWhiteSpace(dto.Type)) facility.Type = dto.Type;
                if (dto.Capacity.HasValue && dto.Capacity > 0) facility.Capacity = dto.Capacity.Value;
                if (!string.IsNullOrWhiteSpace(dto.Category))
                {
                    if (!Enum.TryParse<FacilityCategory>(dto.Category, true, out var category))
                        return BadRequest(new { message = "Invalid category. Valid values: LibraryAndLearning, InnovationTechnologyAndResearch, SportsRecreationAndCommunity" });
                    facility.Category = category;
                }

                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "facility_updated",
                    TargetTable = "Facilities",
                    TargetId = id,
                    Details = $"Facility '{facility.Name}' updated",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    facility.Id, facility.Name, facility.Type,
                    Category = facility.Category.ToString(),
                    facility.Capacity, facility.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                var facility = await _context.Facilities
                    .FirstOrDefaultAsync(f => f.Id == id && f.OrganizationId == orgId);

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                var hasActiveBookings = await _context.Bookings
                    .AnyAsync(b => b.FacilityId == id &&
                        (b.Status == BookingStatus.Pending ||
                         b.Status == BookingStatus.Approved) &&
                        b.EndTime > DateTime.UtcNow);

                if (hasActiveBookings)
                    return BadRequest(new { message = "Cannot delete a facility with active or pending bookings." });

                facility.IsActive = false;
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "facility_deactivated",
                    TargetTable = "Facilities",
                    TargetId = id,
                    Details = $"Facility '{facility.Name}' deactivated",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Facility '{facility.Name}' has been deactivated." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("{id}/reactivate")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Reactivate(int id)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                var facility = await _context.Facilities
                    .FirstOrDefaultAsync(f => f.Id == id && f.OrganizationId == orgId);

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                if (facility.IsActive)
                    return BadRequest(new { message = "Facility is already active." });

                facility.IsActive = true;
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "facility_reactivated",
                    TargetTable = "Facilities",
                    TargetId = id,
                    Details = $"Facility '{facility.Name}' reactivated",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Facility '{facility.Name}' has been reactivated." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }

    public class CreateFacilityDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Capacity { get; set; }
    }

    public class UpdateFacilityDto
    {
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Category { get; set; }
        public int? Capacity { get; set; }
    }
}