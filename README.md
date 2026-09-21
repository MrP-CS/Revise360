# Revise 360

A small website that hosts 360° GCSE Computer Science experiences in one place. Students choose a topic, then an experience within it.

- **Students** sign in with their name, class and a 4-digit PIN they make up. Their progress saves after every answer, so they can stop and carry on later, on any device.
- **In each experience**, students answer quiz stations, tap blue **i** markers to find out more (the panel doesn't block the scene), open **My progress**, and use **Review mode** to retry questions they got wrong.
- **On the home screen**, students choose a topic (topics without experiences yet show as Coming soon), then see its experiences with their progress, plus a list of "areas to work on" that links straight to the questions to retry.
- **Teachers** open `teacher.html`, pick a topic, and see every student's progress, the weakest stations for each class, and a per-student breakdown. Results can be downloaded as a CSV.

The first answer to each question is the score that counts. Review mode records whether a student has since fixed a mistake, and the teacher dashboard shows both.

---

## 1. Put the site online (about 5 minutes)

The site is plain HTML, CSS and JavaScript, so any static host works. It **won't** work by double-clicking `index.html`, because browsers block pages opened from your own disk from loading the experience files.

**Option A: Netlify (quickest)**
1. Go to <https://app.netlify.com/drop> and sign in.
2. Drag this whole folder onto the page. You'll get a web address straight away.

**Option B: GitHub Pages**
1. Create a new repository on GitHub and upload the contents of this folder.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
3. After a minute, your site is at `https://<your-username>.github.io/<repository-name>/`.

At this point the site works in **device-only mode**: progress is saved in each student's browser, and the teacher dashboard only shows students who signed in on that same browser. Do step 2 to collect results from every device.

## 2. Collect results in a Google Sheet (about 10 minutes)

1. Create a new Google Sheet, for example "Networks VR results".
2. Go to **Extensions → Apps Script**. Delete the starter code, paste in everything from `apps-script/Code.gs`, and save.
3. Go to **Project Settings (the cog) → Script properties → Add script property**. Set the property to `TEACHER_KEY` and the value to a password only teachers will know.
4. Click **Deploy → New deployment**, choose the type **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**, approve the permissions, and copy the **Web app URL**. It ends in `/exec`.
6. Open `js/config.js`, paste the URL between the quotes on the `backendUrl` line, and re-upload the site.
7. Open `teacher.html` on your site and enter your teacher key.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version**, so the URL stays the same.

## 3. Settings

Everything you're likely to change is in `js/config.js`:
- `classes`: the class list students choose from when they sign in.
- `secure` / `revise`: the score bands. The defaults are full marks = Secure, at least 60% = Revise, and anything lower = Focus here.

## 4. Topics

Topics are listed in `experiences/topics.json`, grouped by paper. This file also sets the site name (`siteTitle`) and the line under it (`tagline`). The OCR J277 topics are already there. Edit the titles or descriptions, or add new groups and topics (for example, KS3 units). A topic with no experiences shows as **Coming soon**; it becomes clickable as soon as you add an experience for it.

## 5. Adding a new experience

No code changes are needed.

1. Put the 360 image, a 2:1 equirectangular JPG (for example 4096×2048), in `experiences/img/`. It's the same image you upload to ClassVR.
2. Create `experiences/<id>.json`. Copying an existing file such as `lesson4.json` is the easiest start.
3. Add an entry to `experiences/registry.json`, including `"topic"` set to the topic's `id` from `topics.json` (for example `"1.4"`). It appears under that topic on the home screen and in the teacher dashboard automatically.
4. Optional: put the lesson's worksheet in `worksheets/` and add `"worksheet": "worksheets/<file name>"` to its registry entry. A **Worksheet** download button then appears on its home-screen card and in the experience's toolbar. Leave the field out and no button shows.

### Experience file format

```json
{
  "id": "lesson9", "lesson": 9, "title": "Modes of connection",
  "scenes": [{
    "id": "p1", "title": "Part 1: Wired", "img": "img/L9_Part1_360.jpg", "imgHi": "img/L9_Part1_360_hi.jpg",
    "stations": [{
      "label": "1", "name": "Ethernet", "col": "#40c4ff",
      "face": "right", "x": 540, "y": 1730,
      "tasks": [
        { "t": "mcq", "q": "Question?", "a": ["Correct answer", "Wrong 1", "Wrong 2", "Wrong 3"], "fb": "Explanation shown after answering." }
      ]
    }],
    "info": [
      { "id": "cat6", "face": "right", "x": 920, "y": 540, "title": "Did you know?", "text": "Extra information shown in the side panel." }
    ]
  }]
}
```

**Positions:** `face` is the wall (`front`, `right`, `back`, `left`, `up` or `down`), and `x`/`y` are pixel positions on that wall's 2048×2048 artwork. The station cards in the existing scenes put badges at x 540 or 1508, y 1730 on the side walls. Older entries use `"pos": [right, up, front]` instead, which also works.

**Task types:**

| `t` | Fields | Marks |
|---|---|---|
| `mcq` | `q`, `a` (correct answer first), `fb`, optional `img` | 1 |
| `multi` | `q`, `opts`, `correct` (list), `fb`, optional `img` | 1 if exactly right |
| `sort` | `q`, `cats`, `items` as `[statement, category]`, `fb` | 1 per item |
| `match` | `q`, `pairs` as `[left, right]`, `fb` | 1 per pair |
| `order` | `q`, `steps` (in the correct order), `fb` | 1 per step in the right place |

Answer options are shuffled for students automatically.

## 6. VR mode (Meta Quest 3 and other WebXR headsets)

Every experience has a VR mode. No app is needed; it runs in the headset's web browser.

1. On the headset, open the **Meta Quest Browser** and go to the site. Sign in and choose a topic as normal (the on-screen keyboard works for the name and PIN).
2. Open an experience and press **🥽 Enter VR** in the toolbar. The button only appears on devices that support VR.
3. In VR:
   - **Point and select:** aim a controller's laser at a numbered badge or a blue *i* marker and pull the trigger. With hand tracking, point and pinch your thumb and index finger.
   - **Questions** appear on a floating panel in front of you. Select answers the same way.
   - **Menu:** look down to find the ☰ Menu button. It shows your score and has buttons for My progress, Review mode, switching scenes and Exit VR.
   - **Turning:** push either thumbstick left or right to turn 30°, which helps when seated.
4. Progress saves exactly as it does on a laptop, so scores show on the home screen and the teacher dashboard.

Sign-in, topics and worksheet downloads stay as normal web pages; do them before entering VR.

**Sharper images for headsets:** each scene can have an optional `"imgHi"` image (8192×4096) that is only used in VR, where the extra detail makes the wall text easier to read. If a scene has no `imgHi`, VR uses the normal `img`.

**If VR doesn't start:** check the site is opened with `https://` (GitHub Pages does this automatically), and that the headset's browser isn't blocked by your device management.

## 7. Data protection: please check before using with students

- The site stores each student's name, class and scores. With step 2 set up, these are saved in **your** Google Sheet. Check with your school's data protection lead that this is acceptable, and use a school Google account if you have one.
- Nothing else is collected: there are no cookies, analytics or adverts.
- The PIN isn't stored. It's combined with the name and class to create an ID for each student. It isn't a strong password, so treat it as a way to keep progress separate between students, not as security.
- To delete a student's data, delete their rows in the Sheet.
