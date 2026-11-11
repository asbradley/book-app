-- Migration 002: track when books are finished, and yearly reading goals.
--
-- Only needed for databases created before this change; a fresh setup from
-- schema.sql already includes these. Run once, after migration 001:
--   mysql -u <DB_USER> -p <DB_NAME> < backend/database/migrations/002_add_finished_at_and_reading_goals.sql

-- When a book was moved to the "read" shelf (NULL for other shelves).
-- The API sets and clears it automatically when the shelf changes.
ALTER TABLE `user_books`
  ADD COLUMN `finished_at` TIMESTAMP NULL DEFAULT NULL AFTER `review`;

-- Existing "read" books have no finish date; the date they were added is the
-- closest information available.
UPDATE `user_books` SET `finished_at` = `created_at` WHERE `status` = 'read';

-- One reading goal (number of books) per user per year
CREATE TABLE IF NOT EXISTS `reading_goals` (
  `user_id` int NOT NULL,
  `year` smallint NOT NULL,
  `target` smallint NOT NULL,
  PRIMARY KEY (`user_id`, `year`),
  CONSTRAINT `reading_goals_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `target_range` CHECK (`target` BETWEEN 1 AND 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
