namespace SFBooking.Server.Data
{
    public enum UserRole
    {
        Student,
        Faculty,
        Manager,
        Admin
    }

    public enum AccountStatus
    {
        Pending,
        Active,
        Inactive
    }

    public class User
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public AccountStatus Status { get; set; } = AccountStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Added for the forgot/reset password flow
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
    }
}