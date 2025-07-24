using Microsoft.AspNetCore.Identity;

namespace UrlShortener.Models
{
    public class AppUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public ICollection<UrlMapping> UrlMappings { get; set; } = new List<UrlMapping>();
    }
}
