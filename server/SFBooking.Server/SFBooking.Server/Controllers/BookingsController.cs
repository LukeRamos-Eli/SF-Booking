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

        // Postgres's "timestamp with time zone" columns require every
        // DateTime written to (or compared against, in a query parameter)
        // them to have Kind = Utc. A JSON date string with no "Z" or offset
        // (e.g. "2026-08-01T09:00:00") deserializes as Kind = Unspecified,
        // which Npgsql rejects outright rather than guessing what timezone
        // was meant. This normalizes any incoming DateTime to Utc kind
        // before it's ever used in a query or saved, regardless of how the
        // client formatted it.
        private static DateTime EnsureUtc(DateTime dt)
        {
            return dt.Kind switch
            {
                DateTimeKind.Utc => dt,
                DateTimeKind.Local => dt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc),
            };
        }

        // GET: api/bookings/mine
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
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
        {
            try
            {
                var startTime = EnsureUtc(dto.StartTime);
                var endTime = EnsureUtc(dto.EndTime);

                if (endTime <= startTime)
                    return BadRequest(new { message = "End time must be after start time." });

                if (startTime < DateTime.UtcNow)
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

                var hasConflict = await _context.Bookings.AnyAsync(b =>
                    b.FacilityId == dto.FacilityId &&
                    (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Approved) &&
                    b.StartTime < endTime &&
                    b.EndTime > startTime);

                if (hasConflict)
                    return BadRequest(new { message = "This facility is already booked or pending for that time slot." });

                var booking = new Booking
                {
                    FacilityId = dto.FacilityId,
                    RequestedById = userId,
                    StartTime = startTime,
                    EndTime = endTime,
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

        // PUT: api/bookings/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBookingDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var orgId = await GetCurrentUserOrgId();

                var booking = await _context.Bookings
                    .Include(b => b.Facility)
                    .FirstOrDefaultAsync(b => b.Id == id && b.Facility!.OrganizationId == orgId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found." });

                if (booking.RequestedById != userId)
                    return Forbid();

                if (booking.Status != BookingStatus.Pending)
                    return BadRequest(new { message = "Only pending bookings can be edited. Cancel and resubmit instead." });

                var newFacilityId = dto.FacilityId ?? booking.FacilityId;
                var newStart = dto.StartTime.HasValue ? EnsureUtc(dto.StartTime.Value) : booking.StartTime;
                var newEnd = dto.EndTime.HasValue ? EnsureUtc(dto.EndTime.Value) : booking.EndTime;
                var newPurpose = string.IsNullOrWhiteSpace(dto.Purpose) ? booking.Purpose : dto.Purpose;

                if (newEnd <= newStart)
                    return BadRequest(new { message = "End time must be after start time." });

                if (newStart < DateTime.UtcNow)
                    return BadRequest(new { message = "Cannot book a time in the past." });

                var facility = await _context.Facilities
                    .FirstOrDefaultAsync(f => f.Id == newFacilityId && f.OrganizationId == orgId);

                if (facility == null)
                    return NotFound(new { message = "Facility not found." });

                if (!facility.IsActive)
                    return BadRequest(new { message = "This facility is not currently active." });

                var hasConflict = await _context.Bookings.AnyAsync(b =>
                    b.Id != booking.Id &&
                    b.FacilityId == newFacilityId &&
                    (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Approved) &&
                    b.StartTime < newEnd &&
                    b.EndTime > newStart);

                if (hasConflict)
                    return BadRequest(new { message = "This facility is already booked or pending for that time slot." });

                booking.FacilityId = newFacilityId;
                booking.StartTime = newStart;
                booking.EndTime = newEnd;
                booking.Purpose = newPurpose;

                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = userId,
                    Action = "booking_edited",
                    TargetTable = "Bookings",
                    TargetId = booking.Id,
                    Details = $"Booking edited for facility '{facility.Name}'",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Booking updated.",
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

    public class UpdateBookingDto
    {
        public int? FacilityId { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Purpose { get; set; }
    }
}