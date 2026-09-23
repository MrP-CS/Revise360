-- Revise 360 database (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS students (
  key        TEXT PRIMARY KEY,     -- hash of class + username + PIN, made in the browser
  name       TEXT NOT NULL,        -- school username, e.g. 24smithj
  cls        TEXT,                 -- class or group label, may be empty
  school_code TEXT,                -- the code the teacher gives out; links a student to a school
  first_seen INTEGER,
  last_seen  INTEGER
);
CREATE TABLE IF NOT EXISTS progress (
  key     TEXT NOT NULL,
  exp_id  TEXT NOT NULL,
  data    TEXT NOT NULL,           -- JSON: answers, scores, info markers seen
  updated INTEGER NOT NULL,
  PRIMARY KEY (key, exp_id)
);
CREATE INDEX IF NOT EXISTS progress_updated ON progress (updated);
CREATE INDEX IF NOT EXISTS students_cls ON students (cls);

-- For licences later: one row per teacher, each with their own dashboard token
CREATE TABLE IF NOT EXISTS teachers (
  id       TEXT PRIMARY KEY,
  email    TEXT,
  token    TEXT UNIQUE NOT NULL,   -- what they paste into the dashboard
  school   TEXT,
  school_code TEXT,                -- the code their students type at sign-in
  seats    INTEGER DEFAULT 0,
  licence  TEXT,                   -- free | trial | paid
  active   INTEGER DEFAULT 1,
  created  INTEGER
);

CREATE INDEX IF NOT EXISTS students_school ON students (school_code);
CREATE INDEX IF NOT EXISTS teachers_school ON teachers (school_code);

-- Teachers asking for a key, reviewed before one is issued
CREATE TABLE IF NOT EXISTS requests (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  email   TEXT NOT NULL,
  school  TEXT NOT NULL,
  name    TEXT NOT NULL,
  role    TEXT,
  note    TEXT,
  created INTEGER,
  status  TEXT DEFAULT 'new'       -- new | issued | declined
);
