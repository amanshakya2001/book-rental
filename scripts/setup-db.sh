#!/bin/bash

# Database initialization script for Render
# Run this once after your first deployment to set up the database

set -e

echo "🗄️ Setting up database for BookRental..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL in Render dashboard first"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Run schema
echo "📋 Creating database schema..."
if [ -f "sql/schema.sql" ]; then
    psql "$DATABASE_URL" -f sql/schema.sql
    echo "✅ Schema created successfully"
else
    echo "❌ Schema file not found: sql/schema.sql"
    exit 1
fi

# Run migrations
echo "🔄 Running database migrations..."
if [ -d "migrations" ]; then
    for migration in migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "  📝 Running: $(basename "$migration")"
            psql "$DATABASE_URL" -f "$migration"
        fi
    done
    echo "✅ All migrations completed"
else
    echo "⚠️  No migrations directory found"
fi

echo "🎉 Database setup completed successfully!"
echo ""
echo "Your BookRental database is ready to use!"
