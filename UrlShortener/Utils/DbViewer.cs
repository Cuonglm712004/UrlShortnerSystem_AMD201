using Microsoft.EntityFrameworkCore;
using UrlShortener.Data;
using UrlShortener.Models;

namespace UrlShortener
{
    public class DbViewer
    {
        public static async Task ViewDatabase()
        {
            var connectionString = "Data Source=urlshortener.db";
            var options = new DbContextOptionsBuilder<UrlShortenerContext>()
                .UseSqlite(connectionString)
                .Options;

            using var context = new UrlShortenerContext(options);

            Console.WriteLine("=== DATABASE VIEWER ===\n");

            // View Users
            Console.WriteLine("📋 USERS:");
            var users = await context.Users.ToListAsync();
            if (users.Any())
            {
                foreach (var user in users)
                {
                    Console.WriteLine($"ID: {user.Id}");
                    Console.WriteLine($"Email: {user.Email}");
                    Console.WriteLine($"Name: {user.FirstName} {user.LastName}");
                    Console.WriteLine($"Created: {user.CreatedAt}");
                    Console.WriteLine($"Last Login: {user.LastLoginAt}");
                    Console.WriteLine($"Active: {user.IsActive}");
                    Console.WriteLine("---");
                }
            }
            else
            {
                Console.WriteLine("No users found.");
            }

            Console.WriteLine("\n🔗 URL MAPPINGS:");
            var urls = await context.UrlMappings.Include(u => u.User).ToListAsync();
            if (urls.Any())
            {
                foreach (var url in urls)
                {
                    Console.WriteLine($"ID: {url.Id}");
                    Console.WriteLine($"Original URL: {url.OriginalUrl}");
                    Console.WriteLine($"Short Code: {url.ShortCode}");
                    Console.WriteLine($"Created: {url.CreatedAt}");
                    Console.WriteLine($"Expires: {url.ExpiresAt?.ToString() ?? "Never"}");
                    Console.WriteLine($"Clicks: {url.ClickCount}");
                    Console.WriteLine($"Active: {url.IsActive}");
                    Console.WriteLine($"User: {url.User?.Email ?? "Anonymous"}");
                    Console.WriteLine("---");
                }
            }
            else
            {
                Console.WriteLine("No URL mappings found.");
            }

            Console.WriteLine($"\n📊 STATISTICS:");
            Console.WriteLine($"Total Users: {users.Count}");
            Console.WriteLine($"Total URLs: {urls.Count}");
            Console.WriteLine($"Total Clicks: {urls.Sum(u => u.ClickCount)}");
            Console.WriteLine($"Active URLs: {urls.Count(u => u.IsActive)}");
        }
    }
}
