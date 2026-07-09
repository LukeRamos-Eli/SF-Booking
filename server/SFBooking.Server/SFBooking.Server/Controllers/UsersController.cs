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
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
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

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var users = await _context.Users
                    .Where(u => u.OrganizationId == orgId)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        u.CreatedAt
                    })
                    .OrderBy(u => u.CreatedAt)
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPending()
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var users = await _context.Users
                    .Where(u => u.OrganizationId == orgId && u.Status == AccountStatus.Pending)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        u.CreatedAt
                    })
                    .OrderBy(u => u.CreatedAt)
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpGet("admins")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdmins()
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();

                var admins = await _context.Users
                    .Where(u => u.OrganizationId == orgId && u.Role == UserRole.Admin)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(admins);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == orgId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                if (user.Status != AccountStatus.Pending)
                    return BadRequest(new { message = "User account is not pending." });

                user.Status = AccountStatus.Active;
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "account_approved",
                    TargetTable = "Users",
                    TargetId = id,
                    Details = $"Account approved for {user.FullName}",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"{user.FullName}'s account has been approved.",
                    user.Id,
                    user.FullName,
                    user.Email,
                    Status = user.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("{id}/deactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                if (id == currentUserId)
                    return BadRequest(new { message = "You cannot deactivate your own account." });

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == orgId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                if (user.Status == AccountStatus.Inactive)
                    return BadRequest(new { message = "User account is already inactive." });

                user.Status = AccountStatus.Inactive;
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "account_deactivated",
                    TargetTable = "Users",
                    TargetId = id,
                    Details = $"Account deactivated for {user.FullName}",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"{user.FullName}'s account has been deactivated.",
                    user.Id,
                    user.FullName,
                    Status = user.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto dto)
        {
            try
            {
                var orgId = await GetCurrentUserOrgId();
                var currentUserId = GetCurrentUserId();

                if (id == currentUserId)
                    return BadRequest(new { message = "You cannot change your own role." });

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == orgId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                if (!Enum.TryParse<UserRole>(dto.Role, true, out var newRole))
                    return BadRequest(new { message = "Invalid role. Valid roles: Student, Faculty, Manager, Admin" });

                var oldRole = user.Role.ToString();
                user.Role = newRole;
                await _context.SaveChangesAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    OrganizationId = orgId,
                    ActorId = currentUserId,
                    Action = "role_changed",
                    TargetTable = "Users",
                    TargetId = id,
                    Details = $"Role changed from {oldRole} to {newRole} for {user.FullName}",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"{user.FullName}'s role has been changed to {newRole}.",
                    user.Id,
                    user.FullName,
                    Role = user.Role.ToString(),
                    Status = user.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var userId = GetCurrentUserId();

                var user = await _context.Users
                    .Include(u => u.Organization)
                    .Where(u => u.Id == userId)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        OrganizationName = u.Organization!.Name,
                        u.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                    return NotFound(new { message = "User not found." });

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { message = "Full name and email are required." });

                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                if (dto.Email != user.Email)
                {
                    var emailTaken = await _context.Users
                        .AnyAsync(u => u.Email == dto.Email && u.Id != userId);
                    if (emailTaken)
                        return BadRequest(new { message = "Email is already in use." });
                }

                user.FullName = dto.FullName;
                user.Email = dto.Email;
                await _context.SaveChangesAsync();

                var organization = await _context.Organizations.FindAsync(user.OrganizationId);

                return Ok(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    Role = user.Role.ToString(),
                    Status = user.Status.ToString(),
                    OrganizationName = organization?.Name,
                    user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }

    public class ChangeRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}