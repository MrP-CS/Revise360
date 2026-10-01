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
      children: [p([t(`Lesson 6: part ${n} of 2`, { bold: true, color: "FFD046", size: 20 })], { before: 0, after: 20 }),
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
        children: [p([t(`Part ${part} score`, { bold: true, size: 24 })], { before: 0, after: 0 }),
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
      p([t("OCR J277 1.3  |  Lesson 6", { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t("Star and mesh networks", { bold: true, size: 40, color: NAVY })], { before: 0, after: 20 }),
      p([t("Worksheet for the 360° experience", { size: 22, color: SOFT })], { before: 0, after: 0 })] }),
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
    p([t("1.  ", { bold: true }), t("Open the Lesson 6 experience. Drag to look around each scene.")]),
    p([t("2.  ", { bold: true }), t("At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the questions on screen. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your score into the yellow box straight away. Refreshing the page loses it.")]),
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...["know what a star network is", "know what a mesh network is",
      "understand that the internet is an example of a partial mesh network", "know the advantages and disadvantages of star and mesh networks"]
      .map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))
  ])];

const part1 = [
  partHeader(1, "Star networks", "An office wired as two star networks. Stations 1 and 2: turn right. Stations 3 and 4: turn around. Station 5, Break it: turn left. Office plan: look down."),
  gap(),
  box(1, "Star topology", COL[1], [...keyFact("In a star network, every device...", 1),
    p([t("Challenge: ", { bold: true, color: YEL }), t("Why is it called a star network? Sketch one with five computers and label the switch.", { bold: true })], { before: 120, keepNext: true }),
    drawBox("Sketch here", 2200), ...lines(1, "It is called a star because ")]), gap(),
  box(2, "Advantages of star", COL[2], [
    p([t("List three advantages from the wall.", { color: SOFT, italics: true })], { keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. "),
    ...challenge("One cable in a star network is cut. Which devices lose their connection?", 1)]), gap(),
  box(3, "Disadvantages of star", COL[3], [
    p([t("List two disadvantages from the wall.", { color: SOFT, italics: true })], { keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "),
    ...challenge("What is the biggest weakness of a star network? Explain why.")]), gap(),
  box(4, "Joining star networks", COL[4], [...keyFact("Two star networks are joined by...", 1),
    ...challenge("The link cable between two switches is cut. Who can still talk to whom?")]), gap(),
  box(5, "Break it!", COL[6], [
    p([t("Predict first. ", { bold: true }), t("Use the office diagram on the wall: Switch A connects Reception, Sales 1 and Sales 2. Switch B connects Accounts, Conference and the file server. Write your prediction, then tap the badge and tick or cross it.")], { keepNext: true }),
    grid(["What fails?", "My prediction", "✓ / ✗"],
      [["The cable to Sales 2 is cut. Who can no longer reach the file server?", "", ""],
       ["Switch A fails. Who can no longer reach the file server?", "", ""],
       ["The link cable is cut. Who can still reach the file server?", "", ""],
       ["Which single failure stops everyone reaching the file server?", "", ""]],
      [4300, IW - 4300 - 1000, 1000], { h: 760 }),
    p([t("Look down: ", { bold: true, color: YEL }), t("trace a file from a computer in Sales to the server. Which switches does it pass through?", { bold: true })], { before: 160, keepNext: true }),
    ...lines(1)]), gap(),
  scoreBox(1, 12),
];

const part2 = [
  new Paragraph({ children: [new PageBreak()] }),
  partHeader(2, "Mesh networks", "Full, partial and wireless mesh. Stations 1 and 2: turn right. Stations 3 and 4: turn around. Station 5, star vs mesh: turn left. Wireless mesh plan: look down."),
  gap(),
  box(1, "Full mesh", COL[1], [...keyFact("In a full mesh network, every device...", 1),
    ...challenge("How many cables would you need to connect four devices in a full mesh? Show your working.", 2),
    ...lines(1, "Answer: "),
    p([t("Stretch: ", { bold: true, color: SOFT }), t("how many cables for six devices? Can you spot the pattern?")], { before: 120, keepNext: true }), ...lines(1)]), gap(),
  box(2, "Mesh: pros and cons", COL[2], [
    grid(["Advantages of mesh", "Disadvantages of mesh"], [["", ""], ["", ""], ["", ""]], [IW / 2, IW / 2], { h: 700 }),
    ...challenge("Why would a bank's data centre choose a mesh rather than a star?")]), gap(),
  box(3, "Partial mesh: the internet", COL[3], [...keyFact("In a partial mesh, devices connect to...", 1),
    ...challenge("Why isn't the internet a full mesh?")]), gap(),
  box(4, "Wireless mesh", COL[4], [...keyFact("In a wireless mesh, each wireless access point must...", 1),
    ...challenge("Why might a wireless mesh be a good choice for a large house or an old building?"),
    p([t("Look down: ", { bold: true, color: YEL }), t("could you remove one WAP from the office plan and still connect every part of the office? Explain.", { bold: true })], { before: 160, keepNext: true }),
    ...lines(2)]), gap(),
  box(5, "Star vs mesh", COL[6], [
    p([t("Complete the table in your own words, then tap the badge for the sorting task.", { color: SOFT, italics: true })], { keepNext: true }),
    grid(["", "Star", "Mesh"],
      [["How devices connect", "", ""], ["If one cable fails...", "", ""], ["If a key device fails...", "", ""], ["Amount of cable and cost", "", ""], ["Example", "", ""]],
      [2600, (IW - 2600) / 2, (IW - 2600) / 2], { firstBold: true, h: 700 })]), gap(),
  scoreBox(2, 14),
];

const exit = [
  new Paragraph({ children: [new PageBreak()] }),
  box(null, "Exam practice", NAVY, [
    p([t("Take the headset off, or close the page, and answer from memory.", { color: SOFT, italics: true })], { keepNext: true }),
    p([t("a)  Explain the biggest weakness of a star network.  ", { bold: true }), t("[2]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(2),
    p([t("b)  Explain how a mesh network overcomes this weakness.  ", { bold: true }), t("[2]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(2),
    p([t("c)  State one disadvantage of a full mesh network.  ", { bold: true }), t("[1]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(1),
    p([t("d)  A small business with 15 staff in one building is setting up a wired network. Should it use a star or a full mesh topology? Justify your answer.  ", { bold: true }), t("[4]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(5)]), gap(),
  box(null, "My scores", NAVY, [
    grid(["", "Score"], [["Part 1: Star", "        / 12"], ["Part 2: Mesh", "        / 14"], ["Total", "        / 26"]], [6000, IW - 6000], { firstBold: true, h: 560 }),
    p([t("How confident am I? ", { bold: true }), t("Colour or circle one for each objective.", { color: SOFT })], { before: 200, keepNext: true }),
    grid(["Objective", "Not yet", "Getting there", "Confident"],
      [["What a star network is", "", "", ""], ["What a mesh network is", "", "", ""], ["Why the internet is a partial mesh", "", "", ""], ["Advantages and disadvantages of star and mesh", "", "", ""]],
      [4826, 1600, 1600, 2000], { h: 520 })])
];

const doc = new Document({
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  styles: { default: { document: { run: { font: F, size: 21 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Lesson 6: Star and mesh networks  |  Page ", font: F, size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: SOFT })] })] }) },
    children: [header, nameRow, gap(), ...intro, gap(), ...part1, ...part2, ...exit]
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(P.OUT + '/Lesson6_StarMesh_Worksheet.docx', b); console.log('ok'); });
