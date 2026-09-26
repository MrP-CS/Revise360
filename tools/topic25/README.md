# Topic 2.5 authoring notes

Five original Revise360 lessons cover language characteristics, low-level operations,
translators, IDE facilities, and review/assessment preparation. Each lesson has six
stations, six readable information panels, two final tasks, a worksheet and an
18-slide lesson PowerPoint. The review lesson's written plenary is a short knowledge
check, not an official OCR assessment.

## Provenance and originality review

The supplied 13 PDF exports were used to identify coverage and lesson order. Their
extractable text was compared with the new content: no exact nine-word sequences
were found. Standard computing terminology and shared factual concepts naturally
overlap. Some PDFs contain previews of embedded resources rather than their full
contents, so this is not a complete comparison against those underlying resources
or a claim of worldwide uniqueness.

Explanations, task wording, answer feedback, scenarios, numeric examples and room
artwork were authored for this topic. No third-party screenshots, publisher diagrams,
assessment questions or resource pages were inserted. The Revise360 room layout,
player, scoring/review logic, logo and lesson-slide template are reused from this
repository, as requested. Their existing provenance and licences are unchanged.

Lesson 2 uses an explicitly described teaching computer, not a specific real CPU.
It is enrichment for understanding low-level operations, not a claim that OCR J277
requires students to memorise an assembly instruction set. Translator comparisons
state the simplified GCSE model and qualify real-world exceptions.

## Editable sources

- `content.py`: lessons 2–5 and helpers.
- `lesson1.json`: the approved-preview lesson, revised for publication.
- `build.py`: renders 4096-pixel cube walls and updates experience data/registry.
- `lessons.json`: generated common content used for worksheet/slide alignment.
- `worksheets.py`: clones the established Logic Gate Lab worksheet template for all five lessons, preserving its station panels, answer lines, score box and confidence table.

Run `python tools/topic25/build.py`, then `python tools/topic25/worksheets.py` from
an environment with Pillow, NumPy and python-docx installed. Artwork uses DejaVu
Sans. Lesson slide files reuse the established Topic 1.1 template and contain
editable text, the Revise360 logo, and screenshots of the actual new experiences.

## Rendering and verification

The optional `faces` scene property activates six independently textured walls.
The existing spherical panorama path is retained for other topics. The wall group
shares the normal scene and VR rotation, so the same station coordinates and
controller targets apply. Readable blue information panels repeat the wall facts.

Desktop checks cover all 70 tasks, scores, completion, review without changing
first-attempt scores, persistence, scene orientation and legacy panorama loading.
Tablet interaction checks cover touch controls and layout. Physical headset testing
is still required on the HTTPS site, especially wall clarity, controller selection
and comfortable reading distance. No claim of headset hardware verification is made.

## Returning-browser regression

The cube-face player requires the updated script. `experience.html` now uses
`player.js?v=20260926-topic25-2`, so a browser holding the older panorama-only
player fetches the compatible version. The old script was reproduced displaying
the square preview as a stretched panorama; the versioned page restores all six
room walls. Whenever the player format changes, update its version in the page.
Worksheet URLs are versioned too, so previous downloads do not mask the new template.
