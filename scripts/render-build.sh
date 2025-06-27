#!/bin/bash

# Render Deployment Script for BookRental
# This script prepares the application for deployment on Render

set -e  # Exit on any error

echo "🚀 Starting Render deployment preparation..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Install dependencies
log "Installing dependencies..."
npm ci

# Create necessary directories
log "Creating directories..."
mkdir -p public/media

# Set proper permissions
chmod 755 public/media

# Run database migrations if schema file exists
if [ -f "sql/schema.sql" ]; then
    log "Schema file found - will be applied via Render environment"
fi

if [ -d "migrations" ]; then
    log "Migration files found - will be applied via Render environment"
fi

# Build the application
log "Building Next.js application..."
npm run build

success "Render deployment preparation completed!"
success "Application is ready for deployment on Render"

log "Build completed successfully! 🎉"


