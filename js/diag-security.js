/* Revise 360 - network attacks, defences and the life of a device.
 *
 * Five diagrams for OCR J277 1.4 (ns-l03, ns-l06, ns-l07, ns-l09) and 1.6
 * (el-l05). Engine and drawing helper: js/diagrams.js. House style: the `fde`
 * diagram in js/diagrams-set.js.
 *
 * These are defensive. Each one shows the shape of a weakness and the thing
 * that closes it; none of them is a procedure that would work against a real
 * system.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  /* Draw a run of coloured text segments on one baseline. Each segment is
   * { t, f } and gets its measured x and width written back, so a later pass
   * can underline or highlight one part of the line. */
  function run(d, x0, y0, segs, size) {
    let cx = x0;
    for (const g of segs) {
      g.x = cx; g.w = d.measure(g.t, size, 700);
      cx += g.w;
    }
    for (const g of segs) {
      if (g.t) d.text(g.x, y0, g.t, { size, weight: 700, fill: g.f,
                                      baseline: "middle", alpha: g.a });
    }
    return cx - x0;
  }
  function runWidth(d, segs, size) {
    let w = 0;
    for (const g of segs) w += d.measure(g.t, size, 700);
    return w;
  }

  // ------------------------------------------------------------------ 1.4.1
  /* SQL injection. The teaching point is the join: the site glues typed text
   * into the middle of a command, so text can become command. Shown with one
   * generic always-true comparison and no comment trick, then closed twice. */
  A("sqlinjection", function () {
    const W = 980, H = 580;
    const FORM = { x: 40, y: 58, w: 250, h: 144 };
    const CODE = { x: 330, y: 88, w: 190, h: 82 };
    const SEE = { x: 580, y: 58, w: 360, h: 144 };
    const STRIP = { x: 40, y: 230, w: 900, h: 90 };
    const DB = { x: 40, y: 336, w: 250, h: 112 };
    const COND = { x: 314, y: 336, w: 370, h: 112 };
    const RESP = { x: 708, y: 336, w: 232, h: 112 };

    const steps = [
      { name: "1. The form", caption: "A login page is two text boxes. Whatever is typed is just characters - the site has no idea what any of it means." },
      { name: "2. Joined in", caption: "The site builds its database query by pasting the typed text into the middle of a command, between quote marks." },
      { name: "3. Text that escapes", caption: "This time the typed password starts with a quote mark. That closes the quote the site opened, so the rest is read as part of the command." },
      { name: "4. Always true", caption: "The added test compares something with itself, so it is true no matter what. The whole condition is now true and a record matches." },
      { name: "5. Fix: check the input", caption: "Validation refuses characters that have no business in a password, so the dangerous text never reaches the query." },
      { name: "6. Fix: keep the value separate", caption: "Better still, the query is fixed in advance with a placeholder and the typed value is sent afterwards, as data. It can never be read as command." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("SQL injection - and the two things that stop it");

      const typedUser = "alice";
      const evil = s >= 2;                  // the risky text sits in the password box
      const attack = s === 2 || s === 3;    // and it reaches the query
      const shown = s === 0 ? "alice".slice(0, Math.round(d.seg(t, .1, .6) * 5)) : typedUser;
      const shownPass = s === 0
        ? "......".slice(0, Math.round(d.seg(t, .45, .95) * 6))
        : (evil ? "' OR 'a'='a" : ".......");

      // ---- the login page --------------------------------------------------
      d.box(FORM.x, FORM.y, FORM.w, FORM.h, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(FORM.x + 16, FORM.y + 20, "Login page", { size: 13, weight: 800, fill: c.soft, baseline: "middle" });
      d.text(FORM.x + 16, FORM.y + 40, "user name", { size: 11, weight: 600, fill: c.dim, baseline: "middle" });
      d.box(FORM.x + 16, FORM.y + 48, FORM.w - 32, 36,
            { fill: c.panel, stroke: s === 0 ? c.teal : c.line, on: s === 0,
              label: shown || " ", size: 14, max: FORM.w - 52 });
      d.text(FORM.x + 16, FORM.y + 96, "password", { size: 11, weight: 600, fill: c.dim, baseline: "middle" });
      const pcol = evil ? (s === 5 ? c.edge : c.bad) : (s === 0 ? c.teal : c.line);
      d.box(FORM.x + 16, FORM.y + 104, FORM.w - 32, 36,
            { fill: c.panel, stroke: pcol, on: true,
              label: shownPass || " ", size: 14, max: FORM.w - 52,
              labelFill: evil ? pcol : c.fg });
      const PASSY = FORM.y + 122;

      // ---- what the site's code does with it --------------------------------
      const codeLabel = s === 4 ? "Check the input" : s === 5 ? "Fixed query" : "The site's code";
      const codeSub = s === 4 ? "letters and digits only" : s === 5 ? "value sent separately" : "joins the text in";
      const codeCol = s >= 4 ? c.ok : c.violet;
      d.box(CODE.x, CODE.y, CODE.w, CODE.h, { fill: s >= 4 ? "#1d4a35" : "#3a2a56", stroke: codeCol,
                                              on: true, r: 12, label: codeLabel, sub: codeSub,
                                              size: 15, max: CODE.w - 20 });
      d.arrow(FORM.x + FORM.w + 4, CODE.y + CODE.h / 2, CODE.x - 6, CODE.y + CODE.h / 2,
              { stroke: c.line, width: 2.2 });
      d.arrow(CODE.x + CODE.w / 2, CODE.y + CODE.h + 4, CODE.x + CODE.w / 2, STRIP.y - 6,
              { stroke: s === 4 ? c.dim : c.line, width: 2.2, alpha: s === 4 ? .3 : 1 });

      // ---- what the site is actually holding ---------------------------------
      d.box(SEE.x, SEE.y, SEE.w, SEE.h, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(SEE.x + 18, SEE.y + 20, ["What the site is holding", "What the site is holding",
                                      "The typed text, in parts", "The typed text, in parts",
                                      "Refused at the door", "Two separate things"][s],
             { size: 13, weight: 800, fill: c.soft, baseline: "middle", max: SEE.w - 36 });
      const rows = [
        [["alice", c.teal, "typed in the name box - just text"], ["......", c.teal, "typed in the password box - just text"]],
        [["alice", c.teal, "used as a name"], ["hunter2", c.ok, "used as a password, and it matches"]],
        [["'", c.bad, "closes the quote the site opened"], ["OR 'a'='a", c.bad, "a test the site never wrote"]],
        [["'a'='a'", c.bad, "true for every record in the table"], ["password", c.dim, "no longer part of the decision"]],
        [["'", c.bad, "a quote mark - refused, so nothing is built"], ["alice", c.ok, "letters only, so this one is fine"]],
        [["?", c.info, "the query's placeholder, fixed in advance"], ["' OR 'a'='a", c.ok, "sent afterwards and compared whole"]]
      ][s];
      rows.forEach((r, i) => {
        const ry = SEE.y + 54 + i * 46, ap = d.seg(t, .08 + i * .14, .35 + i * .14);
        d.chip(SEE.x + 72, ry, r[0], { fill: r[1], w: 96, h: 26, alpha: ap, glow: i === 0 && attack });
        d.wrap(SEE.x + 132, ry - 8, r[2], 208, { size: 11.5, fill: c.soft, alpha: ap });
      });

      // ---- the query ---------------------------------------------------------
      d.box(STRIP.x, STRIP.y, STRIP.w, STRIP.h, { fill: "#16233c", stroke: s === 4 ? c.line : c.edge, r: 14,
                                                  alpha: s === 4 ? .5 : 1 });
      d.text(STRIP.x + 20, STRIP.y + 20,
             s === 4 ? "The query is never built - nothing was joined in"
                     : s === 5 ? "The query, fixed before anything is typed"
                               : "The query the site sends to the database",
             { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });

      const SZ = 16, qy = STRIP.y + 48;
      let segs;
      if (s === 5) {
        segs = [{ t: "SELECT * FROM users WHERE name = ", f: c.soft },
                { t: "?", f: c.info }, { t: " AND pass = ", f: c.soft }, { t: "?", f: c.info }];
      } else if (attack) {
        segs = [{ t: "SELECT * FROM users WHERE name = '", f: c.soft },
                { t: typedUser, f: c.teal }, { t: "' AND pass = '", f: c.soft },
                { t: "'", f: c.bad }, { t: " OR 'a'='a", f: c.bad }, { t: "'", f: c.soft }];
      } else {
        const blank = s === 1;
        segs = [{ t: "SELECT * FROM users WHERE name = '", f: c.soft },
                { t: blank ? typedUser : "____", f: blank ? c.teal : c.dim },
                { t: "' AND pass = '", f: c.soft },
                { t: blank ? "hunter2" : "____", f: blank ? c.ok : c.dim }, { t: "'", f: c.soft }];
      }
      const qx = STRIP.x + (STRIP.w - runWidth(d, segs, SZ)) / 2;
      d.x.save();
      if (s === 4) d.x.globalAlpha = .35;
      run(d, qx, qy, segs, SZ);
      d.x.restore();

      if (attack) {
        const hi = d.seg(t, .2, .6);
        const a = segs[4], b = segs[5];
        d.line(a.x, qy + 16, a.x + (a.w + b.w) * hi, qy + 16,
               { stroke: c.bad, width: 3.5, glow: true });
        d.text(a.x + (a.w + b.w) / 2, qy + 32, "this part is true whatever was typed",
               { size: 12, weight: 800, align: "center", baseline: "middle",
                 fill: c.bad, alpha: d.seg(t, .45, .7) });
      }
      if (s === 5) {
        d.text(STRIP.x + 20, qy + 26, "values sent afterwards:",
               { size: 11.5, weight: 700, fill: c.info, baseline: "middle" });
        [[segs[1], "alice", c.teal], [segs[3], "' OR 'a'='a", c.ok]].forEach((v, i) => {
          const ap = d.seg(t, .15 + i * .2, .45 + i * .2);
          d.chip(v[0].x + v[0].w / 2, qy + 26 + (1 - ap) * 14, v[1],
                 { fill: v[2], h: 22, size: 11.5, alpha: ap });
          d.line(v[0].x + v[0].w / 2, qy + 10, v[0].x + v[0].w / 2, qy + 15,
                 { stroke: c.info, width: 1.6, alpha: ap });
        });
      }

      // the typed value travelling into the query, or being stopped
      if (s === 1 || s === 2) {
        const p = d.onCurve(FORM.x + 110, PASSY, segs[3].x + 16, qy + 4, -55, d.seg(t, .1, .8));
        d.chip(p[0], p[1], attack ? "' OR 'a'='a" : "hunter2",
               { fill: attack ? c.bad : c.ok, glow: true, alpha: 1 - d.seg(t, .85, 1) });
      }
      if (s === 4) {
        const p = d.onCurve(FORM.x + 110, PASSY, CODE.x + CODE.w / 2, CODE.y + CODE.h + 28, 34, d.seg(t, .1, .6));
        d.chip(p[0], p[1], "' OR 'a'='a", { fill: c.bad, glow: true });
        d.text(CODE.x + CODE.w + 26, CODE.y + CODE.h + 28, "refused - it never gets this far",
               { size: 12.5, weight: 800, baseline: "middle",
                 fill: c.bad, alpha: d.seg(t, .55, .8) });
      }

      // ---- database, condition, reply -----------------------------------------
      d.box(DB.x, DB.y, DB.w, DB.h, { fill: "#16233c", stroke: c.line, r: 12 });
      d.text(DB.x + 16, DB.y + 18, "users table", { size: 11.5, weight: 800, fill: c.dim, baseline: "middle" });
      ["alice      ......", "bruno     ......", "chidi      ......"].forEach((r, i) => {
        const hit = i === 0 && ((s === 1 && t > .35) || (s === 3 && t > .35));
        d.box(DB.x + 14, DB.y + 32 + i * 26, DB.w - 28, 22,
              { fill: hit ? "#2a3f68" : c.panel, stroke: hit ? (s === 3 ? c.bad : c.ok) : c.line,
                on: hit, label: r, size: 11.5, max: DB.w - 44 });
      });
      d.arrow(DB.x + DB.w + 4, DB.y + DB.h / 2, COND.x - 6, DB.y + DB.h / 2, { stroke: c.line, width: 2.2 });

      d.box(COND.x, COND.y, COND.w, COND.h, { fill: "#16233c", stroke: c.line, r: 12 });
      d.text(COND.x + 16, COND.y + 18, "The condition the database tests",
             { size: 11.5, weight: 800, fill: c.dim, baseline: "middle", max: COND.w - 32 });
      const lines = [
        [["nothing sent yet", c.dim]],
        [["name = 'alice'  AND  pass = 'hunter2'", c.soft], ["both parts match   gives   TRUE", c.ok]],
        [["name = 'alice'  AND  pass = ''", c.soft], ["OR   'a'='a'", c.bad]],
        [["( name AND pass )   =   FALSE", c.soft], ["OR   'a'='a'   =   TRUE", c.bad],
         ["FALSE OR TRUE   =   TRUE", c.bad]],
        [["nothing sent - the input was refused", c.dim]],
        [["pass is compared with the whole string", c.soft], ["no record stores that   gives   FALSE", c.ok]]
      ][s];
      lines.forEach((l, i) => {
        d.text(COND.x + 16, COND.y + 44 + i * 22, l[0],
               { size: 12, weight: 700, fill: l[1], baseline: "middle", max: COND.w - 32,
                 alpha: d.seg(t, .08 + i * .1, .3 + i * .1) });
      });

      d.arrow(COND.x + COND.w + 4, COND.y + COND.h / 2, RESP.x - 6, COND.y + COND.h / 2, { stroke: c.line, width: 2.2 });
      const reply = [
        [c.dim, "Waiting", "nothing has been submitted"],
        [c.ok, "Signed in", "the right password was given"],
        [c.edge, "Query sent", "the database is about to test a changed condition"],
        [c.bad, "Signed in", "as alice, with no password at all"],
        [c.ok, "Refused", "that character is not allowed in a password"],
        [c.ok, "Login failed", "the password simply did not match"]
      ][s];
      d.box(RESP.x, RESP.y, RESP.w, RESP.h, { fill: "#16233c", stroke: reply[0], on: s > 0, r: 12 });
      d.text(RESP.x + 16, RESP.y + 18, "What the visitor gets",
             { size: 11.5, weight: 800, fill: c.dim, baseline: "middle" });
      d.text(RESP.x + 16, RESP.y + 46, reply[1],
             { size: 17, weight: 800, fill: reply[0], baseline: "middle", max: RESP.w - 32 });
      d.wrap(RESP.x + 16, RESP.y + 62, reply[2], RESP.w - 32, { size: 11.5, fill: c.soft });

      // ---- caption and annotation -----------------------------------------------
      const notes = [
        ["Text is only text", "The site cannot tell a name from an instruction. Everything typed arrives as a string of characters.", [FORM.x + FORM.w, PASSY]],
        ["The risky line", "Joining typed text into the middle of a command is the whole weakness. The quote marks are all that keeps data out of the command.", [CODE.x + CODE.w, CODE.y + CODE.h / 2]],
        ["Out of the quotes", "The site opened a quote and expected the typed text to stay inside it. One quote character is enough to get out.", [segs[3].x, qy + 16]],
        ["Nothing was broken into", "No password was guessed and no file was stolen. The query itself was rewritten by what somebody typed.", [COND.x + 310, COND.y + 92]],
        ["Decide what is allowed", "Validation works by listing what is acceptable, not by guessing every bad string in advance.", [CODE.x + CODE.w, CODE.y + CODE.h / 2]],
        ["Data stays data", "With a placeholder the command is finished before the value arrives, so the value has nowhere to escape to.", [SEE.x + 24, SEE.y + 100]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
    } };
  });

  // ------------------------------------------------------------------ 1.4.2
  /* Brute force. The point is that the search space is a power, not a sum, so
   * one more character multiplies the work, and that three sensible defences
   * make the sum irrelevant. */
  A("bruteforce", function () {
    const W = 980, H = 580;
    const ATT = { x: 40, y: 72, w: 190, h: 100 };
    const SRV = { x: 750, y: 72, w: 190, h: 100 };

    const SPACE = [
      ["4 lower-case letters", 456976, "460 thousand", "under 1/1000 s", "#5ab4ff"],
      ["6 lower-case letters", 308915776, "310 million", "a third of a second", "#40c4ff"],
      ["8 lower-case letters", 208827064576, "209 billion", "about 3 minutes", "#ffd046"],
      ["8 mixed characters", 6.63e15, "6.6 quadrillion", "about 11 weeks", "#ffa028"],
      ["12 mixed characters", 5.4e23, "540 sextillion", "17 million years", "#50dc96"]
    ];

    const steps = [
      { name: "1. Trial and error", caption: "A brute-force attack guesses nothing clever. It works through possible passwords in order until one is accepted." },
      { name: "2. Counting the space", caption: "Four lower-case letters give 26 choices in each of four positions. That is 26 to the power 4, which is 456,976 combinations." },
      { name: "3. The space explodes", caption: "Every extra character multiplies the work, and so does every extra kind of character. The bars below are on a squashed scale." },
      { name: "4. Longer, not cleverer", caption: "Swapping letters for symbols adds very little. Adding characters adds a great deal - but the words still have to be unpredictable." },
      { name: "5. Limit the attempts", caption: "If the account locks after three wrong tries, the attacker gets three guesses instead of billions. The size of the space stops mattering." },
      { name: "6. Two factors", caption: "With two-factor authentication the password is only half of it. A second, changing code is needed from something the real user holds." }
    ];

    function attacker(d, lit) {
      const c = d.c;
      d.box(ATT.x, ATT.y, ATT.w, ATT.h, { fill: "#4a2030", stroke: c.bad, on: lit, r: 12,
                                          label: "Attacker's program", sub: "about a billion tries a second",
                                          size: 14.5, max: ATT.w - 20 });
    }
    function server(d, col, label, sub) {
      const c = d.c;
      d.box(SRV.x, SRV.y, SRV.w, SRV.h, { fill: "#16233c", stroke: col || c.line, on: !!col, r: 12,
                                          label: label || "Login page", sub: sub || "checks one guess at a time",
                                          size: 14.5, max: SRV.w - 20 });
    }

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Brute force - and why length beats cleverness");

      // ---------------------------------------------------- 1. trial and error
      if (s === 0) {
        attacker(d, true);
        const guesses = ["aaaa", "aaab", "aaac", "aaad", "mint"];
        const arrived = Math.min(guesses.length, Math.floor(d.clamp(t, 0, 1) * 6.5));
        server(d, arrived >= 5 ? c.bad : c.line, "Login page",
               arrived >= 5 ? "accepted the 216,678th guess" : "checks one guess at a time");
        for (let i = 0; i < guesses.length; i++) {
          const p = d.clamp((t - i * .14) / .26, 0, 1);
          if (p > 0 && p < 1)
            d.chip(d.lerp(ATT.x + ATT.w + 16, SRV.x - 16, p), ATT.y + ATT.h / 2, guesses[i],
                   { fill: i === 4 ? c.bad : c.edge, glow: true });
        }
        d.line(ATT.x + ATT.w + 6, ATT.y + ATT.h / 2, SRV.x - 6, ATT.y + ATT.h / 2,
               { stroke: c.line, width: 1.6, dash: [6, 6] });

        d.box(300, 196, 380, 180, { fill: "#16233c", stroke: c.line, r: 12 });
        d.text(318, 216, "Guesses sent, in order", { size: 12, weight: 800, fill: c.dim, baseline: "middle" });
        guesses.forEach((g, i) => {
          const on = i < arrived;
          d.box(316, 234 + i * 28, 348, 24,
                { fill: on ? c.panel : "#141f36", stroke: on && i === 4 ? c.bad : c.line,
                  on: on && i === 4, label: "", r: 7, alpha: on ? 1 : .35 });
          d.text(330, 246 + i * 28, g, { size: 13, weight: 700, fill: on ? c.fg : c.dim, baseline: "middle" });
          d.text(438, 246 + i * 28, i === 4 ? "guess 216,678" : "guess " + (i + 1),
                 { size: 11.5, weight: 600, fill: c.dim, baseline: "middle", alpha: on ? 1 : .3 });
          d.chip(624, 246 + i * 28, i === 4 ? "accepted" : "refused",
                 { fill: i === 4 ? c.bad : c.panel2, labelFill: i === 4 ? "#0f1626" : c.soft,
                   w: 72, h: 20, size: 11, alpha: on ? 1 : .15 });
        });

        d.box(40, 396, 900, 58, { fill: "#16233c", stroke: c.line, r: 12 });
        const tried = Math.round(d.ease(d.clamp(t, 0, 1)) * 216678);
        d.text(58, 425, "tried: " + tried.toLocaleString("en-GB") + " of 456,976 possible",
               { size: 14, weight: 800, fill: c.edge, baseline: "middle" });
        const bw = 260;
        d.box(450, 414, bw, 22, { fill: c.panel, stroke: c.line, r: 11 });
        d.box(450, 414, Math.max(6, bw * d.ease(d.clamp(t, 0, 1))), 22, { fill: c.bad, stroke: c.bad, r: 11 });
        d.text(922, 425, "elapsed: about 0.0002 seconds",
               { size: 12.5, weight: 700, fill: c.soft, baseline: "middle", align: "right" });
      }

      // ---------------------------------------------------- 2. counting
      if (s === 1) {
        attacker(d, true);
        server(d, c.line);
        const AL = "abcdefghijklmnopqrstuvwxyz";
        const settle = [.30, .45, .60, .78];
        const final = ["m", "i", "n", "t"];
        const vals = final.map((f, i) => t > settle[i] ? f
                      : AL[Math.floor((t * 42 + i * 7) % 26)]);
        const fills = {};
        final.forEach((f, i) => { if (t > settle[i]) fills[i] = c.edge; });
        d.cells(347, 196, vals, { cw: 64, ch: 76, gap: 10, size: 30, fills,
                                  on: [0, 1, 2, 3], accent: c.edge });
        d.text(490, 160, "4 positions, 26 letters each",
               { size: 13, weight: 700, fill: c.dim, baseline: "middle", align: "center" });
        d.text(490, 310, "26 x 26 x 26 x 26",
               { size: 20, weight: 800, fill: c.soft, baseline: "middle", align: "center" });
        d.text(490, 344, "= 456,976 combinations",
               { size: 22, weight: 800, fill: c.edge, baseline: "middle", align: "center",
                 alpha: d.seg(t, .28, .5) });
        d.box(40, 396, 900, 58, { fill: "#16233c", stroke: c.line, r: 12 });
        d.wrap(58, 410, "A program checking a billion guesses a second works through every one of those 456,976 in less than a thousandth of a second. A four-character password is not a password.",
               860, { size: 13, fill: c.soft });
      }

      // ---------------------------------------------------- 3. the space
      if (s === 2) {
        d.text(40, 76, "password", { size: 12, weight: 800, fill: c.dim, baseline: "middle" });
        d.text(214, 76, "how many combinations there are to try",
               { size: 12, weight: 800, fill: c.dim, baseline: "middle" });
        d.text(936, 76, "time to try them all", { size: 12, weight: 800, fill: c.dim, baseline: "middle", align: "right" });
        SPACE.forEach((r, i) => {
          const y = 104 + i * 62, p = d.seg(t, i * .04, .22 + i * .04);
          d.text(40, y + 18, r[0], { size: 13, weight: 700, fill: c.fg, baseline: "middle", max: 160 });
          const full = 480 * Math.log10(r[1]) / 24.2;
          d.box(214, y + 4, 480, 28, { fill: "#141f36", stroke: c.line, r: 8 });
          d.box(214, y + 4, Math.max(5, full * p), 28, { fill: r[4], stroke: r[4], r: 8 });
          d.text(706, y + 18, r[2], { size: 12.5, weight: 800, fill: r[4], baseline: "middle",
                                      max: 112, alpha: p });
          d.chip(880, y + 18, r[3], { fill: c.panel2, labelFill: c.fg, w: 118, h: 24, size: 11, alpha: p });
        });
        d.box(40, 410, 900, 46, { fill: "#16233c", stroke: c.line, r: 12 });
        d.wrap(58, 422, "The scale is squashed: each equal step to the right means ten times as many combinations. Drawn fairly, the top bar would be far thinner than this full stop. Assumes a billion guesses a second.",
               860, { size: 12.5, fill: c.soft });
      }

      // ---------------------------------------------------- 4. longer
      if (s === 3) {
        const pan = [
          { x: 50, w: 410, col: c.orange, pw: "Pa55w0rd!", chars: "9 characters, letters digits symbols",
            len: 9, n: "630 quadrillion", time: "about 20 years",
            warn: "But this is a common word with predictable swaps, so a word-list attack reaches it in seconds." },
          { x: 520, w: 410, col: c.ok, pw: "copper-bridge-lamp", chars: "18 characters, lower case and hyphens",
            len: 18, n: "58 septillion", time: "about 2 billion years",
            warn: "Easy to remember and nothing to look up - as long as the words are not a famous phrase." }
        ];
        pan.forEach((p, i) => {
          const ap = d.seg(t, i * .2, .4 + i * .2);
          d.box(p.x, 72, p.w, 236, { fill: "#16233c", stroke: p.col, on: true, r: 14, alpha: ap });
          d.text(p.x + p.w / 2, 102, p.pw, { size: 22, weight: 800, fill: p.col, baseline: "middle",
                                             align: "center", max: p.w - 40, alpha: ap });
          d.text(p.x + p.w / 2, 128, p.chars, { size: 12, weight: 600, fill: c.soft, baseline: "middle",
                                                align: "center", max: p.w - 40, alpha: ap });
          const grow = d.seg(t, .1 + i * .08, .4 + i * .08);
          d.text(p.x + 24, 146, "length", { size: 11, weight: 700, fill: c.dim, baseline: "middle", alpha: ap });
          d.box(p.x + 24, 156, p.w - 48, 22, { fill: "#141f36", stroke: c.line, r: 8, alpha: ap });
          d.box(p.x + 24, 156, Math.max(5, (p.w - 48) * (p.len / 18) * grow), 22,
                { fill: p.col, stroke: p.col, r: 8, alpha: ap });
          d.text(p.x + 24, 198, "combinations to try", { size: 11.5, weight: 700, fill: c.dim, baseline: "middle", alpha: ap });
          d.text(p.x + p.w - 24, 198, p.n, { size: 15, weight: 800, fill: p.col, baseline: "middle",
                                             align: "right", max: 200, alpha: ap });
          d.text(p.x + 24, 226, "time at a billion a second", { size: 11.5, weight: 700, fill: c.dim, baseline: "middle", alpha: ap });
          d.text(p.x + p.w - 24, 226, p.time, { size: 15, weight: 800, fill: p.col, baseline: "middle",
                                                align: "right", max: 200, alpha: ap });
          d.wrap(p.x + 24, 252, p.warn, p.w - 48, { size: 12, fill: c.soft, alpha: ap });
        });
        d.box(50, 336, 880, 112, { fill: "#16233c", stroke: c.line, r: 14 });
        d.text(70, 360, "Why length wins", { size: 13, weight: 800, fill: c.edge, baseline: "middle" });
        d.wrap(70, 378, "Adding one lower-case character multiplies the combinations by 26. Replacing a letter with a symbol only widens the set a little, and attackers already know the usual swaps. Nine awkward characters are harder to remember and easier to crack than eighteen plain ones.",
               840, { size: 13, fill: c.soft });
      }

      // ---------------------------------------------------- 5. attempt limit
      if (s === 4) {
        attacker(d, true);
        const tries = Math.min(3, Math.floor(d.clamp(t, 0, 1) * 9));
        const locked = t > .38;
        server(d, locked ? c.ok : c.line, locked ? "Locked" : "Login page",
               locked ? "no more tries for 15 minutes" : "counting the wrong answers");
        d.line(ATT.x + ATT.w + 6, ATT.y + ATT.h / 2, SRV.x - 6, ATT.y + ATT.h / 2,
               { stroke: locked ? c.bad : c.line, width: 1.6, dash: [6, 6], alpha: locked ? .3 : 1 });
        if (!locked) {
          const p = d.clamp((t % .24) / .22, 0, 1);
          d.chip(d.lerp(ATT.x + ATT.w + 16, SRV.x - 16, p), ATT.y + ATT.h / 2, "guess",
                 { fill: c.edge, glow: true });
        } else {
          d.chip(ATT.x + ATT.w + 60, ATT.y + ATT.h / 2, "blocked", { fill: c.bad, glow: true });
        }

        d.box(330, 196, 320, 192, { fill: "#16233c", stroke: locked ? c.ok : c.line, on: locked, r: 14 });
        d.text(348, 218, "Wrong answers counted", { size: 12, weight: 800, fill: c.dim, baseline: "middle" });
        for (let i = 0; i < 3; i++) {
          const on = i < tries;
          d.box(348, 236 + i * 38, 284, 30,
                { fill: on ? "#4a2030" : "#141f36", stroke: on ? c.bad : c.line, on,
                  label: "attempt " + (i + 1) + "   refused", size: 13, max: 260,
                  alpha: on ? 1 : .4 });
        }
        d.box(348, 350, 284, 26, { fill: locked ? "#1d4a35" : "#141f36", stroke: locked ? c.ok : c.line,
                                   on: locked, label: locked ? "account locked" : "", size: 13,
                                   max: 260, alpha: locked ? 1 : .4, r: 8 });

        d.box(40, 404, 900, 50, { fill: "#16233c", stroke: c.line, r: 12 });
        d.text(58, 429, "guesses the attacker needed: 456,976",
               { size: 13.5, weight: 800, fill: c.soft, baseline: "middle" });
        d.text(540, 429, "guesses the attacker got: 3",
               { size: 13.5, weight: 800, fill: c.ok, baseline: "middle", alpha: d.seg(t, .38, .55) });
      }

      // ---------------------------------------------------- 6. two factor
      if (s === 5) {
        attacker(d, true);
        const got = d.seg(t, .04, .22), asked = d.seg(t, .22, .42), fail = d.seg(t, .45, .62);
        server(d, asked > .5 ? c.info : c.line, "Login server",
               asked > .5 ? "password right - now the code" : "checks the password");
        d.line(ATT.x + ATT.w + 6, ATT.y + ATT.h / 2, SRV.x - 6, ATT.y + ATT.h / 2,
               { stroke: c.line, width: 1.6, dash: [6, 6] });
        d.chip(d.lerp(ATT.x + ATT.w + 80, SRV.x - 86, got), ATT.y + ATT.h / 2, "right password",
               { fill: c.edge, glow: true, alpha: 1 - fail });

        d.box(330, 212, 320, 150, { fill: "#16233c", stroke: c.info, on: asked > .5, r: 14 });
        d.text(348, 236, "Factor 2: a changing code", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle" });
        d.cells(348, 254, ["4", "0", "7", "2", "9", "1"],
                { cw: 44, ch: 44, gap: 6, size: 20, on: [0, 1, 2, 3, 4, 5], accent: c.info, alpha: asked });
        d.text(348, 332, "valid for 30 seconds, on the owner's phone",
               { size: 12, weight: 700, fill: c.soft, baseline: "middle", max: 284, alpha: asked });

        d.box(750, 212, 190, 150, { fill: "#16233c", stroke: c.ok, on: true, r: 14,
                                    label: "The owner's phone", sub: "something they have",
                                    size: 14, max: 170 });
        d.arrow(845, SRV.y + SRV.h + 6, 845, 206,
                { stroke: c.info, width: 2.2, alpha: asked, label: "code", labelFill: c.info, lx: 34 });

        d.box(40, 376, 520, 90, { fill: "#16233c", stroke: fail > .4 ? c.ok : c.line, on: fail > .4, r: 12 });
        d.text(58, 398, fail > .4 ? "Login refused" : "Waiting for the second factor",
               { size: 15, weight: 800, fill: fail > .4 ? c.ok : c.dim, baseline: "middle" });
        d.wrap(58, 412, "The attacker has the password and still cannot get in: the code is on a device they do not hold. The real owner also learns their password is known.",
               480, { size: 12.5, fill: c.soft, alpha: fail });
      }

      const notes = [
        ["No cleverness needed", "A brute-force attack needs no knowledge of the user at all - only speed and patience.", [SRV.x, ATT.y + ATT.h / 2]],
        ["A power, not a sum", "Each extra position multiplies by 26. That is why the numbers get out of hand so quickly.", [490, 370]],
        ["Both axes matter", "A longer password and a wider set of characters each multiply the work. Length is the cheaper one to get right.", [694, 370]],
        ["Two different attacks", "Brute force tries every combination. A word-list attack tries likely ones first, which is why predictable patterns fail fast.", [255, 288]],
        ["Cheap and effective", "A lockout costs the organisation almost nothing and removes the attacker's main advantage: repetition.", [620, 429]],
        ["Something you have", "Two-factor pairs something known with something held. One stolen password is no longer enough.", [845, 362]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
    } };
  });

  // ------------------------------------------------------------------ 1.4.3
  /* Denial of service. Students expect an attack to involve theft, so the
   * whole diagram is built around a queue: the service is not broken into,
   * it is simply full. */
  A("ddos", function () {
    const W = 980, H = 580;
    const BOSS = { x: 40, y: 58, w: 180, h: 62 };
    const Q = { x: 440, y: 136, w: 180, h: 252 };
    const SRV = { x: 660, y: 166, w: 280, h: 170 };
    const VERD = { x: 660, y: 352, w: 280, h: 96 };
    const ME = { x: 40, y: 394, w: 240, h: 56 };
    const SLOTS = 6;

    const steps = [
      { name: "1. A normal day", caption: "Requests arrive, wait briefly in a queue, and are answered. The server has plenty of room to spare." },
      { name: "2. A botnet", caption: "One attacker controls thousands of computers infected with malware. Their owners have no idea they are taking part." },
      { name: "3. The flood", caption: "Every machine sends requests at once. They look like ordinary requests, which is what makes them hard to pick out." },
      { name: "4. The queue is full", caption: "With every slot taken, anything new is simply dropped. The server is working flat out and still falling behind." },
      { name: "5. A real customer waits", caption: "A genuine request joins the back of a queue that never shortens, so the page never loads and eventually times out." },
      { name: "6. Nothing was stolen", caption: "No data left the building and nobody got in. The damage is the downtime: an online shop that is offline sells nothing." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Denial of service - swamped, not broken into");

      // ------------------------------------------------ 6. what it is and is not
      if (s === 5) {
        const pan = [
          { x: 50, col: c.violet, h1: "A break-in", h2: "data is copied or changed",
            rows: ["someone gets inside the system", "records are read, altered or taken",
                   "the damage lasts after it ends", "fixed by patching the way in"] },
          { x: 500, col: c.bad, h1: "Denial of service", h2: "nothing is taken at all",
            rows: ["nobody gets inside the system", "no record is read or altered",
                   "the damage is the time offline", "fixed by filtering the traffic"] }
        ];
        pan.forEach((p, i) => {
          const ap = d.seg(t, i * .18, .4 + i * .18);
          d.box(p.x, 66, 430, 236, { fill: "#16233c", stroke: p.col, on: true, r: 14, alpha: ap });
          d.text(p.x + 24, 96, p.h1, { size: 19, weight: 800, fill: p.col, baseline: "middle",
                                       max: 380, alpha: ap });
          d.text(p.x + 24, 120, p.h2, { size: 12.5, weight: 600, fill: c.soft, baseline: "middle",
                                        max: 380, alpha: ap });
          p.rows.forEach((r, j) => {
            const ra = d.seg(t, .2 + j * .12 + i * .1, .45 + j * .12 + i * .1);
            d.box(p.x + 24, 142 + j * 38, 382, 30,
                  { fill: c.panel, stroke: c.line, label: r, size: 12.5, max: 358,
                    r: 8, alpha: Math.min(ap, ra) });
          });
        });
        d.box(50, 322, 880, 126, { fill: "#16233c", stroke: c.ok, on: true, r: 14 });
        d.text(74, 348, "What helps", { size: 13.5, weight: 800, fill: c.ok, baseline: "middle" });
        [["Filter the traffic", "a firewall or a specialist service drops the flood before it reaches the server"],
         ["Spread the load", "copies of the site in several places share the traffic out"],
         ["Clean the bots", "anti-malware on ordinary computers shrinks the botnet in the first place"]]
          .forEach((r, i) => {
            const ap = d.seg(t, .3 + i * .14, .6 + i * .14);
            d.box(74 + i * 280, 366, 258, 66, { fill: c.panel, stroke: c.line, r: 10, alpha: ap });
            d.text(88 + i * 280, 386, r[0], { size: 13, weight: 800, fill: c.ok, baseline: "middle",
                                              max: 230, alpha: ap });
            d.wrap(88 + i * 280, 396, r[1], 230, { size: 11.5, fill: c.soft, alpha: ap });
          });
        d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
        d.note(590, 492, "Exam answers often say data is stolen in a DoS attack. It is not: the service is made unavailable, and that alone costs money.",
               { title: "The usual mistake", to: [715, 300], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
        return;
      }

      const flood = s >= 2;
      const fill = s === 0 ? Math.round(1 + d.pulse(t) * .9)
                 : s === 1 ? 2
                 : s === 2 ? Math.round(d.lerp(2, SLOTS, d.seg(t, .1, .85)))
                 : SLOTS;
      const load = s === 0 ? 18 : s === 1 ? 20 : s === 2 ? Math.round(d.lerp(22, 100, d.seg(t, .1, .8))) : 100;

      // ---- the source of the traffic ----------------------------------------
      if (flood || s === 1) {
        d.box(BOSS.x, BOSS.y, BOSS.w, BOSS.h, { fill: "#4a2030", stroke: c.bad, on: true, r: 12,
                                                label: "Attacker", sub: "sends one command", size: 14.5,
                                                max: BOSS.w - 20 });
        const grid = [];
        for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) grid.push([40 + k * 60, 140 + r * 58]);
        grid.forEach((g, i) => {
          const wake = s === 1 ? d.seg(t, .12 + i * .045, .32 + i * .045) : 1;
          d.box(g[0], g[1], 52, 50, { fill: wake > .5 ? "#4a2030" : c.panel,
                                      stroke: wake > .5 ? c.bad : c.line, on: wake > .5,
                                      label: "PC", size: 12, max: 40, r: 8 });
          if (s === 1 && wake > .1 && wake < .95)
            d.dot(g[0] + 26, g[1] + 25, 7 * (1 - wake), { fill: c.bad, glow: true });
        });
        d.text(40, 374, "thousands of machines - a botnet",
               { size: 11.5, weight: 700, fill: c.bad, baseline: "middle", max: 230 });
      } else {
        ["Shopper", "Shopper", "Shopper"].forEach((u, i) => {
          d.box(40, 150 + i * 62, 180, 50, { fill: "#16233c", stroke: c.ok, on: true, r: 10,
                                             label: u, sub: "one page at a time", size: 13.5,
                                             subSize: 11, max: 160 });
        });
        d.text(40, 356, "a handful of ordinary visitors",
               { size: 11.5, weight: 700, fill: c.ok, baseline: "middle", max: 230 });
      }

      // ---- the request queue -------------------------------------------------
      d.box(Q.x, Q.y, Q.w, Q.h, { fill: "#16233c", stroke: fill >= SLOTS ? c.bad : c.line,
                                  on: fill >= SLOTS, r: 14 });
      d.text(Q.x + 16, Q.y + 20, "Request queue", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle" });
      d.text(Q.x + 16, Q.y + 38, SLOTS + " can wait at once", { size: 11, weight: 600, fill: c.dim, baseline: "middle" });
      for (let i = 0; i < SLOTS; i++) {
        const used = i < fill;
        const mine = s === 4 && i === SLOTS - 1 && false;
        d.box(Q.x + 16, Q.y + 54 + i * 32, Q.w - 32, 26,
              { fill: used ? (flood ? "#4a2030" : "#1d4a35") : "#141f36",
                stroke: used ? (flood ? c.bad : c.ok) : c.line, on: used,
                label: used ? (flood ? "flood request" : "page request") : "free",
                size: 11.5, max: Q.w - 56, r: 7,
                labelFill: used ? c.fg : c.dim, alpha: mine ? 1 : 1 });
      }

      // ---- arriving traffic ---------------------------------------------------
      const lanes = flood || s === 1 ? [160, 200, 240, 280, 320, 360] : [175, 237, 299];
      lanes.forEach((ly, i) => {
        d.line(226, ly, Q.x - 8, Q.y + Q.h / 2,
               { stroke: flood ? c.bad : c.ok, width: flood ? 1.6 : 1.4, dash: [5, 5],
                 alpha: flood ? .5 : .5 });
        const n = flood ? 3 : 1;
        for (let k = 0; k < n; k++) {
          const p = ((t * (flood ? 2.4 : .9) + i * .17 + k * .33) % 1);
          const px = d.lerp(226, Q.x - 8, p), py = d.lerp(ly, Q.y + Q.h / 2, p);
          d.dot(px, py, flood ? 5 : 7, { fill: flood ? c.bad : c.ok, glow: !flood });
        }
      });

      // ---- the server ---------------------------------------------------------
      d.box(SRV.x, SRV.y, SRV.w, SRV.h, { fill: "#16233c", stroke: load >= 100 ? c.bad : c.line,
                                          on: load >= 100, r: 14 });
      d.text(SRV.x + 20, SRV.y + 24, "Web server", { size: 14.5, weight: 800, fill: c.fg, baseline: "middle" });
      d.text(SRV.x + 20, SRV.y + 46, "answers whatever reaches the front",
             { size: 11.5, weight: 600, fill: c.soft, baseline: "middle", max: SRV.w - 40 });
      d.text(SRV.x + 20, SRV.y + 78, "how busy it is", { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
      d.box(SRV.x + 20, SRV.y + 92, SRV.w - 40, 24, { fill: "#141f36", stroke: c.line, r: 8 });
      d.box(SRV.x + 20, SRV.y + 92, Math.max(8, (SRV.w - 40) * load / 100), 24,
            { fill: load >= 100 ? c.bad : load > 60 ? c.orange : c.ok,
              stroke: load >= 100 ? c.bad : load > 60 ? c.orange : c.ok, r: 8 });
      d.text(SRV.x + SRV.w - 20, SRV.y + 104, load + "%",
             { size: 13, weight: 800, fill: c.fg, baseline: "middle", align: "right" });
      d.arrow(Q.x + Q.w + 6, Q.y + Q.h / 2, SRV.x - 6, Q.y + Q.h / 2, { stroke: c.line, width: 2.4 });
      if (s === 0) {
        const back = d.onCurve(SRV.x + 20, SRV.y + SRV.h - 20, 232, 237, 90, (t * .8) % 1);
        d.chip(back[0], back[1], "page", { fill: c.ok, glow: true });
        d.text(SRV.x + 20, SRV.y + 140, "every request gets an answer",
               { size: 11.5, weight: 700, fill: c.ok, baseline: "middle", max: SRV.w - 40 });
      }

      // ---- dropped requests ----------------------------------------------------
      if (s === 3) {
        for (let i = 0; i < 4; i++) {
          const p = (t * 1.6 + i * .25) % 1;
          const px = d.lerp(360, Q.x - 14, Math.min(p * 2, 1));
          d.dot(px, 170 + i * 56, 6, { fill: c.bad, alpha: 1 - Math.max(0, p * 2 - 1) });
          if (p > .5) d.text(Q.x - 24, 170 + i * 56, "dropped",
                             { size: 11, weight: 800, fill: c.bad, baseline: "middle",
                               align: "right", alpha: (p - .5) * 2 });
        }
      }

      // ---- the genuine user ----------------------------------------------------
      if (s >= 3) {
        const waiting = s === 4;
        d.box(ME.x, ME.y, ME.w, ME.h, { fill: "#16233c", stroke: waiting ? c.edge : c.line,
                                        on: waiting, r: 12, label: "A real customer",
                                        sub: waiting ? "still staring at a blank page" : "tries to load the shop",
                                        size: 14, subSize: 11, max: ME.w - 20 });
        if (waiting) {
          const p = d.seg(t, .1, .55);
          const q = d.onCurve(ME.x + ME.w + 6, ME.y + 20, Q.x - 10, Q.y + Q.h - 20, -40, p);
          d.chip(q[0], q[1], "my request", { fill: c.edge, glow: true, alpha: 1 - d.seg(t, .6, .85) });
          if (t > .62) d.text(Q.x - 18, Q.y + Q.h - 6, "no room",
                              { size: 12, weight: 800, fill: c.bad, baseline: "middle",
                                align: "right", alpha: d.seg(t, .62, .85) });
        }
      }

      // ---- the verdict ----------------------------------------------------------
      const v = [
        [c.ok, "Service normal", "Pages come back in a fraction of a second."],
        [c.edge, "Still normal", "The command has gone out but the traffic has not started."],
        [c.orange, "Slowing down", "The queue is filling faster than the server can empty it."],
        [c.bad, "Overloaded", "New requests are discarded without being read."],
        [c.bad, "Service unavailable", "The page times out. The shop is open but nobody can reach the till."]
      ][s];
      d.box(VERD.x, VERD.y, VERD.w, VERD.h, { fill: "#16233c", stroke: v[0], on: true, r: 12 });
      d.text(VERD.x + 20, VERD.y + 26, v[1], { size: 16, weight: 800, fill: v[0], baseline: "middle",
                                               max: VERD.w - 40 });
      d.wrap(VERD.x + 20, VERD.y + 42, v[2], VERD.w - 40, { size: 12, fill: c.soft });

      const notes = [
        ["Why a queue at all", "A server can only answer so many requests at once, so the rest wait their turn. The queue is normal, not a fault.", [Q.x + Q.w / 2, Q.y + 110]],
        ["Not the attacker's computers", "A botnet is built from other people's machines, which hides the attacker and multiplies the traffic.", [130, 240]],
        ["Hard to tell apart", "Each request on its own looks legitimate. It is the number arriving at once that does the damage.", [340, 250]],
        ["Dropped, not refused", "There is no room to even send back an error, so requests are discarded silently.", [Q.x + Q.w / 2, Q.y + 200]],
        ["The real cost", "Downtime, lost orders and customers who go elsewhere - all without a single record being touched.", [ME.x + ME.w, ME.y + 20]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
    } };
  });

  // ------------------------------------------------------------------ 1.4.4
  /* Firewalls. Two things students get wrong: they think a firewall reads
   * content, and they think it is the whole of security. Both are addressed. */
  A("firewall", function () {
    const W = 980, H = 580;
    const NET = { x: 40, y: 74, w: 190, h: 112 };
    const FW = { x: 320, y: 64, w: 200, h: 132 };
    const LAN = { x: 610, y: 74, w: 330, h: 112 };
    const CARD = { x: 40, y: 210, w: 250, h: 200 };
    const TAB = { x: 320, y: 206, w: 620, h: 230 };
    const VERD = { x: 40, y: 384, w: 250, h: 56 };

    const RULES = [
      ["Allow web traffic to the web server, port 443", "allow", "ok"],
      ["Allow mail leaving the network, port 587", "allow", "ok"],
      ["Block remote login from outside, port 23", "block", "bad"],
      ["Block anything not matched above", "block", "bad"]
    ];

    const steps = [
      { name: "1. On the boundary", caption: "A firewall sits between a network and everything outside it. Every packet in or out has to pass through it." },
      { name: "2. The rule list", caption: "An administrator writes the rules: which addresses, which ports, which direction. The list is checked from the top down." },
      { name: "3. Checked and allowed", caption: "This packet is web traffic on port 443, so it matches the first rule and is passed into the network." },
      { name: "4. Checked and dropped", caption: "A remote-login attempt from outside matches a block rule. The packet is thrown away, with no reply sent back." },
      { name: "5. Labels, not meaning", caption: "A firewall reads the labels on a packet, not what it carries. Traffic a rule allows gets through even when its contents are harmful." },
      { name: "6. Layers, not one wall", caption: "A firewall is one layer. Anti-malware, strong authentication and trained users cover the gaps it cannot see." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Firewalls - a rule list on the boundary, not a cure-all");

      const bad = s === 3;
      const sneaky = s === 4;
      const match = s === 2 ? 0 : s === 3 ? 2 : s === 4 ? 0 : -1;
      // how far down the list the check has got
      const scan = s === 2 || s === 3 || s === 4
        ? d.clamp(d.seg(t, .1, .5) * (match + 1.2), 0, match + 1) : -1;
      const decided = scan >= match + .9;
      const pass = decided && (s === 2 || s === 4);

      // ---- the boundary ------------------------------------------------------
      d.box(NET.x, NET.y, NET.w, NET.h, { fill: "#16233c", stroke: c.line, r: 14,
                                          label: "The internet", sub: "anyone, anywhere",
                                          size: 15, max: NET.w - 20 });
      d.box(FW.x, FW.y, FW.w, FW.h, { fill: "#3a2a56", stroke: c.violet, on: true, r: 14,
                                      label: "Firewall", sub: "checks every packet",
                                      size: 18, subSize: 11.5, max: FW.w - 20 });
      d.box(LAN.x, LAN.y, LAN.w, LAN.h, { fill: "#16233c", stroke: s === 5 ? c.ok : c.line,
                                          on: s === 5, r: 14 });
      d.text(LAN.x + 18, LAN.y + 22, "School network", { size: 14.5, weight: 800, fill: c.fg, baseline: "middle" });
      ["Laptops", "Web server", "Printers"].forEach((u, i) => {
        d.box(LAN.x + 16 + i * 102, LAN.y + 40, 94, 54,
              { fill: c.panel, stroke: sneaky && decided && i === 0 ? c.bad : c.line,
                on: sneaky && decided && i === 0, label: u, size: 12.5, max: 78, r: 9 });
      });
      d.line(FW.x - 4, 56, FW.x - 4, 204, { stroke: c.violet, width: 1.4, dash: [4, 5], alpha: .6 });
      d.line(FW.x + FW.w + 4, 56, FW.x + FW.w + 4, 204, { stroke: c.violet, width: 1.4, dash: [4, 5], alpha: .6 });
      d.text(FW.x + FW.w / 2, 50, "the only way in or out",
             { size: 11.5, weight: 700, fill: c.violet, baseline: "middle", align: "center" });

      // ---- the packet in flight -----------------------------------------------
      const PY = FW.y + FW.h / 2;
      d.line(NET.x + NET.w + 6, PY, FW.x - 8, PY, { stroke: c.line, width: 2, dash: [6, 6] });
      d.line(FW.x + FW.w + 8, PY, LAN.x - 6, PY,
             { stroke: pass ? c.ok : c.line, width: 2, dash: [6, 6], alpha: pass ? 1 : .4 });
      if (s === 0) {
        const p = d.seg(t, .15, .85);
        d.chip(d.lerp(NET.x + NET.w + 20, FW.x - 18, p), PY, "packet", { fill: c.edge, glow: true });
      } else if (s >= 2) {
        const inb = d.seg(t, 0, .12);
        const col = bad ? c.bad : sneaky ? c.orange : c.teal;
        if (!decided) {
          d.chip(d.lerp(NET.x + NET.w + 20, FW.x - 18, inb), PY,
                 bad ? "port 23" : "port 443", { fill: col, glow: true });
        } else {
          const out = d.seg(t, .55, .95);
          if (pass) d.chip(d.lerp(FW.x + FW.w + 20, LAN.x + 60, out), PY,
                           sneaky ? "file inside" : "port 443", { fill: sneaky ? c.orange : c.ok, glow: true });
          else d.chip(FW.x - 18, PY, "dropped", { fill: c.bad, glow: true, alpha: 1 - out * .7 });
        }
      } else if (s === 1) {
        d.chip(FW.x - 18, PY, "waiting", { fill: c.dim, labelFill: "#0f1626" });
      } else if (s === 5) {
        const p = d.seg(t, .1, .6);
        d.chip(d.lerp(NET.x + NET.w + 20, LAN.x + 60, p), PY, "traffic", { fill: c.edge, glow: true });
      }

      // ---- left-hand card ------------------------------------------------------
      d.box(CARD.x, CARD.y, CARD.w, CARD.h, { fill: "#16233c", stroke: c.line, r: 14 });
      if (s === 4) {
        d.text(CARD.x + 16, CARD.y + 22, "What it cannot check",
               { size: 13, weight: 800, fill: c.bad, baseline: "middle", max: CARD.w - 32 });
        ["malware inside traffic a rule allows", "a user opening a bad file",
         "a memory stick plugged in indoors", "a password that is easy to guess"]
          .forEach((r, i) => {
            const ap = d.seg(t, .15 + i * .14, .4 + i * .14);
            d.box(CARD.x + 14, CARD.y + 40 + i * 30, CARD.w - 28, 26,
                  { fill: c.panel, stroke: c.line, r: 7, alpha: ap });
            d.text(CARD.x + 24, CARD.y + 53 + i * 30, r,
                   { size: 11, weight: 600, fill: c.soft, baseline: "middle", max: CARD.w - 48, alpha: ap });
          });
      } else if (s === 5) {
        d.text(CARD.x + 16, CARD.y + 22, "Defence in depth",
               { size: 13, weight: 800, fill: c.ok, baseline: "middle", max: CARD.w - 32 });
        d.wrap(CARD.x + 16, CARD.y + 40,
               "No single measure covers everything. Each layer catches what the one before it misses, so an attacker has to get past all of them.",
               CARD.w - 32, { size: 12, fill: c.soft });
        d.wrap(CARD.x + 16, CARD.y + 112,
               "A firewall with no anti-malware behind it is a locked gate in an open field.",
               CARD.w - 32, { size: 12, fill: c.edge, alpha: d.seg(t, .4, .7) });
      } else {
        d.text(CARD.x + 16, CARD.y + 22, s === 3 ? "This packet's labels" : "This packet's labels",
               { size: 13, weight: 800, fill: c.dim, baseline: "middle", max: CARD.w - 32 });
        const info = bad
          ? [["from", "198.51.100.7"], ["to", "10.0.2.15"], ["port", "23  remote login"], ["direction", "coming in"]]
          : [["from", "203.0.113.9"], ["to", "10.0.2.20"], ["port", "443  web"], ["direction", "coming in"]];
        info.forEach((r, i) => {
          const ap = s >= 2 ? d.seg(t, .05 + i * .07, .25 + i * .07) : .45;
          d.text(CARD.x + 18, CARD.y + 52 + i * 27, r[0],
                 { size: 11.5, weight: 700, fill: c.dim, baseline: "middle", alpha: ap });
          d.text(CARD.x + CARD.w - 18, CARD.y + 52 + i * 27, r[1],
                 { size: 12.5, weight: 700, fill: bad && i === 2 ? c.bad : c.fg, baseline: "middle",
                   align: "right", max: 150, alpha: ap });
        });
        d.wrap(CARD.x + 18, CARD.y + 152, "That is all a firewall gets: addresses, ports and direction.",
               CARD.w - 36, { size: 11.5, fill: c.soft });
      }

      // ---- the rule table or the layers -----------------------------------------
      if (s === 5) {
        d.box(TAB.x, TAB.y, TAB.w, TAB.h, { fill: "#16233c", stroke: c.line, r: 14 });
        d.text(TAB.x + 18, TAB.y + 24, "Four layers, each covering a different gap",
               { size: 13, weight: 800, fill: c.dim, baseline: "middle", max: TAB.w - 36 });
        [["Firewall", "filters traffic by rules at the boundary", c.violet],
         ["Anti-malware", "inspects files on the devices themselves", c.teal],
         ["Strong authentication", "long passphrases, attempt limits and two-factor", c.ok],
         ["Trained users", "spot a bad message and report it", c.edge]]
          .forEach((r, i) => {
            const ap = d.seg(t, .1 + i * .16, .4 + i * .16);
            d.box(TAB.x + 18, TAB.y + 44 + i * 44, TAB.w - 36, 38,
                  { fill: c.panel, stroke: r[2], on: true, r: 9, alpha: ap });
            d.text(TAB.x + 34, TAB.y + 63 + i * 44, r[0],
                   { size: 13.5, weight: 800, fill: r[2], baseline: "middle", max: 190, alpha: ap });
            d.text(TAB.x + 236, TAB.y + 63 + i * 44, r[1],
                   { size: 12, weight: 600, fill: c.soft, baseline: "middle", max: 332, alpha: ap });
          });
      } else {
        d.box(TAB.x, TAB.y, TAB.w, TAB.h, { fill: "#16233c", stroke: c.line, r: 14 });
        d.text(TAB.x + 18, TAB.y + 24, "Rule list - read from the top, first match decides",
               { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: TAB.w - 36 });
        RULES.forEach((r, i) => {
          const ap = s === 0 ? .35 : s === 1 ? d.seg(t, .1 + i * .18, .4 + i * .18) : 1;
          const reached = scan >= i;
          const hit = decided && i === match;
          d.box(TAB.x + 34, TAB.y + 42 + i * 44, TAB.w - 68, 36,
                { fill: hit ? (r[2] === "ok" ? "#1d4a35" : "#4a2030") : c.panel,
                  stroke: hit ? (r[2] === "ok" ? c.ok : c.bad) : c.line, on: hit, r: 9,
                  alpha: ap * (s >= 2 && !reached ? .4 : 1) });
          d.text(TAB.x + 50, TAB.y + 60 + i * 44, r[0],
                 { size: 12.5, weight: 700, fill: hit ? c.fg : c.soft, baseline: "middle",
                   max: 420, alpha: ap * (s >= 2 && !reached ? .4 : 1) });
          d.chip(TAB.x + TAB.w - 76, TAB.y + 60 + i * 44, r[1],
                 { fill: r[2] === "ok" ? c.ok : c.bad, w: 64, h: 22, size: 11,
                   alpha: ap * (s >= 2 && !reached ? .4 : 1) });
          if (s >= 2 && scan >= i && scan < i + 1 && !decided)
            d.dot(TAB.x + 22, TAB.y + 60 + i * 44, 6, { fill: c.edge, glow: true });
          if (hit) d.dot(TAB.x + 22, TAB.y + 60 + i * 44, 6, { fill: r[2] === "ok" ? c.ok : c.bad, glow: true });
        });
        d.text(TAB.x + 18, TAB.y + 218, "Rules only name addresses, ports and direction - never what is inside.",
               { size: 11.5, weight: 600, fill: c.dim, baseline: "middle", max: TAB.w - 36 });
      }

      // ---- the verdict -----------------------------------------------------------
      if (s >= 2 && s <= 4) {
        const vc = s === 3 ? c.bad : s === 4 ? c.orange : c.ok;
        const vt = s === 3 ? "DROPPED" : "ALLOWED";
        d.box(VERD.x, VERD.y, VERD.w, VERD.h, { fill: "#16233c", stroke: vc, on: decided, r: 12,
                                                alpha: decided ? 1 : .4 });
        d.text(VERD.x + 18, VERD.y + 28, vt, { size: 19, weight: 800, fill: vc, baseline: "middle",
                                               alpha: decided ? 1 : .4 });
        d.text(VERD.x + VERD.w - 18, VERD.y + 28,
               s === 3 ? "by rule 3" : "by rule 1",
               { size: 12.5, weight: 700, fill: c.soft, baseline: "middle", align: "right",
                 alpha: decided ? 1 : .4 });
      }

      const notes = [
        ["Why position matters", "Put a firewall anywhere else and traffic can go round it. On the boundary there is no way round.", [FW.x + FW.w / 2, FW.y + FW.h]],
        ["Order is part of the rule", "A block rule below a matching allow rule never fires, because checking stops at the first match.", [TAB.x + 300, TAB.y + 60]],
        ["First match wins", "The firewall stops reading as soon as a rule matches. Rules 2 to 4 are never even looked at here.", [TAB.x + 300, TAB.y + 60]],
        ["Dropped, not bounced", "Sending back a refusal would confirm the address exists, so the packet is silently discarded instead.", [FW.x + 20, PY]],
        ["Not a scanner", "Checking contents is anti-malware's job, running on the devices. The firewall only ever saw an allowed port.", [LAN.x + 63, LAN.y + 67]],
        ["No single wall", "Exam answers that stop at 'install a firewall' lose marks. Name the layer and say what it covers.", [TAB.x + 300, TAB.y + 150]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
    } };
  });

  // ------------------------------------------------------------------ 1.6
  /* The life of a device. The misconception worth breaking: students put the
   * whole environmental cost in the charging, when most of it is spent before
   * the device is ever switched on. */
  A("lifecycle", function () {
    const W = 980, H = 580;
    const SW = 156, GAP = 30, SY = 92, SH = 94;
    const stage = i => ({ x: 40 + i * (SW + GAP), y: SY, w: SW, h: SH });
    const C1 = { x: 40, y: 232, w: 288, h: 120 };
    const C2 = { x: 346, y: 232, w: 288, h: 120 };
    const C3 = { x: 652, y: 232, w: 288, h: 120 };
    const BAR = { x: 40, y: 372, w: 900, h: 70 };

    const STAGES = [
      ["Raw materials", "mined and refined", "#ffa028"],
      ["Manufacture", "parts and assembly", "#aa6eeb"],
      ["Shipping", "factory to shop", "#5ab4ff"],
      ["Years of use", "charging and running", "#50dc96"],
      ["End of life", "bin or recycle", "#ff5f5f"]
    ];

    const steps = [
      { name: "1. Out of the ground", caption: "Metals and rare earth elements are mined, then refined. That takes energy, water and land, long before anything is assembled." },
      { name: "2. Making it", caption: "Chips are made in enormous, energy-hungry factories. Hundreds of parts from many countries are then assembled." },
      { name: "3. Getting it to you", caption: "Components and finished devices travel by ship, plane and lorry. It is a real cost, but a small share of the total." },
      { name: "4. Years of use", caption: "Now the device draws power. A phone uses a few units of electricity a year; a desktop and monitor use far more." },
      { name: "5. End of life", caption: "A device is binned, shipped abroad, or recycled. Recycling recovers some of the metals, but never all of them." },
      { name: "6. Where the cost falls", caption: "For a typical smartphone, most of the footprint is spent making it. The charging that students worry about is a small slice." },
      { name: "7. What actually helps", caption: "Keeping a device longer spreads that large manufacturing cost over more years. That is the single biggest thing a user can do." }
    ];

    const CARDS = [
      [["Metals", "copper, gold, aluminium and tin, in tiny amounts spread through the device"],
       ["Rare earths", "lithium for the battery and elements used in magnets and screens"],
       ["The hidden weight", "tens of kilograms of rock are moved and processed for a device weighing under 200 g"]],
      [["Chip fabrication", "ultra-pure water, clean rooms and a great deal of electricity for every wafer"],
       ["Hundreds of parts", "made in different countries, then brought together to be assembled"],
       ["Spent in advance", "most of the carbon is already spent by the time the box is sealed"]],
      [["By sea", "cheapest per item, and the slowest"],
       ["By air", "far more carbon for the same box, used when a launch date matters"],
       ["Then by road", "warehouse to shop to doorstep, often more than once"]],
      [["A phone", "a few units of electricity a year to charge - pennies, and little carbon"],
       ["A desktop and monitor", "left on all day, this can be a hundred times a phone's draw"],
       ["Where the power comes from", "the same device has a different footprint on a wind-powered grid"]],
      [["Landfill", "lead, mercury and other toxins can leak into soil and water"],
       ["Exported", "sent abroad as 'used goods' and often taken apart unsafely by hand"],
       ["Recycled", "metals are recovered, but only part of what went in, and only if it reaches a proper plant"]],
      null,
      [["Keep it longer", "a phone kept five years instead of two spreads the making cost over more than twice the time"],
       ["Repair and upgrade", "a new battery or more storage costs a fraction of a new device's footprint"],
       ["Recycle properly", "take it to a WEEE collection point so the metals go back into the supply, not into the ground"]]
    ];

    const SLICE = [["Making it", 80, "#aa6eeb"], ["Shipping", 3, "#5ab4ff"],
                   ["Using it for 3 years", 16, "#50dc96"], ["Disposal", 1, "#ff5f5f"]];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("The life of a device - where the environmental cost really falls");

      // ---- the pipeline ------------------------------------------------------
      STAGES.forEach((st, i) => {
        const b = stage(i);
        const on = s === i || (s >= 5);
        const lit = s === i;
        d.box(b.x, b.y, b.w, b.h, { fill: lit ? "#22314f" : c.panel, stroke: lit ? st[2] : c.line,
                                    on: lit, r: 12, label: st[0], sub: st[1],
                                    size: 15, subSize: 11, max: b.w - 18,
                                    alpha: s >= 5 ? .85 : (s === i ? 1 : .5) });
        void on;
        if (i < 4) {
          const nb = stage(i + 1);
          d.arrow(b.x + b.w + 3, b.y + b.h / 2, nb.x - 5, nb.y + nb.h / 2,
                  { stroke: s === i ? st[2] : c.line, width: 2.2, size: 8,
                    alpha: s === i ? 1 : .5 });
        }
      });
      if (s <= 4) {
        const b = stage(s);
        const p = d.seg(t, .1, .9);
        d.chip(d.lerp(b.x + 18, b.x + b.w - 18, p), b.y + b.h + 16,
               ["ore", "parts", "crate", "power", "waste"][s],
               { fill: STAGES[s][2], glow: true, h: 22, size: 11.5 });
      } else {
        const p = (t * .9) % 1;
        const q = d.onPath([[58, SY + SH + 16], [940 - 18, SY + SH + 16]], p);
        d.chip(q[0], q[1], "one device", { fill: c.edge, glow: true, h: 22, size: 11.5 });
      }

      // ---- the detail --------------------------------------------------------
      if (s === 5) {
        d.text(40, 216, "Share of a smartphone's lifetime carbon footprint",
               { size: 13, weight: 800, fill: c.dim, baseline: "middle" });
        const BX = 40, BY = 240, BW = 900, BH = 58;
        d.box(BX, BY, BW, BH, { fill: "#141f36", stroke: c.line, r: 10 });
        let cx = BX;
        SLICE.forEach((sl, i) => {
          const ap = d.seg(t, i * .16, .4 + i * .16);
          const w = BW * sl[1] / 100 * ap;
          d.box(cx, BY, Math.max(3, w), BH, { fill: sl[2], stroke: sl[2], r: i === 0 ? 10 : 2 });
          if (sl[1] >= 10)
            d.text(cx + w / 2, BY + BH / 2, sl[1] + "%",
                   { size: 18, weight: 800, fill: "#0f1626", align: "center", baseline: "middle",
                     max: Math.max(10, w - 10), alpha: ap });
          cx += BW * sl[1] / 100 * ap;
        });
        /* A 1% slice is nine pixels wide, so its label cannot sit under it: the
         * three small ones ran into each other and off the right edge. Anything
         * wide enough is labelled in place, the rest go in a legend underneath. */
        let lx = BX, legx = BX;
        SLICE.forEach((sl, i) => {
          const w = BW * sl[1] / 100;
          const ap = d.seg(t, .2 + i * .14, .5 + i * .14);
          if (w >= 110) {
            d.text(lx + w / 2, BY + BH + 20, sl[0],
                   { size: 12.5, weight: 800, fill: sl[2], align: "center", baseline: "middle",
                     max: w - 8, alpha: ap });
          } else {
            d.box(legx, BY + BH + 13, 13, 13, { fill: sl[2], stroke: sl[2], r: 3, alpha: ap });
            const txt = sl[0] + "  " + sl[1] + "%";
            d.text(legx + 20, BY + BH + 20, txt,
                   { size: 12.5, weight: 800, fill: sl[2], baseline: "middle", alpha: ap });
            legx += 26 + d.measure(txt, 12.5, 800) + 24;
          }
          lx += w;
        });
        d.box(40, 342, 900, 100, { fill: "#16233c", stroke: c.edge, on: true, r: 14 });
        d.text(62, 368, "Read it the other way round", { size: 13.5, weight: 800, fill: c.edge, baseline: "middle" });
        d.wrap(62, 386, "Charging a phone carefully for three years saves a slice of that 16%. Keeping the phone for a fourth and fifth year saves a share of the 80%. Rough figures from manufacturers' own reports, for a phone - a desktop PC uses far more electricity, so its use share is bigger.",
               856, { size: 12.5, fill: c.soft });
      } else {
        const cards = CARDS[s];
        d.text(40, 216, ["What comes out of the ground", "What the factory costs",
                         "How it travels", "What it draws while you own it",
                         "Three ways it ends", "", "Three things that genuinely help"][s],
               { size: 13, weight: 800, fill: c.dim, baseline: "middle" });
        [C1, C2, C3].forEach((bx, i) => {
          const r = cards[i], ap = d.seg(t, .1 + i * .16, .4 + i * .16);
          const col = s === 6 ? c.ok : STAGES[Math.min(s, 4)][2];
          d.box(bx.x, bx.y, bx.w, bx.h, { fill: "#16233c", stroke: col, on: true, r: 12, alpha: ap });
          d.text(bx.x + 18, bx.y + 26, r[0], { size: 14, weight: 800, fill: col, baseline: "middle",
                                               max: bx.w - 36, alpha: ap });
          d.wrap(bx.x + 18, bx.y + 42, r[1], bx.w - 36, { size: 12, fill: c.soft, alpha: ap });
        });

        d.box(BAR.x, BAR.y, BAR.w, BAR.h, { fill: "#16233c", stroke: c.line, r: 12 });
        if (s === 0) {
          const g = d.seg(t, .15, .85);
          d.text(58, BAR.y + 20, "rock moved and processed", { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
          d.box(58, BAR.y + 32, 740, 22, { fill: "#141f36", stroke: c.line, r: 8 });
          d.box(58, BAR.y + 32, Math.max(6, 740 * g), 22, { fill: c.orange, stroke: c.orange, r: 8 });
          d.text(812, BAR.y + 43, "tens of kg", { size: 12.5, weight: 800, fill: c.orange, baseline: "middle" });
          d.dot(900, BAR.y + 43, 7, { fill: c.ok });
          d.text(916, BAR.y + 43, "phone", { size: 11.5, weight: 700, fill: c.ok, baseline: "middle" });
        } else if (s === 1) {
          const g = d.seg(t, .2, .9);
          d.text(58, BAR.y + 20, "share of the whole lifetime footprint spent before first use",
                 { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
          d.box(58, BAR.y + 32, 824, 22, { fill: "#141f36", stroke: c.line, r: 8 });
          d.box(58, BAR.y + 32, Math.max(6, 824 * .8 * g), 22, { fill: c.violet, stroke: c.violet, r: 8 });
          d.text(898, BAR.y + 43, "about 80%", { size: 13, weight: 800, fill: c.violet, baseline: "middle", align: "right" });
        } else if (s === 2) {
          d.text(58, BAR.y + 20, "one route a phone takes before it reaches a shelf",
                 { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
          const pts = [[70, BAR.y + 46], [300, BAR.y + 46], [560, BAR.y + 46], [780, BAR.y + 46], [900, BAR.y + 46]];
          d.path(pts, { stroke: c.info, width: 2.4, dash: [6, 5] });
          ["mine", "factory", "port", "warehouse", "shop"].forEach((l, i) => {
            d.dot(pts[i][0], pts[i][1], 6, { fill: c.info });
            d.text(pts[i][0], BAR.y + 30, l, { size: 11, weight: 700, fill: c.soft,
                                               align: "center", baseline: "middle" });
          });
          const q = d.onPath(pts, (t * .9) % 1);
          d.dot(q[0], q[1], 9, { fill: c.edge, glow: true });
        } else if (s === 3) {
          const yrs = d.clamp(t, 0, 1) * 3;
          d.text(58, BAR.y + 20, "electricity used charging one phone", { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
          d.box(58, BAR.y + 32, 600, 22, { fill: "#141f36", stroke: c.line, r: 8 });
          d.box(58, BAR.y + 32, Math.max(6, 600 * yrs / 3), 22, { fill: c.ok, stroke: c.ok, r: 8 });
          d.text(672, BAR.y + 43, "year " + yrs.toFixed(1) + " of 3",
                 { size: 12.5, weight: 800, fill: c.ok, baseline: "middle" });
          d.text(922, BAR.y + 43, "roughly 2 kWh a year",
                 { size: 12.5, weight: 800, fill: c.soft, baseline: "middle", align: "right" });
        } else if (s === 4) {
          d.text(58, BAR.y + 20, "roughly how the world's electronic waste is dealt with",
                 { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
          const segs2 = [["formally recycled", 22, c.ok], ["binned, exported or unrecorded", 78, c.bad]];
          let cx = 58;
          segs2.forEach((g, i) => {
            const ap = d.seg(t, i * .2, .5 + i * .2);
            const w = 824 * g[1] / 100 * ap;
            d.box(cx, BAR.y + 32, Math.max(4, w), 22, { fill: g[2], stroke: g[2], r: 8 });
            d.text(cx + Math.max(4, w) / 2, BAR.y + 43, g[1] + "%",
                   { size: 12, weight: 800, fill: "#0f1626", align: "center", baseline: "middle",
                     max: Math.max(10, w - 8), alpha: ap });
            cx += 824 * g[1] / 100 * ap;
          });
          d.text(58, BAR.y + 62, "about a fifth is recycled through a proper plant",
                 { size: 11.5, weight: 700, fill: c.soft, baseline: "middle" });
        } else {
          const g = d.seg(t, .2, .9);
          d.text(58, BAR.y + 20, "footprint per year of use, if the same phone is kept longer",
                 { size: 11.5, weight: 700, fill: c.dim, baseline: "middle" });
          [["2 years", 1, c.bad], ["3 years", .67, c.orange], ["5 years", .4, c.ok]]
            .forEach((r, i) => {
              d.text(58 + i * 300, BAR.y + 43, r[0], { size: 12.5, weight: 800, fill: r[2], baseline: "middle" });
              d.box(120 + i * 300, BAR.y + 33, 170, 20, { fill: "#141f36", stroke: c.line, r: 7 });
              d.box(120 + i * 300, BAR.y + 33, Math.max(5, 170 * r[1] * g), 20,
                    { fill: r[2], stroke: r[2], r: 7 });
            });
        }
      }

      const notes = [
        ["Before it exists", "Mining and refining already cost energy, water and habitat, for a device nobody has switched on yet.", [stage(0).x + SW / 2, SY + SH]],
        ["The big slice", "This stage, not the charging, is where most of a device's carbon is spent. That is the exam point.", [stage(1).x + SW / 2, SY + SH]],
        ["Small but real", "Transport is a few per cent of the total. Air freight for a launch costs far more than sea freight.", [stage(2).x + SW / 2, SY + SH]],
        ["The part people notice", "Use is the only stage a user can see on a bill, which is why it gets blamed for the whole footprint.", [stage(3).x + SW / 2, SY + SH]],
        ["Not a clean ending", "Devices contain valuable metals and harmful ones in the same case, so how they are taken apart matters.", [stage(4).x + SW / 2, SY + SH]],
        ["Why replacing hurts", "A new device repeats the 80% from scratch. No amount of careful charging makes that back.", [490, 269]],
        ["Longer life, lower share", "Same device, same making cost, spread over more years - so the cost per year of use falls.", [490, BAR.y + 43]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
    } };
  });
})();
