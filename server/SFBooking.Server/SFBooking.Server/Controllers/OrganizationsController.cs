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

        // GET: api/organizations
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var organizations = await _context.Organizations
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.JoinCode,
                    o.CreatedAt
                })
                .ToListAsync();

            return Ok(organizations);
        }

        // GET: api/organizations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var organization = await _context.Organizations
                .Where(o => o.Id == id)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.JoinCode,
                    o.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (organization == null)
                return NotFound(new { message = "Organization not found." });

            return Ok(organization);
        }

        // POST: api/organizations
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrganizationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Organization name is required." });

            var organization = new Organization
            {
                Name = dto.Name,
                JoinCode = GenerateJoinCode(),
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

        // GET: api/organizations/verify/{joinCode}
        [HttpGet("verify/{joinCode}")]
        public async Task<IActionResult> VerifyJoinCode(string joinCode)
        {
            var organization = await _context.Organizations
                .Where(o => o.JoinCode == joinCode)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.JoinCode
                })
                .FirstOrDefaultAsync();

            if (organization == null)
                return NotFound(new { message = "Invalid join code." });

            return Ok(organization);
        }

        // Helper: generate a unique 8-character join code
        private string GenerateJoinCode()
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
            while (_context.Organizations.Any(o => o.JoinCode == code));

            return code;
        }
    }

    // DTO (Data Transfer Object) for creating an organization
    public class CreateOrganizationDto
    {
        public string Name { get; set; } = string.Empty;
    }
}