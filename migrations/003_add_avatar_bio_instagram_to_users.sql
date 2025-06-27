-- Migration: Add avatar_url, bio, and instagram_url columns to users table
ALTER TABLE users
ADD COLUMN avatar_url VARCHAR(512),
ADD COLUMN bio TEXT,
ADD COLUMN instagram_url VARCHAR(255);
