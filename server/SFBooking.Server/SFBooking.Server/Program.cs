using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SFBooking.Server.Data;
using SFBooking.Server.Services;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions =>
        {
            npgsqlOptions.CommandTimeout(30);
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null
            );
        }
    ));

builder.Services.AddScoped<JwtService>();
// Picks a real email sender if one is configured: Gmail SMTP first (the
// simpler option - just needs a Gmail account + app password, no third-party
// signup), then SendGrid if that's set up instead. Falls back to the
// console-log stub if neither is configured, so local dev keeps working
// without needing real credentials.
var gmailAddress = builder.Configuration["Gmail:Address"];
var sendGridApiKey = builder.Configuration["SendGrid:ApiKey"];

if (!string.IsNullOrWhiteSpace(gmailAddress))
{
    builder.Services.AddScoped<IEmailService, GmailSmtpEmailService>();
}
else if (!string.IsNullOrWhiteSpace(sendGridApiKey))
{
    builder.Services.AddScoped<IEmailService, SendGridEmailService>();
}
else
{
    builder.Services.AddScoped<IEmailService, ConsoleEmailService>();
}
builder.Services.AddSingleton<LoginAttemptTracker>();

// General throttle on the auth endpoints (login, register, forgot-password):
// 10 requests per minute per IP address. This is on top of, not instead of,
// the per-email lockout in LoginAttemptTracker - this one stops raw spam/
// abuse from a single source, the tracker stops one account being targeted
// even if the attacker rotates IPs.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("AuthPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://sf-booking-rouge.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

// Lightweight health check for uptime pingers (Render free-tier warming, etc).
// Deliberately does NOT touch the database - just confirms the process is alive,
// so pinging it doesn't burn a DB round trip every few minutes.
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestampUtc = DateTime.UtcNow }));

app.Run();