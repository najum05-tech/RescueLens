-- RescueLens operational feature migration for existing SQLite databases.
-- The application applies equivalent idempotent compatibility changes at startup.
ALTER TABLE reports ADD COLUMN embedding JSON;
ALTER TABLE reports ADD COLUMN embedding_model VARCHAR(100);
ALTER TABLE teams ADD COLUMN description TEXT;
ALTER TABLE teams ADD COLUMN created_at DATETIME;
ALTER TABLE teams ADD COLUMN updated_at DATETIME;
ALTER TABLE assignments ADD COLUMN updated_at DATETIME;

CREATE TABLE IF NOT EXISTS safety_guidance (
  id INTEGER PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL,
  language VARCHAR(8) NOT NULL,
  short_description VARCHAR(500) NOT NULL,
  instructions JSON NOT NULL,
  source_name VARCHAR(160) NOT NULL,
  source_url VARCHAR(500) NOT NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  is_published BOOLEAN NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
