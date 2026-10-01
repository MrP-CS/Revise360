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
                       specs14a-b, specs15, specs21, specs23, specs24)
mkspecs15.py           regenerates specs15.py; walls15.py holds the 1.5 wall
                       content that survived only in the rendered scenes
mkdeck.py              derives a deck spec from a topic's specs module
reconstruct.py         rebuilds deck content for a lesson with no specs module
newmodels.py           which 3D model belongs on which station, and why
applymodels.py         writes those into the experiences and puts every 3D
                       button at its tile's top right
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
qcfit.py               QC: text overflowing a tile or table cell (see below)
qcscenes.py            QC: panel-level overflow. Over-reports badly - it counts
                       box borders as text - so treat its output as candidates
qcstack.py             QC: stack-row label/description collisions. Also
                       over-reports; verify each candidate by eye before acting
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
python3 qcfit.py              # text that overflows its tile or table cell
python3 qcfit.py --changed    # scenes needing a rebuild after a sizing change
python3 qcstack.py            # candidate stack-row collisions, verify by eye
```

`qcfit.py` replays kit.py's layout arithmetic against the spec data instead of
measuring pixels, so it is exact and fast. It exists because the pixel-based
checks only ever measured text against the station *panel*, and so could not see
a label overflowing a tile *inside* a panel - which is how topic 1.5 shipped with
"Defragmentation" overlapping its neighbours for months.

Builds are deterministic. Rebuilding `specs21 L11` on a clean checkout
reproduces the committed `AL_L11_TraceRoom_360.jpg`, its `_hi` variant, the
experience JSON and the worksheet's `document.xml` byte for byte — that is the
check to run after touching a renderer.

## 3D models

`js/models.js` builds every model in code - shapes plus textures painted on
canvases - with each part clickable and described. `R360Models.kinds` lists what
exists. A model is worth adding when the thing is physical and turning it over
shows something a flat diagram cannot: the layers inside a fibre cable, the fact
that nothing inside an SSD moves, how much of a phone had to be mined. Topics
that are about process rather than objects (2.1, 2.3, 2.5) deliberately have
none.

Check the models after changing one:

```
R360_THREE=<path to three.min.js> python3 qcmodels.py
```

Every part is labelled and clickable, so a part that is buried inside an opaque
case, hidden behind another, or has no size is a button a pupil presses to no
effect - invisible to code review and easy to miss by eye. qcmodels.py renders
each model from five angles, hides one part at a time and diffs, and flags any
part that changes no pixels from any angle. It caught a switch whose "Switching
chip" was sealed inside an opaque case, and status lights buried inside the port
blocks.

qcmodels.py makes five checks: a part that renders no pixels from any angle, a
component buried in the board it is supposed to sit on, a label that is stretched
or put somewhere nobody can read it, two parts occupying the same space, and a
part sticking out of the case it is meant to be inside.

The last one exists because the collision check only looks at boxes, and a part
leaving its case collides with nothing anyway: the washing machine's heater ran
straight out through the floor of the casing, and its control panel poked out of
the front and down across the door, and nothing noticed either. The case is taken
to be the largest part, and it has to be the largest along all three axes - which
is what keeps the fibre cable out of it, since its layers are stripped back on
purpose so the core runs well past the jacket.

Trust a clean run only once you have seen the checks fire. Reverting a known
fault and confirming it is flagged is the cheap way to do that; the first version
of the part-visibility check reused one canvas across every model, which returns
blank frames after the first, so it called four healthy models broken; the first
collision check both flooded on legitimate mounting and would have missed a real
overlap of only 7% of the smaller volume; and the first out-of-the-case check
picked its case by volume alone and so reported all four layers of the fibre
cable.

The label check assumes a single material is on +Y, because that is where `chip()`
and `topBox()` put one. A texture passed as a plain `std({ map })` is on all six
faces, so it is stretched on five of them - put a label on one face with a
material array, as `chipFacing()` does.

Labels are drawn on a canvas and then mapped onto a face, so the canvas has to
be made at that face's aspect or the lettering is squashed - "Cache" sat on a
face six times wider than it was deep, drawn on a square canvas. `blockTex()`
and `epoxy()` take the aspect as their last argument, and `chip()` and
`chipFacing()` work theirs out from their own dimensions. A marking also belongs
on a component's broad face, never on its edge, and anything routed over a model
(a bus, a cable) must not come to rest across a label.

Fans are built by one shared `fanUnit(r, axis)`, because getting one right is
fiddly and getting it wrong is obvious: each blade is pitched about its own long
axis inside an arm that swings it round the hub. Rotating a blade and then
translating it outwards - which is what the motherboard and the first case fans
did - slides the blades out of the disc as well as tilting them.

Mind the orientation of anything mounted on a board. `chip()` prints its
markings on the +Y face, which is right for a board lying flat; a board standing
upright (the RAM module) needs `chipFacing()` with the +Z or -Z face instead, or
the chips end up lying flat and sunk edge-on into the board.

A model marker is a player sprite positioned from the experience JSON, not drawn
into the 360 image, so adding or moving one needs no re-render:

```
python3 applymodels.py          # show what would change
python3 applymodels.py --write
```

Placements live in `newmodels.py` and are written into the specs as well, so a
rebuild keeps them. Two lessons have no spec to write to - nw-l04 is drawn by
l4.py and 1.6's spec was lost - so for those `applymodels.py` is the only record
and must be re-run if those scenes are ever rebuilt.

## 2D diagrams

`js/diagrams.js` is the engine - a drawing helper and a viewer - and the
diagrams themselves live in `js/diag-*.js`, one file per group of topics. Each
registers itself:

```js
R360Diagrams.add("fde", () => ({ w, h, steps, render(d, step, t) { ... } }));
```

`render` draws the whole frame every time: there is no retained scene, so a
diagram is one readable function. `t` runs 0 to 1 across a step, which is what
makes them animate. The viewer has the same shape as `R360Models.viewer`, so the
player opens a diagram the same way it opens a model, and `js/vr.js` drives the
same `render` into a canvas texture on a panel.

A diagram earns its place when the teaching point is a process over time, or a
structure whose shape is the point, and a panel of text cannot carry it: the
fetch-execute cycle running, headers wrapped and unwrapped down and up a
protocol stack, a wave being sampled, a list being sorted. A labelled picture
that never moves does not need any of this machinery.

`tools/diagrams/BRIEF.md` is the contract for writing one, and
`tools/diagrams/shoot.js` renders one PNG per step to look at:

```
DIAG_OUT=/tmp/shots node tools/diagrams/shoot.js fde packets
```

Check them all after a change:

```
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/qcdiagrams.js
```

Nothing throws when a label runs off the edge or two captions land on top of
each other, and there are thirty-odd diagrams of six steps each, so this wraps
the drawing helper, records what every call drew, and reports four things: a
part drawn outside the diagram, two pieces of text overlapping, a label squeezed
smaller than it asked for because its box is too narrow, and a diagram named in
an experience that is not registered - `build()` falls back to the first
diagram for an unknown name, so a typo in a placement would otherwise open the
wrong picture silently.

It cannot tell you a diagram is confusing. Look at the images for that.

Two things it took a wrong turn on first, both worth knowing: it compared text
drawn *inside* `d.box` and `d.chip`, so a chip flying over a cell read as two
captions colliding; and it modelled `d.box`'s own label padding instead of
recording the size `d.box` actually drew, which invented four overflows that
were not there. Both times the fix was to observe what was drawn rather than
predict it.

Placements live in `newdiagrams.py`, in the same form as the 3D models:

```
python3 applydiagrams.py          # show what would change
python3 applydiagrams.py --write
```

## Marker geometry — do not drift from this

Station panels, and the markers that belong to them, are fixed. `kit.py`:

```python
STATION_WALLS = [("right",100),("right",1068),("back",100),("back",1068),("left",100),("left",1068)]
PANEL_CENTRE  = [540, 1508]     # centre of the left and right panel on a wall
MODEL_INSET   = 790             # 3D button: 90px in from the panel's right edge
INFO_Y, STATION_Y = 240, 1840   # info icon above the panel, station badge below
MODEL_Y = INFO_Y
```

Panels are 880 wide, top 330, bottom 1800. In every experience the info "i" icon
is centred above the panel it relates to, the 3D button sits at that panel's top
right corner, the 2D diagram button at its top left, and the station badge is
centred below:

```
    [2D]       (i)        [3D]
    +-------------------------+
    |        the panel        |
    +-------------------------+
             (1)
```

Rows 220–260 and 1820–1840 were chosen because they are clear of text in every
scene, and the 3D button clears the info icon by about 12 degrees of view. If you
move any of them, re-run `applymodels.py --write` and `applydiagrams.py --write`
so the deployed experiences follow.

`fixoverlap.py` has deliberately **not** been kept: it nudged markers away from
each other case by case, which is exactly what the uniform placement replaced.

## Answer sheets

**This repository is public.** Answer sheets must never be committed to it.
`buildans.py` and `ansjson.py` write to `R360_OUT` (`build/`, gitignored) for
exactly this reason. Check `git status` before committing anything generated,
and never add an `answers/` directory. Teacher keys and the owner key live on
the Cloudflare Worker and nowhere in this tree.

## Known gaps

- `specs16.py` was lost when the machine it sat on was reclaimed. Topic 1.6
  therefore cannot be re-rendered from a spec as the other topics can; its
  committed scenes and worksheets are intact, but a change to those scenes means
  reconstructing the spec first. `specs15.py` was reconstructed that way and
  re-renders all eight of 1.5's committed images byte for byte;
  `deckspecs/spec_el_l03.json` is the same job done from a deck JSON. Those two
  are the worked examples to follow.
- `ss-l01` carries the `stack` model twice, on stations 0 and 1. Two buttons for
  the same model on one wall is noise; one of them should move or go.
- Nothing detects something *routed over* a label — a bus or a cable coming to
  rest across lettering. That still needs eyes.
