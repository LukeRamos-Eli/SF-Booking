namespace SFBooking.Server.Data
{
    // The three fixed categories every facility must belong to. Stored as
    // an int in the database (standard EF enum behavior); the API sends the
    // enum name as a string (e.g. "LibraryAndLearning"), and the frontend
    // maps that to the full display label.
    public enum FacilityCategory
    {
        LibraryAndLearning,
        InnovationTechnologyAndResearch,
        SportsRecreationAndCommunity
    }

    public class Facility
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public FacilityCategory Category { get; set; }
        public int Capacity { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}