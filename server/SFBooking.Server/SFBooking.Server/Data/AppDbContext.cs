using Microsoft.EntityFrameworkCore;

namespace SFBooking.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Facility> Facilities => Set<Facility>();
        public DbSet<Booking> Bookings => Set<Booking>();
        public DbSet<Approval> Approvals => Set<Approval>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    }
}