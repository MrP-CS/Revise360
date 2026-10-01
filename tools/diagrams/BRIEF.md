# Writing a diagram

Read `js/diagrams.js` for the engine and the full drawing helper, and
`js/diagrams-set.js` for `fde`, which is the house style.

A diagram is registered as:

```js
A("name", function () {
  const steps = [{ name: "1. Fetch", caption: "One or two plain sentences." }];
  return { w: 980, h: 580, steps, render(d, s, t) { /* draws the whole frame */ } };
});
```

- `render` draws everything every frame. No retained scene, no DOM, no libraries.
- `t` runs 0 to 1 across the step. `d.seg(t, a, b)` gives a beat inside it.
- 4 to 7 steps. Something must move or change in each one: a static picture does
  not need an animation engine.
- One `d.note` per step, saying the thing the picture alone cannot.

## Layout budget

| | |
|---|---|
| title | `d.title(...)`, drawn at y 30 |
| drawing | y 50 to 470 |
| step caption | `d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: d.c.soft })` |
| annotation | `d.note(590, 492, text, { title, to: [x, y], w: 360, anchor: "centre" })` |

Nothing outside 0..980 by 0..580. Every box label takes a `max` so long text
shrinks rather than overflowing.

## Checking one

```
DIAG_EXTRA=/tools/diagrams/<file>.js \
  PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/diagrams/shoot.js <name> ...
```

It writes a PNG per step. Look at every one. A diagram nobody has looked at is
not finished - overlapping labels and off-canvas boxes do not raise an error.
