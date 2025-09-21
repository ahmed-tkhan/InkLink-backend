#!/bin/bash

# InkLink Backend Deployment Script
# This script helps deploy the InkLink backend using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check for docker compose (newer version) or docker-compose (legacy)
    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Set the compose command
    if command -v docker compose &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    print_success "Docker and Docker Compose are available"
}

# Create environment file if it doesn't exist
setup_environment() {
    if [ ! -f ".env" ]; then
        print_status "Creating environment file from template..."
        cp .env.example .env
        print_warning "Please review and update the .env file with your configuration"
    else
        print_status "Environment file already exists"
    fi
}

# Deploy the application
deploy() {
    print_status "Starting InkLink Backend deployment..."
    
    # Build and start the services
    $COMPOSE_CMD up -d --build
    
    print_success "InkLink Backend has been deployed!"
    print_status "Services status:"
    $COMPOSE_CMD ps
    
    echo ""
    print_status "Application will be available at: http://localhost:3000"
    print_status "Health check endpoint: http://localhost:3000/health"
    print_status "API documentation: http://localhost:3000/"
}

# Deploy development version
deploy_dev() {
    print_status "Starting InkLink Backend development deployment..."
    
    # Build and start the development services
    $COMPOSE_CMD -f docker-compose.dev.yml up -d --build
    
    print_success "InkLink Backend development environment has been deployed!"
    print_status "Services status:"
    $COMPOSE_CMD -f docker-compose.dev.yml ps
    
    echo ""
    print_status "Development server will be available at: http://localhost:3000"
    print_status "Code changes will trigger automatic restarts"
}

# Stop the application
stop() {
    print_status "Stopping InkLink Backend..."
    $COMPOSE_CMD down
    print_success "InkLink Backend has been stopped"
}

# Stop development environment
stop_dev() {
    print_status "Stopping InkLink Backend development environment..."
    $COMPOSE_CMD -f docker-compose.dev.yml down
    print_success "InkLink Backend development environment has been stopped"
}

# View logs
logs() {
    $COMPOSE_CMD logs -f inklink-backend
}

# View development logs
logs_dev() {
    $COMPOSE_CMD -f docker-compose.dev.yml logs -f inklink-backend
}

# Update the application
update() {
    print_status "Updating InkLink Backend..."
    
    # Pull latest changes (if this is a git repository)
    if [ -d ".git" ]; then
        print_status "Pulling latest changes from git..."
        git pull
    fi
    
    # Rebuild and restart
    $COMPOSE_CMD down
    $COMPOSE_CMD up -d --build
    
    print_success "InkLink Backend has been updated!"
}

# Backup data
backup() {
    print_status "Creating backup of InkLink Backend data..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup volumes
    docker run --rm \
        -v inklink-backend_inklink_data:/data \
        -v inklink-backend_inklink_db:/db \
        -v "$(pwd)/$BACKUP_DIR:/backup" \
        alpine sh -c "cp -r /data/* /backup/ 2>/dev/null || true; cp -r /db/* /backup/ 2>/dev/null || true"
    
    print_success "Backup created at: $BACKUP_DIR"
}

# Show help
show_help() {
    echo "InkLink Backend Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      Deploy the production application"
    echo "  deploy-dev  Deploy the development environment"
    echo "  stop        Stop the production application"
    echo "  stop-dev    Stop the development environment"
    echo "  logs        View application logs"
    echo "  logs-dev    View development logs"
    echo "  update      Update and restart the application"
    echo "  backup      Create a backup of application data"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy      # Deploy production environment"
    echo "  $0 deploy-dev  # Deploy development environment"
    echo "  $0 logs        # View logs"
    echo "  $0 stop        # Stop services"
}

# Main script logic
main() {
    check_docker
    setup_environment
    
    case "${1:-help}" in
        deploy)
            deploy
            ;;
        deploy-dev)
            deploy_dev
            ;;
        stop)
            stop
            ;;
        stop-dev)
            stop_dev
            ;;
        logs)
            logs
            ;;
        logs-dev)
            logs_dev
            ;;
        update)
            update
            ;;
        backup)
            backup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"