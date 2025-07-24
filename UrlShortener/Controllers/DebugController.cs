using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrlShortener.Data;

namespace UrlShortener.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebugController : ControllerBase
    {
        private readonly UrlShortenerContext _context;

        public DebugController(UrlShortenerContext context)
        {
            _context = context;
        }

        [HttpGet("database")]
        public async Task<IActionResult> ViewDatabase()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                var urls = await _context.UrlMappings.Include(u => u.User).ToListAsync();

                var result = new
                {
                    Users = users.Select(u => new
                    {
                        u.Id,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.CreatedAt,
                        u.LastLoginAt,
                        u.IsActive
                    }),
                    UrlMappings = urls.Select(u => new
                    {
                        u.Id,
                        u.OriginalUrl,
                        u.ShortCode,
                        u.CreatedAt,
                        u.ExpiresAt,
                        u.ClickCount,
                        u.IsActive,
                        UserEmail = u.User?.Email
                    }),
                    Statistics = new
                    {
                        TotalUsers = users.Count,
                        TotalUrls = urls.Count,
                        TotalClicks = urls.Sum(u => u.ClickCount),
                        ActiveUrls = urls.Count(u => u.IsActive)
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
