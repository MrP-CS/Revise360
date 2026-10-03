# The 360° experiences are website-only — and what that is worth today

The product's position is simple: a teacher downloads documents; the experiences
are used on revise360.co.uk. No "download experience", no offline bundle, no
SCORM or H5P export, no downloadable player, no site backup.

This document is in two halves. The first is what has been built and is checked
on every run. The second is what has **not** been built, because this build has
no backend, and what that means for anyone deciding how to publish.

## What a unit download contains

Two ZIPs per unit, built by `tools/mkpacks.py` from an explicit allowlist, never
by zipping a directory and hoping the exclusions hold.

**`<unit>_Teaching_Resources.zip`** — one numbered folder per lesson, each holding
the lesson PowerPoint (.pptx) and the student worksheet (.docx to edit, .pdf to
print). A README, and nothing else. The build manifest sits **beside** the zip as
`<unit>_Teaching_Resources_MANIFEST.json`, not inside it.

**`<unit>_Teacher_Guide.zip`** — the unit pedagogy, big picture and delivery
guide, the whole-course big picture, a lesson plan for every lesson of the unit in
`Lesson_Plans/`, and the teacher answers in `Teacher_Answers/` where verified ones
exist. Where they do not, there is no folder rather than an empty one.

A lesson with neither slides nor a worksheet — the bonus challenges — has no
folder in the teaching pack, and the README names it and says why.

## What is checked, every time

`tools/tests/smokepacks.py` re-opens all 24 packs and fails on any of:

| check | what it catches |
|---|---|
| every entry matches the allowlist | anything the builder was not asked to include |
| first bytes against the extension | a 360 image renamed `.pdf`, a page renamed `.docx` |
| names that look like the product | `experiences/`, `_360.jpg`, `_hi.jpg`, `/img/`, `.js`, `.html`, `.wasm`, `.glb` |
| **inside** every .pptx and .docx | a scene image embedded in a slide, by SHA-256 against every file in `experiences/img/` |
| **inside** every .pptx and .docx | any 2:1 image of 1024px or wider — the shape of an equirectangular panorama |
| zip entry names and attributes | a path escape (`../`, a leading `/`) or a symlink |
| the text files in a pack | a teacher key, an `Authorization` header, a bearer token, a raw S3 or Azure link |
| the teaching pack's kinds | anything that is not `.pptx`, `.docx` or `.pdf` |
| a print-ready PDF beside every worksheet | a `--no-pdf` build shipping no printable worksheet |
| a plan for every lesson of the unit | a pack that is quietly short |
| the manifest is outside the zip | build metadata in a pack a teacher opens |

Each check was validated by breaking the thing it watches: a scene JSON added to a
pack, a panorama renamed `.pdf`, the player script, a panorama hidden in a slide
deck's `ppt/media/`, and a `../` path escape. All five were caught.

### The one image that is allowed, and why

Four of the 2.5 slide decks embed a 1440×900 view of their room — a rectilinear,
flattened preview of what a pupil sees on arrival, with the station layout
readable. It is a separate rendered view, not a crop of the panorama: the original
is 4096×2048 and equirectangular, and no byte of it is in the deck. One
perspective view cannot rebuild a room. The test allows it and reports the count,
so if that count grows, somebody looks.

## What is NOT protected, and why not

**This build has no server.** `APP_CONFIG.backendUrl` is empty. The site is static
files; there is nothing between a request and a file.

That means:

- The packs, the lesson plans and the unit guides sit at ordinary addresses under
  `packs/`, `lessonplans/` and `unitdocs/`. The links to them are on the teacher
  dashboard, behind the teacher sign-in, and nowhere a pupil goes — but the
  sign-in is a panel in the page, not a gate in front of the files. Anyone who
  knows or guesses a URL can fetch one.
- The same is true of the experiences themselves. `experiences/*.json` and
  `experiences/img/*.jpg` are fetched by the browser from ordinary addresses and
  can be fetched by anything else.
- There is no entitlement check of any kind. Nothing asks whether this teacher's
  school has this unit, because nothing is in a position to ask.
- Teacher answers are kept out of the public repository (`answers/` is gitignored)
  and out of every lesson plan, which is why `smokeplans.py` checks that no plan
  prints a model solution. That is a discipline about what gets built, not a
  control over who can read it.

**So: this is not secure, and must not be described as secure.** A client-side
gate is a convenience for the teacher who is signed in, not a protection against
anyone who is not. The dashboard panel says so on the page itself:

> These files are served as ordinary downloads. This build has no server to check
> who is asking, so treat the links as private rather than protected.

### What would make it real

The dependency is one thing: a server, or a trusted gateway, that authorises each
request — including a direct request for an asset, not only for the page that
links to it. Concretely:

1. Move `packs/`, `lessonplans/`, `unitdocs/` and `experiences/` behind a route
   that requires the user's own login and checks their permissions on every
   request, not a signed URL that expires and not a shared credential.
2. Check two things before releasing a teacher pack: that the account is a
   verified teacher, and that their school is entitled to that unit. A student
   account must never receive a teacher bundle or any answer material, while the
   individual student worksheet access the lesson flow already relies on keeps
   working.
3. Check entitlement before serving an experience's scene JSON and its images, so
   that a direct request for `experiences/img/<unit>_360.jpg` is refused the same
   way the page would be.

This is the same backend workstream that `docs/PYTHON-PROGRESSION.md` names for
holding progress, and it is narrow: authorisation on protected routes, not a
rewrite of payments or identity.

**Until that exists, do not publish these packs anywhere that implies they are
access-controlled, and do not make a claim on the website or in a sales
conversation that the experiences cannot be taken.** They can. What is true today
is that the product does not offer a way to take them, that no download contains
any part of one, and that the build fails if one ever appears in a pack.
