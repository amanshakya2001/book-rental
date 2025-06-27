#!/bin/bash

# Database initialization script for Render
# Run this once after your first deployment to set up the database

set -e

echo "🗄️ Setting up database for BookRental..."

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
    echo "❌ ERROR: POSTGRES_URL environment variable is not set"
    echo "Please set your POSTGRES_URL in Render dashboard first"
    exit 1
fi

echo "✅ POSTGRES_URL found"

# Add SSL mode if not present
if [[ "$POSTGRES_URL" != *"sslmode"* ]]; then
    POSTGRES_URL="${POSTGRES_URL}?sslmode=require"
fi

# Test database connection
echo "🔍 Testing database connection..."
if ! psql "$POSTGRES_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to database. Please check your POSTGRES_URL"
    exit 1
fi

echo "✅ Database connection successful"

# Run schema
echo "📋 Creating database schema..."
if [ -f "sql/schema.sql" ]; then
    psql "$POSTGRES_URL" -f sql/schema.sql
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
            if psql "$POSTGRES_URL" -f "$migration" -v ON_ERROR_STOP=1; then
                echo "  ✅ Migration $(basename "$migration") completed successfully"
            else
                echo "  ⚠️  Migration $(basename "$migration") had issues (may already be applied)"
            fi
        fi
    done
    echo "✅ All migrations processed"
else
    echo "⚠️  No migrations directory found"
fi

# Verify profile columns exist
echo "🔍 Verifying database structure..."
psql "$POSTGRES_URL" -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('avatar_url', 'bio', 'instagram_url', 'updated_at')
ORDER BY column_name;
"

echo "🎉 Database setup completed successfully!"
echo ""
echo "Your BookRental database is ready to use!"
