-- Database schema for the book project (MySQL 8+).
--
-- Usage (creates the tables in the database named by DB_NAME in backend/.env):
--   mysql -u <DB_USER> -p <DB_NAME> < backend/database/schema.sql
--
-- Safe to re-run: tables are only created if they don't already exist.

-- Registered accounts. Passwords are stored as bcrypt hashes.
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Books on a user's shelves, with their optional rating and review.
-- book_id is the Google Books volume ID; title/author/cover are cached copies
-- so the profile page can render without calling the Google Books API.
-- (Existing databases: apply migrations/001_add_shelves_ratings_reviews.sql.)
CREATE TABLE IF NOT EXISTS `user_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `book_id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `cover_image` text,
  `status` enum('want_to_read', 'reading', 'read') NOT NULL DEFAULT 'read',
  `rating` tinyint DEFAULT NULL,
  `review` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_book` (`user_id`, `book_id`),
  CONSTRAINT `user_books_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rating_range` CHECK (`rating` IS NULL OR `rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
