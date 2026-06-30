namespace SFBooking.Server.Data
{
    public class Facility
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}