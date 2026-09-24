-- Revise 360 database (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS students (
  key        TEXT PRIMARY KEY,     -- hash of class + username + PIN, made in the browser
  name       TEXT NOT NULL,        -- school username, e.g. 24smithj
  cls        TEXT,                 -- class or group label, may be empty
  school_code TEXT,                -- the code the teacher gives out; links a student to a school
  pin         TEXT,                -- set only for logins the teacher created, so cards can be reprinted
  roster      INTEGER DEFAULT 0,   -- 1 = created by a teacher rather than self-registered
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
CREATE INDEX IF NOT EXISTS students_name_school ON students (name, school_code);

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
  enforce_roster INTEGER DEFAULT 0, -- 1 = only students on the teacher's list may sign in
  role     TEXT DEFAULT 'admin',   -- admin = the school's lead teacher; member = invited colleague
  invited_by TEXT,
  person   TEXT,                   -- the teacher's name, for the team list
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

-- Failed sign-in attempts, used only to slow down PIN guessing; cleaned up weekly
CREATE TABLE IF NOT EXISTS attempts (
  name TEXT NOT NULL,
  at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_name ON attempts (name, at);

-- Invitations to colleagues at the same school
CREATE TABLE IF NOT EXISTS invites (
  code        TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  email       TEXT,
  created     INTEGER,
  expires     INTEGER,
  used        INTEGER,
  used_by     TEXT
);
CREATE INDEX IF NOT EXISTS invites_school ON invites (school_code);
