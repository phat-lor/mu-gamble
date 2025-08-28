#!/bin/bash

# Production deployment script for Mahidol888
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
APP_NAME="mahidol888"
BACKUP_DIR="./backups"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    local required_vars=("SESSION_SECRET" "CSRF_SECRET" "PUBLIC_SITE_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        print_error "Please set them in your environment or create a .env file"
        exit 1
    fi
    
    print_status "All required environment variables are set"
}

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
    fi
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/backup-$timestamp.tar.gz"
    
    docker run --rm \
        -v "${APP_NAME}_app_data:/data:ro" \
        -v "$(pwd)/$BACKUP_DIR:/backup" \
        alpine:latest \
        tar -czf "/backup/backup-$timestamp.tar.gz" -C /data .
    
    print_status "Backup created: $backup_file"
}

# Function to deploy the application
deploy() {
    print_status "Starting deployment..."
    
    # Pull latest changes if using git
    if [[ -d ".git" ]]; then
        print_status "Pulling latest changes..."
        git pull origin main || print_warning "Could not pull latest changes"
    fi
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
            print_status "Services are healthy!"
            break
        fi
        
        print_status "Waiting for services to be healthy... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_error "Services failed to become healthy within the expected time"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
    
    print_status "Deployment completed successfully!"
}

# Function to rollback
rollback() {
    print_status "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if specified
    if [[ -n "$1" ]]; then
        local backup_file="$1"
        if [[ -f "$backup_file" ]]; then
            print_status "Restoring from backup: $backup_file"
            docker run --rm \
                -v "${APP_NAME}_app_data:/data" \
                -v "$(pwd)/$backup_file:/backup.tar.gz" \
                alpine:latest \
                tar -xzf /backup.tar.gz -C /data
        else
            print_error "Backup file not found: $backup_file"
            exit 1
        fi
    fi
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_status "Rollback completed"
}

# Function to show status
status() {
    print_status "Service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    print_status "Recent logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the application"
    echo "  rollback   Rollback to previous version"
    echo "  backup     Create a backup"
    echo "  status     Show service status"
    echo "  logs       Show service logs"
    echo "  stop       Stop all services"
    echo "  help       Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  SESSION_SECRET    Required: Secret for session management"
    echo "  CSRF_SECRET       Required: Secret for CSRF protection"
    echo "  PUBLIC_SITE_URL   Required: Public URL of the application"
    echo "  ADMIN_EMAIL       Optional: Admin email address"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_env_vars
        create_backup
        deploy
        ;;
    "rollback")
        rollback "$2"
        ;;
    "backup")
        create_backup
        ;;
    "status")
        status
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    "stop")
        print_status "Stopping services..."
        docker-compose -f "$COMPOSE_FILE" down
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
