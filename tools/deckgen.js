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
  finalSlide(pres, L);
  didYouKnowSlide(pres, L);
  examSlide(pres, L);
  plenarySlide(pres, L);

  const camel = L.title.split(/[^A-Za-z0-9]+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const name = `${PREFIX}_L${String(L.lesson).padStart(2, "0")}_${camel}_Lesson.pptx`;
  pres.writeFile({ fileName: `${OUT}/${name}` }).then(() => console.log("ok", name));
});
