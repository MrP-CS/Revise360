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
      p([t("OCR J277 1.3  |  Lesson 7", { color: SOFT, size: 20, bold: true })], { before: 0, after: 20 }),
      p([t("Catch-up and revision: Revision HQ", { bold: true, size: 40, color: NAVY })], { before: 0, after: 20 }),
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
    p([t("1.  ", { bold: true }), t("Open Revision HQ. Each numbered station sums up one lesson from 1 to 6.")]),
    p([t("2.  ", { bold: true }), t("At each station, write three key facts and answer the challenge in its box on this sheet "), t("before", { bold: true }), t(" you tap the badge.")]),
    p([t("3.  ", { bold: true }), t("Tap the badge and answer the quiz. Your first answer is the one that counts.")]),
    p([t("4.  ", { bold: true }), t("When the score screen appears, copy your results into section B straight away. Refreshing the page loses them.")]),
    p([t("5.  ", { bold: true }), t("Use your results to choose what to catch up on and revise in section C.")]),
    p([t("By the end of the lesson I will:", { bold: true, color: NAVY })], { before: 160 }),
    ...["know which lessons I am secure on and which I need to revise", "have completed any outstanding work from lessons 1 to 6",
      "be ready for my mid-topic test next lesson"]
      .map(o => p([t(o)], { numbering: { reference: "b", level: 0 }, before: 20, after: 20 }))
  ])];

function rev(n, title, col, chal, extra = []) {
  return [box(n, title, col, [
    p([t("Three key facts in your own words:", { bold: true, color: SOFT })], { keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. "),
    ...challenge(chal), ...extra]), gap()];
}

const secA = [
  partHeader("Section A", "Revision stations", "Lessons 1 and 2: turn right. Lessons 3 and 4: turn around. Lessons 5 and 6: turn left. Final challenge: look down."),
  gap(),
  ...rev(1, "Lesson 1: Types of network", COL[1], "What are the characteristics of LANs and WANs?"),
  ...rev(2, "Lesson 2: Network performance", COL[2], "The school wants to add more CCTV cameras that record video to the file server. What should the network manager consider?", ),
  ...rev(3, "Lesson 3: Client-server and peer-to-peer", COL[3], "Is torrenting an example of client-server or peer-to-peer? Explain."),
  ...rev(4, "Lesson 4: LAN hardware", COL[4], "What is the difference between a switch and a router?"),
  ...rev(5, "Lesson 5: The internet", COL[5], "What is the advantage of working in the cloud, compared with installing programs and saving files locally?"),
  ...rev(6, "Lesson 6: Star and mesh", COL[6], "Why is a mesh network more reliable than a star network?"),
  box("★", "Final challenge: how does a browser find a website?", COL.Y, [
    p([t("Before", { bold: true }), t(" you tap the star, write the five steps in order, from typing www.google.com to seeing the page.")], { keepNext: true }),
    ...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. "), ...lines(1, "4. "), ...lines(1, "5. ")]), gap(),
];

const secB = [
  new Paragraph({ children: [new PageBreak()] }),
  partHeader("Section B", "My results", "Copy these from the score screen. Secure = full marks. Revise = mostly right. Focus here = revise this first."),
  gap(),
  grid(["Station", "Score", "Secure / Revise / Focus here", "What I will do about it"],
    [["Lesson 1: Types of network", "    / 3", "", ""], ["Lesson 2: Network performance", "    / 3", "", ""],
     ["Lesson 3: Client-server and P2P", "    / 3", "", ""], ["Lesson 4: LAN hardware", "    / 3", "", ""],
     ["Lesson 5: The internet", "    / 3", "", ""], ["Lesson 6: Star and mesh", "    / 3", "", ""],
     ["Final challenge: DNS", "    / 5", "", ""], ["Total", "    / 23", "", ""]],
    [3300, 1100, 2400, W - 3300 - 1100 - 2400], { firstBold: true, h: 620 }),
  gap(),
  box(null, "My top three things to revise before the test", NAVY, [...lines(1, "1. "), ...lines(1, "2. "), ...lines(1, "3. ")]), gap(),
];

const tasks = [
  ["1", "Zoom out worksheet: LAN and WAN bullet points, and advantages and disadvantages of networks"],
  ["2", "Network control room worksheet: how the five factors affect performance"],
  ["3", "Network showdown worksheet: label the client-server and peer-to-peer diagrams, and sort the statements"],
  ["4", "Wire up the school worksheet: switch, router, WAP, NIC, UTP and fibre"],
  ["5", "Inside the internet worksheet: the internet, DNS, hosting and the cloud, and the DNS steps"],
  ["6", "Star and mesh worksheet: draw both topologies, and their advantages and disadvantages"],
];
const secC = [
  new Paragraph({ children: [new PageBreak()] }),
  partHeader("Section C", "Catch-up checklist", "Tick each task once it is complete. Start with any lesson you marked Focus here."),
  gap(),
  grid(["Lesson", "Task", "Done ✓"], tasks.map(r => [r[0], r[1], ""]), [1100, IW + 440 - 1100 - 1200, 1200], { h: 520 }),
  gap(),
  box(null, "Revisit an experience", COL[2], [
    p([t("Pick the lesson you marked "), t("Focus here", { bold: true }), t(" and reopen that experience. Use review mode to retry the questions you got wrong, then answer its challenge questions again from memory.")]),
    p([t("Experience I revisited: __________________________     Questions I retried: ______")], { line: 400 })]), gap(),
  box(null, "Test-ready answer", NAVY, [
    p([t("How does the internet work? Use the terms WAN, router, DNS and web server.  ", { bold: true }), t("[4]", { color: SOFT })], { keepNext: true }),
    ...lines(6)]),
];

const doc = new Document({
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  styles: { default: { document: { run: { font: F, size: 21 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Lesson 7: Catch-up and revision  |  Page ", font: F, size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: SOFT })] })] }) },
    children: [header, nameRow, gap(), ...intro, gap(), ...secA, ...secB, ...secC]
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(P.OUT + '/Lesson7_RevisionHQ_Worksheet.docx', b); console.log('ok'); });
