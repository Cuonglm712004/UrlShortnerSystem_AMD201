using Microsoft.AspNetCore.Mvc;
using UrlShortener.Models.DTOs;
using UrlShortener.Services;

namespace UrlShortener.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UrlController : ControllerBase
    {
        private readonly IUrlShortenerService _urlService;
        private readonly ILogger<UrlController> _logger;

        public UrlController(IUrlShortenerService urlService, ILogger<UrlController> logger)
        {
            _urlService = urlService;
            _logger = logger;
        }

        [HttpPost("shorten")]
        public async Task<ActionResult<UrlResponse>> ShortenUrl([FromBody] CreateUrlRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _urlService.CreateShortUrlAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Invalid request: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating short URL");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("stats/{shortCode}")]
        public async Task<ActionResult<UrlStatsResponse>> GetUrlStats(string shortCode)
        {
            try
            {
                var result = await _urlService.GetUrlStatsAsync(shortCode);
                
                if (result == null)
                {
                    return NotFound(new { error = "Short URL not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting URL stats for {ShortCode}", shortCode);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<UrlStatsResponse>>> GetAllUrls()
        {
            try
            {
                var result = await _urlService.GetAllUrlsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all URLs");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("{shortCode}")]
        public async Task<ActionResult> DeleteUrl(string shortCode)
        {
            try
            {
                var result = await _urlService.DeleteUrlAsync(shortCode);
                
                if (!result)
                {
                    return NotFound(new { error = "Short URL not found" });
                }

                return Ok(new { message = "URL deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting URL {ShortCode}", shortCode);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
