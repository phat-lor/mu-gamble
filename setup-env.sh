#!/bin/bash

# Setup environment variables for deployment
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    print_status "Creating .env file from template..."
    cp env.example .env
fi

# Generate secrets if they don't exist
if ! grep -q "SESSION_SECRET=" .env || grep -q "your-super-secret-session-key-change-this" .env; then
    print_status "Generating SESSION_SECRET..."
    SESSION_SECRET=$(openssl rand -hex 32)
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
fi

if ! grep -q "CSRF_SECRET=" .env || grep -q "your-super-secret-csrf-key-change-this" .env; then
    print_status "Generating CSRF_SECRET..."
    CSRF_SECRET=$(openssl rand -hex 32)
    sed -i "s/CSRF_SECRET=.*/CSRF_SECRET=$CSRF_SECRET/" .env
fi

# Ask for domain
echo ""
print_status "Please enter your domain or IP address for PUBLIC_SITE_URL:"
print_warning "For local testing, use: http://localhost:3000"
print_warning "For production, use: https://yourdomain.com"
echo ""
read -p "Enter PUBLIC_SITE_URL: " domain

if [[ -n "$domain" ]]; then
    sed -i "s|PUBLIC_SITE_URL=.*|PUBLIC_SITE_URL=$domain|" .env
    print_status "Updated PUBLIC_SITE_URL to: $domain"
fi

# Ask for admin email
echo ""
read -p "Enter admin email (optional, press Enter to skip): " admin_email

if [[ -n "$admin_email" ]]; then
    sed -i "s/ADMIN_EMAIL=.*/ADMIN_EMAIL=$admin_email/" .env
    print_status "Updated ADMIN_EMAIL to: $admin_email"
fi

print_status "Environment setup complete!"
print_status "You can now run: ./deploy.sh deploy"
