-- Migration 003: following other readers, and private profiles.
--
-- Only needed for databases created before this change; a fresh setup from
-- schema.sql already includes these. Run once, after migration 002:
--   mysql -u <DB_USER> -p <DB_NAME> < backend/database/migrations/003_add_follows_and_privacy.sql

-- Private profiles hide their shelves, reviews and activity from other users.
-- Existing and new profiles start public.
ALTER TABLE `users`
  ADD COLUMN `is_private` BOOLEAN NOT NULL DEFAULT FALSE AFTER `password`;

-- follower_id follows following_id. Following yourself is rejected by the API
-- (MySQL doesn't allow a CHECK on columns used by a cascading foreign key).
CREATE TABLE IF NOT EXISTS `follows` (
  `follower_id` int NOT NULL,
  `following_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`, `following_id`),
  KEY `follows_following_id` (`following_id`),
  CONSTRAINT `follows_follower_fk` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_following_fk` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
