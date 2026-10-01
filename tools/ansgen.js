// Builds the teacher answer sheet for a lesson, from the same spec the worksheet is built from.
const P = require("./paths.js");
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, Footer, PageNumber, VerticalAlign } = require('docx');

const W = 10466;
const NAVY = "1C2C4A", YEL = "C99A00", SOFT = "5A6B85", GREEN = "2FAE72", RED = "D64545";
const COL = { 1: "1E9BD7", 2: "8A55C9", 3: "E0603F", 4: "E08A10", 5: "2FAE72", 6: "D6408E" };
const F = "Arial";
const t = (text, o = {}) => new TextRun({ text, font: F, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs, o)], spacing: { before: o.before ?? 60, after: o.after ?? 60 }, alignment: o.align, keepNext: o.keepNext });
const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: nb, bottom: nb, left: nb, right: nb, insideHorizontal: nb, insideVertical: nb };
const gap = () => new Paragraph({ children: [], spacing: { before: 0, after: 120 } });
const bullet = (s, o = {}) => p([t("•  ", { color: o.color || YEL, bold: true }), t(s, o)], { before: 20, after: 20 });

function box(num, title, colour, children) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({ width: { size: W, type: WidthType.DXA },
      borders: { left: { style: BorderStyle.SINGLE, size: 36, color: colour }, top: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" }, right: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" } },
      margins: { top: 100, bottom: 140, left: 200, right: 200 },
      children: [p([t(num ? `${num}   ` : "", { bold: true, color: colour, size: 26 }), t(title, { bold: true, color: colour, size: 26 })], { before: 0, keepNext: true }), ...children] })] })] });
}
function grid(headers, rows, widths) {
  const cell = (s, o = {}) => new TableCell({ width: { size: o.w, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
    shading: o.head ? { type: "clear", fill: "EDF1F6" } : undefined, margins: { top: 60, bottom: 60, left: 120, right: 120 },
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" }, right: { style: BorderStyle.SINGLE, size: 4, color: "C9D2DE" } },
    children: [p(String(s), { bold: o.head, size: 20, before: 0, after: 0 })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { head: true, w: widths[i] })) }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { w: widths[i] })) }))] });
}
function header(S) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W - 1800, 1800], borders: noBorders,
    rows: [new TableRow({ children: [
      new TableCell({ borders: noBorders, children: [
        p([t(S.topicLabel + "   |   Lesson " + S.lesson, { color: YEL, bold: true, size: 19 })], { after: 0 }),
        p([t("ANSWERS: " + S.title, { bold: true, size: 34, color: NAVY })], { before: 20, after: 0 }),
        p([t("Teacher copy — model answers and marking notes for the 360° experience: " + S.expName, { color: SOFT, size: 19 })], { before: 20 })] }),
      new TableCell({ borders: noBorders, verticalAlign: VerticalAlign.TOP, children: [p([t("Revise 360", { bold: true, color: NAVY, size: 26 })], { align: AlignmentType.RIGHT })] })] })] });
}

function build(S) {
  const kids = [header(S), gap()];

  kids.push(box(null, "How to mark this sheet", NAVY, [
    bullet("Award a mark for each correct point, up to the marks shown. The answers here are indicative: accept any equivalent wording that makes the same point."),
    bullet("For 'state' and 'name' questions, one correct term is enough; don't insist on a full sentence."),
    bullet("For 'describe', expect the point plus a detail. For 'explain', expect the point plus a consequence: 'so that…', 'which means…'."),
    bullet("Where a question says 'using an example', the example carries a mark of its own."),
    bullet("Calculations: award method marks for the formula and the substitution even when the final number is wrong. A missing or wrong unit normally loses one mark, not the answer."),
    bullet("Don't award a mark twice for the same point said in two ways.", { color: RED }),
    bullet("The station answers below are what students should have written before tapping the badge. The experience marks its own questions; this sheet lets you check the written work.", { color: SOFT })]), gap());

  if (S.starterAnswer) kids.push(box(null, "Starter", COL[1], [
    p([t("Question: ", { bold: true }), t(S.starter, { italics: true })]),
    p([t("Looking for: ", { bold: true, color: GREEN })]), ...S.starterAnswer.map(a => bullet(a)),
    p([t("Teacher note: ", { bold: true, color: SOFT }), t(S.starterNote || "This is a discussion starter, not an assessed question. Take two or three answers, then leave it unresolved: the experience settles it.", { color: SOFT, italics: true })])]), gap());

  S.stations.forEach((st, i) => {
    kids.push(box(i + 1, st.name, COL[(i % 6) + 1], [
      p([t("Key fact — accept any of:", { bold: true, color: GREEN })], { keepNext: true }),
      ...st.facts.map(f => bullet(f)),
      st.challenge ? p([t("Challenge: ", { bold: true, color: YEL }), t(st.challenge, { italics: true })], { before: 120 }) : null,
      ...(st.challengeAnswer || []).map(a => bullet(a, { color: GREEN })),
      st.questions.length ? p([t("Answers in the experience:", { bold: true, color: SOFT })], { before: 120 }) : null,
      ...st.questions.map(q => p([t("Q: ", { color: SOFT }), t(q.q + "  "), t("→  " + q.a, { bold: true, color: GREEN })], { before: 20, after: 20 })),
      st.note ? p([t("Watch for: ", { bold: true, color: RED }), t(st.note, { italics: true })], { before: 100 }) : null
    ].filter(Boolean)), gap());
  });

  if (S.final) kids.push(box("★", S.final.name, YEL, [
    ...S.final.questions.map(q => p([t("Q: ", { color: SOFT }), t(q.q + "  "), t("→  " + q.a, { bold: true, color: GREEN })], { before: 20, after: 20 })),
    S.final.note ? p([t("Watch for: ", { bold: true, color: RED }), t(S.final.note, { italics: true })], { before: 100 }) : null].filter(Boolean)), gap());

  if (S.exam && S.exam.length) kids.push(box(null, "Exam practice: mark scheme", COL[3], [
    ...S.exam.flatMap((e, i) => [
      p([t(String.fromCharCode(97 + i) + ")  " + e.q + "  ", { bold: true }), t("[" + e.marks + "]", { color: SOFT })], { before: 140, keepNext: true }),
      ...e.points.map(pt => bullet(pt, { color: GREEN })),
      e.note ? p([t("Marking note: ", { bold: true, color: SOFT }), t(e.note, { italics: true, color: SOFT })], { before: 40 }) : null].filter(Boolean))]), gap());

  if (S.common && S.common.length) kids.push(box(null, "Common mistakes in this lesson", RED, S.common.map(c => bullet(c, { color: RED }))), gap());

  if (S.scoreGuide) kids.push(box(null, "Reading the students' scores", COL[5], [
    p("The experience marks itself and shows a breakdown by station:"),
    grid(["Band", "What it means", "What to do next"], [
      ["Secure (80%+)", "The content is known well enough to recall under pressure", "Move on; use review mode as a starter later"],
      ["Revise (50–79%)", "Mostly understood, with gaps in detail", "Set the matching worksheet exam practice again"],
      ["Focus here (<50%)", "The station was not understood", "Reteach that station's content before the assessment"]],
      [1800, 4400, W - 6200]),
    p([t("The station breakdown is more useful than the total: it names exactly which idea to reteach.", { color: SOFT, italics: true })], { before: 100 })]), gap());

  const doc = new Document({ styles: { default: { document: { run: { font: F, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 560, left: 720 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [t(S.footer + "  —  teacher answers  |  Page ", { size: 16, color: SOFT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: SOFT, font: F })] })] }) },
      children: kids }] });
  Packer.toBuffer(doc).then(b => { fs.writeFileSync(S.out, b); console.log("ok", S.out); });
}
build(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
