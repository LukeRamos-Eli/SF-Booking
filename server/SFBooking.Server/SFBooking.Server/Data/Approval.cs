namespace SFBooking.Server.Data
{
    public enum ApprovalDecision
    {
        Approved,
        Rejected
    }

    public class Approval
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public Booking? Booking { get; set; }

        public int ReviewedById { get; set; }
        public User? ReviewedBy { get; set; }

        public ApprovalDecision Decision { get; set; }
        public string? Remarks { get; set; }
        public bool IsOverride { get; set; } = false;
        public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
    }
}