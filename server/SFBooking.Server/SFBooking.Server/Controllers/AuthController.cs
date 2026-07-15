using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SFBooking.Server.Data;
using SFBooking.Server.Services;
using System.Security.Claims;
using System.Security.Cryptography;

namespace SFBooking.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly LoginAttemptTracker _loginTracker;

        public AuthController(
            AppDbContext context,
            JwtService jwtService,
            IEmailService emailService,
            LoginAttemptTracker loginTracker)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _loginTracker = loginTracker;
        }

        [HttpPost("register")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email) ||
                    string.IsNullOrWhiteSpace(dto.Password) ||
                    string.IsNullOrWhiteSpace(dto.FullName) ||
                    string.IsNullOrWhiteSpace(dto.JoinCode))
                    return BadRequest(new { message = "All fields are required." });

                var organization = await _context.Organizations
                    .FirstOrDefaultAsync(o => o.JoinCode == dto.JoinCode);

                if (organization == null)
                    return BadRequest(new { message = "Invalid join code." });

                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (existingUser != null)
                    return BadRequest(new { message = "Email already registered." });

                var user = new User
                {
                    FullName = dto.FullName,
                    Email = dto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    OrganizationId = organization.Id,
                    Role = UserRole.Student,
                    Status = AccountStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Registration successful. Await admin approval.",
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.Status,
                    OrganizationName = organization.Name
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPost("login")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email) ||
                    string.IsNullOrWhiteSpace(dto.Password))
                    return BadRequest(new { message = "Email and password are required." });

                var (locked, retryAfter) = _loginTracker.IsLocked(dto.Email);
                if (locked)
                {
                    Response.Headers["Retry-After"] = ((int)(retryAfter?.TotalSeconds ?? 0)).ToString();
                    return StatusCode(429, new
                    {
                        message = $"Too many failed login attempts. Try again in {Math.Ceiling(retryAfter!.Value.TotalMinutes)} minute(s)."
                    });
                }

                var user = await _context.Users
                    .Include(u => u.Organization)
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                {
                    _loginTracker.RecordFailure(dto.Email);
                    return Unauthorized(new { message = "Invalid email or password." });
                }

                if (user.Status == AccountStatus.Pending)
                    return Unauthorized(new { message = "Your account is awaiting admin approval." });

                if (user.Status == AccountStatus.Inactive)
                    return Unauthorized(new { message = "Your account has been deactivated." });

                _loginTracker.RecordSuccess(dto.Email);

                var token = _jwtService.GenerateToken(user, user.Organization!.Name);

                return Ok(new
                {
                    message = "Login successful.",
                    token,
                    user.Id,
                    user.FullName,
                    user.Email,
                    role = user.Role.ToString(),
                    user.Status,
                    OrganizationName = user.Organization.Name
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
                    string.IsNullOrWhiteSpace(dto.NewPassword) ||
                    string.IsNullOrWhiteSpace(dto.ConfirmPassword))
                    return BadRequest(new { message = "All fields are required." });

                if (dto.NewPassword != dto.ConfirmPassword)
                    return BadRequest(new { message = "New password and confirm password do not match." });

                if (dto.NewPassword.Length < 8)
                    return BadRequest(new { message = "Password must be at least 8 characters long." });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value!);

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                    return BadRequest(new { message = "Current password is incorrect." });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // POST: api/auth/forgot-password
        // Public. Generates a single-use reset token valid for 30 minutes
        // and "emails" it (currently via the console stub - see
        // Services/ConsoleEmailService.cs). Always returns the same generic
        // response whether or not the email exists, so this endpoint can't
        // be used to figure out which emails are registered.
        [HttpPost("forgot-password")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { message = "Email is required." });

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user != null)
                {
                    var tokenBytes = RandomNumberGenerator.GetBytes(32);
                    var token = Convert.ToHexString(tokenBytes);

                    user.PasswordResetToken = token;
                    user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
                    await _context.SaveChangesAsync();

                    await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, token);
                }

                // Same message regardless of whether the email was found -
                // don't leak which emails are registered.
                return Ok(new { message = "If that email is registered, a password reset link has been sent." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        // POST: api/auth/reset-password
        // Public. Consumes the token generated by forgot-password. Token is
        // cleared after use (or after expiry check fails) so it can't be
        // replayed.
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Token) ||
                    string.IsNullOrWhiteSpace(dto.NewPassword) ||
                    string.IsNullOrWhiteSpace(dto.ConfirmPassword))
                    return BadRequest(new { message = "All fields are required." });

                if (dto.NewPassword != dto.ConfirmPassword)
                    return BadRequest(new { message = "New password and confirm password do not match." });

                if (dto.NewPassword.Length < 8)
                    return BadRequest(new { message = "Password must be at least 8 characters long." });

                var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == dto.Token);

                if (user == null || user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "This reset link is invalid or has expired. Request a new one." });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Password has been reset. You can now sign in with your new password." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }
    }

    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string JoinCode { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}