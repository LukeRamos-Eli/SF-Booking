# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "SFBooking.Server.csproj"
RUN dotnet publish "SFBooking.Server.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Render assigns a port at runtime via the PORT env var - this reads it at
# container startup and falls back to 8080 if it's not set (e.g. local
# `docker run` testing).
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet SFBooking.Server.dll"]