# Unit downloads: what is built, by what, and how to rebuild it

A teacher opens the dashboard, picks a topic, and gets two downloads for that
unit. Everything behind them is generated; nothing is assembled by hand.

## The chain

```
tools/specs*.py  +  tools/codebank/*.json          the authored content
        |
        v
tools/inventory.py      ->  build/inventory.json   what the course contains
tools/record.py         ->  build/records/*.json   one canonical record per lesson
                            answers/records/*.json the teacher half (never committed)
                            build/coverage.json    the outcome trace
                            docs/COVERAGE.md
        |
        v
tools/mkplans.py        ->  lessonplans/*.pdf      a plan per lesson + index.json
tools/mkunitdocs.py     ->  unitdocs/*.pdf         3 per unit + the course map
tools/mkpacks.py        ->  packs/*.zip            two per unit + index.json
                                                   + a manifest beside each zip
```

Each step reads the one above it, so a change to a question reaches the lesson
plan, the delivery guide and the pack without anyone retyping it.

## Rebuilding

Order matters: a later step reads what an earlier one wrote.

```bash
export R360_PLEX=/path/to/ibm-plex-woff2      # the embedded fonts
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers

python3 tools/inventory.py
python3 tools/record.py
python3 tools/mkplans.py
python3 tools/mkunitdocs.py
python3 tools/mkpacks.py                      # ~10 min: LibreOffice converts
                                              # 110 worksheets to PDF, cached in
                                              # build/wspdf
```

Then the checks, each of which has been validated by breaking what it watches:

```bash
python3 tools/tests/smokeplans.py             # a real, current plan per lesson
python3 tools/tests/smokepacks.py             # the packs hold what they say
python3 tools/audit_exposure.py --strict      # nothing private is published
```

Without `R360_PLEX` the documents still build, in the system sans, and say so.

## What goes in which pack

**`<unit>_Teaching_Resources.zip`** — numbered lesson folders, each with the
PowerPoint (.pptx) and the worksheet (.docx and .pdf). A README. Nothing else:
no source, no JSON, no media, no manifest. The build manifest sits beside the zip.

**`<unit>_Teacher_Guide.zip`** — `<unit>_Unit_Pedagogy.pdf`,
`<unit>_Unit_Big_Picture.pdf`, `<unit>_Unit_Delivery_Guide.pdf`,
`GCSE_Course_Big_Picture.pdf`, `Lesson_Plans/` (one PDF per lesson of the unit),
and `Teacher_Answers/` where verified answers exist. Where they do not, the folder
is absent and the README says so rather than shipping an empty one.

A lesson with neither slides nor a worksheet — the bonus challenges — has no
folder in the teaching pack, and the README names it and says why.

## The packs are reproducible

Built twice from the same files, a pack is byte-for-byte the same. Entries are
sorted by their name in the archive, every entry carries the same timestamp (the
newest source file's, not today's), and the README and manifest are dated from
that same stamp. Without this, every rebuild would write another 57 MB of
identical content into the repository's history. `smokepacks.py` rebuilds one unit
and compares the hashes.

## Adding a unit

Nothing in these tools knows a unit list. They read `build/inventory.json`, which
reads `experiences/topics.json` and `experiences/registry.json`. Add the lessons
there and the whole chain picks them up, including the course big picture.

## What these downloads are not

They are documents. The 360° experiences are not in them and will not be: see
`docs/EXPERIENCE-PROTECTION.md` for what is checked, what is deliberately allowed,
and the honest limits of a static site with no server.
