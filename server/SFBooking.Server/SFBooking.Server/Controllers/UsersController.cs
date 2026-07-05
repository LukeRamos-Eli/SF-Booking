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

        // Helper: get current logged in user's ID from JWT token
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                     ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

        // Helper: get current user's organization ID
        private async Task<int> GetCurrentUserOrgId()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            return user!.OrganizationId;
        }

        // GET: api/users
        // Admin and Manager only - get all users in their organization
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

        // GET: api/users/pending
        // Admin only - get all pending accounts
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

        // GET: api/users/admins
        // Admin only - get all admins in the organization
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

        // PUT: api/users/{id}/approve
        // Admin only - approve a pending account
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

                // Log to audit trail
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

        // PUT: api/users/{id}/deactivate
        // Admin only - deactivate a user account
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

        // PUT: api/users/{id}/role
        // Admin only - change a user's role
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

        // GET: api/users/me
        // Any logged in user - get own profile
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

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
                string.IsNullOrWhiteSpace(dto.NewPassword) ||
                string.IsNullOrWhiteSpace(dto.ConfirmPassword))
            {
                return BadRequest(new { message = "All fields are required." });
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest(new { message = "New password and confirm password do not match." });
            }

            if (dto.NewPassword.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long." });
            }

            var userId = GetCurrentUserId();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }


    }



    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }




    public class ChangeRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }




}