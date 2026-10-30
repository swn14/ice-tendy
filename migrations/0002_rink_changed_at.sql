-- When the rink's details or its upcoming sessions last actually changed, as opposed to
-- last_checked_at, which moves on every successful ingest. Drives the sitemap's <lastmod>.
ALTER TABLE rinks ADD COLUMN changed_at TEXT; -- ISO 8601 UTC

UPDATE rinks SET changed_at = last_checked_at;
