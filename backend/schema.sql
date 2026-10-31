CREATE TABLE IF NOT EXISTS visitors (
  id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS visits (
  visitor_id text NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  event_id uuid NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id,event_id)
);
CREATE INDEX IF NOT EXISTS visits_time ON visits(visited_at);
CREATE TABLE IF NOT EXISTS collection (
  visitor_id text NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  pokemon_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('guess','arm','battle','legacy','unknown')),
  obtained_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id,pokemon_id)
);
