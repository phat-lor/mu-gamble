# Docker Deployment Guide

This guide explains how to deploy the Mahidol888 application using Docker in production.

## Prerequisites

- Docker and Docker Compose installed on your server
- A domain name (for production)
- SSL certificates (for HTTPS)

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd mahidol888
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your production values:

```bash
# Generate strong secrets
SESSION_SECRET=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 32)

# Set your domain
PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Deploy

#### Option A: Using the deployment script (recommended)

```bash
chmod +x deploy.sh
./deploy.sh deploy
```

#### Option B: Using Docker Compose directly

```bash
# For development/testing
docker-compose up -d

# For production
docker-compose -f docker-compose.prod.yml up -d
```

## Configuration

### Environment Variables

| Variable               | Required | Description                          |
| ---------------------- | -------- | ------------------------------------ |
| `SESSION_SECRET`       | Yes      | Secret for session management        |
| `CSRF_SECRET`          | Yes      | Secret for CSRF protection           |
| `PUBLIC_SITE_URL`      | Yes      | Public URL of your application       |
| `ADMIN_EMAIL`          | No       | Admin email for notifications        |
| `DATABASE_URL`         | No       | Database URL (defaults to SQLite)    |
| `ENABLE_RATE_LIMITING` | No       | Enable rate limiting (default: true) |
| `MAX_LOGIN_ATTEMPTS`   | No       | Max login attempts (default: 5)      |
| `MAX_BET_ATTEMPTS`     | No       | Max bet attempts (default: 10)       |

### SSL Configuration

For production with HTTPS:

1. Place your SSL certificates in the `ssl/` directory:

   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

2. Uncomment SSL configuration in `nginx.conf`

3. Update `PUBLIC_SITE_URL` to use `https://`

## Deployment Scripts

The `deploy.sh` script provides several commands:

```bash
# Deploy the application
./deploy.sh deploy

# Show service status
./deploy.sh status

# View logs
./deploy.sh logs

# Create backup
./deploy.sh backup

# Rollback deployment
./deploy.sh rollback

# Stop services
./deploy.sh stop

# Show help
./deploy.sh help
```

## Docker Run (Alternative)

If you prefer using `docker run` instead of Docker Compose:

```bash
# Build the image
docker build -t mahidol888 .

# Run the container
docker run -d \
  --name mahidol888-app \
  --restart unless-stopped \
  -p 3000:3000 \
  -v app_data:/app/data \
  -e NODE_ENV=production \
  -e SESSION_SECRET=your-session-secret \
  -e CSRF_SECRET=your-csrf-secret \
  -e PUBLIC_SITE_URL=https://yourdomain.com \
  -e DATABASE_URL=file:/app/data/production.db \
  mahidol888
```

## Monitoring and Maintenance

### Health Checks

The application includes health checks that monitor:

- Application availability
- Database connectivity
- API endpoints

### Logs

View application logs:

```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs app

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Backups

Automatic backups are created before each deployment. Manual backups:

```bash
./deploy.sh backup
```

### Database Migrations

Run database migrations:

```bash
# Enter the container
docker exec -it mahidol888-app sh

# Run migrations
bun run db:migrate
```

## Security Considerations

### Production Checklist

- [ ] Change default secrets (`SESSION_SECRET`, `CSRF_SECRET`)
- [ ] Configure SSL certificates
- [ ] Set up proper firewall rules
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Use non-root user (already configured in Dockerfile)
- [ ] Keep Docker images updated

### Network Security

The production configuration:

- Binds the app to localhost only (127.0.0.1:3000)
- Uses Nginx as a reverse proxy
- Implements rate limiting
- Adds security headers

## Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using the port
   lsof -i :3000

   # Stop conflicting services
   docker-compose down
   ```

2. **Permission denied**

   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh
   ```

3. **Database connection issues**

   ```bash
   # Check database file permissions
   docker exec -it mahidol888-app ls -la /app/data
   ```

4. **SSL certificate issues**
   ```bash
   # Test SSL configuration
   docker exec -it mahidol888-nginx nginx -t
   ```

### Debug Mode

For debugging, you can run in development mode:

```bash
# Override environment
NODE_ENV=development docker-compose up -d
```

## Performance Optimization

### Resource Limits

Add resource limits to your containers:

```yaml
# In docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Caching

The Nginx configuration includes:

- Static file caching (1 year)
- Gzip compression
- Browser caching headers

### Database Optimization

For SQLite in production:

- Regular backups
- Monitor file size
- Consider migration to PostgreSQL for high traffic

## Scaling

### Horizontal Scaling

For high traffic, consider:

- Using a load balancer
- Multiple app instances
- Database clustering
- CDN for static assets

### Vertical Scaling

Increase container resources:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

## Support

For issues and questions:

1. Check the logs: `./deploy.sh logs`
2. Review this documentation
3. Check the main README.md
4. Open an issue in the repository
