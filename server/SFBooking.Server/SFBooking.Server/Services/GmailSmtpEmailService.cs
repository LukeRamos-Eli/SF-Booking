using System.Net;
using System.Net.Mail;

namespace SFBooking.Server.Services
{
    // Sends real emails through Gmail's SMTP server instead of a third-party
    // provider like SendGrid. Needs a Gmail account and an "app password"
    // (not your regular Gmail password) - see the setup notes wherever this
    // is documented for your project. No company/sender verification needed
    // since you're just using your own existing Gmail account.
    public class GmailSmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<GmailSmtpEmailService> _logger;

        public GmailSmtpEmailService(IConfiguration config, ILogger<GmailSmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken)
        {
            var gmailAddress = _config["Gmail:Address"];
            var appPassword = _config["Gmail:AppPassword"];
            var frontendBaseUrl = (_config["FrontendSettings:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');
            var resetLink = $"{frontendBaseUrl}/reset-password?token={resetToken}";

            using var client = new SmtpClient("smtp.gmail.com", 587)
            {
                Credentials = new NetworkCredential(gmailAddress, appPassword),
                EnableSsl = true,
            };

            var mail = new MailMessage
            {
                From = new MailAddress(gmailAddress!, "SF Booking"),
                Subject = "Reset your SF Booking password",
                IsBodyHtml = true,
                Body =
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
                    "<p>- SF Booking</p>",
            };
            mail.To.Add(toEmail);

            try
            {
                await client.SendMailAsync(mail);
                _logger.LogInformation("Password reset email sent to {Email} via Gmail SMTP", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gmail SMTP failed to send password reset email to {Email}", toEmail);

                // Deliberately swallowed, not rethrown - ForgotPassword always
                // returns the same generic message regardless of whether
                // delivery actually succeeded, so this shouldn't change the
                // caller-facing response.
            }
        }
    }
}