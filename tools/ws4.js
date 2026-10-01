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
      p([t("OCR J277 1.3  |  Lesson 4", { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t("Hardware used to connect a LAN", { bold: true, size: 40, color: NAVY })], { before: 0, after: 20 }),
      p([t("Worksheet for the 360° experience: Mission: wire up the school", { size: 22, color: SOFT })], { before: 0, after: 0 })] }),
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
    p([t("2.  ", { bold: true }), t("Open Mission: wire up the school. At each numbered station, read the wall panel and fill in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the questions on screen. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your score into the yellow box straight away.")]),
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...["know the hardware needed to connect a LAN", "understand the purpose of each piece of hardware and the jobs it does"]
      .map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))
  ]), gap(),
  box(null, "Starter: before you put the headset on", COL.Y, [
    p([t("A school has one building for Years 7 to 9 and another 200 metres away for Years 10 and 11. Suggest how you would connect the two, and why.", { bold: true })], { keepNext: true }),
    ...lines(2)])];

function station(n, title, col, where, fact, chal, extra = []) {
  return [box(n, title, col, [
    p([t(where, { color: SOFT, italics: true, size: 19 })], { before: 0, keepNext: true }),
    ...keyFact(fact, 2), ...challenge(chal), ...extra]), gap()];
}

const body1 = [
  partHeader("Mission: wire up the school", "The school server room", "Stations 1 and 2: turn right. Stations 3 and 4: turn around. Station 5: look up. Station 6: turn left. Final challenge: look down."),
  gap(),
  ...station(1, "Switch", COL[1], "Turn right", "A switch connects... and sends data using...",
    "The switch in a computer room breaks. What happens to the PCs plugged into it, and why?"),
  ...station(2, "UTP cable (Cat5e / Cat6)", COL[2], "Turn right", "UTP cable is made of... The wires are twisted because...",
    "Why wouldn't you use UTP cable to link two buildings that are 2 km apart?"),
  ...station(3, "Router", COL[3], "Turn around", "A router connects... and sends packets using...",
    "The router fails but the switches still work. Can students print to the class printer? Can they load a website? Explain.", ),
  ...station(4, "Fibre optic cable", COL[4], "Turn around", "Fibre optic cable sends data as...",
    "Give two reasons why fibre optic cable is used for long distances. Was your starter answer right?", [...lines(1, "My starter answer was right / wrong because ")]),
  ...station(5, "Wireless access point (WAP)", COL[5], "Look up", "A wireless access point lets...",
    "Why does a large school need lots of WAPs rather than one powerful one?"),
  ...station(6, "Network interface card (NIC)", COL[6], "Turn left", "A NIC is... Every NIC has a unique...",
    "A desktop PC has a wired NIC but no wireless NIC. How must it connect to the school network?",
    [p([t("Copy the example MAC address from the wall: ", { bold: true })], { before: 120, keepNext: true }), ...lines(1)]),
];

const body2 = [
  box("★", "Final challenge: trace the request (look down)", COL.Y, [
    p([t("Use the floor map. A student on a laptop opens a website. ", { bold: true }), t("Before", { bold: true }), t(" you tap the star, fill in each device the request passes through, and the connection it travels along to get there.")], { keepNext: true }),
    grid(["Step", "Travels along...", "...to reach"],
      [["1", "", ""], ["2", "", ""], ["3", "", ""], ["4", "", "The internet"]], [900, (IW - 900) / 2, (IW - 900) / 2], { h: 620 }),
    p([t("Start: the laptop. Choose from: Wi-Fi, UTP cable, fibre optic cable, WAP, switch, router.", { color: SOFT, italics: true, size: 19 })])]), gap(),
  scoreBox("", 16), gap(),
  box(null, "Summary: which does what?", NAVY, [
    p([t("Complete the table from what you found in the server room.", { color: SOFT, italics: true })], { keepNext: true }),
    grid(["Hardware", "Main job", "Uses MAC addresses, IP addresses, or neither?"],
      [["Switch", "", ""], ["Router", "", ""], ["WAP", "", ""], ["NIC", "", ""]], [1900, IW - 1900 - 3000, 3000], { firstBold: true, h: 700 }),
    p([t("Compare the two transmission media:", { bold: true })], { before: 200, keepNext: true }),
    grid(["", "UTP (Cat5e / Cat6)", "Fibre optic"],
      [["Made of", "", ""], ["Data sent as", "", ""], ["Distance", "", ""], ["Affected by interference?", "", ""], ["Cost", "", ""]],
      [2600, (IW - 2600) / 2, (IW - 2600) / 2], { firstBold: true, h: 560 })]), gap(),
];

const exit = [
  box(null, "Exam practice", NAVY, [
    p([t("Take the headset off, or close the page, and answer from memory.", { color: SOFT, italics: true })], { keepNext: true }),
    p([t("a)  State the purpose of a router.  ", { bold: true }), t("[1]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(1),
    p([t("b)  Explain the difference between a switch and a router.  ", { bold: true }), t("[2]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(2),
    p([t("c)  How do you set up a LAN? Describe the hardware a small office would need and what each piece does.  ", { bold: true }), t("[6]", { color: SOFT })], { before: 120, keepNext: true }), ...lines(8)]), gap(),
  box(null, "How confident am I?", NAVY, [
    grid(["Objective", "Not yet", "Getting there", "Confident"],
      [["The hardware needed to connect a LAN", "", "", ""], ["What a switch, router, WAP and NIC each do", "", "", ""], ["The differences between UTP and fibre optic", "", "", ""]],
      [4826, 1600, 1600, 2000], { h: 560 })])
];

const doc = new Document({
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  styles: { default: { document: { run: { font: F, size: 21 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Lesson 4: Hardware used to connect a LAN  |  Page ", font: F, size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: SOFT })] })] }) },
    children: [header, nameRow, gap(), ...intro, gap(), ...body1, ...body2, ...exit]
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(P.OUT + '/Lesson4_LANHardware_Worksheet.docx', b); console.log('ok'); });
