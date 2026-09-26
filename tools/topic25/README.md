# Topic 2.5 authoring notes

## OCR curriculum audit

Checked against OCR GCSE Computer Science J277 specification, version 3.1,
May 2026, printed page 21 (PDF page 23), sections 2.5.1 and 2.5.2:
https://www.ocr.org.uk/images/558027-specification-gcse-computer-science-j277.pdf

| Lesson | Scope |
| --- | --- |
| 1 Language level lab | High-level and low-level characteristics, machine code, portability and the need for translation (2.5.1) |
| 2 Language choice workshop | Language purpose, readability, development effort, portability, hardware control and justified choices (2.5.1) |
| 3 Translation studio | Need for translators; compiler/interpreter behaviour, error reporting, benefits and drawbacks (2.5.1) |
| 4 IDE control room | Editors, error diagnostics, translators and run-time environment; practical use in a class IDE (2.5.2) |
| 5 Language review HQ | Application and retrieval of the same 2.5.1 and 2.5.2 content |

The original instruction-model lesson exceeded the required scope. This revision
replaces it entirely. It removes assembly instruction tracing, accumulator exercises,
assembler operation, linking, bytecode and runtime-library implementation detail.
Assembly is named only as a low-level language, without teaching an instruction set
or assembler. OCR explicitly excludes understanding of assemblers.

Breakpoint/step/watch exercises were not necessarily invalid examples of diagnostics,
but the revised lessons focus on the four facilities expressly listed by OCR. Source
snippets illustrate the facilities; they do not assess a separate programming syllabus.
Lesson 4 requires practical work in the class IDE. The 360 activity alone does not
replace OCR's requirement for practical experience of an IDE.

The audit covers wall facts and diagrams, information panels, all 70 interactive
tasks and feedback, starter and terminology answers, worksheet challenges, final
challenges, written plenaries and slide answers. All derive from the common content
sources below. Exam-style questions are original practice, not official OCR questions.

## Provenance

The supplied resource exports informed topic coverage. No third-party screenshots,
lesson text, publisher diagrams or assessment questions are reproduced. Explanations,
scenarios, task wording, answers and room artwork were authored for Revise360.
Standard computing terminology and factual concepts naturally overlap with sources.
This is not a claim of worldwide textual uniqueness or exclusive ownership of facts.
Existing Revise360 layout, branding, player and templates retain their existing provenance.

## Editable sources

- `lesson1.json` and `content.json`: original lesson content.
- `content.py`: loads lessons 2–5 and station colours.
- `build.py`: exports panoramas, thumbnails, experience JSON and registry entries.
- `panorama.py`: converts authored room walls into standard spherical panoramas.
- `lessons.json`: generated shared input for worksheets and lesson slides.
- `worksheets.py`: fills the existing Logic Gate Lab worksheet template.

Run `python tools/topic25/build.py`, then `python tools/topic25/worksheets.py` in an
environment with Pillow, NumPy and python-docx. Slides reuse the established lesson
PowerPoint template with editable text, the Revise360 logo and actual room previews.

## Rendering and verification

Topic 2.5 uses the original spherical player, as the established experiences do.
Each scene references a 4096×2048 JPEG with `img` and an 8192×4096 headset JPEG
with `imgHi`. No alternate renderer or scene `faces` map is used. The original
texture filtering, field of view, hotspot projection, controls and VR implementation
are retained. The old cube-wall assets have been removed.

The page requests `player.js?v=20260926-panorama`. Download URLs carry an OCR
revision parameter to refresh the worksheets and slides. Blue information panels
provide an additional readable copy of the station facts.

Desktop checks cover all tasks, scoring, completion, review without changing the
first-attempt score, saved progress and legacy loading. Tablet checks cover touch
interaction and resource downloads. High-resolution texture loading and WebXR
initialisation can be checked in software; physical headset clarity and controller
interaction still require testing on the HTTPS site.
