namespace SFBooking.Server.Data
{
    public class Organization
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string JoinCode { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<User> Users { get; set; } = new();
        public List<Facility> Facilities { get; set; } = new();
    }
}