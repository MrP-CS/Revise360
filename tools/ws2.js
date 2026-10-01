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






const header = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [8266, 2200],
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: 8266, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      p([t("OCR J277 1.3  |  Lesson 2", { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t("Factors that affect network performance", { bold: true, size: 38, color: NAVY })], { before: 0, after: 20 }),
      p([t("Worksheet for the 360° experience: Network control room", { size: 22, color: SOFT })], { before: 0, after: 0 })] }),
    new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [t("Revise 360", { bold: true, color: SOFT, size: 26 })] })] })
  ] })]
});
const nameRow = new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [5000, 2733, 2733], borders: noBorders,
  rows: [new TableRow({ children: ["Name", "Class", "Date"].map((l, i) => new TableCell({ width: { size: [5000, 2733, 2733][i], type: WidthType.DXA }, borders: noBorders,
    children: [new Paragraph({ children: [t(l + ":", { bold: true })], spacing: { before: 240, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "9AA8BC", space: 1 } } })] })) })] });
const IW = W - 440;
const intro = [
  box(null, "How to use this sheet", NAVY, [
    p([t("1.  ", { bold: true }), t("Answer the starter below before you open the experience.")]),
    p([t("2.  ", { bold: true }), t("Open Network control room. At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the questions on screen. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your score into the yellow box straight away.")]),
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...["understand what factors can affect the performance of a network", "be able to explain how each factor affects network speed"]
      .map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))
  ]), gap(),
  box(null, "Starter: before you put the headset on", COL.Y, [
    p([t("What can affect the performance of a network? Write down as many ideas as you can.", { bold: true })], { keepNext: true }),
    ...lines(2)])];

function station(n, title, col, where, fact, chal) {
  return [box(n, title, col, [
    p([t(where, { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    ...keyFact(fact, 1), ...challenge(chal)]), gap()];
}

const body1 = [
  partHeader("Network control room", "The five factors", "Stations 1 and 2: turn right. Stations 3 and 4: turn around. Station 5 and the CCTV case: turn left. Final challenge: look down."),
  gap(),
  ...station(1, "Bandwidth", COL[1], "Turn right", "Bandwidth is... It is measured in...",
    "Why does streaming a 4K film need more bandwidth than streaming music?"),
  ...station(2, "Number of users", COL[2], "Turn right", "When more people use a network at the same time...",
    "Why is the school network slowest at the start of a lesson, when everyone logs on?"),
  ...station(3, "Transmission media", COL[3], "Turn around", "Wired connections are usually... Fibre optic is...",
    "A games console keeps lagging on Wi-Fi. What would you suggest, and why?"),
  ...station(4, "Error rate", COL[4], "Turn around", "When data is damaged or lost...",
    "Why might Wi-Fi be slower near a microwave oven, or in a block of flats with lots of other Wi-Fi networks?"),
  ...station(5, "Latency", COL[5], "Turn left", "Latency is... It is measured in...",
    "Why does a video call to Australia have more delay than one to a friend in the same town?"),
  box(6, "Case study: CCTV", COL[6], [
    p([t("Turn left", { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    p([t("A school network includes several CCTV cameras that record video to the file server. The head teacher wants to add more cameras around the outside of the building. ", {}), t("What should the network manager consider?", { bold: true })], { keepNext: true }),
    p([t("Write your advice to the head teacher, using at least two of the five factors.", { color: SOFT, italics: true })], { keepNext: true }),
    ...lines(5)]), gap(),
];

const body2 = [
  box("★", "Final challenge: diagnose the network (look down)", COL.Y, [
    p([t("Before", { bold: true }), t(" you tap the star, write the factor causing each problem. Choose from: bandwidth, number of users, transmission media, error rate, latency.")], { keepNext: true }),
    grid(["Help desk problem", "Factor"],
      [["Downloads slow right down every lunchtime, when 300 students go online", ""],
       ["A 10 Mbps connection can't stream several HD videos at once", ""],
       ["A laptop at the far end of the building keeps losing its Wi-Fi", ""],
       ["Packets are corrupted near heavy machinery and keep being resent", ""],
       ["Online gamers notice a delay between pressing a button and the action happening", ""]],
      [IW - 2800, 2800], { h: 600 })]), gap(),
  scoreBox("", 17), gap(),
  box(null, "Task: how each factor affects network speed", NAVY, [
    p([t("Explain how each factor can affect network speed, and give a real example.", { color: SOFT, italics: true })], { keepNext: true }),
    grid(["Factor", "How it affects network speed", "Example"],
      [["Bandwidth", "", ""], ["Number of users", "", ""], ["Transmission media", "", ""], ["Error rate", "", ""], ["Latency", "", ""]],
      [2300, IW - 2300 - 3000, 3000], { firstBold: true, h: 780 })]), gap(),
];

const exit = [
  box(null, "Exam practice", NAVY, [
    p([t("Take the headset off, or close the page, and answer from memory.", { color: SOFT, italics: true })], { keepNext: true }),
    p([t("a)  State two factors that can affect the performance of a network.  ", { bold: true }), t("[2]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(2),
    p([t("b)  Explain how the number of users can affect the performance of a network.  ", { bold: true }), t("[2]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(2),
    p([t("c)  A student's online game keeps lagging. Explain two possible causes and suggest a fix for each.  ", { bold: true }), t("[4]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(4)]), gap(),
  box(null, "How confident am I?", NAVY, [
    grid(["Objective", "Not yet", "Getting there", "Confident"],
      [["Naming the five factors that affect performance", "", "", ""], ["Explaining how each factor affects network speed", "", "", ""], ["Applying the factors to a scenario, like the CCTV case", "", "", ""]],
      [4826, 1600, 1600, 2000], { h: 560 })])
];

const doc = new Document({
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  styles: { default: { document: { run: { font: F, size: 21 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Lesson 2: Factors that affect network performance  |  Page ", font: F, size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: SOFT })] })] }) },
    children: [header, nameRow, gap(), ...intro, gap(), ...body1, ...body2, ...exit]
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(P.OUT + '/Lesson2_Performance_Worksheet.docx', b); console.log('ok'); });
