-- Revise 360 demo data: one school, one teacher key, five student logins.
-- Run once against your database, try everything out, then run seed-demo-remove.sql
-- to take it all out again before real schools start using the service.
--
--   wrangler d1 execute revise360 --remote --file=seed-demo.sql
--
INSERT OR REPLACE INTO teachers (id, email, token, school, school_code, seats, licence, active, created, role, person)
VALUES ('demo-teacher-0001', 'demo@revise360.co.uk', 'd8aa37cab02283b89627e649c02bf862', 'Revise 360 Demo School', 'DEMO24', 0, 'free', 1, strftime('%s','now')*1000, 'admin', 'Demo Lead Teacher');

INSERT OR REPLACE INTO students (key, name, cls, school_code, pin, roster, first_seen, last_seen)
VALUES ('5f8513baeae70f8b37582e6280591694f0bcbfc5e531b02d8e78b86010581a6e', 'demo01', '11A', 'DEMO24', '632743', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
INSERT OR REPLACE INTO students (key, name, cls, school_code, pin, roster, first_seen, last_seen)
VALUES ('ea9b825db02929a77ac0f5689840d0d9400bca94a8ad1d0c5d3452554373ac48', 'demo02', '11A', 'DEMO24', '698258', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
INSERT OR REPLACE INTO students (key, name, cls, school_code, pin, roster, first_seen, last_seen)
VALUES ('a95d4885f7d75c708046350ad686f36759bbd65a7041c9204b161bf86943098a', 'demo03', '11A', 'DEMO24', '092838', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
INSERT OR REPLACE INTO students (key, name, cls, school_code, pin, roster, first_seen, last_seen)
VALUES ('bc7f279bb0d76d8e67b74bac6d29bf9219f0d45df8528398d4c4b3e140febc01', 'demo04', '10C', 'DEMO24', '960287', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
INSERT OR REPLACE INTO students (key, name, cls, school_code, pin, roster, first_seen, last_seen)
VALUES ('3c5b901acf2cd4b789a7d1c1f8e6c496dc57b8af281fc82b9600651ed921f2d1', 'demo05', '10C', 'DEMO24', '170890', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
