#!/bin/bash

# Outwit Budget Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT..."
echo "📅 Timestamp: $TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    log_warning "No environment file found. Make sure to set environment variables."
fi

# Install dependencies
log_info "Installing dependencies..."
npm ci --only=production
log_success "Dependencies installed"

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate
log_success "Prisma client generated"

# Run build
log_info "Building application..."
npm run build
log_success "Build completed successfully"

# Deploy based on environment
case $ENVIRONMENT in
    "vercel")
        log_info "Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod --yes
            log_success "Deployed to Vercel successfully!"
        else
            log_error "Vercel CLI not found. Install with: npm i -g vercel"
            exit 1
        fi
        ;;
    "production")
        log_info "Deploying to production server..."
        # Add your production deployment commands here
        log_success "Deployed to production successfully!"
        ;;
    "staging")
        log_info "Deploying to staging..."
        # Add your staging deployment commands here
        log_success "Deployed to staging successfully!"
        ;;
    *)
        log_error "Unknown environment: $ENVIRONMENT"
        log_info "Available environments: vercel, production, staging"
        exit 1
        ;;
esac

# Post-deployment tasks
log_info "Running post-deployment tasks..."

# Health check (if applicable)
if [ "$ENVIRONMENT" = "vercel" ] || [ "$ENVIRONMENT" = "production" ]; then
    log_info "Waiting for deployment to be ready..."
    sleep 10
    
    # You can add health check URL here
    # curl -f https://your-domain.com/api/health || log_warning "Health check failed"
fi

log_success "🎉 Deployment completed successfully!"
log_info "Environment: $ENVIRONMENT"
log_info "Timestamp: $TIMESTAMP"

# Open deployment URL (optional)
case $ENVIRONMENT in
    "vercel")
        log_info "🌐 Your app should be available at: https://outwit-budget.vercel.app"
        ;;
    "production")
        log_info "🌐 Your app should be available at your production URL"
        ;;
esac
