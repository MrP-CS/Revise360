const P = require("./paths.js");
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, ImageRun, AlignmentType, Footer, PageNumber, TabStopType, VerticalAlign, PageBreak,
  LevelFormat } = require('docx');

const W = 10466; // A4 width minus 0.5" margins... A4 11906 - 2*720
const NAVY = "1C2C4A", YEL = "C99A00", SOFT = "5A6B85";
const COL = { 1: "1E9BD7", 2: "8A55C9", 3: "E0603F", 4: "E08A10", 5: "2FAE72", 6: "D6408E", G: "2FAE72", R: "D64545", Y: "C99A00" };
const F = "Arial";

const t = (text, o = {}) => new TextRun({ text, font: F, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs, o)], spacing: { before: o.before ?? 60, after: o.after ?? 60, line: o.line }, alignment: o.align, keepNext: o.keepNext, numbering: o.numbering });
const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: nb, bottom: nb, left: nb, right: nb, insideHorizontal: nb, insideVertical: nb };

function lines(n, label, width = W - 440) {
  const dot = { style: BorderStyle.DOTTED, size: 6, color: "9AA8BC" };
  return [new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: [width],
    rows: Array.from({ length: n }, (_, k) => new TableRow({ cantSplit: true, height: { value: 460, rule: "exact" }, children: [new TableCell({
      width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.BOTTOM,
      borders: { top: nb, left: nb, right: nb, bottom: dot }, margins: { left: 0, right: 0, bottom: 20 },
      children: [new Paragraph({ children: [t(k === 0 && label ? label : "", { color: SOFT })], spacing: { before: 0, after: 0 } })] })] })) })];
}
function challenge(q, n = 2) {
  return [p([t("Challenge: ", { bold: true, color: YEL }), t(q, { bold: true })], { before: 120, keepNext: true }), ...lines(n)];
}
function keyFact(prompt, n = 2) {
  return [p([t("Key fact in your own words: ", { bold: true, color: SOFT }), t(prompt, { italics: true })], { keepNext: true }), ...lines(n)];
}
function box(num, title, colour, children, width = W) {
  return new Table({
    width: { size: width, type: WidthType.DXA }, columnWidths: [width],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: { left: { style: BorderStyle.SINGLE, size: 36, color: colour }, top: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" }, right: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" } },
      margins: { top: 100, bottom: 140, left: 200, right: 200 },
      children: [p([t(num ? `${num}   ` : "", { bold: true, color: colour, size: 26 }), t(title, { bold: true, color: colour, size: 26 })], { before: 0, keepNext: true }), ...children]
    })] })]
  });
}
const gap = () => new Paragraph({ children: [], spacing: { before: 0, after: 120 } });

function partHeader(n, title, where) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: NAVY }, borders: noBorders,
      margins: { top: 140, bottom: 140, left: 240, right: 240 },
      children: [p([t(n, { bold: true, color: "FFD046", size: 20 })], { before: 0, after: 20 }),
        p([t(title, { bold: true, color: "FFFFFF", size: 34 })], { before: 0, after: 20 }),
        p([t(where, { color: "C8D4E6", size: 19 })], { before: 0, after: 0 })]
    })] })]
  });
}

function scoreBox(part, total) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [7466, 3000],
    rows: [new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: 7466, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFF6D6" },
        borders: { top: { style: BorderStyle.SINGLE, size: 8, color: YEL }, bottom: { style: BorderStyle.SINGLE, size: 8, color: YEL }, left: { style: BorderStyle.SINGLE, size: 8, color: YEL }, right: nb },
        margins: { top: 120, bottom: 120, left: 200, right: 120 }, verticalAlign: VerticalAlign.CENTER,
        children: [p([t(part ? `Part ${part} score` : "Your score", { bold: true, size: 24 })], { before: 0, after: 0 }),
          p([t("Copy it from the score screen as soon as it appears.", { color: SOFT, size: 19 })], { before: 0, after: 0 })] }),
      new TableCell({ width: { size: 3000, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFF6D6" },
        borders: { top: { style: BorderStyle.SINGLE, size: 8, color: YEL }, bottom: { style: BorderStyle.SINGLE, size: 8, color: YEL }, right: { style: BorderStyle.SINGLE, size: 8, color: YEL }, left: nb },
        verticalAlign: VerticalAlign.CENTER,
        children: [p([t("______ / " + total, { bold: true, size: 32 })], { align: AlignmentType.CENTER, before: 0, after: 0 })] })
    ] })]
  });
}

function grid(headers, rows, widths, opts = {}) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: "B7C2D1" };
  const borders = { top: b, bottom: b, left: b, right: b };
  const mk = (txt, w, head, fill) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: fill || (head ? "E6ECF5" : "FFFFFF") },
    margins: { top: 80, bottom: 80, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER,
    children: [p([t(txt, { bold: head, size: head ? 20 : 21 })], { before: 0, after: 0 })] });
  return new Table({ width: { size: widths.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => mk(h, widths[i], true)) }),
      ...rows.map(r => new TableRow({ cantSplit: true, height: { value: opts.h || 520, rule: "atLeast" }, children: r.map((c, i) => mk(c, widths[i], i === 0 && opts.firstBold, i === 0 && opts.firstBold ? "F3F6FA" : null)) }))] });
}

function drawBox(label, h = 3200) {
  return new Table({ width: { size: W - 440, type: WidthType.DXA }, columnWidths: [W - 440],
    rows: [new TableRow({ height: { value: h, rule: "exact" }, children: [new TableCell({ width: { size: W - 440, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.DASHED, size: 6, color: "9AA8BC" }, bottom: { style: BorderStyle.DASHED, size: 6, color: "9AA8BC" }, left: { style: BorderStyle.DASHED, size: 6, color: "9AA8BC" }, right: { style: BorderStyle.DASHED, size: 6, color: "9AA8BC" } },
      margins: { top: 80, left: 120 }, children: [p([t(label, { color: SOFT, size: 18, italics: true })], { before: 0 })] })] })] });
}






function mkHeader(lesson, title, sub) { return new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [8266, 2200],
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: 8266, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      p([t("OCR J277 2.3 Producing robust programs  |  Lesson " + lesson, { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t(title, { bold: true, size: 38, color: NAVY })], { before: 0, after: 20 }),
      p([t(sub, { size: 22, color: SOFT })], { before: 0, after: 0 })] }),
    new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [t("Revise 360", { bold: true, color: SOFT, size: 26 })] })] })
  ] })] }); }
const nameRow = () => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [5000, 2733, 2733], borders: noBorders,
  rows: [new TableRow({ children: ["Name", "Class", "Date"].map((l, i) => new TableCell({ width: { size: [5000, 2733, 2733][i], type: WidthType.DXA }, borders: noBorders,
    children: [new Paragraph({ children: [t(l + ":", { bold: true })], spacing: { before: 240, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "9AA8BC", space: 1 } } })] })) })] });
const IW = W - 440;
function howTo(expName, objectives, code) { return box(null, "How to use this sheet", NAVY, code ? [
    p([t("1.  ", { bold: true }), t("Answer the starter below before you open the experience.")]),
    p([t("2.  ", { bold: true }), t("Open " + expName + ". At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you start the programs.")]),
    p([t("3.  ", { bold: true }), t("The What to do column says what each activity asks of you: run a program, say what it will display, change one thing, fill in a gap, fix a mistake, or write it yourself.")]),
    p([t("4.  ", { bold: true }), t("Plan the ones you write on this sheet, then type the program in the editor and press Run to try it. Run never marks anything, so try things out freely.")]),
    p([t("5.  ", { bold: true }), t("Press Check to mark it. You can change your program and check again as often as you like - your best mark is the one that is kept.")]),
    p([t("6.  ", { bold: true }), t("Read the tests that failed: each one says what was expected and what your program displayed. If you are stuck, the Hint button gives you one step at a time.")]),
    p([t("7.  ", { bold: true }), t("Work through the activities in order and complete every one. The next activity opens when the one you are on is finished.")]),
    p([t("8.  ", { bold: true }), t("If you get stuck, press I need help. Use a hint, or ask your teacher and show them the question and your code. Complete the question before moving on.")]),
] : [
    p([t("1.  ", { bold: true }), t("Answer the starter below before you open the experience.")]),
    p([t("2.  ", { bold: true }), t("Open " + expName + ". At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the questions on screen. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your score into the yellow box straight away.")]),
  ].concat([
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...objectives.map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))])); }
function station(n, title, col, where, fact, chal, extra = [], factLines = 1, chalLines = 2) {
  return [box(n, title, col, [
    p([t(where, { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    ...keyFact(fact, factLines), ...(chal ? challenge(chal, chalLines) : []), ...extra]), gap()]; }
const numbered = n => Array.from({ length: n }, (_, i) => lines(1, (i + 1) + ". ")).flat();
function keyTerms(terms) { return box(null, "Key terminology", COL.G, terms.flatMap(term => [
  p([t(term, { bold: true, color: NAVY })], { before: 100, keepNext: true }), ...lines(2)])); }
function confidence(rows) { return box(null, "How confident am I?", NAVY, [grid(["Objective", "Not yet", "Getting there", "Confident"], rows.map(r => [r, "", "", ""]), [4826, 1600, 1600, 2000], { h: 560 })]); }
function makeDoc(footer, children, out) {
  const doc = new Document({
    numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
    styles: { default: { document: { run: { font: F, size: 21 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: footer + "  |  Page ", font: F, size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: SOFT })] })] }) },
      children }] });
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log("ok", out); });
}

const S = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const kids = [];
function logicKids(blocks) {
  return (blocks || []).flatMap(b => {
    if (b.kind === "draw") return [p([t(b.title, { bold: true })], { before: 120, keepNext: true }), drawBox("Your logic diagram", 2400)];
    if (b.kind === "lines") return [p([t(b.title, { bold: true })], { before: 120, keepNext: true }), ...lines(b.n)];
    if (b.kind === "table") { const n = b.head.length, w = Math.floor(IW / n);
      return [p([t(b.title, { bold: true })], { before: 120, keepNext: true }), grid(b.head, b.rows, b.head.map(() => w), { h: 360 })]; }
    return [];
  });
}
kids.push(mkHeaderT(S.topicLabel, S.lesson, S.title, S.sub), nameRow(), gap());
function mkHeaderT(topicLabel, lesson, title, sub) { return new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [8266, 2200],
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: 8266, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      p([t(topicLabel + "  |  Lesson " + lesson, { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t(title, { bold: true, size: 38, color: NAVY })], { before: 0, after: 20 }),
      p([t(sub, { size: 22, color: SOFT })], { before: 0, after: 0 })] }),
    new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [t("Revise 360", { bold: true, color: SOFT, size: 26 })] })] })
  ] })] }); }
if (S.kind === "reflection") {
  kids.push(box(null, "How to use this sheet", NAVY, [
    p([t("Use this sheet after your test has been marked. Copy your mark for each question, then colour the RAG column: red if you got few or no marks, amber if you got some, green if you got full marks.")]),
    p([t("Then plan what you will do to improve your red and amber topics.")])]), gap());
  kids.push(box(null, "My results", NAVY, [grid(["Q", "Topic", "Marks", "My mark", "R / A / G"], S.rows.map(r => [r[0], r[1], String(r[2]), "", ""]),
    [700, IW - 700 - 1100 - 1300 - 1300, 1100, 1300, 1300], { h: 560 }),
    p([t("Total: ", { bold: true }), t("________ / " + S.total, { bold: true })], { before: 160, align: AlignmentType.RIGHT })]), gap());
  kids.push(box(null, "What went well", COL.G, [...lines(3)]), gap());
  kids.push(box(null, "Even better if: the topics I need to improve", COL.R, [...numbered(3)]), gap());
  kids.push(box(null, "My improvement plan", NAVY, [
    p([t("For your weakest topic, correct your answer below using your notes or the Revise 360 experience for that lesson.", { color: SOFT, italics: true })], { keepNext: true }), ...lines(6)]), gap());
  kids.push(box(null, "Revise 360 experiences to revisit", COL.Y, [p([t(S.revisit)])]));
} else {
  kids.push(howTo(S.expName, S.objectives, S.code), gap());
  if (S.starter) kids.push(box(null, "Starter: before you put the headset on", COL.Y, [p([t(S.starter, { bold: true })], { keepNext: true }), ...lines(S.starterLines || 2)]), gap());
  if (S.keyterms && S.keyterms.length) kids.push(keyTerms(S.keyterms));
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(partHeader(S.expName, S.revision ? "Revision stations" : "The stations", "Stations 1 and 2: turn right. Stations 3 and 4: turn around. Stations 5 and 6: turn left. Final challenge: look down."), gap());
  const WHERE = ["Turn right", "Turn right", "Turn around", "Turn around", "Turn left", "Turn left"];
  S.stations.forEach((st, i) => {
    const col = COL[i + 1];
    if (S.revision) kids.push(box(i + 1, st.name, col, [p([t(WHERE[i], { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
      p([t("Three key facts in your own words:", { bold: true, color: SOFT })], { keepNext: true }), ...numbered(3), ...challenge(st.challenge)]), gap());
    else kids.push(...station(i + 1, st.name, col, WHERE[i], st.fact || "Key facts:", st.challenge, logicKids(st.logic)));
  });
  const F = S.final;
  kids.push(box("★", F.title + " (look down)", COL.Y, [
    p([t("Before", { bold: true }), t(" you tap the star, " + F.instr)], { keepNext: true }),
    ...(F.rows.length ? [grid([F.left, F.right], F.rows.map(r => [r, ""]), [IW - 2600, 2600], { h: 500 })] : []), ...logicKids(F.logic)]), gap());
  kids.push(scoreBox("", S.total), gap());
  if (S.revision) kids.push(box(null, "My results", NAVY, [grid(["Station", "Score", "Secure / Revise / Focus here", "What I will do about it"],
    S.results.map(r => [r[0], "    / " + r[1], "", ""]), [3300, 1100, 2300, IW - 3300 - 1100 - 2300], { firstBold: true, h: 560 })]), gap());
  if (S.extra) kids.push(box(null, S.extra.title, NAVY, [p([t(S.extra.instr, { color: SOFT, italics: true })], { keepNext: true }),
    grid(S.extra.head, S.extra.rows, S.extra.head.map((_, i) => i === 0 ? 900 : Math.floor((IW - 900) / (S.extra.head.length - 1))), { h: 620 })]), gap());
  if (S.checklist) kids.push(box(null, "Outstanding programs checklist", COL[2], [grid(["Program", "Done ✓"], S.checklist.map(c => [c, ""]), [IW - 1400, 1400], { h: 500 })]), gap());
  if (S.keyq) kids.push(box(null, "Key question", NAVY, [p([t(S.keyq, { bold: true })], { keepNext: true }), ...lines(3)]), gap());
  if (S.exam && S.exam.length) kids.push(box(null, "Exam practice", NAVY, [p([t("Take the headset off, or close the page, and answer from memory.", { color: SOFT, italics: true })], { keepNext: true }),
    ...S.exam.flatMap((e, i) => [p([t(String.fromCharCode(97 + i) + ")  " + e[0] + "  ", { bold: true }), t("[" + e[1] + "]", { color: SOFT })], { before: 120, keepNext: true }), ...(e[2] ? lines(e[2]) : [drawBox("Your answer", 2200)])])]), gap());
  if (S.rag) kids.push(box(null, "Revision checklist: RAG each topic", COL[4], [grid(["Topic", "Red", "Amber", "Green"], S.rag.map(r => [r, "", "", ""]), [IW - 3000, 1000, 1000, 1000], { h: 480 })]), gap());
  kids.push(confidence(S.confidence));
}
makeDoc(S.footer, kids, S.out);
