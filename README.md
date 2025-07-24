# URL Shortener Service

A production-ready URL shortening service built with .NET 9.0, featuring user authentication, analytics tracking, and containerized deployment.

## System Requirements

- .NET 9.0 SDK
- Docker & Docker Compose
- SQLite (included)

## Quick Start

### Development Environment
```bash
cd UrlShortener
dotnet restore
dotnet run
```
Access: http://localhost:5119

### Production Deployment
```bash
docker-compose up -d --build
```
Access: http://localhost:8080

## Build Commands

### Local Development
```bash
# Restore dependencies
cd UrlShortener && dotnet restore

# Build project
cd UrlShortener && dotnet build

# Run development server
cd UrlShortener && dotnet run

# Run tests
cd UrlShortener && dotnet test
```

### Docker Operations
```bash
# Build and start services
docker-compose up --build

# Start services in background
docker-compose up -d --build

# Stop all services
docker-compose down

# View service logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove all containers and volumes
docker-compose down -v
```

### Manual Docker Build
```bash
# Build image
docker build -t urlshortener:latest .

# Run container
docker run -d -p 8080:8080 --name urlshortener urlshortener:latest

# Stop container
docker stop urlshortener

# Remove container
docker rm urlshortener
```

## Application Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Web Interface | http://localhost:8080 | Main application UI |
| API Documentation | http://localhost:8080/swagger | Swagger/OpenAPI documentation |
| Health Check | http://localhost:8080/health | Service health status |

## Configuration

### Environment Variables
- `ASPNETCORE_ENVIRONMENT`: Development/Production
- `ASPNETCORE_URLS`: Application listening URLs
- `ConnectionStrings__DefaultConnection`: Database connection string

### Database
- **Type**: SQLite
- **Location**: `UrlShortener/urlshortener.db`
- **Migrations**: Automatic on startup

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### URL Management
- `POST /api/url/shorten` - Create short URL
- `GET /api/url/all` - List user URLs
- `GET /api/url/stats/{shortCode}` - Get URL statistics
- `DELETE /api/url/{shortCode}` - Delete URL
- `GET /r/{shortCode}` - Redirect to original URL

## Project Structure

```
System/
├── UrlShortener/              # Application source code
│   ├── Controllers/           # API controllers
│   ├── Data/                 # Database context and models
│   ├── Models/               # Domain models and DTOs
│   ├── Services/             # Business logic services
│   ├── Utils/                # Utility classes
│   ├── wwwroot/              # Static web assets
│   └── Program.cs            # Application entry point
├── docker/                   # Docker configuration overrides
├── .vscode/                  # VS Code workspace settings
├── docker-compose.yml        # Container orchestration
├── Dockerfile               # Container build instructions
└── System.sln               # Visual Studio solution
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using port 8080
netstat -ano | findstr :8080
# Kill the process or change port in docker-compose.yml
```

**Database connection errors:**
```bash
# Reset database
cd UrlShortener
rm urlshortener.db
dotnet run
```

**Docker build failures:**
```bash
# Clean Docker cache
docker system prune -f
docker-compose build --no-cache
```

### Logs and Debugging

**Application logs:**
```bash
# Container logs
docker-compose logs -f urlshortener

# Follow logs
docker-compose logs -f --tail=100
```

**Development debugging:**
```bash
# Run with detailed logging
cd UrlShortener
dotnet run --verbosity diagnostic
```

## Security Considerations

- JWT tokens expire after 7 days
- Passwords are hashed using ASP.NET Core Identity
- HTTPS enforced in production
- Input validation on all endpoints
- SQL injection protection via Entity Framework

## Performance Notes

- SQLite suitable for development and small-scale production
- Consider PostgreSQL/SQL Server for high-traffic scenarios
- Static file serving optimized for production
- Database queries optimized with proper indexing

## Maintenance

### Database Backup
```bash
# Copy SQLite database
cp UrlShortener/urlshortener.db backup/urlshortener_$(date +%Y%m%d).db
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
docker-compose down
docker-compose up -d --build
```
