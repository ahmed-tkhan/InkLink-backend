# 🐳 InkLink Backend - Self-Hosting Guide

Complete guide for self-hosting the InkLink Backend using Docker - the fastest, most transparent way to deploy your own image processing service.

## 🎯 Why Self-Host?

- ✅ **Complete Data Control** - Your images never leave your server
- ✅ **Zero Monthly Costs** - No subscription fees or usage charges
- ✅ **Privacy First** - No third-party access to your data
- ✅ **Offline Capable** - Works without internet connection
- ✅ **Easy to Scale** - Add more resources as needed
- ✅ **Transparent** - Full access to source code and configuration

## 📋 Prerequisites

Before starting, ensure you have:

- **Docker** (version 20.10 or later)
- **Docker Compose** (version 2.0 or later)
- **2GB RAM** minimum (4GB recommended)
- **10GB free disk space** (for images and database)
- **Port 3000** available (or modify configuration)

### Installing Docker

#### Ubuntu/Debian
```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin
```

#### CentOS/RHEL/Fedora
```bash
# Install Docker
sudo dnf install docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

#### macOS
```bash
# Install Docker Desktop
# Download from: https://docs.docker.com/desktop/mac/install/
# Or use Homebrew
brew install --cask docker
```

#### Windows
```bash
# Install Docker Desktop
# Download from: https://docs.docker.com/desktop/windows/install/
# Or use Chocolatey
choco install docker-desktop
```

## 🚀 Quick Start (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/ahmed-tkhan/InkLink-backend.git
cd InkLink-backend
```

### 2. One-Command Deployment
```bash
# Deploy production environment
./deploy.sh deploy

# Or deploy development environment
./deploy.sh deploy-dev
```

### 3. Verify Installation
```bash
# Check if service is running
curl http://localhost:3000/health

# Expected response: {"status":"OK","timestamp":"...","version":"1.0.0"}
```

### 4. Test Upload
Open your browser and go to `http://localhost:3000` or use the included test page at `test.html`.

## 🔧 Manual Deployment

If you prefer manual control over the deployment process:

### Production Deployment
```bash
# 1. Create environment file
cp .env.example .env

# 2. Edit environment variables (optional)
nano .env

# 3. Build and start services
docker compose up -d --build

# 4. Check status
docker compose ps
docker compose logs -f
```

### Development Deployment
```bash
# Start development environment with hot reload
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Key configuration options:

```bash
# Server Configuration
NODE_ENV=production          # production or development
PORT=3000                   # Port to run the server on

# File Upload Limits
MAX_FILE_SIZE=10485760      # 10MB in bytes
ALLOWED_FILE_TYPES=jpeg,jpg,png,gif,webp,bmp

# CORS Configuration (for web access)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging
LOG_LEVEL=info              # error, warn, info, debug
```

### Custom Port
To run on a different port:

```bash
# Method 1: Edit .env file
echo "PORT=8080" >> .env

# Method 2: Edit docker-compose.yml
# Change ports mapping from "3000:3000" to "8080:3000"
```

### SSL/HTTPS Setup

For production with SSL, use the included Traefik configuration:

```bash
# 1. Edit docker-compose.yml and update email for Let's Encrypt
nano docker-compose.yml

# 2. Deploy with Traefik
docker compose --profile production up -d

# 3. Your site will be available at https://yourdomain.com
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Regular Updates
```bash
# Update the application
./deploy.sh update

# Update system packages
sudo apt update && sudo apt upgrade
```

### 3. Backup Strategy
```bash
# Create backup
./deploy.sh backup

# Automated daily backups (add to crontab)
0 2 * * * cd /path/to/inklink-backend && ./deploy.sh backup
```

### 4. Monitor Resources
```bash
# Check container resource usage
docker stats

# Check disk space
df -h

# Check logs for errors
./deploy.sh logs | grep ERROR
```

## 📊 Monitoring & Maintenance

### Health Checks
The application includes built-in health checks:

```bash
# Check application health
curl http://localhost:3000/health

# Check Docker container health
docker ps

# Check detailed container information
docker inspect inklink-backend
```

### Log Management
```bash
# View real-time logs
./deploy.sh logs

# View specific number of log lines
docker compose logs --tail=100 inklink-backend

# Search logs for errors
docker compose logs inklink-backend | grep ERROR
```

### Performance Tuning

#### For High Traffic
```yaml
# Add to docker-compose.yml under inklink-backend service
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
    reservations:
      cpus: '1.0'
      memory: 2G
```

#### Storage Optimization
```bash
# Clean up old Docker images
docker system prune -a

# Optimize database (if needed)
docker exec inklink-backend sqlite3 /app/database.sqlite "VACUUM;"
```

## 🛠️ Management Commands

The included `deploy.sh` script provides easy management:

```bash
# Deployment
./deploy.sh deploy          # Deploy production
./deploy.sh deploy-dev      # Deploy development

# Management
./deploy.sh stop            # Stop services
./deploy.sh logs            # View logs
./deploy.sh update          # Update application
./deploy.sh backup          # Create backup

# Help
./deploy.sh help            # Show all commands
```

## 🌐 Domain Setup & DNS

### 1. Point Domain to Server
```bash
# Add A record in your DNS provider:
# Type: A
# Name: @ (or subdomain)
# Value: YOUR_SERVER_IP
```

### 2. Update Configuration
```bash
# Edit docker-compose.yml
# Change Host(`localhost`) to Host(`yourdomain.com`)
nano docker-compose.yml
```

### 3. Deploy with SSL
```bash
docker-compose --profile production up -d
```

## 🔄 Scaling & High Availability

### Load Balancing
```yaml
# Add to docker-compose.yml
services:
  inklink-backend:
    # ... existing config
    deploy:
      replicas: 3
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - inklink-backend
```

### Database Backup
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec inklink-backend sqlite3 /app/database.sqlite ".backup /app/backup_$DATE.db"
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

#### Permission Denied
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

#### Storage Issues
```bash
# Check disk space
df -h

# Clean up Docker volumes
docker volume prune
```

#### Container Won't Start
```bash
# Check logs for errors
docker-compose logs inklink-backend

# Check container status
docker ps -a

# Restart services
docker-compose restart
```

### Getting Help

1. **Check Logs**: `./deploy.sh logs`
2. **Verify Health**: `curl http://localhost:3000/health`
3. **Container Status**: `docker ps`
4. **Resource Usage**: `docker stats`
5. **Disk Space**: `df -h`

## 🎉 Success!

Your InkLink Backend is now self-hosted and ready to use! 

- **API Base URL**: `http://localhost:3000` (or your domain)
- **Health Check**: `http://localhost:3000/health`
- **Upload Endpoint**: `POST http://localhost:3000/upload`
- **List Images**: `GET http://localhost:3000/upload/list`

### Next Steps

1. Test image uploads using the included `test.html`
2. Integrate with your frontend application
3. Set up automated backups
4. Configure monitoring and alerts
5. Consider scaling for production use

Happy self-hosting! 🚀