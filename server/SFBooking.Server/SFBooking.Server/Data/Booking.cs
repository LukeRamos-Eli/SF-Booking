namespace SFBooking.Server.Data
{
    public enum BookingStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    public class Booking
    {
        public int Id { get; set; }
        public int FacilityId { get; set; }
        public Facility? Facility { get; set; }

        public int RequestedById { get; set; }
        public User? RequestedBy { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}