using SendGrid;
using SendGrid.Helpers.Mail;

namespace SFBooking.Server.Services
{
    // Real email delivery via SendGrid. Only gets registered (see Program.cs)
    // when a SendGrid API key is actually configured - otherwise the app
    // falls back to ConsoleEmailService, so local development never needs
    // real credentials just to keep working.
    public class SendGridEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SendGridEmailService> _logger;

        public SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken)
        {
            var apiKey = _config["SendGrid:ApiKey"];
            var fromEmail = _config["SendGrid:FromEmail"] ?? "no-reply@sfbooking.app";
            var fromName = _config["SendGrid:FromName"] ?? "SF Booking";
            var frontendBaseUrl = (_config["FrontendSettings:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');

            var resetLink = $"{frontendBaseUrl}/reset-password?token={resetToken}";

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, fromName);
            var to = new EmailAddress(toEmail, fullName);
            const string subject = "Reset your SF Booking password";

            var plainTextContent =
                $"Hi {fullName},\n\n" +
                "We received a request to reset your SF Booking password. " +
                "Use the link below to choose a new one:\n\n" +
                $"{resetLink}\n\n" +
                "This link expires in 30 minutes. If you didn't request this, " +
                "you can safely ignore this email.\n\n" +
                "- SF Booking";

            var htmlContent =
                $"<p>Hi {fullName},</p>" +
                "<p>We received a request to reset your SF Booking password. " +
                "Click the button below to choose a new one:</p>" +
                $"<p><a href=\"{resetLink}\" " +
                "style=\"display:inline-block;padding:12px 24px;background-color:#8CB369;" +
                "color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;\">" +
                "Reset Password</a></p>" +
                $"<p>Or copy this link into your browser:<br>{resetLink}</p>" +
                "<p>This link expires in <strong>30 minutes</strong>. If you didn't request this, " +
                "you can safely ignore this email.</p>" +
                "<p>- SF Booking</p>";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            var response = await client.SendEmailAsync(msg);

            if ((int)response.StatusCode >= 400)
            {
                var body = await response.Body.ReadAsStringAsync();
                _logger.LogError(
                    "SendGrid failed to send password reset email to {Email}. Status: {Status}. Body: {Body}",
                    toEmail, response.StatusCode, body);

                // Deliberately does NOT throw here. ForgotPassword always
                // returns the same generic message regardless of whether
                // delivery actually succeeded - letting a delivery failure
                // bubble up as a different response would let someone probe
                // which emails are registered based on error behavior.
            }
            else
            {
                _logger.LogInformation("Password reset email sent to {Email}", toEmail);
            }
        }
    }
}