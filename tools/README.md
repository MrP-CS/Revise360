# tools/ — the Revise 360 build toolchain

Everything on the site that is generated rather than hand-written is produced by
these scripts: the 360° scene images, the experience JSON the player reads, the
student worksheets, the answer sheets and the lesson PowerPoints.

They used to live outside the repository, which meant a fix to a renderer was
lost the moment the machine they sat on went away, and anyone rebuilding a scene
would silently reintroduce bugs that had already been fixed. They live here now.

## Setup

Python 3.11+ with:

```
pip install --break-system-packages pillow numpy
```

Node 18+ with `docx` (worksheets and answer sheets) and `pptxgenjs` (decks):

```
npm install -g docx pptxgenjs
```

Optional, and only for the browser tests in `tests/`:

```
npm install -g playwright && playwright install chromium   # see note below
npm install three iwer
```

In the Anthropic cloud container Chromium is already present — set
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and do **not** run
`playwright install`.

## Environment variables

Nothing is required; every one of these has a working default.

| Variable | Default | What it does |
|---|---|---|
| `R360_SITE` | the repo root above `tools/` | the site being written into |
| `R360_OUT` | `<repo>/build` | where finished files land before you move them |
| `R360_LAND` | `tools/land.geojson` | coastline outlines, needed **only** by the 1.3 world-map scene (file not in the repo — it is large; any country-outline GeoJSON with a `features` array works) |
| `R360_THREE` | `node_modules/three/build/three.min.js` | Three.js build used by the VR smoke tests |
| `R360_IWER` | `node_modules/iwer/build/iwer.js` | WebXR emulator used by the VR smoke tests |
| `R360_LOGO` | — | a school logo for `logo_plaque()`. Unused: scenes no longer carry a logo plaque, and the logo is third-party so it is not in this repo. |

`R360_OUT` defaults to `build/`, which is gitignored. Generated files are
reviewed there and then copied into `experiences/`, `worksheets/` and
`presentations/` deliberately — see **Answer sheets** below for why that matters.

## Layout

```
paths.py / paths.js    where everything lives; every script resolves through these
lib360.py              equirectangular projection, fonts, panel/card primitives
kit.py                 scene renderer + export(); the station/info/model geometry
specs*.py              per-topic lesson content (specs11, specs12a-c, specs13,
                       specs14a-b, specs21, specs23, specs24)
l1/l2/l4/l6/l7.py      bespoke one-off scenes that predate kit.py
rp3/rp4.py, lib23.py   topic 2.3 scenes
*_scene.py             the standalone game rooms (sprint, blitz, defence, arena)
buildws.py + ws*.js    worksheets  (Python builds the spec, Node writes the .docx)
buildans.py, ansjson.py, ansgen.js   answer sheets
deckgen.js             lesson PowerPoints
deckspecs/             deck content (deck16.json, deck21.json)
wsspecs/               generated worksheet specs; committed so a .docx rebuild is
                       reproducible without re-running the Python
cardgen.py             the 1200x520 flat preview card on each lesson tile
qcscenes.py            QC: text overflow, empty illustration boxes, collisions
qcstack.py             QC: the stack-row label/description collision detector
tests/                 smoke tests, including Playwright VR reachability checks
```

## Building

One scene (writes `experiences/<id>.json` and both image sizes):

```
python3 buildone.py specs21 L11
```

A full topic's worksheets:

```
python3 buildws.py
```

A topic's PowerPoints:

```
node deckgen.js deckspecs/deck21.json AL ../build/decks
```

Preview cards:

```
python3 cardgen.py
```

QC every rendered scene:

```
python3 qcscenes.py
python3 qcstack.py
```

Builds are deterministic. Rebuilding `specs21 L11` on a clean checkout
reproduces the committed `AL_L11_TraceRoom_360.jpg`, its `_hi` variant, the
experience JSON and the worksheet's `document.xml` byte for byte — that is the
check to run after touching a renderer.

## Marker geometry — do not drift from this

Station panels, and the markers that belong to them, are fixed. `kit.py`:

```python
STATION_WALLS = [("right",100),("right",1068),("back",100),("back",1068),("left",100),("left",1068)]
PANEL_CENTRE  = [540, 1508]     # centre of the left and right panel on a wall
INFO_Y, STATION_Y = 240, 1840   # info icon above the panel, station badge below
```

Panels are 880 wide, top 330, bottom 1800. The info "i" icon is centred above
the panel it relates to and the station badge centred below it, in every
experience — rows 220–260 and 1820–1840 were chosen because they are clear of
text in every scene. If you move them, re-run `qcscenes.py`.

`fixoverlap.py` has deliberately **not** been kept: it nudged markers away from
each other case by case, which is exactly what the uniform placement replaced.

## Answer sheets

**This repository is public.** Answer sheets must never be committed to it.
`buildans.py` and `ansjson.py` write to `R360_OUT` (`build/`, gitignored) for
exactly this reason. Check `git status` before committing anything generated,
and never add an `answers/` directory. Teacher keys and the owner key live on
the Cloudflare Worker and nowhere in this tree.

## Known gaps

- `specs15.py` and `specs16.py` were lost when the machine they sat on was
  reclaimed. Topics 1.5 and 1.6 therefore cannot be re-rendered from a spec as
  the other topics can; their committed scenes and worksheets are intact, but a
  change to those scenes means reconstructing the spec first.
  `deckspecs/spec_el_l03.json` is one such reconstruction, done from the deck
  JSON, the experience JSON and the rendered image, and verified to re-render
  the scene identically — it is the worked example to follow for the rest.
- Lesson PowerPoints do not yet exist for 1.4, 1.5, 2.3 or 2.4 (23 experiences).
