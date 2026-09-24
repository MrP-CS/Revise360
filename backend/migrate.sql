-- Revise 360: bring an existing database up to date.
-- Safe to run more than once. SQLite has no "ADD COLUMN IF NOT EXISTS", so you will see
-- "duplicate column name" errors for anything already there: those are fine, ignore them.
--
--   wrangler d1 execute revise360 --remote --file=migrate.sql
--
-- 1. New tables
CREATE TABLE IF NOT EXISTS requests (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  email   TEXT NOT NULL,
  school  TEXT NOT NULL,
  name    TEXT NOT NULL,
  role    TEXT,
  note    TEXT,
  created INTEGER,
  status  TEXT DEFAULT 'new'
);
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
CREATE TABLE IF NOT EXISTS attempts (
  name TEXT NOT NULL,
  at   INTEGER NOT NULL
);

-- 2. New columns (errors here just mean you already have them)
ALTER TABLE students ADD COLUMN school_code TEXT;
ALTER TABLE students ADD COLUMN pin TEXT;
ALTER TABLE students ADD COLUMN roster INTEGER DEFAULT 0;
ALTER TABLE teachers ADD COLUMN school_code TEXT;
ALTER TABLE teachers ADD COLUMN enforce_roster INTEGER DEFAULT 0;
ALTER TABLE teachers ADD COLUMN role TEXT DEFAULT 'admin';
ALTER TABLE teachers ADD COLUMN invited_by TEXT;
ALTER TABLE teachers ADD COLUMN person TEXT;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS students_school ON students (school_code);
CREATE INDEX IF NOT EXISTS students_name_school ON students (name, school_code);
CREATE INDEX IF NOT EXISTS teachers_school ON teachers (school_code);
CREATE INDEX IF NOT EXISTS invites_school ON invites (school_code);
CREATE INDEX IF NOT EXISTS attempts_name ON attempts (name, at);
