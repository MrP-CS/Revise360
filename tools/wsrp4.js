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
function howTo(expName, objectives) { return box(null, "How to use this sheet", NAVY, [
    p([t("1.  ", { bold: true }), t("Answer the starter below before you open the experience.")]),
    p([t("2.  ", { bold: true }), t("Open " + expName + ". At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the questions on screen. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your score into the yellow box straight away.")]),
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...objectives.map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))]); }
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

const bugs = ['prnt("2. Save game")', "choice = input(Enter choice:) with no quotation marks", "while items >= 1 with the colon missing",
  "valid = True before while not valid:, so the loop never runs", 'if not choice in [1,2,3]: when input() gives the string "2"',
  "valid == True where valid = True was meant", "average = total / count when count is 0", "Printing Fail when the score is above the pass mark"];
makeDoc("2.3 Lesson 4: Types of testing and errors", [
  mkHeader(4, "Types of testing and errors", "Worksheet for the 360° experience: Bug hunt lab"), nameRow(), gap(),
  howTo("Bug hunt lab", ["know four reasons why a program should be tested", "know what iterative testing is", "know what final/terminal testing is",
    "know what a syntax error is", "know what a logic error is"]), gap(),
  box(null, "Starter: before you put the headset on", COL.Y, [
    p([t("The total cost program on station 6 contains syntax and logic errors. How many can you find before you start?", { bold: true })], { keepNext: true }), ...lines(3)]), gap(),
  partHeader("Bug hunt lab", "The stations", "Stations 1 and 2: turn right. Stations 3 and 4: turn around. Stations 5 and 6: turn left. Final challenge: look down."), gap(),
  box(1, "Why test a program?", COL[1], [
    p([t("Turn right", { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    p([t("Challenge: ", { bold: true, color: YEL }), t("Give four reasons why a program should be tested before it is released.", { bold: true })], { keepNext: true }), ...numbered(4)]), gap(),
  ...station(2, "Iterative testing", COL[2], "Turn right", "Iterative testing takes place... It involves...",
    "Suggest three things you would test iteratively while writing a date of birth validation program.", [], 2, 3),
  ...station(3, "Final (terminal) testing", COL[3], "Turn around", "Final testing takes place... It checks...",
    "Suggest three things you would test in final testing of a game before it goes on sale.", [], 1, 3),
  box(4, "Syntax errors", COL[4], [
    p([t("Turn around", { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    ...keyFact("A syntax error is...", 1),
    p([t("Challenge: ", { bold: true, color: YEL }), t("Find the three syntax errors on the wall and say how to fix each one.", { bold: true })], { before: 120, keepNext: true }),
    grid(["Error", "How to fix it"], [["", ""], ["", ""], ["", ""]], [IW / 2, IW / 2], { h: 560 })]), gap(),
  ...station(5, "Logic errors", COL[5], "Turn left", "A logic error is... It is hard to find because...",
    "Explain the logic error in the pass mark program and how to fix it."),
  box(6, "Error detective", COL[6], [
    p([t("Turn left", { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    p([t("Find every error in the total cost program. For each one, give the line number, the error and its type.", { bold: true })], { keepNext: true }),
    grid(["Line", "Error and fix", "Syntax or logic?"], [["", "", ""], ["", "", ""], ["", "", ""], ["", "", ""]], [1000, IW - 1000 - 2200, 2200], { h: 620 })]), gap(),
  box("★", "Final challenge: syntax or logic? (look down)", COL.Y, [
    p([t("Before", { bold: true }), t(" you tap the star, write whether each bug is a syntax (S) or logic (L) error.")], { keepNext: true }),
    grid(["Bug", "S or L"], bugs.map(r => [r, ""]), [IW - 1400, 1400], { h: 520 })]), gap(),
  scoreBox("", 20), gap(),
  box(null, "Iterative and final testing", NAVY, [
    p([t("Suggest three things that could be tested under each heading.", { color: SOFT, italics: true })], { keepNext: true }),
    grid(["Iterative testing", "Final/terminal testing"], [["", ""], ["", ""], ["", ""]], [IW / 2, IW / 2], { h: 700 })]), gap(),
  box(null, "Key question", NAVY, [p([t("What are the different types of errors that can occur in a program?", { bold: true })], { keepNext: true }), ...lines(3)]), gap(),
  box(null, "Exam practice", NAVY, [
    p([t("Take the headset off, or close the page, and answer from memory.", { color: SOFT, italics: true })], { keepNext: true }),
    p([t("a)  Describe what iterative testing is and when it happens.  ", { bold: true }), t("[3]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(3),
    p([t("b)  A program calculates an average with average = total / count, where count is 0. State the logic error.  ", { bold: true }), t("[1]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(1),
    p([t("c)  Describe what a syntax error is, and give an example.  ", { bold: true }), t("[2]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(2)]), gap(),
  confidence(["Reasons for testing a program", "Iterative and final/terminal testing", "Telling syntax errors from logic errors"])
], P.OUT + "/RP_Lesson4_Testing_Worksheet.docx");
