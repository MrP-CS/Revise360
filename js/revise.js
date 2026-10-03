/* Revision 360 on a page: the 360 room, and the question window inside it.
 *
 * This file draws. It does not decide anything: which question comes next, what
 * an answer is worth and what that says about what to revise are all
 * js/revengine.js, which the headset calls too. If a mark ever differs between
 * the page and a headset, it is because something in HERE has gone wrong, and
 * that is deliberate - there is only one place the marking can be.
 *
 * The room is a real scene built by tools/revroom.py, drawn the same way the
 * course's lessons are. The question window sits in front of it, as a station's
 * questions do. Section 2: this is not a quiz page with a photograph behind it,
 * and the walls carry the command words, the mark conventions and the topic list
 * so a learner who looks up finds something worth reading.
 */
(async function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const CFG = window.APP_CONFIG;
  const params = new URLSearchParams(location.search);

  const student = Store.student();
  if (!student) {
    location.href = "index.html?next=" + encodeURIComponent("revise.html");
    return;
  }
  await Store.pull();

  // ---------------------------------------------------------------- the room
  const ROOM = "revision-room";
  let exp = null;
  try {
    exp = await (await fetch("experiences/" + ROOM + ".json", { cache: "no-cache" })).json();
  } catch (e) {
    document.body.innerHTML = '<div class="webgl-fallback"><h1>Revision 360</h1>'
      + "<p>The revision room could not be loaded. Check your connection and reload.</p></div>";
    return;
  }

  const THREE = window.THREE;
  const v = $("#v");
  let r, scene, cam, grp, mat, sphere;
  const frameHooks = [], sceneHooks = [];
  let lon = 0, lat = 0, dragging = false, px = 0, py = 0;

  function build3D() {
    r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(innerWidth, innerHeight);
    r.xr.enabled = true;
    v.appendChild(r.domElement);
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .1, 1100);
    grp = new THREE.Group(); scene.add(grp);
    const g = new THREE.SphereGeometry(500, 60, 40); g.scale(-1, 1, 1);
    mat = new THREE.MeshBasicMaterial({ map: texFor(0) });
    sphere = new THREE.Mesh(g, mat); grp.add(sphere);
    addEventListener("resize", size);
    v.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; py = e.clientY; v.style.cursor = "grabbing"; });
    addEventListener("pointerup", () => { dragging = false; v.style.cursor = "grab"; });
    addEventListener("pointermove", e => {
      if (!dragging) return;
      lon -= (e.clientX - px) * .12; lat += (e.clientY - py) * .12;
      lat = Math.max(-85, Math.min(85, lat)); px = e.clientX; py = e.clientY;
    });
    addEventListener("keydown", e => {
      if (/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName)) return;
      if (e.key === "ArrowLeft") lon -= 4;
      else if (e.key === "ArrowRight") lon += 4;
      else if (e.key === "ArrowUp") lat = Math.min(85, lat + 3);
      else if (e.key === "ArrowDown") lat = Math.max(-85, lat - 3);
      else return;
      e.preventDefault();
    });
    r.setAnimationLoop(tick);
  }
  function texFor() {
    const sc = exp.scenes[0];
    const want = (navigator.xr && innerWidth > 1200) ? (sc.imgHi || sc.img) : sc.img;
    const t = new THREE.TextureLoader().load("experiences/" + want);
    t.minFilter = THREE.LinearFilter;
    return t;
  }
  function size() { r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  let last = 0;
  function tick(t) {
    const dt = (t - last) / 1000; last = t;
    if (!r.xr.isPresenting) {
      const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon);
      cam.lookAt(500 * Math.sin(phi) * Math.cos(th), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(th));
    }
    frameHooks.forEach(f => { try { f(dt); } catch (e) {} });
    r.render(scene, cam);
  }
  build3D();

  // ---------------------------------------------------------------- chrome
  let toastT;
  function toast(msg) {
    if (core.inVR && core.toastHook) return core.toastHook(msg);
    const el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 5000);
  }
  function openDrawer(html, cls) {
    const d = $("#drawer");
    d.className = "drawer open " + (cls || "");
    d.innerHTML = '<button class="x" aria-label="Close panel">×</button>' + html;
    d.querySelector(".x").onclick = closeDrawer;
  }
  function closeDrawer() { $("#drawer").className = "drawer"; $("#drawer").innerHTML = ""; }

  const modal = $("#modal"), box = $("#box");
  function showBox(title, col, inner, cls) {
    box.className = "box huge plain " + (cls || "");
    box.style.setProperty("--c", col || "#ffd046");
    box.innerHTML = '<div class="head"><span id="mt">' + esc(title) + "</span></div>"
                  + '<div class="mbody">' + inner + "</div>";
    modal.classList.add("open");
  }
  function closeBox() { modal.classList.remove("open"); box.innerHTML = ""; }

  // ---------------------------------------------------------------- start up
  const Engine = window.R360Engine, Bank = window.R360Bank;
  await Bank.start();
  Engine.load();
  if (!Engine.topics().length) Engine.setTopics(Bank.topics());
  if (params.get("topic") && Bank.topic(params.get("topic"))) Engine.setTopics([params.get("topic")]);
  const missing = await Engine.refresh();
  if (missing.length) toast("Some questions could not be loaded. Revision continues with the rest.");
  Engine.session();

  // ---------------------------------------------------------------- the stream
  let current = null, phase = "ask", lastResult = null, improving = false;
  let confidence = null, draftTimer = null;

  function hud() {
    const s = Engine.session(), p = Engine.progress();
    const pct = s.avail ? Math.round(100 * s.firstGot / s.avail) : 0;
    $("#hud").innerHTML = "<b>" + s.firstGot + " / " + s.avail + "</b> marks"
      + (s.avail ? " · " + pct + "%" : "")
      + (s.recovered ? '<br><span class="muted">' + s.recovered + " recovered</span>" : "")
      + (p ? '<br><span class="muted">' + p.done + " of " + p.of + " " + p.kind + "</span>" : "");
    const ts = Engine.topics();
    $("#where").innerHTML = "<b>" + Engine.MODES[Engine.state.mode].label + "</b> · "
      + (ts.length === Bank.topics().length ? "all topics"
         : ts.length === 1 ? esc(ts[0] + " " + Bank.title(ts[0])) : ts.length + " topics");
  }

  function ask() {
    improving = false; confidence = null; lastResult = null; phase = "ask";
    const q = Engine.pick();
    current = q;
    if (!q) {
      showBox("Nothing left to ask", "#ffd046",
        "<p class=\"q\">There are no more questions in the topics you have chosen that you "
        + "have not just seen.</p><p>Choose more topics, or finish the session and come back "
        + "later — questions you got wrong come round again after a while, not straight "
        + "away.</p><div class=\"mrow\"><button class=\"btn ghost\" id=\"more\">Choose topics</button>"
        + "<button class=\"btn\" id=\"fin\">Finish session</button></div>");
      $("#more").onclick = topics; $("#fin").onclick = finish;
      return;
    }
    Engine.state.current = { id: q.id };
    Engine.save();
    paint();
    hud();
  }

  /* One question screen. Everything a learner needs to see is on it at once:
   * the topic, the kind of question, what it is worth, the question, somewhere
   * to answer, a hint if there is one, and how to submit. Section 73. */
  function paint() {
    const q = current;
    const rev = Bank.revisit(q);
    const kind = KIND[q.type] || q.type;
    const head = '<div class="qmeta">'
      + '<span class="tag">' + esc(q.topic + " " + Bank.title(q.topic)) + "</span>"
      + '<span class="tag">' + esc(kind) + "</span>"
      + (q.commandWord ? '<span class="tag">' + esc(q.commandWord.toUpperCase()) + "</span>" : "")
      + (q.examStyle ? '<span class="tag exam">Exam style</span>' : "")
      + '<span class="marks">' + q.marks + (q.marks === 1 ? " mark" : " marks") + "</span>"
      + '<button class="star" id="star" aria-pressed="' + (Engine.isBookmarked(q.id) ? "true" : "false")
      + '" aria-label="Bookmark this question" title="Bookmark this question">'
      + (Engine.isBookmarked(q.id) ? "★" : "☆") + "</button></div>";
    const body = BUILD[q.type] ? BUILD[q.type](q) : "<p>This question cannot be shown here.</p>";
    const hint = q.hint ? '<p class="qn"><button class="btn ghost small" id="hintBtn">Hint</button>'
                        + ' <span id="hintText" hidden>' + esc(q.hint) + "</span></p>" : "";
    showBox(Engine.MODES[Engine.state.mode].label, "#ffd046",
            head + '<p class="q">' + esc(q.q) + "</p>" + body + hint
            + confidenceRow() + '<div class="fb" id="fb"></div><div class="mrow" id="actions"></div>');
    $("#star").onclick = () => {
      const on = Engine.bookmark(q.id);
      $("#star").setAttribute("aria-pressed", on ? "true" : "false");
      $("#star").textContent = on ? "★" : "☆";
      toast(on ? "Bookmarked. Find it again under Progress." : "Bookmark removed.");
    };
    if (q.hint) $("#hintBtn").onclick = () => {
      $("#hintText").hidden = false; $("#hintBtn").remove();
    };
    wireConfidence();
    if (WIRE[q.type]) WIRE[q.type](q);
    actions([{ id: "submit", label: submitLabel(q), primary: true, fn: () => submit(q) }]);
  }

  function submitLabel(q) {
    if (q.type === "extended") return "I have written my answer";
    return "Check my answer";
  }

  const KIND = {
    mcq: "Multiple choice", tf: "True or false", multi: "Choose all that apply",
    match: "Matching", order: "Put in order", sort: "Sort into groups",
    short: "Short answer", written: "Written answer", extended: "Extended response",
    num: "Calculation", convert: "Conversion", binadd: "Binary addition",
    binshift: "Binary shift", truth: "Truth table", trace: "Trace table",
    codeout: "What does this print?"
  };

  function actions(list) {
    const row = $("#actions");
    row.innerHTML = "";
    list.forEach(a => {
      const b = document.createElement("button");
      b.className = "btn" + (a.primary ? "" : " ghost");
      b.id = a.id; b.textContent = a.label; b.onclick = a.fn;
      row.appendChild(b);
    });
  }

  /* Optional, and it stays optional: nothing waits for it and nothing nags.
   * What it is for is section 37 - an answer that was wrong and certain is a
   * misconception, and comes back sooner than a guess does. */
  function confidenceRow() {
    return '<div class="confid" id="conf">How sure are you? <span class="seg">'
      + Engine.CONFIDENCE.map((c, i) => '<button type="button" data-c="' + i
          + '" aria-pressed="false">' + esc(c) + "</button>").join("")
      + '</span><span class="muted">Optional</span></div>';
  }
  function wireConfidence() {
    const el = $("#conf"); if (!el) return;
    el.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
      confidence = +b.dataset.c;
      el.querySelectorAll("[data-c]").forEach(x =>
        x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    });
  }

  // ---------------------------------------------------------------- the kinds
  const held = {};        // whatever the current question's widget is holding

  const BUILD = {
    mcq: q => '<div class="opts" id="opts">' + shuffled(q).map((o, i) =>
      '<button class="opt" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>",
    tf: q => BUILD.mcq(q),
    multi: q => '<div class="chips" id="chips">' + q.options.map((o, i) =>
      '<button class="chip" data-o="' + i + '" aria-pressed="false">' + esc(o) + "</button>").join("")
      + "</div>",
    match: q => {
      const rights = shuffle(q.pairs.map(p => p[1]));
      held.rights = rights;
      return '<p class="qn">Choose an item, then choose what it matches.</p><div class="items" id="left">'
        + q.pairs.map((p, i) => '<div class="item"><span>' + esc(p[0])
            + ' <b id="m' + i + '" class="muted"></b></span>'
            + '<button class="btn ghost small" data-l="' + i + '">Choose</button></div>').join("")
        + '</div><div class="chips" id="rights">' + rights.map((x, i) =>
            '<button class="chip" data-r="' + i + '">' + esc(x) + "</button>").join("") + "</div>";
    },
    order: q => {
      held.pool = shuffle(q.steps.slice()); held.seq = [];
      return '<div class="orderwrap"><ol class="olist" id="seq">'
        + q.steps.map(() => '<li class="empty">…</li>').join("") + "</ol>"
        + '<div class="pool" id="pool"></div></div>';
    },
    sort: q => {
      held.pick = {};
      return '<div class="items" id="sortitems">' + shuffle(q.items.map((it, i) => [it, i]))
        .map(([it, i]) => '<div class="item stack"><span>' + esc(it[0]) + "</span>"
          + '<span class="seg">' + q.cats.map(c =>
              '<button data-i="' + i + '" data-c="' + esc(c) + '" aria-pressed="false">'
              + esc(c) + "</button>").join("") + "</span></div>").join("") + "</div>";
    },
    short: q => writing(q, true),
    written: q => writing(q, false),
    extended: q => writing(q, false)
      + '<p class="qn">A six-mark answer is not marked automatically here. When you have '
      + "written it, you will be shown the mark points and mark it yourself.</p>",
    num: q => exact(q, false) + (q.unit ? '<span class="unit">' + esc(q.unit) + "</span>" : ""),
    convert: q => exact(q, true),
    binadd: q => exact(q, true),
    binshift: q => exact(q, true),
    codeout: q => (q.code ? '<pre class="code" id="qcode"></pre>' : "") + exact(q, true),
    truth: q => grid(q),
    trace: q => (q.code ? '<pre class="code" id="qcode"></pre>' : "") + grid(q)
  };

  function writing(q, one) {
    const draft = (Engine.state.q[q.id] || {}).draft || "";
    return '<textarea class="answer' + (one ? " one" : "") + '" id="ans" rows="' + (one ? 2 : 5)
      + '" aria-label="Your answer" placeholder="Write your answer here…">'
      + esc(draft) + '</textarea><p class="saved" id="saved"></p>';
  }
  function exact(q, mono) {
    return '<input class="exact' + (mono ? " mono" : "") + '" id="ans" autocomplete="off" '
      + 'spellcheck="false" aria-label="Your answer">';
  }
  function grid(q) {
    let html = '<table class="gridq" id="grid"><thead><tr>'
      + q.cols.map(c => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>";
    q.rows.forEach((row, ri) => {
      html += "<tr>" + row.map((cell, ci) => cell !== ""
        ? '<td class="given">' + esc(cell) + "</td>"
        : '<td><input data-r="' + ri + '" data-c="' + ci + '" autocomplete="off" '
          + 'spellcheck="false" aria-label="' + esc(q.cols[ci] + " row " + (ri + 1)) + '"></td>'
      ).join("") + "</tr>";
    });
    return html + "</tbody></table>";
  }

  const WIRE = {
    mcq: () => {
      $("#opts").querySelectorAll(".opt").forEach(b => b.onclick = () => {
        held.chosen = +b.dataset.i;
        $("#opts").querySelectorAll(".opt").forEach(x =>
          x.classList.toggle("sel", x === b));
        $("#opts").querySelectorAll(".opt").forEach(x => x.style.borderColor = x === b ? "var(--edge)" : "");
      });
    },
    tf: () => WIRE.mcq(),
    multi: () => {
      held.on = new Set();
      $("#chips").querySelectorAll(".chip").forEach(b => b.onclick = () => {
        const i = +b.dataset.o;
        if (held.on.has(i)) held.on.delete(i); else held.on.add(i);
        b.setAttribute("aria-pressed", held.on.has(i) ? "true" : "false");
      });
    },
    match: q => {
      held.pairs = {}; held.sel = 0;
      const mark = () => q.pairs.forEach((p, i) =>
        $("#m" + i).textContent = held.pairs[i] ? "→ " + held.pairs[i] : "");
      $("#left").querySelectorAll("[data-l]").forEach(b => b.onclick = () => {
        held.sel = +b.dataset.l;
        $("#left").querySelectorAll("[data-l]").forEach(x =>
          x.style.borderColor = x === b ? "var(--edge)" : "");
      });
      $("#rights").querySelectorAll("[data-r]").forEach(b => b.onclick = () => {
        held.pairs[held.sel] = held.rights[+b.dataset.r];
        const next = q.pairs.findIndex((_, i) => !held.pairs[i]);
        held.sel = next >= 0 ? next : held.sel;
        mark();
      });
    },
    order: q => {
      const draw = () => {
        const seq = $("#seq");
        seq.innerHTML = q.steps.map((_, i) => held.seq[i]
          ? "<li>" + esc(held.seq[i]) + "</li>" : '<li class="empty">…</li>').join("");
        $("#pool").innerHTML = held.pool.filter(p => held.seq.indexOf(p) < 0)
          .map(p => '<button class="opt" data-p="' + esc(p) + '">' + esc(p) + "</button>").join("")
          + (held.seq.length ? '<button class="btn ghost small" id="reset">Start again</button>' : "");
        $("#pool").querySelectorAll("[data-p]").forEach(b => b.onclick = () => {
          held.seq.push(b.dataset.p); draw();
        });
        const rs = $("#reset"); if (rs) rs.onclick = () => { held.seq = []; draw(); };
      };
      draw();
    },
    sort: q => {
      $("#sortitems").querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        held.pick[i] = b.dataset.c;
        $("#sortitems").querySelectorAll('[data-i="' + i + '"]').forEach(x =>
          x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      });
    },
    short: q => wireWriting(q),
    written: q => wireWriting(q),
    extended: q => wireWriting(q),
    codeout: q => paintCode(q),
    trace: q => paintCode(q)
  };

  function paintCode(q) {
    const el = $("#qcode"); if (!el || !q.code) return;
    if (window.R360Tok && R360Tok.html) el.innerHTML = R360Tok.html(q.code);
    else el.textContent = q.code;
  }

  /* Section 69: a draft is not lost to a refresh, a stray back button or a trip
   * into the lesson the question points at. It is saved as it is typed, on the
   * question, and put back when the question is drawn again. */
  function wireWriting(q) {
    const a = $("#ans");
    a.focus();
    a.addEventListener("input", () => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => {
        const r0 = (Engine.state.q[q.id] = Engine.state.q[q.id] || { attempts: 0 });
        r0.draft = a.value;
        Engine.save();
        $("#saved").textContent = a.value.trim() ? "Draft saved." : "";
      }, 600);
    });
  }

  function shuffled(q) {
    if (!held.order || held.orderFor !== q.id) {
      held.orderFor = q.id;
      held.order = shuffle(q.options.map((_, i) => i));
    }
    return held.order.map(i => q.options[i]);
  }
  function shuffle(a) {
    const out = a.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  function response(q) {
    switch (q.type) {
      case "mcq": case "tf":
        return held.chosen == null ? null : q.options[held.order[held.chosen]];
      case "multi":
        return [...held.on].map(i => q.options[i]);
      case "match": return held.pairs;
      case "order": return held.seq;
      case "sort": return held.pick;
      case "truth": case "trace": {
        const cells = {};
        $("#grid").querySelectorAll("input").forEach(i =>
          cells[i.dataset.r + "," + i.dataset.c] = i.value);
        return cells;
      }
      default: return ($("#ans") || {}).value || "";
    }
  }

  function unanswered(q, resp) {
    if (resp == null) return true;
    if (Array.isArray(resp)) return !resp.length;
    if (typeof resp === "object") return !Object.keys(resp).length;
    return !String(resp).trim();
  }

  // ---------------------------------------------------------------- marking
  function submit(q) {
    const resp = response(q);
    if (unanswered(q, resp)) { toast("Write or choose an answer first."); return; }
    if (q.type === "extended") { selfReview(q, resp); return; }
    const res = Engine.submit(q, resp, { confidence: confidence, improve: improving });
    lastResult = res; phase = "marked";
    showMark(q, res, resp);
  }

  function showMark(q, res, resp) {
    lock(q);
    const fb = $("#fb");
    fb.className = "fb show " + (res.full ? "ok" : res.got ? "" : "no");
    if (!res.full && res.got) fb.style.background = "#2a2410";
    let html = "<strong>" + res.got + " / " + res.max + " mark" + (res.max === 1 ? "" : "s")
      + (res.isImprovement ? " on your improved answer" : "") + "</strong>";
    if (res.capped) html += "<p>" + esc(res.capped) + "</p>";
    if (res.detail && res.detail.length) {
      html += '<ul class="points">' + res.detail.map(d =>
        '<li class="' + (d.met ? "got" : "lost") + '"><i>' + (d.met ? "✓" : "○")
        + "</i><span>" + esc(d.concept) + "</span></li>").join("") + "</ul>";
    } else if (res.missed && res.missed.length && !res.full) {
      html += '<ul class="points">' + res.missed.map(m =>
        '<li class="lost"><i>○</i><span>' + esc(m) + "</span></li>").join("") + "</ul>";
    }
    if (q.feedback) html += "<p>" + esc(q.feedback) + "</p>";
    if (res.isImprovement && res.first) {
      html += '<p class="sourceline">First attempt ' + res.first.got + " / " + res.first.max
            + " · improved " + res.bestSoFar.got + " / " + res.bestSoFar.max
            + (res.recovered ? " · <b>" + res.recovered + " mark"
               + (res.recovered === 1 ? "" : "s") + " recovered</b>" : "") + "</p>";
    }
    fb.innerHTML = html;

    const rev = Bank.revisit(q);
    if (!res.full && rev) {
      const a = document.createElement("a");
      a.className = "revisit"; a.href = rev.href;
      a.innerHTML = "<b>Revise this</b>" + esc(rev.label)
        + (rev.reason ? '<br><span class="muted">' + esc(rev.reason) + "</span>" : "");
      fb.appendChild(a);
    }

    const acts = [];
    if (res.canImprove && !improving)
      acts.push({ id: "improve", label: "Improve my answer", primary: true,
                  fn: () => improve(q) });
    if (!res.full && (q.type === "short" || q.type === "written") && improving)
      acts.push({ id: "example", label: "Show example answer", fn: () => showExample(q) });
    acts.push({ id: "next", label: "Next question", primary: !res.canImprove || improving,
                fn: ask });
    actions(acts);
    hud();
    if (Engine.finished()) {
      actions([{ id: "fin", label: "See how you did", primary: true, fn: finish }]);
    }
  }

  function lock(q) {
    const b = $("#box");
    b.querySelectorAll(".opt, .chip, .seg button, [data-l], [data-r], [data-p], #reset")
      .forEach(x => x.disabled = true);
    const ans = $("#ans"); if (ans) ans.disabled = true;
    b.querySelectorAll("#grid input").forEach(i => i.disabled = true);
    const c = $("#conf"); if (c) c.remove();
    // Show where the right answer was, once it cannot be changed.
    if (q.type === "mcq" || q.type === "tf") {
      const right = q.options[q.correct];
      $("#opts").querySelectorAll(".opt").forEach(x => {
        if (x.textContent === right) x.classList.add("right");
        else if (+x.dataset.i === held.chosen) x.classList.add("wrong");
      });
    }
    if (q.type === "multi") {
      $("#chips").querySelectorAll(".chip").forEach(x => {
        const o = q.options[+x.dataset.o];
        if (q.correct.indexOf(o) >= 0) x.classList.add("right");
        else if (held.on.has(+x.dataset.o)) x.classList.add("wrong");
      });
    }
    if (q.type === "truth" || q.type === "trace") {
      $("#grid").querySelectorAll("input").forEach(i => {
        const want = String(q.answer[+i.dataset.r][+i.dataset.c]).trim().toLowerCase();
        const got = String(i.value).trim().toLowerCase();
        i.classList.add(got === want ? "right" : "wrong");
        if (got !== want) i.value = want;
      });
    }
  }

  /* Section 22 to 25. The first attempt is already recorded and is not touched;
   * the learner gets the question back with the feedback above it and writes it
   * again. Nothing shows them the answer unless they ask for it. */
  function improve(q) {
    improving = true;
    const was = lastResult;
    paint();
    const fb = $("#fb");
    fb.className = "fb show";
    fb.style.background = "#2a2410";
    fb.innerHTML = "<strong>First attempt: " + was.got + " / " + was.max + "</strong>"
      + "<p>Use the feedback to write it again. You earned:</p>"
      + '<ul class="points">' + (was.detail || []).map(d =>
          '<li class="' + (d.met ? "got" : "lost") + '"><i>' + (d.met ? "✓" : "○")
          + "</i><span>" + esc(d.concept) + "</span></li>").join("") + "</ul>";
    const a = $("#ans"); if (a) { a.value = (Engine.state.q[q.id] || {}).draft || ""; a.focus(); }
    actions([{ id: "submit", label: "Check my improved answer", primary: true,
               fn: () => submit(q) },
             { id: "give", label: "Show example answer", fn: () => showExample(q) }]);
  }

  /* Section 29: an example, labelled as one example rather than as the answer. */
  function showExample(q) {
    const fb = $("#fb");
    const d = document.createElement("div");
    d.innerHTML = "<p><b>Example full-mark response</b></p><p>" + esc(q.example || "") + "</p>"
      + '<p class="sourceline">This is one answer that would earn full marks, not the only '
      + "one. Yours does not have to use the same words.</p>";
    fb.appendChild(d);
    actions([{ id: "next", label: "Next question", primary: true, fn: ask }]);
  }

  /* Section 20 and 49: a six-mark answer is not marked automatically here, and
   * is not pretended to be. The learner reads the mark points and says which
   * they made; the mark is stored as theirs. */
  function selfReview(q, text) {
    const pts = q.markPoints || [];
    showBox("Mark your own answer", "#5ab4ff",
      '<p class="q">' + esc(q.q) + "</p>"
      + '<p class="qn">Read what you wrote against the mark points below and tick the ones '
      + "you really made. Be honest with yourself — this mark is recorded as self-reviewed, "
      + "and it is only useful to you if it is true.</p>"
      + '<div class="selfcheck">' + pts.map((p, i) =>
          '<label><input type="checkbox" data-p="' + i + '"><span>' + esc(p.concept)
          + "</span></label>").join("") + "</div>"
      + (q.bands ? '<p class="qn">This question is assessed on: '
          + q.bands.map(b => esc(b)).join(", ") + ".</p>" : "")
      + '<div class="fb" id="fb"></div><div class="mrow" id="actions"></div>');
    actions([
      { id: "back", label: "Back to my answer", fn: () => { paint(); const a = $("#ans"); if (a) a.value = text; } },
      { id: "done", label: "Record my mark", primary: true, fn: () => {
          const ticked = [].slice.call(box.querySelectorAll("[data-p]:checked"))
            .map(c => pts[+c.dataset.p].concept);
          const res = Engine.selfReview(q, ticked, { confidence: confidence });
          lastResult = res;
          const fb = $("#fb");
          fb.className = "fb show " + (res.full ? "ok" : "");
          fb.style.background = res.full ? "" : "#2a2410";
          fb.innerHTML = "<strong>" + res.got + " / " + res.max + " marks, self-reviewed</strong>"
            + "<p>" + esc(q.feedback || "") + "</p>"
            + '<p class="sourceline">Recorded as SELF-REVIEWED. Marks you gave yourself are '
            + "kept apart from marks Revise 360 worked out, and the diagnosis of what to "
            + "revise next uses the automatic ones.</p>";
          const d = document.createElement("div");
          d.innerHTML = "<p><b>Example full-mark response</b></p><p>" + esc(q.example || "")
            + "</p>";
          fb.appendChild(d);
          const rev = Bank.revisit(q);
          if (!res.full && rev) {
            const a = document.createElement("a");
            a.className = "revisit"; a.href = rev.href;
            a.innerHTML = "<b>Revise this</b>" + esc(rev.label);
            fb.appendChild(a);
          }
          actions([{ id: "next", label: "Next question", primary: true, fn: ask }]);
          hud();
        } }]);
  }

  // ---------------------------------------------------------------- panels
  function topics() {
    const all = Bank.manifest.topics, chosen = Engine.topics();
    const pick = t => '<button data-t="' + t.topic + '" aria-pressed="'
      + (chosen.indexOf(t.topic) >= 0 ? "true" : "false") + '"><b>' + esc(t.topic) + "</b>"
      + esc(t.title) + '<span><br>' + t.questions + " questions · " + t.marks + " marks</span></button>";
    openDrawer("<h2>Topics</h2>"
      + '<div class="row"><button class="btn ghost small" id="selAll">Select all</button>'
      + '<button class="btn ghost small" id="clrAll">Clear all</button>'
      + '<button class="btn ghost small" id="p1">Paper 1</button>'
      + '<button class="btn ghost small" id="p2">Paper 2</button></div>'
      + '<div class="picker">' + all.map(pick).join("") + "</div>"
      + "<h2>How you want to revise</h2>"
      + '<div class="modes">' + Engine.modesAvailable().map(m =>
          '<button data-m="' + m.id + '" aria-pressed="' + (Engine.state.mode === m.id ? "true" : "false")
          + '"' + (m.blocked ? " disabled" : "") + ">" + esc(m.label)
          + (m.blocked ? '<span class="why">' + esc(m.blocked) + "</span>" : "") + "</button>").join("")
      + "</div>"
      + '<p class="count">Changing your topics does not lose anything: your marks, your '
      + "session and your queue all carry on.</p>", "progress");
    const d = $("#drawer");
    const after = async () => { await Engine.refresh(); hud(); topics(); };
    d.querySelectorAll("[data-t]").forEach(b => b.onclick = async () => {
      Engine.toggleTopic(b.dataset.t); await after();
    });
    d.querySelector("#selAll").onclick = async () => { Engine.setTopics(Bank.topics()); await after(); };
    d.querySelector("#clrAll").onclick = () => toast("At least one topic has to be chosen.");
    d.querySelector("#p1").onclick = async () => { Engine.setPaper(1); await after(); };
    d.querySelector("#p2").onclick = async () => { Engine.setPaper(2); await after(); };
    d.querySelectorAll("[data-m]").forEach(b => b.onclick = async () => {
      const r2 = Engine.setMode(b.dataset.m);
      if (typeof r2 === "string" && r2 !== b.dataset.m) { toast(r2); return; }
      await after();
      toast("Now: " + Engine.MODES[Engine.state.mode].label + ".");
    });
  }

  function progress() {
    const o = Engine.overview();
    const pct = o.firstAvail ? Math.round(100 * o.firstGot / o.firstAvail) : 0;
    const bar = x => '<div class="bar"><i style="width:' + (x.avail ? Math.round(100 * x.got / x.avail) : 0) + '%"></i></div>';
    let html = "<h2>My revision</h2>"
      + '<div class="stats"><div class="stat"><b>' + o.firstGot + " / " + o.firstAvail
      + "</b>first-attempt marks</div>"
      + '<div class="stat"><b>' + pct + "%</b>first attempt</div>"
      + '<div class="stat"><b>' + o.recovered + "</b>marks recovered</div>"
      + '<div class="stat"><b>' + o.questions + "</b>questions attempted</div></div>";
    if (o.examAvail)
      html += "<p>Exam-style: <b>" + o.examGot + " / " + o.examAvail + "</b></p>";
    html += "<h2>By topic</h2>";
    html += o.byTopic.length ? o.byTopic.map(t =>
      '<div class="hbar"><span>' + esc(t.topic + " " + t.title) + "</span>" + bar(t)
      + "<span>" + t.got + "/" + t.avail + "</span></div>").join("")
      : '<p class="muted">Nothing yet.</p>';
    if (o.commandWords.length) {
      html += "<h2>By command word</h2>"
        + o.commandWords.map(c => '<div class="hbar"><span>' + esc(c.word.toUpperCase())
          + "</span>" + bar(c) + "<span>" + c.got + "/" + c.avail + "</span></div>").join("")
        + '<p class="count">Only shown where enough questions have been answered to mean '
        + "anything.</p>";
    }
    if (o.queue.length) {
      html += "<h2>What to revise next</h2><div class=\"weak\">"
        + o.queue.map(x => '<a href="' + (x.station ? x.station.href : "#") + '">'
          + "<span>" + esc(x.concept) + (x.priority ? " · high priority" : "")
          + '<br><span class="muted">' + esc(x.station ? x.station.label : "") + "</span></span>"
          + '<span class="rag r">' + x.lost + " lost</span></a>").join("") + "</div>";
    }
    const bm = Engine.bookmarked();
    if (bm.length) {
      html += "<h2>My bookmarks</h2><div class=\"weak\">" + bm.map(id => {
        const q = Bank.question(id);
        return q ? '<a href="#" data-b="' + esc(id) + '"><span>' + esc(q.q.slice(0, 90))
          + '<br><span class="muted">' + esc(q.topic + " · " + q.marks + " marks")
          + "</span></span><span class=\"rag n\">Open</span></a>" : "";
      }).join("") + "</div>";
    }
    const h = Engine.history(6);
    if (h.length) {
      html += "<h2>Recent sessions</h2>" + h.map(x =>
        '<div class="hbar"><span>' + new Date(x.at).toLocaleDateString("en-GB",
          { day: "numeric", month: "short" }) + " · " + x.questions + " questions</span>"
        + bar({ got: x.got, avail: x.avail }) + "<span>" + x.got + "/" + x.avail + "</span></div>"
      ).join("");
    }
    html += "<h2>Weekly target</h2>";
    const t = o.target;
    html += t ? "<p>" + esc(t.kind === "attemptMarks" ? "Attempt" : "Earn") + " " + t.n
        + " marks this week: <b>" + t.got + " / " + t.n + "</b>"
        + (t.done ? " — done." : "") + '</p><button class="btn ghost small" id="noTarget">Remove target</button>'
      : '<div class="row"><button class="btn ghost small" data-tg="40">Earn 40 first-attempt marks</button>'
        + '<button class="btn ghost small" data-tg="50a">Attempt 50 marks</button></div>'
        + '<p class="count">Optional, and nothing happens if you miss it.</p>';
    html += '<p class="count">Revise 360 does not turn this into a predicted grade: a question '
         + "stream you choose the topics for is not an exam paper.</p>";
    openDrawer(html, "progress");
    const d = $("#drawer");
    d.querySelectorAll("[data-b]").forEach(a => a.onclick = e => {
      e.preventDefault();
      const q = Bank.question(a.dataset.b);
      if (q) { current = q; improving = false; confidence = null; closeDrawer(); paint(); }
    });
    d.querySelectorAll("[data-tg]").forEach(b => b.onclick = () => {
      const val = b.dataset.tg;
      Engine.setTarget(val.endsWith("a") ? "attemptMarks" : "firstMarks", parseInt(val, 10));
      progress();
    });
    const nt = d.querySelector("#noTarget");
    if (nt) nt.onclick = () => { Engine.setTarget(null); progress(); };
  }

  function menu() {
    openDrawer("<h2>Revision 360</h2>"
      + "<p>" + esc(student.name) + " · " + esc(student.cls) + "</p>"
      + '<div class="row"><button class="btn ghost small" id="mTopics">Topics and mode</button>'
      + '<button class="btn ghost small" id="mProg">My revision</button>'
      + '<button class="btn ghost small" id="mFin">Finish session</button></div>'
      + '<p class="count">The walls of this room carry the command words, what each mark '
      + "value expects, and the eleven topics. Drag to look around.</p>"
      + '<p class="count">Revise 360 stores what you answered and what it was worth. It does '
      + "not record where you looked or how long you took.</p>", "progress");
    $("#mTopics").onclick = topics;
    $("#mProg").onclick = progress;
    $("#mFin").onclick = finish;
  }

  /* Section 58. What was done, what is worth doing next, and nothing dressed up. */
  function finish() {
    closeDrawer();
    const s = Engine.endSession();
    if (!s) { toast("Nothing answered yet."); return; }
    const row = s.row;
    const pct = row.avail ? Math.round(100 * row.got / row.avail) : 0;
    let html = '<div class="stats summary">'
      + '<div class="stat"><b>' + row.got + " / " + row.avail + "</b>first-attempt marks</div>"
      + '<div class="stat"><b>' + pct + "%</b>of what was available</div>"
      + '<div class="stat"><b>' + row.best + " / " + row.avail + "</b>best marks</div>"
      + '<div class="stat"><b>' + row.recovered + "</b>marks recovered</div>"
      + '<div class="stat"><b>' + row.questions + "</b>questions</div>"
      + '<div class="stat"><b>' + row.topics.length + "</b>topics revised</div></div>";
    if (row.examAvail)
      html += "<p>Exam-style questions: <b>" + row.examGot + " / " + row.examAvail + "</b></p>";
    if (s.strongest.length)
      html += "<h2>Strongest here</h2><p>" + s.strongest.map(x =>
        esc(KIND[x.what] || x.what) + " " + x.got + "/" + x.avail).join(" · ") + "</p>";
    if (s.toRecover.length) {
      html += "<h2>What to revise next</h2><div class=\"weak\">" + s.toRecover.map((x, i) =>
        '<a href="' + (x.station ? x.station.href : "#") + '"><span>' + (i + 1) + ". "
        + esc(x.concept) + '<br><span class="muted">' + esc(x.station ? x.station.label : "")
        + "</span></span><span class=\"rag r\">" + x.lost + " marks lost</span></a>").join("")
        + "</div>";
    } else {
      html += "<p>Nothing stood out as costing you marks in this session.</p>";
    }
    html += '<p class="sourceline">This is what you scored on these questions. It is not a '
         + "grade, and Revise 360 will not turn it into one.</p>"
         + '<div class="mrow"><button class="btn ghost" id="again">Keep revising</button>'
         + '<a class="btn" href="index.html">Done</a></div>';
    showBox("Revision session complete", "#50dc96", html);
    $("#again").onclick = () => { Engine.startSession(); hud(); ask(); };
    hud();
  }

  // ---------------------------------------------------------------- wiring
  $("#menuBtn").onclick = menu;
  $("#topicBtn").onclick = topics;
  $("#progBtn").onclick = progress;
  $("#markBtn").onclick = () => {
    if (!current) return;
    const on = Engine.bookmark(current.id);
    $("#markBtn").setAttribute("aria-pressed", on ? "true" : "false");
    const st = $("#star"); if (st) { st.setAttribute("aria-pressed", on ? "true" : "false"); st.textContent = on ? "★" : "☆"; }
    toast(on ? "Bookmarked." : "Bookmark removed.");
  };
  $("#recentreBtn").onclick = () => {
    if (core.inVR && window.NVRVR && NVRVR.recentre) { NVRVR.recentre(); return; }
    lon = 0; lat = 0; toast("Back to the front wall.");
  };
  $("#finishBtn").onclick = finish;
  $("#homeBtn").onclick = () => { location.href = "index.html"; };

  // ---------------------------------------------------------------- VR bridge
  /* What js/vr.js needs to run in this room. It is the same object the lesson
   * player hands it, with the parts a revision room has - and `revision`, which
   * is how js/revvr.js knows to put a question on the screen instead of a
   * station. The headset gets its questions from the same engine as this page. */
  const core = {
    renderer: null, scene: null, cam: null, grp: null, mat: null,
    exp: exp, cur: 0, prog: { scenes: { main: { ans: {}, done: {}, drafts: {} } }, info: [] },
    student: student, CFG: CFG, inVR: false, toastHook: null,
    sprites: [], frameHooks: frameHooks, sceneHooks: sceneHooks,
    revision: { engine: Engine, bank: Bank, ask: ask, finish: finish,
                topics: topics, progress: progress,
                get current() { return current; },
                set current(q) { current = q; },
                get improving() { return improving; },
                set improving(x) { improving = x; },
                get lastResult() { return lastResult; },
                set lastResult(x) { lastResult = x; },
                get confidence() { return confidence; },
                set confidence(x) { confidence = x; },
                paint: paint, KIND: KIND },
    texFor: texFor,
    closeUI: () => { closeDrawer(); closeBox(); },
    refreshSprites: () => {},
    hud: hud, drawNav: () => {}, markInfo: () => {}, save: () => Engine.save(),
    stationState: () => ({ got: 0, tot: 0, done: false }),
    loadScene: () => {}, taskList: () => null, lockedStation: () => -1,
    marks: t => (t && t.marks) || 1, award: () => {}, awardBest: () => {},
    isDone: () => false, isComplete: () => true, gated: () => false,
    reviewMode: false, setReview: () => {}, shuffle: shuffle,
    completeStation: () => ({ review: false, sceneDone: false }),
    publicDemo: false
  };

  // The three.js objects are made above; hand them over once they exist.
  core.renderer = r; core.scene = scene; core.cam = cam; core.grp = grp; core.mat = mat;

  window.NVRCore = core;
  window.NVRRevise = { ask: ask, paint: paint, submit: submit, finish: finish,
                       topics: topics, progress: progress, menu: menu,
                       get current() { return current; }, response: response,
                       get held() { return held; } };
  document.dispatchEvent(new Event("nvr-ready"));

  hud();
  ask();
})();
