# Topic 2.1 build notes

This topic uses the same spherical panorama player and authoring pipeline as Topic 2.5. Each scene has a 4096×2048 JPEG (`img`) and an 8192×4096 JPEG (`imgHi`), six numbered stations, six information points and a final challenge. No player, VR, authentication or progress code changes are made.

The worksheet builder copies the established Logic Gate Lab template, including coloured station panels, dotted answer space, score boxes and confidence tables. PowerPoints import and edit the established Language Level Lab deck, preserving its master, dimensions, typography and classroom workflow.

## Editable sources

- `content.py`: common content for all 16 teaching lessons.
- `content.json` and `lessons.json`: generated content snapshots.
- `build.py`, `panorama.py`, `diagrams.py`: panorama, thumbnail, scene and registry generation.
- `worksheets.py`: editable Word worksheets.
- `assessment.py`: original 40-mark test, reflection and mark scheme.
- `slides.mjs`, `assessment-slides.mjs`: slide builders using the provided Artifact Tool runtime.
- `validate.mjs`: task schema, asset references and real Store.summarise scoring/completion checks.
- `TeacherGuide.md` and `TeachingAnswers.md`: classroom guidance and complete answers.

Run Python generators from the repository's parent folder as in the supplied scripts. They require Pillow, NumPy and python-docx. The slide builders require the Codex presentation runtime and a private `build/node_modules` link to its bundled modules. Change the versioned final/receipt staging paths before rerunning them. The final teaching PPTX files are already exported and do not require these tools to use.

## Verification

All 16 scenes contain 14 tasks, totalling 224 interactive tasks. The standard Store.summarise implementation was executed against empty, completed and reviewed progress for every scene. Resource paths and both panorama dimensions were verified. All documents and decks were rendered for layout review. The local browser preview was unavailable in this environment, so live WebGL interaction and physical headset controls remain to be checked on the hosted site.

Assessment is a worksheet-type registry entry, so it is excluded from interactive progress calculations. The hub now displays its optional PowerPoint download, just as it does for experience entries.

## Provenance

Lesson order follows the user-supplied Algorithms export. Curriculum was checked against OCR J277 specification v3.1 (2026), 2.1.1–2.1.3. The scenarios, explanations, diagrams and questions are original practice. The prior Revise360 layouts, code and branding retain their existing provenance.
