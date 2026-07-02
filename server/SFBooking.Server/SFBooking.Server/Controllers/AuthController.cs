using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SFBooking.Server.Data;
using SFBooking.Server.Services;

namespace SFBooking.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;

        public AuthController(AppDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
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
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email) ||
                    string.IsNullOrWhiteSpace(dto.Password))
                    return BadRequest(new { message = "Email and password are required." });

                var user = await _context.Users
                    .Include(u => u.Organization)
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    return Unauthorized(new { message = "Invalid email or password." });

                if (user.Status == AccountStatus.Pending)
                    return Unauthorized(new { message = "Your account is awaiting admin approval." });

                if (user.Status == AccountStatus.Inactive)
                    return Unauthorized(new { message = "Your account has been deactivated." });

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
}