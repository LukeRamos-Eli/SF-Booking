namespace SFBooking.Server.Data
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public int ActorId { get; set; }
        public User? Actor { get; set; }

        public string Action { get; set; } = string.Empty;
        public string TargetTable { get; set; } = string.Empty;
        public int TargetId { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}