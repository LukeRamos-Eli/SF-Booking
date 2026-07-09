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
    public class ApprovalsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ApprovalsController(AppDbContext context)
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

        // GET: api/approvals
        // Admin/Manager only - view approval history for the organization
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var approvals = await _context.Approvals
                    .Include(a => a.Booking)!.ThenInclude(b => b!.Facility)
                    .Include(a => a.Booking)!.ThenInclude(b => b!.RequestedBy)
                    .Include(a => a.ReviewedBy)
                    .Where(a => a.Booking!.Facility!.OrganizationId == orgId)
                    .OrderByDescending(a => a.ReviewedAt)
                    .Select(a => new
                    {
                        a.Id,
                        a.BookingId,
                        FacilityName = a.Booking!.Facility!.Name,
                        RequestedByName = a.Booking.RequestedBy!.FullName,
                        a.ReviewedById,
                        ReviewedByName = a.ReviewedBy!.FullName,
                        Decision = a.Decision.ToString(),
                        a.Remarks,
                        a.IsOverride,
                        a.ReviewedAt
                    })
                    .ToListAsync();

                return Ok(approvals);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // PUT: api/approvals/{bookingId}/approve
        // Admin/Manager only - approve a pending booking
        [HttpPut("{bookingId}/approve")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Approve(int bookingId, [FromBody] ApprovalDecisionDto dto)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var reviewerId = GetCurrentUserId();

                var booking = await _context.Bookings
                    .Include(b => b.Facility)
                    .Include(b => b.RequestedBy)
                    .FirstOrDefaultAsync(b => b.Id == bookingId && b.Facility!.OrganizationId == orgId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found." });

                if (booking.Status != BookingStatus.Pending)
                    return BadRequest(new { message = "Only pending bookings can be approved." });

                booking.Status = BookingStatus.Approved;
                await _context.SaveChangesAsync();

                var approval = new Approval
                {
                    BookingId = booking.Id,
                    ReviewedById = reviewerId,
                    Decision = ApprovalDecision.Approved,
                    Remarks = dto.Remarks,
                    IsOverride = false,
                    ReviewedAt = DateTime.UtcNow
                };
                _context.Approvals.Add(approval);

                _context.Notifications.Add(new Notification
                {
                    UserId = booking.RequestedById,
                    BookingId = booking.Id,
                    Type = NotificationType.ApprovalNotification,
                    Message = $"Your booking for {booking.Facility!.Name} on {booking.StartTime:MMM d, h:mm tt} has been approved.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = reviewerId,
                    Action = "booking_approved",
                    TargetTable = "Bookings",
                    TargetId = booking.Id,
                    Details = $"Booking for '{booking.Facility!.Name}' approved",
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Booking approved.",
                    booking.Id,
                    Status = booking.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // PUT: api/approvals/{bookingId}/reject
        // Admin/Manager only - reject a pending booking, remarks required
        [HttpPut("{bookingId}/reject")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Reject(int bookingId, [FromBody] ApprovalDecisionDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Remarks))
                    return BadRequest(new { message = "Remarks are required when rejecting a booking." });

                var orgId = await GetCurrentUserOrgId();
                var reviewerId = GetCurrentUserId();

                var booking = await _context.Bookings
                    .Include(b => b.Facility)
                    .Include(b => b.RequestedBy)
                    .FirstOrDefaultAsync(b => b.Id == bookingId && b.Facility!.OrganizationId == orgId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found." });

                if (booking.Status != BookingStatus.Pending)
                    return BadRequest(new { message = "Only pending bookings can be rejected." });

                booking.Status = BookingStatus.Rejected;
                await _context.SaveChangesAsync();

                _context.Approvals.Add(new Approval
                {
                    BookingId = booking.Id,
                    ReviewedById = reviewerId,
                    Decision = ApprovalDecision.Rejected,
                    Remarks = dto.Remarks,
                    IsOverride = false,
                    ReviewedAt = DateTime.UtcNow
                });

                _context.Notifications.Add(new Notification
                {
                    UserId = booking.RequestedById,
                    BookingId = booking.Id,
                    Type = NotificationType.RejectionNotification,
                    Message = $"Your booking for {booking.Facility!.Name} on {booking.StartTime:MMM d, h:mm tt} was rejected: {dto.Remarks}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = reviewerId,
                    Action = "booking_rejected",
                    TargetTable = "Bookings",
                    TargetId = booking.Id,
                    Details = $"Booking for '{booking.Facility!.Name}' rejected: {dto.Remarks}",
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Booking rejected.",
                    booking.Id,
                    Status = booking.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // PUT: api/approvals/{bookingId}/override
        // Admin only - override an already-approved booking, remarks required
        [HttpPut("{bookingId}/override")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Override(int bookingId, [FromBody] ApprovalDecisionDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Remarks))
                    return BadRequest(new { message = "Remarks are required when overriding an approved booking." });

                var orgId = await GetCurrentUserOrgId();
                var reviewerId = GetCurrentUserId();

                var booking = await _context.Bookings
                    .Include(b => b.Facility)
                    .Include(b => b.RequestedBy)
                    .FirstOrDefaultAsync(b => b.Id == bookingId && b.Facility!.OrganizationId == orgId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found." });

                if (booking.Status != BookingStatus.Approved)
                    return BadRequest(new { message = "Only approved bookings can be overridden." });

                booking.Status = BookingStatus.Rejected;
                await _context.SaveChangesAsync();

                _context.Approvals.Add(new Approval
                {
                    BookingId = booking.Id,
                    ReviewedById = reviewerId,
                    Decision = ApprovalDecision.Rejected,
                    Remarks = dto.Remarks,
                    IsOverride = true,
                    ReviewedAt = DateTime.UtcNow
                });

                _context.Notifications.Add(new Notification
                {
                    UserId = booking.RequestedById,
                    BookingId = booking.Id,
                    Type = NotificationType.RejectionNotification,
                    Message = $"Your previously approved booking for {booking.Facility!.Name} on {booking.StartTime:MMM d, h:mm tt} has been overridden: {dto.Remarks}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = reviewerId,
                    Action = "booking_overridden",
                    TargetTable = "Bookings",
                    TargetId = booking.Id,
                    Details = $"Approved booking for '{booking.Facility!.Name}' overridden: {dto.Remarks}",
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Booking approval overridden.",
                    booking.Id,
                    Status = booking.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }

    public class ApprovalDecisionDto
    {
        public string? Remarks { get; set; }
    }
}