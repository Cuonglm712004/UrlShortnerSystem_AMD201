using System.ComponentModel.DataAnnotations;

namespace UrlShortener.Models.DTOs
{
    public class CreateUrlRequest
    {
        [Required]
        [Url]
        [MaxLength(2048)]
        public string OriginalUrl { get; set; } = string.Empty;
        
        public DateTime? ExpiresAt { get; set; }
    }
    
    public class UrlResponse
    {
        public int Id { get; set; }
        public string OriginalUrl { get; set; } = string.Empty;
        public string ShortCode { get; set; } = string.Empty;
        public string ShortUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int ClickCount { get; set; }
        public bool IsActive { get; set; }
        public string? UserEmail { get; set; }
    }
    
    public class UrlStatsResponse
    {
        public int Id { get; set; }
        public string OriginalUrl { get; set; } = string.Empty;
        public string ShortCode { get; set; } = string.Empty;
        public string ShortUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int ClickCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsExpired { get; set; }
        public string? UserEmail { get; set; }
    }
}
