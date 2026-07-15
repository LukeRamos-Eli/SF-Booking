using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SFBooking.Server.Data;
using System.Security.Claims;

namespace SFBooking.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
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

        // GET: api/auditlogs
        // Admin only - full activity trail for the organization, most recent first.
        // Optional query params: action (filter by action type), limit (cap result count).
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? action, [FromQuery] int? limit)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var query = _context.AuditLogs
                    .Include(a => a.Actor)
                    .Where(a => a.OrganizationId == orgId);

                if (!string.IsNullOrWhiteSpace(action))
                    query = query.Where(a => a.Action == action);

                var ordered = query
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => new
                    {
                        a.Id,
                        a.ActorId,
                        ActorName = a.Actor != null ? a.Actor.FullName : "Unknown",
                        a.Action,
                        a.TargetTable,
                        a.TargetId,
                        a.Details,
                        a.CreatedAt
                    });

                var logs = limit.HasValue
                    ? await ordered.Take(limit.Value).ToListAsync()
                    : await ordered.ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }
}