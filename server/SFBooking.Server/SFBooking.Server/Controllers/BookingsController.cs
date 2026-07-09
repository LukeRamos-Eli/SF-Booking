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
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                     ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

        private async Task<int> GetCurrentUserOrgId()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            return user!.OrganizationId;
        }

        // GET: api/bookings/mine
        // Any logged in user - view own bookings
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            try
            {
                var userId = GetCurrentUserId();

                var bookings = await _context.Bookings
                    .Include(b => b.Facility)
                    .Where(b => b.RequestedById == userId)
                    .OrderByDescending(b => b.StartTime)
                    .Select(b => new
                    {
                        b.Id,
                        b.FacilityId,
                        FacilityName = b.Facility!.Name,
                        b.StartTime,
                        b.EndTime,
                        b.Purpose,
                        Status = b.Status.ToString(),
                        b.CreatedAt
                    })
                    .ToListAsync();

                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // GET: api/bookings
        // Admin/Manager only - view all bookings in the organization
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var bookings = await _context.Bookings
                    .Include(b => b.Facility)
                    .Include(b => b.RequestedBy)
                    .Where(b => b.Facility!.OrganizationId == orgId)
                    .OrderByDescending(b => b.CreatedAt)
                    .Select(b => new
                    {
                        b.Id,
                        b.FacilityId,
                        FacilityName = b.Facility!.Name,
                        b.RequestedById,
                        RequestedByName = b.RequestedBy!.FullName,
                        b.StartTime,
                        b.EndTime,
                        b.Purpose,
                        Status = b.Status.ToString(),
                        b.CreatedAt
                    })
                    .ToListAsync();

                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // GET: api/bookings/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var orgId = await GetCurrentUserOrgId();
                var isElevated = User.IsInRole("Admin") || User.IsInRole("Manager");

                var booking = await _context.Bookings
                    .Include(b => b.Facility)
                    .Include(b => b.RequestedBy)
                    .FirstOrDefaultAsync(b => b.Id == id && b.Facility!.OrganizationId == orgId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found." });

                if (!isElevated && booking.RequestedById != userId)
                    return Forbid();

                return Ok(new
                {
                    booking.Id,
                    booking.FacilityId,
                    FacilityName = booking.Facility!.Name,
                    booking.RequestedById,
                    RequestedByName = booking.RequestedBy!.FullName,
                    booking.StartTime,
                    booking.EndTime,
                    booking.Purpose,
                    Status = booking.Status.ToString(),
                    booking.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // POST: api/bookings
        // Any logged in user - submit a booking request
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
        {
            try
            {
                if (dto.EndTime <= dto.StartTime)
                    return BadRequest(new { message = "End time must be after start time." });

                if (dto.StartTime < DateTime.UtcNow)
                    return BadRequest(new { message = "Cannot book a time in the past." });

                if (string.IsNullOrWhiteSpace(dto.Purpose))
                    return BadRequest(new { message = "Purpose is required." });

                var orgId = await GetCurrentUserOrgId();
                var userId = GetCurrentUserId();

                var facility = await _context.Facilities
                    .FirstOrDefaultAsync(f => f.Id == dto.FacilityId && f.OrganizationId == orgId);

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                if (!facility.IsActive)
                    return BadRequest(new { message = "This facility is not currently active." });

                // Conflict detection: block overlap with any Pending or Approved booking
                var hasConflict = await _context.Bookings.AnyAsync(b =>
                    b.FacilityId == dto.FacilityId &&
                    (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Approved) &&
                    b.StartTime < dto.EndTime &&
                    b.EndTime > dto.StartTime);

                if (hasConflict)
                    return BadRequest(new { message = "This facility is already booked or pending for that time slot." });

                var booking = new Booking
                {
                    FacilityId = dto.FacilityId,
                    RequestedById = userId,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    Purpose = dto.Purpose,
                    Status = BookingStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = userId,
                    Action = "booking_requested",
                    TargetTable = "Bookings",
                    TargetId = booking.Id,
                    Details = $"Booking requested for facility '{facility.Name}'",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = booking.Id }, new
                {
                    message = "Booking request submitted. Await approval.",
                    booking.Id,
                    FacilityName = facility.Name,
                    booking.StartTime,
                    booking.EndTime,
                    booking.Purpose,
                    Status = booking.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // PUT: api/bookings/{id}/cancel
        // Owner only - cancel own pending or approved booking
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var booking = await _context.Bookings
                    .Include(b => b.Facility)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (booking == null)
                    return NotFound(new { message = "Booking not found." });

                if (booking.RequestedById != userId)
                    return Forbid();

                if (booking.Status == BookingStatus.Cancelled)
                    return BadRequest(new { message = "Booking is already cancelled." });

                if (booking.Status == BookingStatus.Rejected)
                    return BadRequest(new { message = "Cannot cancel a rejected booking." });

                booking.Status = BookingStatus.Cancelled;
                await _context.SaveChangesAsync();

                var orgId = await GetCurrentUserOrgId();
                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = userId,
                    Action = "booking_cancelled",
                    TargetTable = "Bookings",
                    TargetId = id,
                    Details = "Booking cancelled by requester",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new { message = "Booking cancelled.", booking.Id, Status = booking.Status.ToString() });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }

    public class CreateBookingDto
    {
        public int FacilityId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Purpose { get; set; } = string.Empty;
    }
}