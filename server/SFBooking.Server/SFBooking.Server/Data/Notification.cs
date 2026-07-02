namespace SFBooking.Server.Data
{
    public enum NotificationType
    {
        ReservationConfirmation,
        ApprovalNotification,
        RejectionNotification
    }

    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }

        public int BookingId { get; set; }
        public Booking? Booking { get; set; }

        public NotificationType Type { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}