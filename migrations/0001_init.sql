-- Rinks we track. `adapter` names the ingest module that knows how to read the rink's schedule.
CREATE TABLE rinks (
	id TEXT PRIMARY KEY, -- slug, e.g. 'a2-veterans'
	name TEXT NOT NULL,
	city TEXT NOT NULL,
	address TEXT,
	lat REAL NOT NULL,
	lng REAL NOT NULL,
	website TEXT,
	schedule_url TEXT,
	adapter TEXT, -- null = not automated yet
	active INTEGER NOT NULL DEFAULT 1,
	last_checked_at TEXT, -- ISO 8601 UTC, last successful ingest
	last_error TEXT
);

CREATE TABLE sessions (
	id TEXT PRIMARY KEY, -- stable per source event so re-ingest upserts
	rink_id TEXT NOT NULL REFERENCES rinks (id) ON DELETE CASCADE,
	type TEXT NOT NULL CHECK (type IN ('drop_in', 'sticks_pucks')),
	title TEXT,
	starts_at TEXT NOT NULL, -- ISO 8601 UTC
	ends_at TEXT, -- ISO 8601 UTC
	local_date TEXT NOT NULL, -- YYYY-MM-DD in America/Detroit, for date filtering
	age_group TEXT CHECK (age_group IN ('adult', 'youth', 'all')),
	price_cents INTEGER,
	booking_url TEXT,
	source_url TEXT,
	fetched_at TEXT NOT NULL
);

CREATE INDEX sessions_by_date_type ON sessions (local_date, type);
CREATE INDEX sessions_by_rink ON sessions (rink_id, starts_at);
