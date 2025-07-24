using Microsoft.EntityFrameworkCore;
using System.Text;
using UrlShortener.Data;
using UrlShortener.Models;
using UrlShortener.Models.DTOs;
using System.Security.Claims;

namespace UrlShortener.Services
{
    public class UrlShortenerService : IUrlShortenerService
    {
        private readonly UrlShortenerContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHttpClientFactory _httpClientFactory;
        private const string Characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        private readonly Random _random = new();

        public UrlShortenerService(UrlShortenerContext context, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<UrlResponse> CreateShortUrlAsync(CreateUrlRequest request)
        {
            // Validate URL format
            if (!IsValidUrl(request.OriginalUrl))
            {
                throw new ArgumentException("Invalid URL format");
            }

            // Check if URL is accessible
            if (!await IsUrlAccessibleAsync(request.OriginalUrl))
            {
                throw new ArgumentException("URL is not accessible or does not exist");
            }

            // Get current user ID (can be null for anonymous users)
            var userId = GetCurrentUserId();

            // Check if URL already exists for this user (or anonymous if userId is null)
            var existingUrl = await _context.UrlMappings
                .FirstOrDefaultAsync(u => u.OriginalUrl == request.OriginalUrl && 
                                        u.UserId == userId && u.IsActive);

            if (existingUrl != null)
            {
                return MapToUrlResponse(existingUrl);
            }

            // Generate short code (removed custom code logic)
            var shortCode = await GenerateUniqueShortCodeAsync();

            var urlMapping = new UrlMapping
            {
                OriginalUrl = request.OriginalUrl,
                ShortCode = shortCode,
                ExpiresAt = request.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                UserId = userId
            };

            _context.UrlMappings.Add(urlMapping);
            await _context.SaveChangesAsync();

            return MapToUrlResponse(urlMapping);
        }

        public async Task<UrlMapping?> GetUrlByShortCodeAsync(string shortCode)
        {
            return await _context.UrlMappings
                .Include(u => u.User)
                .FirstOrDefaultAsync(u => u.ShortCode == shortCode && 
                                       u.IsActive && 
                                       (!u.ExpiresAt.HasValue || u.ExpiresAt.Value > DateTime.UtcNow));
        }

        public async Task<UrlStatsResponse?> GetUrlStatsAsync(string shortCode)
        {
            // For stats, we don't filter by expiration - user should see stats even for expired URLs
            var urlMapping = await _context.UrlMappings
                .Include(u => u.User)
                .FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.IsActive);

            if (urlMapping == null)
                return null;

            return MapToUrlStatsResponse(urlMapping);
        }

        public async Task<IEnumerable<UrlStatsResponse>> GetAllUrlsAsync()
        {
            var userId = GetCurrentUserId();
            
            // Only return URLs if user is authenticated
            if (string.IsNullOrEmpty(userId))
            {
                return Enumerable.Empty<UrlStatsResponse>();
            }

            var urls = await _context.UrlMappings
                .Include(u => u.User)
                .Where(u => u.IsActive && u.UserId == userId)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return urls.Select(MapToUrlStatsResponse);
        }

        public async Task<bool> DeleteUrlAsync(string shortCode)
        {
            var userId = GetCurrentUserId();
            var urlMapping = await _context.UrlMappings
                .FirstOrDefaultAsync(u => u.ShortCode == shortCode);

            if (urlMapping == null)
                return false;

            // Only allow users to delete their own URLs (or allow anonymous deletion for now)
            if (!string.IsNullOrEmpty(userId) && urlMapping.UserId != userId)
                return false;

            urlMapping.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task IncrementClickCountAsync(string shortCode)
        {
            var urlMapping = await _context.UrlMappings
                .FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.IsActive);

            if (urlMapping != null)
            {
                urlMapping.ClickCount++;
                await _context.SaveChangesAsync();
            }
        }

        private string? GetCurrentUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private async Task<string> GenerateUniqueShortCodeAsync()
        {
            string shortCode;
            do
            {
                shortCode = GenerateRandomString(6);
            } while (await _context.UrlMappings.AnyAsync(u => u.ShortCode == shortCode));

            return shortCode;
        }

        private string GenerateRandomString(int length)
        {
            var result = new StringBuilder(length);
            for (int i = 0; i < length; i++)
            {
                result.Append(Characters[_random.Next(Characters.Length)]);
            }
            return result.ToString();
        }

        private static bool IsValidUrl(string url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out var uriResult) &&
                   (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
        }

        private async Task<bool> IsUrlAccessibleAsync(string url)
        {
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                
                // Set a reasonable timeout for URL checking
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                
                // Use HEAD request first (faster, doesn't download content)
                var request = new HttpRequestMessage(HttpMethod.Head, url);
                request.Headers.Add("User-Agent", "UrlShortener/1.0");
                
                var response = await httpClient.SendAsync(request);
                
                // If HEAD fails, try GET request (some servers don't support HEAD)
                if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.MethodNotAllowed)
                {
                    request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Add("User-Agent", "UrlShortener/1.0");
                    response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                }
                
                // Consider 2xx and 3xx as accessible
                return response.IsSuccessStatusCode || 
                       ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400);
            }
            catch (Exception)
            {
                // If any exception occurs (timeout, DNS resolution failed, etc.), consider URL inaccessible
                return false;
            }
        }

        private UrlResponse MapToUrlResponse(UrlMapping urlMapping)
        {
            var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5119";
            return new UrlResponse
            {
                Id = urlMapping.Id,
                OriginalUrl = urlMapping.OriginalUrl,
                ShortCode = urlMapping.ShortCode,
                ShortUrl = $"{baseUrl.TrimEnd('/')}/r/{urlMapping.ShortCode}",
                CreatedAt = urlMapping.CreatedAt,
                ExpiresAt = urlMapping.ExpiresAt,
                ClickCount = urlMapping.ClickCount,
                IsActive = urlMapping.IsActive,
                UserEmail = urlMapping.User?.Email
            };
        }

        private UrlStatsResponse MapToUrlStatsResponse(UrlMapping urlMapping)
        {
            var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5119";
            return new UrlStatsResponse
            {
                Id = urlMapping.Id,
                OriginalUrl = urlMapping.OriginalUrl,
                ShortCode = urlMapping.ShortCode,
                ShortUrl = $"{baseUrl.TrimEnd('/')}/r/{urlMapping.ShortCode}",
                CreatedAt = urlMapping.CreatedAt,
                ExpiresAt = urlMapping.ExpiresAt,
                ClickCount = urlMapping.ClickCount,
                IsActive = urlMapping.IsActive,
                IsExpired = urlMapping.ExpiresAt.HasValue && urlMapping.ExpiresAt.Value < DateTime.UtcNow,
                UserEmail = urlMapping.User?.Email
            };
        }
    }
}
