/* Revision 360 in a headset.
 *
 * Not a second quiz. The questions come from js/revengine.js and the marks from
 * js/revmark.js - the same two files the page uses - and the panels are drawn by
 * the headset's own panel kit, handed over by js/vr.js. What is in this file is
 * only the arrangement: a question screen in front of the learner, a row of
 * controls under it, and nothing overlapping either. Section 2 and section 72.
 *
 * Long writing is not forced on anybody. A one-mark or two-mark written answer
 * can be typed on the adaptive keyboard the Python workspace already has. A
 * four-mark or six-mark one offers three ways through: write it here anyway,
 * write it on paper and mark it against the mark points, or save it for a
 * desktop. Section 70 and 71.
 */
(function () {
  "use strict";
  window.R360VRExt = window.R360VRExt || [];
  window.R360VRExt.push(function (kit) {
    const core = kit.core;
    if (!core.revision) return;                 // a lesson, not the revision room
    const R = core.revision, Engine = R.engine, Bank = R.bank;
    const T = kit.T, COL = kit.COL;

    /* Where the two surfaces sit, from the anchor taken when a question opens.
     * The same shape as the Python workspace: the thing being read straight
     * ahead, the controls below it, with clear air between them, because every
     * surface is drawn with depth testing off and what is in front is decided by
     * nothing but not overlapping. */
    const SEAT = { screen: { dist: 2.0, pitch: 2, yaw: 0, width: 2.6 },
                   bar:    { dist: 1.75, pitch: -30, yaw: 0, width: 1.5 } };

    const qp = kit.register(new kit.Panel(SEAT.screen.width, 1400));
    const bar = kit.register(new kit.Panel(SEAT.bar.width, 1100));
    qp.mesh.renderOrder = 22;
    bar.mesh.renderOrder = 22;

    let answer = "", held = null, phase = "ask", shownHint = false;
    let paperMode = false;

    function place() {
      kit.atAnchor(qp.mesh, SEAT.screen.dist, SEAT.screen.pitch, SEAT.screen.yaw);
      if (kbTarget) placeKeys();
      else kit.atAnchor(bar.mesh, SEAT.bar.dist, SEAT.bar.pitch, SEAT.bar.yaw);
      kit.placeMenuButton(true);
    }

    function close() {
      qp.hide(); bar.hide();
      if (kbTarget) { kbTarget = null; kit.useKeyboard(null); }
      kit.clearAnchor();
    }

    // ------------------------------------------------------------ the bar
    /* Six controls, always in the same place, never on top of the question.
     * Section 72 names them. */
    function drawBar() {
      const q = R.current;
      bar.set({ color: COL.line, blocks: [
        { row: [
          { btn: "☰ Menu", id: "menu", center: true, size: 26, onClick: menu },
          { btn: "Topics", id: "topics", center: true, size: 26, onClick: topics },
          { btn: "Progress", id: "prog", center: true, size: 26, onClick: progress }
        ] },
        { row: [
          { btn: (q && Engine.isBookmarked(q.id) ? "★ Saved" : "☆ Bookmark"),
            id: "mark", center: true, size: 26,
            state: q && Engine.isBookmarked(q.id) ? "on" : "",
            onClick: () => { if (!q) return; Engine.bookmark(q.id); drawBar(); } },
          { btn: "Recentre", id: "re", center: true, size: 26,
            onClick: () => { kit.setAnchor(true); place(); } },
          { btn: "Finish", id: "fin", center: true, size: 26, onClick: finish }
        ] }
      ] });
    }

    // ------------------------------------------------------------ a question
    function ask() {
      const q = Engine.pick();
      R.current = q; R.improving = false; R.confidence = null; R.lastResult = null;
      answer = ""; held = null; phase = "ask"; shownHint = false; paperMode = false;
      if (kbTarget) { kbTarget = null; kit.useKeyboard(null); }
      if (!q) {
        qp.set({ title: "Nothing left to ask", color: COL.edge, blocks: [
          { p: "There are no more questions in the topics you have chosen that you have "
             + "not just seen.", size: 30 },
          { row: [{ btn: "Choose topics", id: "t", center: true, onClick: topics },
                  { btn: "Finish session", id: "f", center: true, primary: true, onClick: finish }] }
        ] });
        place(); drawBar();
        return;
      }
      Engine.state.current = { id: q.id }; Engine.save();
      paint();
    }

    function meta(q) {
      return q.topic + " " + Bank.title(q.topic) + "  ·  " + (R.KIND[q.type] || q.type)
           + (q.commandWord ? "  ·  " + q.commandWord.toUpperCase() : "")
           + (q.examStyle ? "  ·  exam style" : "")
           + "  ·  " + q.marks + (q.marks === 1 ? " mark" : " marks");
    }

    function paint() {
      const q = R.current;
      if (!q) return;
      const blocks = [{ p: meta(q), size: 24, color: COL.soft }, { p: q.q, size: 34, bold: true }];
      if (q.code) blocks.push({ code: q.code, size: 24 });
      BODY[q.type] ? BODY[q.type](q, blocks) : blocks.push({ p: "This question cannot be shown in the headset yet.", size: 28, color: COL.bad });
      if (q.hint) blocks.push(shownHint ? { p: "Hint: " + q.hint, size: 26, color: COL.edge }
        : { btn: "Hint", id: "hint", center: true, size: 26,
            onClick: () => { shownHint = true; paint(); } });
      qp.set({ title: Engine.MODES[Engine.state.mode].label, color: COL.edge,
               onClose: null, blocks: blocks });
      if (!kbTarget) drawBar();
      place();
    }

    function chosenRow(q, picked, onPick) {
      return q.options.map((o, i) => ({
        btn: o, id: "o" + i, size: 27, state: picked === i ? "on" : "",
        onClick: () => onPick(i)
      }));
    }

    const BODY = {
      mcq(q, b) {
        held = held || { i: null };
        q.options.forEach((o, i) => b.push({ btn: o, id: "o" + i, size: 27,
          state: held.i === i ? "on" : "",
          onClick: () => { held.i = i; paint(); } }));
        b.push({ btn: "Check my answer", id: "go", primary: true,
                 disabled: held.i === null, onClick: () => submit(q.options[held.i]) });
      },
      tf(q, b) { BODY.mcq(q, b); },
      multi(q, b) {
        held = held || { on: {} };
        q.options.forEach((o, i) => b.push({ btn: o, id: "m" + i, size: 27,
          state: held.on[i] ? "on" : "",
          onClick: () => { held.on[i] = !held.on[i]; paint(); } }));
        b.push({ btn: "Check my answer", id: "go", primary: true,
                 disabled: !Object.keys(held.on).some(k => held.on[k]),
                 onClick: () => submit(q.options.filter((_, i) => held.on[i])) });
      },
      match(q, b) {
        held = held || { pairs: {}, sel: 0, rights: core.shuffle(q.pairs.map(p => p[1])) };
        b.push({ p: "Choose an item, then choose what it matches.", size: 24, color: COL.soft });
        q.pairs.forEach((p, i) => b.push({
          btn: p[0] + (held.pairs[i] ? "  →  " + held.pairs[i] : ""), id: "l" + i, size: 26,
          state: held.sel === i ? "on" : "",
          onClick: () => { held.sel = i; paint(); } }));
        for (let i = 0; i < held.rights.length; i += 2)
          b.push({ row: held.rights.slice(i, i + 2).map(rt => ({
            btn: rt, id: "r" + rt, center: true, size: 25,
            onClick: () => {
              held.pairs[held.sel] = rt;
              const nx = q.pairs.findIndex((_, j) => !held.pairs[j]);
              held.sel = nx >= 0 ? nx : held.sel;
              paint();
            } })) });
        b.push({ btn: "Check my answers", id: "go", primary: true,
                 disabled: Object.keys(held.pairs).length < q.pairs.length,
                 onClick: () => submit(held.pairs) });
      },
      order(q, b) {
        held = held || { pool: core.shuffle(q.steps.slice()), seq: [] };
        q.steps.forEach((_, i) => b.push({
          p: (i + 1) + ".  " + (held.seq[i] || "…"), size: 26,
          color: held.seq[i] ? COL.fg : COL.soft }));
        held.pool.filter(p => held.seq.indexOf(p) < 0).forEach((p, i) => b.push({
          btn: p, id: "p" + i, size: 25, onClick: () => { held.seq.push(p); paint(); } }));
        b.push({ row: [
          { btn: "Start again", id: "rs", center: true, disabled: !held.seq.length,
            onClick: () => { held.seq = []; paint(); } },
          { btn: "Check my order", id: "go", center: true, primary: true,
            disabled: held.seq.length < q.steps.length,
            onClick: () => submit(held.seq) }] });
      },
      sort(q, b) {
        held = held || { pick: {} };
        q.items.forEach((it, i) => {
          b.push({ p: it[0], size: 26 });
          b.push({ row: q.cats.map(c => ({ btn: c, id: "s" + i + c, center: true, size: 24,
            state: held.pick[i] === c ? "on" : "",
            onClick: () => { held.pick[i] = c; paint(); } })) });
        });
        b.push({ btn: "Check my answers", id: "go", primary: true,
                 disabled: Object.keys(held.pick).length < q.items.length,
                 onClick: () => submit(held.pick) });
      },
      short(q, b) { writing(q, b); },
      written(q, b) { writing(q, b); },
      extended(q, b) { writing(q, b); },
      num(q, b) { typed(q, b); },
      convert(q, b) { typed(q, b); },
      binadd(q, b) { typed(q, b); },
      binshift(q, b) { typed(q, b); },
      codeout(q, b) { typed(q, b); },
      truth(q, b) { gridBody(q, b); },
      trace(q, b) { gridBody(q, b); }
    };

    /* Writing in a headset. A short answer is typed here; a long one is offered
     * three ways and none of them is "type six marks on a virtual keyboard".
     * Section 70. */
    function writing(q, b) {
      const long = q.marks >= 4 || q.type === "extended";
      if (long && !paperMode && !held) {
        b.push({ p: "This is a " + q.marks + "-mark written answer. Typing that in a headset is "
                  + "slow, so choose how you would like to do it.", size: 27 });
        b.push({ btn: "Answer in VR anyway", id: "inVR", center: true,
                 onClick: () => { held = { typing: true }; paint(); } });
        b.push({ btn: "Answer on paper, then mark it here", id: "paper", center: true,
                 onClick: () => { paperMode = true; held = { typing: false }; paint(); } });
        b.push({ btn: "Save it for a desktop", id: "later", center: true,
                 onClick: () => {
                   Engine.bookmark(q.id, true);
                   kit.toast("Bookmarked. Open Revision 360 on a computer and it will be "
                           + "waiting under My bookmarks.");
                   ask();
                 } });
        return;
      }
      if (paperMode) {
        b.push({ p: "Write your answer on paper, then mark it against the mark points.",
                 size: 28 });
        b.push({ btn: "I have written it", id: "go", primary: true,
                 onClick: () => selfReview(q) });
        return;
      }
      b.push({ p: answer || "…", size: 28, mono: false,
               color: answer ? COL.fg : COL.soft });
      b.push({ row: [
        { btn: kbTarget ? "Hide keyboard" : "Keyboard", id: "kb", center: true,
          state: kbTarget ? "on" : "", onClick: () => openKeys(q) },
        { btn: "Clear", id: "cl", center: true, disabled: !answer,
          onClick: () => { answer = ""; if (kbTarget) { kbTarget.text = ""; kbTarget.caret = 0; } paint(); } },
        { btn: "Check my answer", id: "go", center: true, primary: true,
          disabled: !answer.trim(), onClick: () => { if (kbTarget) closeKeys(); submit(answer); } }] });
    }

    function typed(q, b) {
      b.push({ p: answer || "…", size: 34, mono: true,
               color: answer ? COL.fg : COL.soft });
      b.push({ row: [
        { btn: kbTarget ? "Hide keyboard" : "Keyboard", id: "kb", center: true,
          state: kbTarget ? "on" : "", onClick: () => openKeys(q) },
        { btn: "Clear", id: "cl", center: true, disabled: !answer,
          onClick: () => { answer = ""; if (kbTarget) { kbTarget.text = ""; kbTarget.caret = 0; } paint(); } },
        { btn: "Check", id: "go", center: true, primary: true,
          disabled: !answer.trim(), onClick: () => { if (kbTarget) closeKeys(); submit(answer); } }] });
    }

    /* A grid in a headset is answered a cell at a time: the cell is chosen, then
     * typed. A table of input boxes is not something a controller can use. */
    function gridBody(q, b) {
      held = held || { cells: {}, at: null };
      const blanks = [];
      q.rows.forEach((row, r) => row.forEach((cell, c) => { if (cell === "") blanks.push([r, c]); }));
      q.rows.forEach((row, r) => {
        b.push({ p: row.map((cell, c) => q.cols[c] + " " +
          (cell !== "" ? cell : (held.cells[r + "," + c] || "·"))).join("   "),
          size: 26, mono: true });
      });
      b.push({ p: "Choose a cell, then type it.", size: 24, color: COL.soft });
      for (let i = 0; i < blanks.length; i += 3)
        b.push({ row: blanks.slice(i, i + 3).map(([r, c]) => ({
          btn: q.cols[c] + " " + (r + 1), id: "c" + r + "_" + c, center: true, size: 24,
          state: held.at === r + "," + c ? "on" : "",
          onClick: () => { held.at = r + "," + c; answer = held.cells[held.at] || "";
                           if (kbTarget) { kbTarget.text = answer; kbTarget.caret = answer.length; }
                           else openKeys(q); paint(); } })) });
      b.push({ btn: "Check my answers", id: "go", primary: true,
               disabled: Object.keys(held.cells).length < blanks.length,
               onClick: () => submit(held.cells) });
    }

    /* The adaptive keyboard the Python workspace uses, borrowed rather than
     * copied: js/vr.js lends it anything with text, a caret and a shift key, so
     * the arrow keys, backspace and the symbol set that follows the question all
     * come with it. A revision question names the symbols it needs the same way
     * a Python task does, and most of them need none, so the keyboard a learner
     * gets for a written answer is letters and a full stop. */
    let kbTarget = null;
    function openKeys(q) {
      if (kbTarget) return closeKeys();
      kbTarget = kit.useKeyboard({
        task: { vrKeys: q.vrKeys || keysFor(q) },
        text: answer, caret: answer.length, shift: false, allKeys: false,
        changed() {
          answer = kbTarget.text;
          if (held && held.at) held.cells[held.at] = answer;
          paint();
        }
      });
      placeKeys();
    }
    function closeKeys() {
      kbTarget = null; kit.useKeyboard(null); paint();
    }
    /* What a revision question needs on the keyboard. A written answer is
     * letters and ordinary punctuation; a conversion is digits and the letters
     * for hexadecimal; a calculation is digits and a decimal point. Nothing is
     * ever locked away - `More symbols` is on the keyboard whatever this says. */
    function keysFor(q) {
      if (q.type === "convert" || q.type === "binadd" || q.type === "binshift")
        return "0123456789".split("");
      if (q.type === "num") return "0123456789".split("").concat([".", "%", "/"]);
      if (q.type === "truth" || q.type === "trace") return "0123456789".split("").concat(['"', "'"]);
      if (q.type === "codeout") return null;        // output can contain anything
      return [".", ",", "'"];
    }
    /* The keyboard is placed by its top edge, clear of the question above it,
     * the way the Python one is - and the control bar is put away while it is
     * open, because they want the same piece of air. */
    function placeKeys() {
      bar.hide();
      const kh = kit.kbPanel.mesh.scale.y || 0.6;
      const mid = kit.SEAT.keys.top
                - T.MathUtils.radToDeg(Math.atan2(kh / 2, kit.SEAT.keys.dist));
      kit.atAnchor(kit.kbPanel.mesh, kit.SEAT.keys.dist, mid, 0);
    }

    // ------------------------------------------------------------ marking
    function submit(resp) {
      const q = R.current;
      if (q.type === "extended") { selfReview(q); return; }
      const res = Engine.submit(q, resp, { confidence: R.confidence, improve: R.improving });
      R.lastResult = res; phase = "marked";
      showMark(q, res);
    }

    function showMark(q, res) {
      const blocks = [
        { p: meta(q), size: 22, color: COL.soft },
        { big: res.got + " / " + res.max },
        { p: res.full ? "Full marks." : res.got ? "Part marks." : "No marks this time.",
          size: 30, align: "center", color: res.full ? COL.ok : res.got ? COL.edge : COL.bad }
      ];
      if (res.capped) blocks.push({ p: res.capped, size: 25, color: COL.edge });
      (res.detail || []).forEach(d => blocks.push({
        p: (d.met ? "✓  " : "○  ") + d.concept, size: 26,
        color: d.met ? COL.ok : COL.soft }));
      if (!res.detail && res.missed && res.missed.length && !res.full)
        res.missed.forEach(m => blocks.push({ p: "○  " + m, size: 26, color: COL.soft }));
      if (q.feedback) blocks.push({ p: q.feedback, size: 26 });
      if (res.isImprovement && res.first)
        blocks.push({ p: "First attempt " + res.first.got + " / " + res.first.max
                       + "  ·  improved " + res.bestSoFar.got + " / " + res.bestSoFar.max
                       + (res.recovered ? "  ·  " + res.recovered + " recovered" : ""),
                      size: 26, color: COL.edge });
      const rev = Bank.revisit(q);
      if (!res.full && rev)
        blocks.push({ p: "Revise this: " + rev.label, size: 26, color: COL.info });

      const row = [];
      if (res.canImprove && !R.improving)
        row.push({ btn: "Improve my answer", id: "imp", center: true, primary: true,
                   onClick: () => improve(q) });
      if (!res.full && q.example && (R.improving || !res.canImprove))
        row.push({ btn: "Example answer", id: "ex", center: true,
                   onClick: () => {
                     blocks.push({ p: "Example full-mark response: " + q.example, size: 25,
                                   color: COL.edge });
                     qp.set({ title: "Marked", color: COL.edge, blocks: blocks });
                     place();
                   } });
      row.push({ btn: Engine.finished() ? "See how you did" : "Next question", id: "nx",
                 center: true, primary: !row.length,
                 onClick: () => (Engine.finished() ? finish() : ask()) });
      blocks.push({ row: row });
      qp.set({ title: "Marked", color: res.full ? COL.ok : COL.edge, blocks: blocks });
      place(); drawBar();
    }

    function improve(q) {
      R.improving = true; answer = ""; held = null; phase = "ask"; paperMode = false;
      const was = R.lastResult;
      paint();
      const spec = qp.spec;
      spec.blocks.unshift({ p: "First attempt " + was.got + " / " + was.max
                             + ". Write it again using the feedback.", size: 26, color: COL.edge });
      (was.detail || []).slice().reverse().forEach(d => spec.blocks.splice(1, 0, {
        p: (d.met ? "✓  " : "○  ") + d.concept, size: 24,
        color: d.met ? COL.ok : COL.soft }));
      qp.set(spec); place();
    }

    function selfReview(q) {
      const pts = q.markPoints || [];
      const ticked = {};
      const draw = () => {
        const blocks = [
          { p: q.q, size: 30, bold: true },
          { p: "Mark your own answer against these. This mark is recorded as self-reviewed, "
             + "and it is only worth anything if it is true.", size: 25, color: COL.soft }];
        pts.forEach((p, i) => blocks.push({
          btn: (ticked[i] ? "✓  " : "○  ") + p.concept, id: "p" + i, size: 25,
          state: ticked[i] ? "on" : "",
          onClick: () => { ticked[i] = !ticked[i]; draw(); } }));
        blocks.push({ btn: "Record my mark", id: "go", primary: true, onClick: () => {
          const res = Engine.selfReview(q, pts.filter((_, i) => ticked[i]).map(p => p.concept),
                                        { confidence: R.confidence });
          R.lastResult = res;
          showMark(q, res);
        } });
        qp.set({ title: "Mark your own answer", color: COL.info, blocks: blocks });
        place();
      };
      draw();
    }

    // ------------------------------------------------------------ panels
    function menu() {
      const s = Engine.session();
      kit.menuPanel.set({ title: "Revision 360", color: COL.edge,
        onClose: () => kit.menuPanel.hide(), blocks: [
          { p: core.student.name + " · " + core.student.cls, size: 26, color: COL.soft },
          { p: s.firstGot + " / " + s.avail + " marks this session", size: 32, bold: true },
          { p: Engine.MODES[Engine.state.mode].label + " · "
             + Engine.topics().length + " topic(s)", size: 26, color: COL.soft },
          { row: [{ btn: "Topics", id: "t", center: true, onClick: topics },
                  { btn: "Progress", id: "p", center: true, onClick: progress }] },
          { row: [{ btn: "Finish session", id: "f", center: true, onClick: finish },
                  { btn: "Leave VR", id: "x", center: true, onClick: kit.exitVR }] },
          { p: "Revise 360 stores what you answered and what it was worth. It does not "
             + "record where you looked.", size: 22, color: COL.soft }
        ] });
      kit.placeInFront(kit.menuPanel, 1.5, Math.max(-20, Math.min(10, kit.gazePitch())));
    }

    function topics() {
      const chosen = Engine.topics();
      const rows = [];
      const all = Bank.manifest.topics;
      for (let i = 0; i < all.length; i += 2)
        rows.push({ row: all.slice(i, i + 2).map(t => ({
          btn: t.topic + " " + t.title, id: "t" + t.topic, center: true, size: 23,
          state: chosen.indexOf(t.topic) >= 0 ? "on" : "",
          onClick: async () => { Engine.toggleTopic(t.topic); await Engine.refresh(); topics(); }
        })) });
      kit.menuPanel.set({ title: "Topics", color: COL.edge,
        onClose: () => kit.menuPanel.hide(), blocks: [
          { row: [
            { btn: "All", id: "all", center: true,
              onClick: async () => { Engine.setTopics(Bank.topics()); await Engine.refresh(); topics(); } },
            { btn: "Paper 1", id: "p1", center: true,
              onClick: async () => { Engine.setPaper(1); await Engine.refresh(); topics(); } },
            { btn: "Paper 2", id: "p2", center: true,
              onClick: async () => { Engine.setPaper(2); await Engine.refresh(); topics(); } }] }
        ].concat(rows).concat([
          { p: "Changing your topics does not lose your marks or your session.", size: 22,
            color: COL.soft },
          { btn: "Done", id: "done", primary: true, center: true,
            onClick: () => { kit.menuPanel.hide(); if (!R.current) ask(); } }
        ]) });
      kit.placeInFront(kit.menuPanel, 1.5, Math.max(-20, Math.min(10, kit.gazePitch())));
    }

    function progress() {
      const o = Engine.overview();
      const blocks = [
        { p: o.firstGot + " / " + o.firstAvail + " first-attempt marks", size: 32, bold: true },
        { p: o.recovered + " marks recovered · " + o.questions + " questions attempted",
          size: 26, color: COL.soft }];
      o.byTopic.forEach(t => blocks.push({ kv: [t.topic + " " + t.title,
        t.got + "/" + t.avail, [Store.band(t.got, t.avail), ""]] }));
      if (o.queue.length) {
        blocks.push({ p: "What to revise next", size: 28, bold: true, color: COL.edge });
        o.queue.forEach(x => blocks.push({ p: x.concept + "  ·  " + x.lost + " marks lost"
          + (x.station ? "\n" + x.station.label : ""), size: 24 }));
      }
      blocks.push({ p: "Revise 360 does not turn this into a predicted grade.", size: 22,
                    color: COL.soft });
      blocks.push({ btn: "Close", id: "c", center: true,
                    onClick: () => kit.menuPanel.hide() });
      kit.menuPanel.set({ title: "My revision", color: COL.edge,
                          onClose: () => kit.menuPanel.hide(), blocks: blocks });
      kit.placeInFront(kit.menuPanel, 1.5, Math.max(-20, Math.min(10, kit.gazePitch())));
    }

    function finish() {
      const s = Engine.endSession();
      kit.menuPanel.hide();
      if (!s) { kit.toast("Nothing answered yet."); return; }
      const row = s.row;
      const blocks = [
        { big: row.got + " / " + row.avail },
        { p: "first-attempt marks", size: 26, align: "center", color: COL.soft },
        { kv: ["Questions", String(row.questions)] },
        { kv: ["Best marks", row.best + " / " + row.avail] },
        { kv: ["Marks recovered", String(row.recovered)] },
        { kv: ["Topics revised", String(row.topics.length)] }];
      if (row.examAvail) blocks.push({ kv: ["Exam style", row.examGot + " / " + row.examAvail] });
      if (s.toRecover.length) {
        blocks.push({ p: "What to revise next", size: 28, bold: true, color: COL.edge });
        s.toRecover.forEach((x, i) => blocks.push({
          p: (i + 1) + ". " + x.concept + " — " + x.lost + " marks lost"
           + (x.station ? "\n" + x.station.label : ""), size: 24 }));
      }
      blocks.push({ p: "This is what you scored on these questions. It is not a grade.",
                    size: 22, color: COL.soft });
      blocks.push({ row: [
        { btn: "Keep revising", id: "again", center: true,
          onClick: () => { Engine.startSession(); ask(); } },
        { btn: "Leave VR", id: "x", center: true, primary: true, onClick: kit.exitVR }] });
      qp.set({ title: "Revision session complete", color: COL.ok, blocks: blocks });
      place(); drawBar();
    }

    // ------------------------------------------------------------ in and out
    kit.onMenu(menu);
    core.frameHooks.push(() => {
      // Nothing to animate; the panels only redraw when something is pressed.
    });
    const was = core.sceneHooks;
    was.push(() => { if (!core.inVR) close(); });

    /* When the headset session starts, put the learner in front of a question.
     * The page may already be showing one: the same one is carried over, because
     * the engine is the same and the question is in it. */
    const openWhenReady = () => {
      if (!core.inVR) return;
      kit.setAnchor(true);
      if (R.current) { answer = ""; held = null; paint(); } else ask();
    };
    let wasIn = false;
    core.frameHooks.push(() => {
      if (core.inVR && !wasIn) { wasIn = true; setTimeout(openWhenReady, 400); }
      if (!core.inVR && wasIn) { wasIn = false; close(); }
    });

    /* Where each surface sits, in degrees from the anchor, measured off the
     * meshes by js/vr.js. Section 72 says the question screen, the controls and
     * the keyboard may not overlap, and tools/tests/smokeviserbounds.py checks
     * that against this rather than working the geometry out a second time. Only
     * what is actually showing is reported: the bar is put away while the
     * keyboard is up, and a surface that is hidden covers nothing. */
    function reviseBounds() {
      return kit.boundsFor([["question", qp.mesh], ["controls", bar.mesh],
                            ["keyboard", kit.kbPanel.mesh],
                            ["menu", kit.menuBtn.mesh]]);
    }

    window.NVRReviseVR = { ask, paint, submit, finish, menu, topics, progress,
                           qp, bar, SEAT, place, reviseBounds,
                           get kbTarget() { return kbTarget; },
                           get answer() { return answer; },
                           set answer(x) { answer = x; },
                           get held() { return held; } };
  });
})();
