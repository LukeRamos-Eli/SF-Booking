namespace SFBooking.Server.Services
{
    // Singleton, in-memory. Good enough for a single-instance deployment;
    // if this ever runs across multiple server instances, this would need
    // to move to a shared store (e.g. the database or Redis) since each
    // instance would otherwise track attempts separately.
    public class LoginAttemptTracker
    {
        private class Entry
        {
            public int FailedCount;
            public DateTime WindowStart;
            public DateTime? LockedUntil;
        }

        private readonly Dictionary<string, Entry> _entries = new();
        private readonly object _lock = new();

        private const int MaxAttempts = 5;
        private static readonly TimeSpan Window = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan LockDuration = TimeSpan.FromMinutes(15);

        public (bool locked, TimeSpan? retryAfter) IsLocked(string email)
        {
            var key = email.ToLowerInvariant();
            lock (_lock)
            {
                if (_entries.TryGetValue(key, out var entry) && entry.LockedUntil.HasValue)
                {
                    if (entry.LockedUntil.Value > DateTime.UtcNow)
                        return (true, entry.LockedUntil.Value - DateTime.UtcNow);

                    // lock has expired - clear it out so they get a fresh window
                    _entries.Remove(key);
                }
                return (false, null);
            }
        }

        public void RecordFailure(string email)
        {
            var key = email.ToLowerInvariant();
            lock (_lock)
            {
                if (!_entries.TryGetValue(key, out var entry) || DateTime.UtcNow - entry.WindowStart > Window)
                {
                    entry = new Entry { FailedCount = 0, WindowStart = DateTime.UtcNow };
                    _entries[key] = entry;
                }

                entry.FailedCount++;
                if (entry.FailedCount >= MaxAttempts)
                {
                    entry.LockedUntil = DateTime.UtcNow.Add(LockDuration);
                }
            }
        }

        public void RecordSuccess(string email)
        {
            lock (_lock)
            {
                _entries.Remove(email.ToLowerInvariant());
            }
        }
    }
}