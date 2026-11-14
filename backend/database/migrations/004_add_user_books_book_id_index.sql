-- Migration 004: index user_books by book, for a book's community reviews
-- (GET /api/books/:bookId/reviews). The existing unique key starts with
-- user_id, so it can't be used to find every reader of one book.
--
-- Only needed for databases created before this change; a fresh setup from
-- schema.sql already includes it. Run once, after migration 003:
--   mysql -u <DB_USER> -p <DB_NAME> < backend/database/migrations/004_add_user_books_book_id_index.sql

CREATE INDEX `user_books_book_id` ON `user_books` (`book_id`);
