// Turns the DPA page into a signable Word document.
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, Footer, PageNumber, VerticalAlign } = require('docx');
const W = 9638, F = "Arial", NAVY = "1C2C4A", SOFT = "5A6B85";
const t = (s, o = {}) => new TextRun({ text: s, font: F, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs, o)], spacing: { before: o.before ?? 80, after: o.after ?? 80 }, alignment: o.align });
const h1 = s => p([t(s, { bold: true, size: 32, color: NAVY })], { before: 240, after: 100 });
const h2 = s => p([t(s, { bold: true, size: 24, color: NAVY })], { before: 200, after: 60 });
const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
function grid(headers, rows, widths) {
  const cell = (s, head) => new TableCell({ verticalAlign: VerticalAlign.TOP, margins: { top: 60, bottom: 60, left: 110, right: 110 },
    shading: head ? { type: "clear", fill: "EDF1F6" } : undefined,
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "B9C4D4" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "B9C4D4" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "B9C4D4" }, right: { style: BorderStyle.SINGLE, size: 4, color: "B9C4D4" } },
    children: [p(String(s), { bold: head, size: 19, before: 0, after: 0 })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map(x => cell(x, true)) }),
      ...rows.map(r => new TableRow({ children: r.map(c => cell(c, false)) }))] });
}
function signBlock(role, party) {
  const line = s => new TableCell({ borders: { top: nb, left: nb, right: nb, bottom: { style: BorderStyle.SINGLE, size: 6, color: "8A96A8" } },
    margins: { top: 280, bottom: 60 }, children: [p(s, { size: 18, color: SOFT, before: 0, after: 0 })] });
  return [p([t(role + ": ", { bold: true }), t(party)], { before: 200 }),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [4800, 4838], borders: { insideVertical: nb, insideHorizontal: nb },
      rows: [new TableRow({ children: [line("Signature"), line("Date")] }), new TableRow({ children: [line("Name"), line("Position")] })] })];
}
const J = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const kids = [
  p([t("DATA PROCESSING AGREEMENT", { bold: true, size: 36, color: NAVY })], { align: AlignmentType.CENTER, before: 0 }),
  p([t("Made under Article 28 of the UK GDPR", { color: SOFT, size: 22 })], { align: AlignmentType.CENTER }),
  p([t("Version 1.0 · September 2026 · Revise 360 Ltd", { color: SOFT, size: 18 })], { align: AlignmentType.CENTER, after: 200 }),
  h2("Parties"),
  grid(["Party", "Details", "Role"], [
    ["(1) The Customer", "School / academy / trust: ____________________________\nAddress: ____________________________\nData protection contact: ____________________________", "Controller"],
    ["(2) Revise 360 Ltd", "Company number __________, registered in England and Wales\nAddress: ____________________________\nContact: hello@revise360.co.uk", "Processor"]], [2100, 5500, 2038]),
  p([t("Effective date: ____________________     Subscription reference: ____________________", { size: 20 })], { before: 160 }),
];
for (const sec of J.sections) {
  kids.push(h1(sec.title));
  for (const b of sec.body) {
    if (typeof b === "string") kids.push(p(b));
    else if (b.bullets) b.bullets.forEach(x => kids.push(p([t("•  ", { bold: true, color: NAVY }), t(x)], { before: 30, after: 30 })));
    else if (b.table) kids.push(grid(b.table.head, b.table.rows, b.table.widths));
  }
}
kids.push(h1("Signed for and on behalf of the parties"));
kids.push(...signBlock("The Customer", "________________________________________"));
kids.push(...signBlock("Revise 360 Ltd", "Revise 360 Ltd"));
const doc = new Document({ styles: { default: { document: { run: { font: F, size: 21 } } } },
  sections: [{ properties: { page: { margin: { top: 1000, right: 1134, bottom: 900, left: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [t("Revise 360 Ltd — Data Processing Agreement v1.0 | Page ", { size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: SOFT, font: F })] })] }) },
    children: kids }] });
Packer.toBuffer(doc).then(b => { fs.writeFileSync(J.out, b); console.log("ok", J.out); });
