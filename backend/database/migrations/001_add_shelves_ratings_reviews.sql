-- Migration 001: reading shelves, ratings and reviews on user_books.
--
-- Only needed for databases created before this change; a fresh setup from
-- schema.sql already includes these columns. Run once:
--   mysql -u <DB_USER> -p <DB_NAME> < backend/database/migrations/001_add_shelves_ratings_reviews.sql
--
-- Existing rows default to 'read' because books were previously only added
-- as reading history.

ALTER TABLE `user_books`
  ADD COLUMN `status` ENUM('want_to_read', 'reading', 'read') NOT NULL DEFAULT 'read' AFTER `cover_image`,
  ADD COLUMN `rating` TINYINT NULL AFTER `status`,
  ADD COLUMN `review` TEXT NULL AFTER `rating`,
  ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
  ADD CONSTRAINT `rating_range` CHECK (`rating` IS NULL OR `rating` BETWEEN 1 AND 5);
