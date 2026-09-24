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

## Before you deploy: demo mode

With `backendUrl` empty in `js/config.js`, the whole platform runs in the browser:
teachers sign in to the dashboard with the key `demo`, create class logins, print cards,
and students sign in and work through experiences with progress saved on that device. It
uses the same actions as this Worker, so when you're ready you paste your Worker URL into
`backendUrl` and everything switches over with no other change.

What demo mode can't do: share progress between devices, let colleagues see each other's
classes, or issue real teacher keys. Those need the backend below.

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

## "Sorry, that didn't send" on the sign-up form

That message means the browser couldn't get an answer from the backend. Work through these
in order; it's nearly always the first two.

**1. Is the backend deployed and reachable?**
Open `https://api.revise360.co.uk/health` (or your `workers.dev` URL) in a browser. You want
`{"ok":true,...}`. If it doesn't load:
- `wrangler deploy` from the `backend` folder, and check it prints a URL.
- If you're using `api.revise360.co.uk`, add that custom domain to the Worker in the
  Cloudflare dashboard, under Workers → your worker → Settings → Domains & Routes. Until
  that DNS record exists the address doesn't resolve.

**2. Does `js/config.js` point at the right place?**
`backendUrl` must be exactly the URL that answered in step 1, including `https://`. If you're
still testing, put the `workers.dev` URL there for now.

**3. Do the tables exist?**
The sign-up form writes to a `requests` table, which was added after the first version.
Run the migration once:

```
wrangler d1 execute revise360 --remote --file=migrate.sql
```

You'll see "duplicate column name" errors for anything already present. Those are expected.

**4. Still stuck?**
Open the page, press F12, and look at the Console and Network tabs while you submit. A red
CORS message means the Worker isn't returning the headers, so check it deployed properly. A
404 means the URL is wrong. A 500 usually means a missing table, so go back to step 3.

Whatever happens, the form now falls back to a pre-written email to you, so a teacher can
always get through.

## Demo data for testing

`seed-demo.sql` creates one demo school, one teacher key and five student logins so you can
try the whole platform before any real school touches it:

```
wrangler d1 execute revise360 --remote --file=seed-demo.sql
```

The credentials are in that file. Sign in as a student on the home page, work through an
experience, then open `teacher.html` with the demo teacher key and watch the results appear.
The demo school is a normal school as far as the system is concerned, so class logins,
printing cards, CSV import and colleague invites all work.

When you've finished, take it all out again:

```
wrangler d1 execute revise360 --remote --file=seed-demo-remove.sql
```

**Two rules.** Don't leave the demo teacher key in place once real schools are signed up:
anyone who learns it sees that school's data, though the demo school holds nothing real.
And never put a teacher key or the owner key in `js/config.js` or anywhere else the browser
can read: keys belong in the backend only.

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

The easiest way to issue a key is the **admin page** at `/admin.html`: sign in with the
`TEACHER_KEY` secret, review requests from the sign-up form, and press Issue key. It shows
the teacher key once, offers a ready-drafted email, and lists every key with its school code
and student count so you can switch one off later.

Or from the command line:

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

## Connecting a payment system (WordPress, Stripe or anything else)

Key issuing is a single API call, so any checkout can trigger it:

```
POST { "action": "issue", "teacherKey": "OWNER_KEY",
       "school": "Riverside Academy", "email": "buyer@school.sch.uk",
       "licence": "paid", "seats": 200 }
→ { "ok": true, "teacherKey": "…", "schoolCode": "K7M3QP" }
```

With WooCommerce, add a hook on `woocommerce_order_status_completed` that makes this call
and emails the key and school code to the buyer. Keep the owner key in `wp-config.php`, never
in a page or a theme file. Until that's wired up, issuing by hand from the admin page after a
payment notification works perfectly well, and gives you a look at who is signing up.
