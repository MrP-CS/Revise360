// Lesson PowerPoints for Revise 360, generated from the same lesson specs as the
// experiences and worksheets, so the three never drift apart.
// Colours and type follow BRAND.md: light deck for the classroom projector.
const P = require("./paths.js");
const pptxgen = require("pptxgenjs");
const fs = require("fs");

const INK = "101828", CANVAS = "F7F7F4", COBALT = "2D63FF", TEAL = "08A6A6",
      AMBER = "F4B942", SLATE = "667085", BORDER = "D9DEE7", WHITE = "FFFFFF";
const SANS = "IBM Plex Sans", MONO = "IBM Plex Mono";
const W = 13.33, H = 7.5;

/* Python inside a sentence on a slide, in the editor's own token colours.
 *
 * A projector is a sheet of paper that glows, so the ink is the printed palette
 * from the @media print half of css/pytok.css rather than the dark-background
 * one: #9fe6a0 on a white slide is unreadable at the back of a room. The seven
 * token kinds, the monospace face and the meaning are the same as on screen.
 *
 * Returns the run array pptxgenjs takes for rich text. Text with nothing marked
 * comes back as a single run, so every call site can use it unconditionally. */
const TOK = require("../js/pytok.js");
const PINK = TOK.flat("print");
function rich(text, opts = {}) {
  const str = String(text == null ? "" : text);
  if (!TOK.has(str)) return [{ text: str, options: { ...opts } }];
  const runs = [];
  let i = 0;
  for (;;) {
    const a = str.indexOf("`", i);
    const b = a < 0 ? -1 : str.indexOf("`", a + 1);
    if (a < 0 || b < 0) { if (i < str.length) runs.push({ text: str.slice(i), options: { ...opts } }); break; }
    if (a > i) runs.push({ text: str.slice(i, a), options: { ...opts } });
    for (const tk of TOK.lex(str.slice(a + 1, b))) {
      runs.push({ text: tk.t, options: { ...opts, fontFace: MONO, color: PINK[tk.k] } });
    }
    i = b + 1;
  }
  return runs;
}

const DATA = process.argv[2] || P.TOOLS + "/deckspecs/deck21.json";
const PREFIX = process.argv[3] || "AL";
const OUT = process.argv[4] || P.OUT + "/decks";
const lessons = JSON.parse(fs.readFileSync(DATA, "utf8"));
fs.mkdirSync(OUT, { recursive: true });

// ---- shared furniture -------------------------------------------------
function chrome(slide, kicker, pageLabel) {
  slide.background = { color: CANVAS };
  slide.addShape("rect", { x: 0, y: 0, w: W, h: 0.09, fill: { color: COBALT } });
  slide.addText(kicker, { x: 0.55, y: 6.82, w: 8.5, h: 0.4, fontSize: 11, fontFace: MONO,
    color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
  slide.addText("Revise 360", { x: 10.2, y: 6.82, w: 2.6, h: 0.4, fontSize: 11, fontFace: MONO,
    color: SLATE, align: "right", isTextBox: true, margin: 0, valign: "middle" });
  if (pageLabel) {
    slide.addText(pageLabel, { x: 9.1, y: 6.82, w: 1.0, h: 0.4, fontSize: 11, fontFace: MONO,
      color: BORDER, align: "right", isTextBox: true, margin: 0, valign: "middle" });
  }
}

function heading(slide, text, sub) {
  slide.addText(text, { x: 0.55, y: 0.45, w: 12.2, h: 0.85, fontSize: 32, bold: true,
    fontFace: SANS, color: INK, isTextBox: true, margin: 0, valign: "middle" });
  if (sub) {
    slide.addText(sub, { x: 0.55, y: 1.28, w: 12.2, h: 0.45, fontSize: 15, fontFace: SANS,
      color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
  }
}

function numberChip(slide, n, x, y, colour) {
  slide.addShape("ellipse", { x, y, w: 0.62, h: 0.62, fill: { color: colour } });
  slide.addText(String(n), { x, y, w: 0.62, h: 0.62, fontSize: 20, bold: true, fontFace: MONO,
    color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
}

function card(slide, x, y, w, h, colour) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.12, fill: { color: WHITE },
    line: { color: colour || BORDER, width: 1.25 } });
}

// ---- slide builders ---------------------------------------------------
function titleSlide(pres, L) {
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addShape("rect", { x: 0, y: 0, w: W, h: 0.09, fill: { color: COBALT } });
  s.addText(L.kicker, { x: 0.9, y: 1.55, w: 11.5, h: 0.45, fontSize: 15, fontFace: MONO,
    color: AMBER, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(L.title, { x: 0.9, y: 2.1, w: 11.5, h: 1.4, fontSize: 60, bold: true, fontFace: SANS,
    color: WHITE, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(L.intro, { x: 0.9, y: 3.6, w: 10.4, h: 1.5, fontSize: 18, fontFace: SANS,
    color: "C7CDD9", isTextBox: true, margin: 0, lineSpacingMultiple: 1.25 });
  s.addShape("line", { x: 0.9, y: 5.3, w: 3.2, h: 0, line: { color: COBALT, width: 2.5 } });
  s.addText(L.subtitle, { x: 0.9, y: 5.5, w: 11.5, h: 0.4, fontSize: 13, fontFace: MONO,
    color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
  s.addNotes(`Lesson ${L.lesson}: ${L.title}.\nOpen the experience at revise360.co.uk and hand out ${L.wsfile}.`);
  return s;
}

function objectivesSlide(pres, L) {
  const s = pres.addSlide();
  chrome(s, L.kicker);
  heading(s, "By the end of this lesson", L.keyq);
  L.objectives.forEach((o, i) => {
    const y = 2.15 + i * 1.02;
    numberChip(s, i + 1, 0.6, y, COBALT);
    s.addText(o.charAt(0).toUpperCase() + o.slice(1), { x: 1.45, y, w: 11.3, h: 0.62,
      fontSize: 19, fontFace: SANS, color: INK, isTextBox: true, margin: 0, valign: "middle" });
  });
  const ky = 2.15 + L.objectives.length * 1.02 + 0.35;
  if (L.keywords.length && ky < 6.1) {
    s.addText("Key words", { x: 0.6, y: ky, w: 3, h: 0.35, fontSize: 12, fontFace: MONO,
      color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
    let x = 0.6;
    L.keywords.forEach(k => {
      const w = Math.max(1.1, 0.16 * k.length + 0.5);
      if (x + w > 12.7) return;
      s.addShape("roundRect", { x, y: ky + 0.42, w, h: 0.44, rectRadius: 0.22,
        fill: { color: WHITE }, line: { color: COBALT, width: 1 } });
      s.addText(k, { x, y: ky + 0.42, w, h: 0.44, fontSize: 12, fontFace: SANS, color: COBALT,
        align: "center", valign: "middle", isTextBox: true, margin: 0 });
      x += w + 0.14;
    });
  }
  s.addNotes("Share the objectives, then go straight into the starter. Devices stay away for the first five minutes.");
  return s;
}

function starterSlide(pres, L) {
  const s = pres.addSlide();
  chrome(s, L.kicker);
  s.addShape("roundRect", { x: 0.55, y: 0.5, w: 2.3, h: 0.5, rectRadius: 0.1, fill: { color: AMBER } });
  s.addText("STARTER", { x: 0.55, y: 0.5, w: 2.3, h: 0.5, fontSize: 13, bold: true, fontFace: MONO,
    color: INK, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText("Five minutes, on paper", { x: 3.05, y: 0.5, w: 6, h: 0.5, fontSize: 14, fontFace: SANS,
    color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
  card(s, 0.55, 1.35, 12.2, 3.5, COBALT);
  s.addText(rich(L.starter), { x: 1.1, y: 1.8, w: 11.1, h: 2.6, fontSize: 26, fontFace: SANS,
    color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.3, valign: "middle" });
  s.addText("No devices yet. Write your answer on the worksheet before anyone talks.",
    { x: 0.55, y: 5.15, w: 12.2, h: 0.5, fontSize: 15, fontFace: SANS, color: SLATE,
      isTextBox: true, margin: 0, valign: "middle" });
  s.addNotes("Silent start. Take two or three answers before moving on: this is where misconceptions surface.");
  return s;
}

function intoSlide(pres, L) {
  const s = pres.addSlide();
  chrome(s, L.kicker);
  heading(s, "Into the experience", `Open ${L.title} on revise360.co.uk`);
  /* A coding lesson is a different lesson. Its stations are programs the pupil
   * writes and runs in the editor rather than facts to read and write down, so
   * telling a class to "read the wall and write the key fact" would be wrong. */
  const steps = L.code ? [
    ["Look around", "Six numbered stations are arranged around you. Turn right for 1 and 2, around for 3 and 4, left for 5 and 6."],
    ["Plan before you type", "Read the task and its brief. Work out the inputs, what happens to them, and exactly what is printed."],
    ["Write it and run it", "Type the program in the editor and press Run to see what it does. Then press Check to mark it against the tests."],
    ["Read the failures", "A test that fails tells you what was expected and what came out. Fix and run it again - that is what programmers do."]
  ] : [
    ["Look around", "Six numbered stations are arranged around you. Turn right for 1 and 2, around for 3 and 4, left for 5 and 6."],
    ["Read, then write", "Read the wall, write the key fact and your answer to the challenge on the worksheet."],
    ["Then tap the badge", "Only answer the questions once you have written. Your first answer is the one that counts."],
    ["Look down at the end", "The starred final challenge is on the floor. Predict on paper first."]
  ];
  steps.forEach((st, i) => {
    const y = 2.05 + i * 1.12;
    numberChip(s, i + 1, 0.6, y, i === 3 ? AMBER : TEAL);
    s.addText(st[0], { x: 1.45, y: y - 0.02, w: 3.3, h: 0.35, fontSize: 17, bold: true,
      fontFace: SANS, color: INK, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(st[1], { x: 1.45, y: y + 0.3, w: 11.2, h: 0.5, fontSize: 14, fontFace: SANS,
      color: SLATE, isTextBox: true, margin: 0, valign: "top" });
  });
  s.addNotes("Insist on writing before tapping. That single rule is the difference between revision and a quiz game.");
  return s;
}

function stationSlide(pres, L, st, n) {
  const s = pres.addSlide();
  chrome(s, L.kicker, `Station ${n}`);
  numberChip(s, n, 0.55, 0.48, COBALT);
  s.addText(st.name, { x: 1.35, y: 0.45, w: 11.4, h: 0.68, fontSize: 30, bold: true,
    fontFace: SANS, color: INK, isTextBox: true, margin: 0, valign: "middle" });
  card(s, 0.55, 1.4, 7.7, 3.55, BORDER);
  const bullets = st.bullets.flatMap((b, i) => {
    const runs = rich(b, { bullet: true });
    const last = runs[runs.length - 1];
    last.options = { ...last.options, breakLine: i < st.bullets.length - 1, paraSpaceAfter: 12 };
    return runs;
  });
  s.addText(bullets, { x: 1.0, y: 1.75, w: 6.9, h: 2.9, fontSize: 17, fontFace: SANS,
    color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2, valign: "top" });
  card(s, 8.55, 1.4, 4.2, 3.55, AMBER);
  s.addText("CHALLENGE", { x: 8.95, y: 1.65, w: 3.5, h: 0.35, fontSize: 12, bold: true,
    fontFace: MONO, color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(rich(st.challenge), { x: 8.95, y: 2.05, w: 3.45, h: 2.6, fontSize: 16, fontFace: SANS,
    color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25, valign: "top" });
  if (st.fact) {
    s.addShape("roundRect", { x: 0.55, y: 5.2, w: 12.2, h: 0.85, rectRadius: 0.1,
      fill: { color: "EEF2FB" }, line: { color: COBALT, width: 1 } });
    s.addText([{ text: "On your worksheet:  ", options: { bold: true, color: COBALT } },
               { text: st.fact }],
      { x: 1.0, y: 5.2, w: 11.3, h: 0.85, fontSize: 16, fontFace: SANS, color: INK,
        isTextBox: true, margin: 0, valign: "middle" });
  }
  s.addNotes(`Station ${n}: ${st.name}. Students read this wall in the experience, write the key fact and the challenge answer, then answer the questions at the badge.`);
  return s;
}

const finalTitle = n => {
  const t = n.replace(/^Final challenge:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function finalSlide(pres, L) {
  const s = pres.addSlide();
  chrome(s, L.kicker);
  s.addShape("roundRect", { x: 0.55, y: 0.48, w: 3.4, h: 0.55, rectRadius: 0.1, fill: { color: AMBER } });
  s.addText("★  FINAL CHALLENGE", { x: 0.55, y: 0.48, w: 3.4, h: 0.55, fontSize: 13, bold: true,
    fontFace: MONO, color: INK, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText(finalTitle(L.final.name), { x: 0.55, y: 1.2, w: 12.2, h: 0.8,
    fontSize: 34, bold: true, fontFace: SANS, color: INK, isTextBox: true, margin: 0, valign: "middle" });
  card(s, 0.55, 2.2, 12.2, 2.4, COBALT);
  s.addText(L.final.intro, { x: 1.1, y: 2.55, w: 11.1, h: 1.7, fontSize: 22, fontFace: SANS,
    color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.3, valign: "middle" });
  s.addText("Predict on paper first, then look down and test it.",
    { x: 0.55, y: 4.95, w: 12.2, h: 0.5, fontSize: 16, fontFace: SANS, color: SLATE,
      isTextBox: true, margin: 0, valign: "middle" });
  s.addNotes("Make them commit to an answer on paper before they tap the star. Guessing first costs them the learning.");
  return s;
}

function didYouKnowSlide(pres, L) {
  if (!L.info.length) return null;
  const s = pres.addSlide();
  chrome(s, L.kicker);
  heading(s, "Worth knowing", "The information markers dotted around the room");
  const picks = L.info.slice(0, 4);
  picks.forEach((f, i) => {
    const x = 0.55 + (i % 2) * 6.25, y = 2.0 + Math.floor(i / 2) * 2.15;
    card(s, x, y, 5.9, 1.9, i % 2 ? TEAL : COBALT);
    s.addText(f.title, { x: x + 0.35, y: y + 0.2, w: 5.2, h: 0.4, fontSize: 16, bold: true,
      fontFace: SANS, color: i % 2 ? TEAL : COBALT, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(rich(f.text), { x: x + 0.35, y: y + 0.62, w: 5.2, h: 1.1, fontSize: 13, fontFace: SANS,
      color: SLATE, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2, valign: "top" });
  });
  s.addNotes("Use these as a settler, or as something for early finishers to read in the experience.");
  return s;
}

function examSlide(pres, L) {
  if (!L.exam.length) return null;
  const s = pres.addSlide();
  chrome(s, L.kicker);
  heading(s, "Exam practice", "Devices away. Answer from memory on the worksheet.");
  L.exam.forEach((q, i) => {
    const y = 2.0 + i * 1.42;
    card(s, 0.55, y, 12.2, 1.2, BORDER);
    s.addText(rich(q.q), { x: 1.0, y: y + 0.12, w: 10.3, h: 0.96, fontSize: 17, fontFace: SANS,
      color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.18, valign: "middle" });
    s.addShape("roundRect", { x: 11.5, y: y + 0.33, w: 0.95, h: 0.54, rectRadius: 0.1,
      fill: { color: "EEF2FB" } });
    s.addText(`[${q.marks}]`, { x: 11.5, y: y + 0.33, w: 0.95, h: 0.54, fontSize: 15, bold: true,
      fontFace: MONO, color: COBALT, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addNotes("Timed and silent. Mark against the answer sheet, then ask students to record their weakest area.");
  return s;
}

/* ---- the model, and the check ---------------------------------------
 *
 * Two slides that only appear when there is something real to put on them.
 *
 * The MODEL is authored per lesson, in the deck spec, because modelling a
 * process only helps where there is a process worth modelling; a lesson that
 * does not need one does not get an empty slide. It goes
 * problem -> thinking -> steps -> finished answer, or, for a concept rather
 * than a procedure, example -> why it works -> non-example -> common mistake.
 * Whichever it is, it must not use the data, names or scenario of the activity
 * the pupils are about to do: the model teaches the process, it does not answer
 * the question.
 *
 * The CHECK is not authored at all. It is read out of the lesson record, by the
 * same rule the lesson plan uses - the middle check of the lesson - so the
 * slide and the plan always name the same question and cannot drift. The slide
 * shows the question and its options and does NOT mark the right one, because a
 * hinge works only if the room commits before it sees the answer. The answer and
 * what to do about the split are in the speaker notes.
 */
const LETTER = "ABCDEFGH";   // three to six options exist in this course
let overflowed = false;

function modelSlide(pres, L) {
  const m = L.model;
  if (!m) return null;
  const s = pres.addSlide();
  chrome(s, L.kicker);
  heading(s, m.title || "Watch me do one", m.sub || "Your turn comes after this one");
  const steps = m.steps || [];
  const cols = m.labels || ["THE PROBLEM", "WHAT I'M THINKING", "HOW I BUILD IT", "THE FINISHED ANSWER"];
  /* The working goes across the top in a column each; the finished answer gets
   * the full width underneath it. That is not only layout. The answer is the
   * thing the room reads from the back and copies the shape of, and a quarter
   * of a slide forces it down to a size nobody at the back can read.
   *
   * The type size comes from the fullest column rather than a guess, since how
   * much thinking a step needs varies by lesson. A blank line costs a line. */
  const n = Math.min(steps.length, cols.length);
  const top = n - 1, w = (12.2 - (top - 1) * 0.25) / top;
  /* The smallest readable size is 11: below that a projector at the back of a
   * room is guesswork. If the text will not fit at 11 it is too long for the
   * slide, and that is said rather than quietly drawn over the card below -
   * which is exactly what the first version of this slide did. */
  /* A line takes more room than its point size times its spacing: the font has
   * leading of its own and PowerPoint adds a little more, so the sum carries a
   * margin measured off a render rather than assumed. */
  const LEADING = 1.15;
  const lines = (text, width, px) => {
    const perLine = Math.floor(width * 118 / px);
    return String(text).split("\n")
      .reduce((a, ln) => a + Math.max(1, Math.ceil(ln.length / perLine)), 0);
  };
  const fits = (text, width, height, px, spacing) =>
    lines(text, width, px) * px * spacing * LEADING / 72 <= height;
  const fit = (text, width, height, spacing, where) => {
    for (const px of [15, 14, 13, 12, 11]) if (fits(text, width, height, px, spacing)) return px;
    console.error(`  OVERFLOW  ${L.id} model, ${where}: too long for the slide even at 11pt. `
      + "Shorten it in the deck spec; the slide cannot grow.");
    overflowed = true;
    return 11;
  };

  /* 1.88 down to 6.93 is everything between the heading and the footer, and the
   * two halves share it. How they share it depends on the lesson: a pseudocode
   * answer is eight lines and its working is three, a discussion answer is six
   * lines of prose and its working is nine. Splitting it down the middle made
   * one of them overflow whichever lesson it was, so the room is divided in
   * proportion to what each half needs at the smallest readable size. */
  const TOP_Y = 1.88, BOT_Y = 6.93, GAP = 0.15, TOP_CHROME = 0.72, ANS_CHROME = 0.68;
  const textRoom = (BOT_Y - TOP_Y) - GAP - TOP_CHROME - ANS_CHROME;
  const need = t => lines(t, w - 0.6, 11) * 11 * 1.18 * LEADING / 72;
  const topNeed = Math.max(...steps.slice(0, top).map(need));
  const ansNeed = lines(steps[n - 1], 11.4, 11) * 11 * 1.2 * LEADING / 72;
  let topH = Math.max(0.9, Math.min(textRoom - 0.9, textRoom * topNeed / (topNeed + ansNeed)));
  const ansH = textRoom - topH;
  const size = Math.min(...steps.slice(0, top)
    .map((t, i) => fit(t, w - 0.6, topH, 1.18, cols[i])));
  for (let i = 0; i < top; i++) {
    const x = 0.55 + i * (w + 0.25);
    card(s, x, TOP_Y, w, topH + TOP_CHROME, BORDER);
    s.addText(cols[i], { x: x + 0.3, y: TOP_Y + 0.18, w: w - 0.6, h: 0.32, fontSize: 11, bold: true,
      fontFace: MONO, color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(rich(steps[i]), { x: x + 0.3, y: TOP_Y + 0.56, w: w - 0.6, h: topH, fontSize: size,
      fontFace: SANS, color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.18, valign: "top" });
  }
  const ansY = TOP_Y + topH + TOP_CHROME + GAP;
  card(s, 0.55, ansY, 12.2, ansH + ANS_CHROME, TEAL);
  s.addText(cols[n - 1], { x: 0.95, y: ansY + 0.18, w: 11.4, h: 0.32, fontSize: 11, bold: true,
    fontFace: MONO, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(rich(steps[n - 1]), { x: 0.95, y: ansY + 0.56, w: 11.4, h: ansH,
    fontSize: fit(steps[n - 1], 11.4, ansH, 1.2, cols[n - 1]), fontFace: SANS, color: INK,
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2, valign: "top" });
  s.addNotes([
    m.notes || "Work through this at the front, thinking aloud, before anyone starts their own. "
      + "The scenario here is deliberately not the one on the worksheet.",
    m.note ? "\nSay this out loud: " + m.note : "",
  ].join("\n"));
  return s;
}

/* The lesson record, if it has been built. Missing is not an error: the decks
 * can be rebuilt on a machine that has not run record.py, and a deck without a
 * check slide is what this course shipped before. */
function recordOf(id) {
  try {
    return JSON.parse(fs.readFileSync(`${P.OUT}/records/${id}.json`, "utf8"));
  } catch (e) { return null; }
}

function checkSlide(pres, L) {
  const rec = recordOf(L.id);
  // Which question to stop on is decided in record.py and read here, so this
  // slide and the lesson plan can never name a different one.
  const c = rec && rec.hinge;
  if (!c) return null;
  const n = c.station_n, stName = c.station_name;
  const many = Array.isArray(c.right);          // a select-all, used only where
  const s = pres.addSlide();                    // the lesson has nothing else
  chrome(s, L.kicker);
  s.addShape("roundRect", { x: 0.55, y: 0.5, w: 1.15, h: 0.46, rectRadius: 0.1,
    fill: { color: AMBER } });
  s.addText("CHECK", { x: 0.55, y: 0.5, w: 1.15, h: 0.46, fontSize: 12, bold: true,
    fontFace: MONO, color: INK, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText(many ? "Take each one in turn. Everyone commits to every line."
                 : "Hands down. Everyone commits.",
    { x: 1.9, y: 0.5, w: 10.8, h: 0.46, fontSize: 15,
      fontFace: SANS, color: SLATE, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(rich(c.asks), { x: 0.55, y: 1.2, w: 12.2, h: 1.0, fontSize: 26, bold: true,
    fontFace: SANS, color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15, valign: "middle" });
  /* "What will this program display?" is not a question without the program.
   * A Predict check keeps its listing, and it goes beside the options rather
   * than above them, so neither has to shrink to make room for the other. */
  let optX = 0.55, optW = 12.2, TOP = 2.35;
  if (c.code && c.code.length) {
    const h = Math.min(4.2, 0.5 + c.code.length * 0.30);
    card(s, 0.55, TOP, 5.5, h, BORDER);
    s.addText(c.code.map((ln, i) => ({ text: ln, options: { breakLine: i < c.code.length - 1 } })),
      { x: 0.9, y: TOP + 0.22, w: 4.9, h: h - 0.44, fontSize: 15, fontFace: MONO,
        color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25, valign: "top" });
    optX = 6.35; optW = 6.4;
  }
  /* The record lists the right answer first, so the options are rotated to put
   * it somewhere else on the board. The rotation is fixed per question - every
   * copy of the deck letters them the same way, and the plan and the slide agree
   * - but it is taken from a hash of the wording rather than its length, which
   * put two of 1.6's seven checks on C for no better reason than both questions
   * being a multiple of three characters long. */
  const rights = many ? c.right : [c.right];
  const opts = rights.concat(c.distractors || []);
  let h = 0;
  for (let i = 0; i < c.asks.length; i++) h = (h * 31 + c.asks.charCodeAt(i)) % 100003;
  const shift = h % opts.length;   // every position, A included
  const shown = opts.map((_, i) => opts[(i + opts.length - shift) % opts.length]);
  /* Three, four, five and six options all occur in this course, and six rows at
   * the spacing four wants runs off the bottom of the slide, so the rows are cut
   * to the space between the question and the footer. */
  const BOT = 6.95;
  const step = Math.min(0.95, (BOT - TOP) / shown.length);
  const rowH = step - 0.15, optPx = rowH >= 0.7 ? 17 : rowH >= 0.6 ? 15 : 14;
  shown.forEach((o, i) => {
    const y = TOP + i * step;
    card(s, optX, y, optW, rowH, BORDER);
    const chip = Math.min(0.48, rowH - 0.2);
    s.addShape("roundRect", { x: optX + 0.3, y: y + (rowH - chip) / 2, w: chip, h: chip, rectRadius: 0.1,
      fill: { color: "EEF2FB" } });
    s.addText(LETTER[i], { x: optX + 0.3, y: y + (rowH - chip) / 2, w: chip, h: chip, fontSize: 13,
      bold: true, fontFace: MONO, color: COBALT, align: "center", valign: "middle",
      isTextBox: true, margin: 0 });
    s.addText(rich(o), { x: optX + 1.0, y, w: optW - 1.2, h: rowH, fontSize: optPx, fontFace: SANS,
      color: INK, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15, valign: "middle" });
  });
  const letters = rights.map(r => LETTER[shown.indexOf(r)]).sort();
  const lines = [
    many ? `The answers are ${letters.join(" and ")}. Everything else is wrong.`
         : `The answer is ${letters[0]}: ${c.right}.`,
    "",
    many
      ? "Do not say them yet. This one asks for several, so a single show of hands will not "
        + "read: go down the letters one at a time, hands up for each, and write the counts "
        + "down before anyone can change their mind."
      : "Do not say it yet. Every pupil commits first - fingers, whiteboards or a show of hands "
        + "on each letter in turn - and you count the split before anyone can change their mind.",
    "",
    "IF MOST OF THE CLASS IS RIGHT: say why it is right in one sentence and go straight on "
    + "to the independent work.",
    "",
    `IF A SIGNIFICANT GROUP IS ON ONE WRONG LETTER: that option is the misconception to teach `
    + `against before anyone goes on. Go back to station ${n}, ${stName}, and work through its `
    + `example again, aloud, with the class watching, then re-ask this question.`,
  ];
  if (c.only_multi) {
    lines.push("", "This lesson has no single-answer question to stop on, so this one asks for "
      + "several. That is a weaker hinge than a four-option question and it is used here only "
      + "because the lesson offers nothing better.");
  }
  if (c.response) lines.push("", `The course's own response to a wrong answer here: ${c.response}`);
  if (c.gap) {
    lines.push("", `A limitation, stated rather than papered over: ${c.gap}. The course does not `
      + "record what each separate wrong option means, and this slide does not invent it. Decide "
      + "your own reteach for each option before the lesson; the options above are the start of it.");
  }
  lines.push("", `This is a real activity from the experience (${c.id}), so the wording here is the `
    + "wording a pupil will see.");
  s.addNotes(lines.join("\n"));
  return s;
}

function plenarySlide(pres, L) {
  const s = pres.addSlide();
  chrome(s, L.kicker);
  heading(s, "Before you go", "Rate yourself on each of these");
  (L.confidence || []).forEach((c, i) => {
    const y = 2.1 + i * 1.05;
    card(s, 0.55, y, 8.6, 0.85, BORDER);
    s.addText(c, { x: 1.0, y, w: 7.8, h: 0.85, fontSize: 18, fontFace: SANS, color: INK,
      isTextBox: true, margin: 0, valign: "middle" });
    ["Secure", "Revise", "Focus here"].forEach((lab, j) => {
      const x = 9.4 + j * 1.18;
      s.addShape("roundRect", { x, y: y + 0.16, w: 1.08, h: 0.53, rectRadius: 0.1,
        fill: { color: WHITE }, line: { color: [TEAL, AMBER, "E2574C"][j], width: 1.25 } });
      s.addText(lab, { x, y: y + 0.16, w: 1.08, h: 0.53, fontSize: 10, fontFace: SANS,
        color: [TEAL, AMBER, "E2574C"][j], align: "center", valign: "middle", isTextBox: true, margin: 0 });
    });
  });
  const y2 = 2.1 + (L.confidence || []).length * 1.05 + 0.3;
  if (y2 < 6.0) {
    s.addText(`Anything marked Focus here: reopen ${L.title} and use review mode on the questions you got wrong.`,
      { x: 0.55, y: y2, w: 12.2, h: 0.6, fontSize: 15, fontFace: SANS, color: SLATE,
        isTextBox: true, margin: 0, valign: "middle" });
  }
  s.addNotes("Students copy their score-screen breakdown onto the worksheet, then rate themselves here.");
  return s;
}

// ---- build one deck per lesson ---------------------------------------
lessons.forEach(L => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Revise 360 Ltd";
  pres.company = "Revise 360 Ltd";
  pres.title = `${L.kicker} — ${L.title}`;
  pres.subject = "OCR J277 GCSE Computer Science";

  titleSlide(pres, L);
  objectivesSlide(pres, L);
  starterSlide(pres, L);
  intoSlide(pres, L);
  L.stations.forEach((st, i) => stationSlide(pres, L, st, i + 1));
  // The walls explain, the model shows the process on a scenario of its own, the
  // check finds out who has it, and only then does the independent work start.
  modelSlide(pres, L);
  checkSlide(pres, L);
  finalSlide(pres, L);
  didYouKnowSlide(pres, L);
  examSlide(pres, L);
  plenarySlide(pres, L);

  const camel = L.title.split(/[^A-Za-z0-9]+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const name = `${PREFIX}_L${String(L.lesson).padStart(2, "0")}_${camel}_Lesson.pptx`;
  pres.writeFile({ fileName: `${OUT}/${name}` }).then(() => console.log("ok", name));
});

// A model slide that did not fit was written anyway, because the decks around it
// are fine and leaving them unbuilt helps nobody - but the run fails, so a build
// script cannot treat a deck with text running off a card as a success.
process.on("exit", () => { if (overflowed) process.exitCode = 1; });
