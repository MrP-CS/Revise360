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
      children: [p([t(`Zoom out: part ${n} of 3`, { bold: true, color: "FFD046", size: 20 })], { before: 0, after: 20 }),
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


// ---------- header ----------
const header = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [8266, 2200],
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: 8266, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      p([t("OCR J277 1.3  |  Lesson 1", { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t("Types of network: zoom out", { bold: true, size: 40, color: NAVY })], { before: 0, after: 20 }),
      p([t("Worksheet for the 360° experience", { size: 22, color: SOFT })], { before: 0, after: 0 })] }),
    new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [t("Revise 360", { bold: true, color: SOFT, size: 26 })] })] })
  ] })]
});
const nameRow = new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [5000, 2733, 2733], borders: noBorders,
  rows: [new TableRow({ children: ["Name", "Class", "Date"].map((l, i) => new TableCell({ width: { size: [5000, 2733, 2733][i], type: WidthType.DXA }, borders: noBorders,
    children: [new Paragraph({ children: [t(l + ":", { bold: true })], spacing: { before: 240, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "9AA8BC", space: 1 } } })] })) })] });

const intro = [
  box(null, "How to use this sheet", NAVY, [
    p([t("1.  ", { bold: true }), t("Open the Lesson 1 experience. Drag to look around each scene.")]),
    p([t("2.  ", { bold: true }), t("At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the questions on screen. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your score into the yellow box straight away. Refreshing the page loses it.")]),
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...["know what is meant by a standalone computer", "know the different types of network: LAN and WAN",
      "understand the advantages of networking", "understand the implications (disadvantages) of networking"]
      .map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))
  ])];

// ---------- Part 1 ----------
const part1 = [
  partHeader(1, "One computer on its own", "A bedroom with one standalone computer. Stations 1 and 2: turn right. Stations 3 and 4: turn around. Predict: turn left."),
  gap(),
  box(1, "Standalone computer", COL[1], [...keyFact("A standalone computer is..."),
    p([t("Challenge: ", { bold: true, color: YEL }), t("Name one device in your home that is standalone and one that is on a network.", { bold: true })], { before: 120, keepNext: true }),
    ...lines(1, "Standalone: "), ...lines(1, "On a network: ")]), gap(),
  box(2, "Sharing a file", COL[2], [...keyFact("Without a network, a file is shared by...", 1),
    ...challenge("You and a friend both edit the same essay by passing a USB stick back and forth. What could go wrong?")]), gap(),
  box(3, "Printing", COL[3], [...keyFact("Each standalone computer needs...", 1),
    ...challenge("Why would this be a problem for a school's budget?")]), gap(),
  box(4, "Updates and backups", COL[4], [...keyFact("On standalone computers, updates and backups must be...", 1),
    ...challenge("This computer's hard drive fails tonight and it has never been backed up. What is lost?", 1)]), gap(),
  box("?", "Predict", COL[6], [
    p([t("Do this ", {}), t("before", { bold: true }), t(" you tap the badge. How would a network solve each problem?")], { keepNext: true }),
    grid(["Problem", "With a network..."], [["Sharing files", ""], ["Printing", ""], ["Installing updates", ""], ["Backing up", ""]], [2600, W - 440 - 2600], { firstBold: true, h: 620 })]), gap(),
  scoreBox(1, 12),
];

// ---------- Part 2 ----------
const part2 = [
  new Paragraph({ children: [new PageBreak()] }),
  partHeader(2, "One site: the school LAN", "A school computer room. Stations 1 and 2: turn right. Stations 3 and 4: turn around. The LAN map: turn left."),
  gap(),
  box(1, "Local area network (LAN)", COL[1], [
    p([t("Complete the definition:", { bold: true, color: SOFT })], { keepNext: true }),
    p([t("LAN stands for __________________________________ . It covers a __________ geographical area, such as __________________________ . The __________________________ owns and manages all of the hardware. Devices connect using __________________ or __________________ .")], { after: 60, line: 400 }),
    ...challenge("Is the Wi-Fi network in your home a LAN? Use the definition to explain.")]), gap(),
  box(2, "Sharing resources", COL[2], [
    ...keyFact("On a LAN, files, printers and logins can be shared because...", 1),
    p([t("Challenge: ", { bold: true, color: YEL }), t("Name three things in your school that are shared over the LAN.", { bold: true })], { before: 120, keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. ")]), gap(),
  box(3, "Advantages of networks", COL.G, [
    p([t("List four advantages from the wall, in your own words.", { color: SOFT, italics: true })], { keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. "), ...lines(1, "4. "),
    ...challenge("Which advantage do you think saves the school the most money? Justify your choice.")]), gap(),
  box(4, "Disadvantages of networks", COL.R, [
    p([t("List four disadvantages from the wall.", { color: SOFT, italics: true })], { keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. "), ...lines(1, "4. "),
    ...challenge("How could a school reduce the risk of a virus spreading across its network?")]), gap(),
  box(5, "The LAN in this room", COL[6], [
    p([t("Sketch the LAN on the left wall. Label the switch, the file server, the shared printer and at least two computers. Draw the cables as lines.")], { keepNext: true }),
    drawBox("Sketch here", 3000),
    p([t("Check your predictions: ", { bold: true }), t("look back at your Predict table from part 1. Which prediction was closest? Which one would you change?")], { before: 160, keepNext: true }),
    ...lines(2)]), gap(),
  scoreBox(2, 10),
];

// ---------- Part 3 ----------
const part3 = [
  new Paragraph({ children: [new PageBreak()] }),
  partHeader(3, "The whole world: WANs", "A world map of connected cities. Stations 1 and 2: turn right. LAN vs WAN: turn around. Quick check: turn left. Satellite: look up."),
  gap(),
  box(1, "Wide area network (WAN)", COL[1], [
    p([t("Complete the definition:", { bold: true, color: SOFT })], { keepNext: true }),
    p([t("WAN stands for __________________________________ . It covers a __________ geographical area, such as ______________________________ . A WAN connects __________ together. The biggest WAN in the world is ______________________ .")], { after: 60, line: 400 }),
    ...challenge("A school trust links the LANs of its schools in different towns. Is that a LAN or a WAN? Why?")]), gap(),
  box(2, "Who owns the connections?", COL[2], [
    ...keyFact("WAN connections are usually owned by...", 1),
    p([t("Name three types of connection a WAN can use:", { bold: true })], { before: 120, keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. "),
    ...challenge("Why doesn't a school lay its own cable to another school 30 miles away?")]), gap(),
  box(3, "LAN vs WAN", COL[3], [
    p([t("Complete the table in your own words.", { color: SOFT, italics: true })], { keepNext: true }),
    grid(["", "LAN", "WAN"], [["Area covered", "", ""], ["Who owns the hardware?", "", ""], ["Typical connections", "", ""], ["Example", "", ""]], [2600, (W - 440 - 2600) / 2, (W - 440 - 2600) / 2], { firstBold: true, h: 700 }),
    p([t("Task: ", { bold: true, color: YEL }), t("write three bullet points to describe a LAN, then three contrasting bullet points to describe a WAN.", { bold: true })], { before: 160, keepNext: true }),
    grid(["A LAN...", "Whereas a WAN..."], [["", ""], ["", ""], ["", ""]], [(W - 440) / 2, (W - 440) / 2], { h: 800 })]), gap(),
  box(5, "Satellite (look up)", COL[5], [...keyFact("Satellites are used for some WAN links because...", 1)]), gap(),
  scoreBox(3, 13),
];

// ---------- Exit ----------
const exit = [
  new Paragraph({ children: [new PageBreak()] }),
  box(4, "Exit questions (turn left in part 3)", COL[6], [
    p([t("Take the headset off, or close the page, and answer from memory.", { color: SOFT, italics: true })], { keepNext: true }),
    p([t("a)  What is meant by a standalone computer?", { bold: true })], { before: 120, keepNext: true }), ...lines(2),
    p([t("b)  Name one advantage of a network.", { bold: true })], { before: 120, keepNext: true }), ...lines(1),
    p([t("c)  Name one disadvantage of a network.", { bold: true })], { before: 120, keepNext: true }), ...lines(1),
    p([t("d)  Give two differences between a LAN and a WAN.", { bold: true })], { before: 120, keepNext: true }), ...lines(3)]), gap(),
  box(null, "My scores", NAVY, [
    grid(["", "Score"], [["Part 1: Standalone", "        / 12"], ["Part 2: LAN", "        / 10"], ["Part 3: WAN", "        / 13"], ["Total", "        / 35"]], [6000, W - 440 - 6000], { firstBold: true, h: 560 }),
    p([t("How confident am I? ", { bold: true }), t("Colour or circle one for each objective.", { color: SOFT })], { before: 200, keepNext: true }),
    grid(["Objective", "Not yet", "Getting there", "Confident"],
      [["What a standalone computer is", "", "", ""], ["The difference between a LAN and a WAN", "", "", ""], ["The advantages of networking", "", "", ""], ["The disadvantages of networking", "", "", ""]],
      [4826, 1600, 1600, 2000], { h: 520 })
  ])
];

const doc = new Document({
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  styles: { default: { document: { run: { font: F, size: 21 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Lesson 1: Types of network  |  Page ", font: F, size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: SOFT })] })] }) },
    children: [header, nameRow, gap(), ...intro, gap(), ...part1, ...part2, ...part3, ...exit]
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(P.OUT + '/Lesson1_ZoomOut_Worksheet.docx', b); console.log('ok'); });
