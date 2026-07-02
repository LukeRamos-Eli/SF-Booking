using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SFBooking.Server.Data;

namespace SFBooking.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrganizationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrganizationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var organizations = await _context.Organizations
                    .Select(o => new { o.Id, o.Name, o.JoinCode, o.CreatedAt })
                    .ToListAsync();
                return Ok(organizations);
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
                var organization = await _context.Organizations
                    .Where(o => o.Id == id)
                    .Select(o => new { o.Id, o.Name, o.JoinCode, o.CreatedAt })
                    .FirstOrDefaultAsync();

                if (organization == null)
                    return NotFound(new { message = "Organization not found." });

                return Ok(organization);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrganizationDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest(new { message = "Organization name is required." });

                var joinCode = await GenerateJoinCodeAsync();

                var organization = new Organization
                {
                    Name = dto.Name,
                    JoinCode = joinCode,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Organizations.Add(organization);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = organization.Id }, new
                {
                    organization.Id,
                    organization.Name,
                    organization.JoinCode,
                    organization.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        [HttpGet("verify/{joinCode}")]
        public async Task<IActionResult> VerifyJoinCode(string joinCode)
        {
            try
            {
                var organization = await _context.Organizations
                    .Where(o => o.JoinCode == joinCode)
                    .Select(o => new { o.Id, o.Name, o.JoinCode })
                    .FirstOrDefaultAsync();

                if (organization == null)
                    return NotFound(new { message = "Invalid join code." });

                return Ok(organization);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Database temporarily unavailable.", error = ex.Message });
            }
        }

        private async Task<string> GenerateJoinCodeAsync()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            string code;

            do
            {
                code = new string(Enumerable.Repeat(chars, 8)
                    .Select(s => s[random.Next(s.Length)])
                    .ToArray());
            }
            while (await _context.Organizations.AnyAsync(o => o.JoinCode == code));

            return code;
        }
    }

    public class CreateOrganizationDto
    {
        public string Name { get; set; } = string.Empty;
    }
}