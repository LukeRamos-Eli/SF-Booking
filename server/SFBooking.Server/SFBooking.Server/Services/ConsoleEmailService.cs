namespace SFBooking.Server.Services
{
    // TEMPORARY implementation. No real email provider is configured for this
    // project yet, so this just logs the reset link to the console/output
    // window instead of actually emailing the user. Swap the DI registration
    // in Program.cs (builder.Services.AddScoped<IEmailService, ...>) for a
    // real implementation - e.g. SendGrid, Mailgun, or SMTP via
    // System.Net.Mail - once you have provider credentials. AuthController
    // doesn't need to change at all when you do that swap.
    public class ConsoleEmailService : IEmailService
    {
        private readonly ILogger<ConsoleEmailService> _logger;

        public ConsoleEmailService(ILogger<ConsoleEmailService> logger)
        {
            _logger = logger;
        }

        public Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken)
        {
            _logger.LogWarning(
                "[DEV EMAIL STUB] Password reset requested for {Email} ({FullName}). " +
                "Reset token (would normally be emailed as a link): {Token}",
                toEmail, fullName, resetToken);

            return Task.CompletedTask;
        }
    }
}