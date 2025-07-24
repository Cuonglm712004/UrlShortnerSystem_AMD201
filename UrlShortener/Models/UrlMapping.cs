using System.ComponentModel.DataAnnotations;

namespace UrlShortener.Models
{
    public class UrlMapping
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(2048)]
        public string OriginalUrl { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(10)]
        public string ShortCode { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiresAt { get; set; }
        
        public int ClickCount { get; set; } = 0;
        
        public string? UserId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public AppUser? User { get; set; }
    }
}
