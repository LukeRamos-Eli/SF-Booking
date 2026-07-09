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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                     ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

        // GET: api/notifications
        // Logged in user - view own notifications, most recent first
        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            try
            {
                var userId = GetCurrentUserId();

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        n.Id,
                        n.BookingId,
                        Type = n.Type.ToString(),
                        n.Message,
                        n.IsRead,
                        n.CreatedAt
                    })
                    .ToListAsync();

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // GET: api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = GetCurrentUserId();

                var count = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // PUT: api/notifications/{id}/read
        // Owner only - mark a single notification as read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

                if (notification == null)
                    return NotFound(new { message = "Notification not found." });

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Notification marked as read.", notification.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // PUT: api/notifications/read-all
        // Owner only - mark all own notifications as read
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = GetCurrentUserId();

                var unread = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var n in unread)
                    n.IsRead = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = $"{unread.Count} notification(s) marked as read." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }
}