-- Migration 005: profile pictures.
--
-- Only needed for databases created before this change; a fresh setup from
-- schema.sql already includes these. Run once, after migration 004:
--   mysql -u <DB_USER> -p <DB_NAME> < backend/database/migrations/005_add_avatars.sql

-- The picture itself, already resized to a small WebP by the API (typically
-- 10-20 KB), and when it last changed (used to version its URL for caching).
ALTER TABLE `users`
  ADD COLUMN `avatar` MEDIUMBLOB NULL AFTER `is_private`,
  ADD COLUMN `avatar_updated_at` TIMESTAMP(3) NULL DEFAULT NULL AFTER `avatar`;
