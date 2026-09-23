# Revise 360 backend

A Cloudflare Worker plus a D1 database. It replaces the Google Sheet and works from any
device, not just the one a student signed in on.

## What it stores

| Field | Example | Why |
|---|---|---|
| `key` | `9f2c…` (SHA-256 hash) | Identifies a student without storing anything readable |
| `name` | `24smithj` | So the teacher dashboard is usable |
| `cls` | `MCS 11A` (optional) | Grouping in the dashboard |
| progress | `{"scenes":{…},"sprint":{…}}` | Scores and answers |

No passwords, no email addresses, no real names, no IP logging beyond Cloudflare's own
request logs. Data untouched for a year is deleted automatically every Monday.

## Setup, about 15 minutes

1. Install the tool and sign in:
   ```
   npm install -g wrangler
   wrangler login
   ```
2. Create the database, then paste the id it prints into `wrangler.toml`:
   ```
   wrangler d1 create revise360
   ```
3. Create the tables:
   ```
   wrangler d1 execute revise360 --remote --file=schema.sql
   ```
4. Set the teacher dashboard key (choose a long random phrase):
   ```
   wrangler secret put TEACHER_KEY
   ```
5. Publish:
   ```
   wrangler deploy
   ```
   It prints a URL like `https://revise360-api.<your-account>.workers.dev`.
6. Put that URL into `js/config.js` as `backendUrl`, commit, and the site starts syncing.
7. Check it: open `https://…workers.dev/health` and you should see `{"ok":true,…}`.

## Cost

Cloudflare's free tier covers 100,000 requests a day and 5 GB of D1 storage. A class of 30
working through an experience makes roughly 200 requests, so a whole school is comfortably
inside the free tier. There is no card on file unless you add one.

## How a student's progress reaches the right teacher

Each school gets two things:

| | Who sees it | What it does |
|---|---|---|
| **Teacher key** | Staff only | Opens the dashboard. Long and private |
| **School code** | Given to students | Six characters, e.g. `K7M3QP`. Tags every save with that school |

A student types the school code once at sign-in, or opens a link with it built in
(`https://revise360.co.uk/?school=K7M3QP`), and it is stored with their progress. The
dashboard query is filtered by the code attached to the teacher's key, so a teacher sees
their own school and nothing else. The owner key set in `TEACHER_KEY` sees everything, for
support.

Issue a key and code with:

```
curl -X POST https://your-worker-url/ -d '{"action":"issue","teacherKey":"OWNER_KEY",
  "school":"Test High School","email":"teacher@school.sch.uk"}'
```

It returns the teacher key and the generated school code. Sign-up requests from the website
are stored in the `requests` table; list them with `{"action":"requests","teacherKey":"OWNER_KEY"}`.

## Using it

- Students: nothing changes. Progress saves as they answer, and follows them to any device
  when they sign in with the same username, class and PIN.
- Teachers: open `teacher.html`, paste the `TEACHER_KEY`, and the dashboard loads every
  student's results with a CSV download.
- To delete one student's data, POST `{"action":"forget","teacherKey":"…","key":"…"}`.

## Data protection

The school remains the data controller. This service is a processor: it holds a username, an
optional class label and quiz scores. Keep the teacher key private, don't reuse it between
schools, and tell your data protection lead what is stored. When licences arrive, each school
gets its own token in the `teachers` table so keys are never shared.
