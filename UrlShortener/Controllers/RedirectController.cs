using Microsoft.AspNetCore.Mvc;
using UrlShortener.Services;

namespace UrlShortener.Controllers
{
    [Route("r")]
    public class RedirectController : Controller
    {
        private readonly IUrlShortenerService _urlService;
        private readonly ILogger<RedirectController> _logger;

        public RedirectController(IUrlShortenerService urlService, ILogger<RedirectController> logger)
        {
            _urlService = urlService;
            _logger = logger;
        }

        [HttpGet("{shortCode}")]
        public async Task<IActionResult> RedirectToOriginalUrl(string shortCode)
        {
            try
            {
                var urlMapping = await _urlService.GetUrlByShortCodeAsync(shortCode);

                if (urlMapping == null)
                {
                    _logger.LogWarning("Short code not found or expired: {ShortCode}", shortCode);
                    return NotFound("Short URL not found or has expired");
                }

                // Increment click count
                await _urlService.IncrementClickCountAsync(shortCode);

                _logger.LogInformation("Redirecting {ShortCode} to {OriginalUrl}", shortCode, urlMapping.OriginalUrl);
                return Redirect(urlMapping.OriginalUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error redirecting short code: {ShortCode}", shortCode);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
