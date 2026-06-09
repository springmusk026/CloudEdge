-- Add pinned column to posts
ALTER TABLE posts ADD COLUMN pinned integer DEFAULT 0;
