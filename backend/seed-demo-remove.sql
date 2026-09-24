-- Removes every trace of the demo school created by seed-demo.sql
DELETE FROM progress WHERE key IN (SELECT key FROM students WHERE school_code = 'DEMO24');
DELETE FROM students WHERE school_code = 'DEMO24';
DELETE FROM invites  WHERE school_code = 'DEMO24';
DELETE FROM teachers WHERE school_code = 'DEMO24';
