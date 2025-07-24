using UrlShortener.Models;
using UrlShortener.Models.DTOs;

namespace UrlShortener.Services
{
    public interface IUrlShortenerService
    {
        Task<UrlResponse> CreateShortUrlAsync(CreateUrlRequest request);
        Task<UrlMapping?> GetUrlByShortCodeAsync(string shortCode);
        Task<UrlStatsResponse?> GetUrlStatsAsync(string shortCode);
        Task<IEnumerable<UrlStatsResponse>> GetAllUrlsAsync();
        Task<bool> DeleteUrlAsync(string shortCode);
        Task IncrementClickCountAsync(string shortCode);
    }
}
