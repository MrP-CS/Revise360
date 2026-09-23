// Revise 360: Cyber defence. Spend a budget on protections, then face the threats.
// Drawn on a canvas with abstract pointer events, so it works with a mouse and in VR.
(function () {
  const C = { bg: "#0e1628", grid: "#16223a", line: "#3c5a87", fg: "#f0f4fa", soft: "#b4c4dc", edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", buy: "#1e4f7a" };
  const W = 1000, H = 620;

  const SHOP = [
    { id: "am", name: "Anti-malware software", cost: 2000, note: "Detects and removes malicious software" },
    { id: "fw", name: "Firewall", cost: 1500, note: "Filters traffic entering the network" },
    { id: "train", name: "Staff training", cost: 1500, note: "People learn to spot scams and tricks" },
    { id: "backup", name: "Off-site backups", cost: 1000, note: "Restore files instead of paying a ransom" },
    { id: "pw", name: "Strong password policy", cost: 500, note: "Long passwords and account lockouts" },
    { id: "mfa", name: "Two-factor authentication", cost: 1500, note: "A stolen password isn't enough" },
    { id: "enc", name: "Encryption (HTTPS and VPN)", cost: 2000, note: "Intercepted data can't be read" },
    { id: "code", name: "Secure coding and validation", cost: 2000, note: "Input is checked before it reaches the database" },
    { id: "pen", name: "Penetration testing", cost: 2500, note: "Finds weaknesses before criminals do" },
    { id: "ddos", name: "Traffic filtering service", cost: 2500, note: "Absorbs and filters floods of requests" },
    { id: "phys", name: "Physical security", cost: 1500, note: "Locked server room, keycards and CCTV" },
    { id: "acc", name: "User access levels", cost: 1000, note: "Each user reaches only what they need" }
  ];
  const KINDS = ["Malware", "Phishing", "Social engineering", "Brute force", "Denial of service", "Data interception", "SQL injection"];
  const THREATS = [
    { lvl: 0, kind: "Phishing", stops: ["train", "mfa"], text: "An email that looks like it's from the finance director asks a member of staff to log in urgently at a website you don't recognise." },
    { lvl: 0, kind: "Malware", stops: ["am"], text: "A member of staff downloads a 'free PDF converter' from a pop-up advert. It installs something else as well." },
    { lvl: 0, kind: "Brute force", stops: ["pw", "mfa"], text: "A program is trying thousands of common passwords against your staff login page, one account after another." },
    { lvl: 0, kind: "Malware", stops: ["backup", "am"], text: "Every document on the shared drive has been encrypted and a message demands £5,000 in Bitcoin for the key." },
    { lvl: 1, kind: "Denial of service", stops: ["ddos", "fw"], text: "Thousands of infected devices are sending requests to your website at once. Real customers can't get through." },
    { lvl: 1, kind: "Data interception", stops: ["enc"], text: "A member of staff logs into the company system from café Wi-Fi. Someone nearby is capturing the packets." },
    { lvl: 1, kind: "SQL injection", stops: ["code", "pen"], text: "Someone types ' OR 1=1 -- into your website's login box instead of a username." },
    { lvl: 1, kind: "Social engineering", stops: ["train", "phys"], text: "A caller claims to be from IT and asks a receptionist to read out her password so they can 'fix an error'." },
    { lvl: 1, kind: "Malware", stops: ["am", "fw"], text: "A worm is spreading between computers on your network, using a weakness in software that hasn't been patched." },
    { lvl: 2, kind: "Social engineering", stops: ["train", "am"], text: "A USB stick labelled 'Staff salaries' is left in the car park. An employee plugs it into their work computer." },
    { lvl: 2, kind: "Data interception", stops: ["phys", "enc"], text: "A laptop full of customer records is stolen from the back seat of a car." },
    { lvl: 2, kind: "Phishing", stops: ["mfa", "train"], text: "A member of staff has typed their password into a fake login page. The attacker now has working credentials." },
    { lvl: 2, kind: "Brute force", stops: ["pw", "mfa"], text: "An attacker has a list of passwords leaked from another website and is trying them against your accounts." },
    { lvl: 2, kind: "Denial of service", stops: ["ddos"], text: "A criminal group threatens to flood your servers unless you pay them. At 9am the traffic starts." },
    { lvl: 2, kind: "SQL injection", stops: ["code", "pen"], text: "Your website's search box passes whatever is typed straight into a database query. Someone has noticed." },
    { lvl: 2, kind: "Social engineering", stops: ["phys", "train"], text: "A stranger in a high-vis jacket follows a member of staff through the security door, carrying a clipboard." }
  ];

  function Defence(opts) {
    opts = opts || {};
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
    const st = { screen: "intro", budget: 10000, owned: [], lives: 3, score: 0, round: 0, threat: null, guessKind: null, guessSafe: null, result: null, hits: [], hover: null, used: [] };

    const money = n => "£" + n.toLocaleString();
    function rr(px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
    function wrap(text, font, maxW) { x.font = font; const out = []; let line = "";
      String(text).split(" ").forEach(w2 => { const t = line ? line + " " + w2 : w2; if (x.measureText(t).width > maxW && line) { out.push(line); line = w2; } else line = t; }); out.push(line); return out; }
    function textBlock(text, px, py, maxW, size, color, bold) { const f = `${bold ? "700 " : ""}${size}px Segoe UI, sans-serif`;
      const lines = wrap(text, f, maxW); x.fillStyle = color || C.fg; x.font = f; x.textAlign = "left"; x.textBaseline = "top";
      lines.forEach((l, i) => x.fillText(l, px, py + i * size * 1.3)); return py + lines.length * size * 1.3; }
    function button(id, label, px, py, w, h, style) {
      const hov = st.hover === id;
      rr(px, py, w, h, 14); x.fillStyle = style === "primary" ? (hov ? "#ffe07a" : C.edge) : style === "off" ? "#1a2233" : hov ? "#1d2f52" : "#15223b"; x.fill();
      x.lineWidth = hov ? 5 : 3; x.strokeStyle = style === "primary" ? C.edge : style === "ok" ? C.ok : style === "bad" ? C.bad : C.line; x.stroke();
      const lines = wrap(label, "600 26px Segoe UI, sans-serif", w - 24); x.fillStyle = style === "primary" ? "#0f1626" : style === "off" ? C.soft : C.fg;
      x.font = "600 26px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      lines.forEach((l, i) => x.fillText(l, px + w / 2, py + h / 2 + (i - (lines.length - 1) / 2) * 30));
      if (style !== "off") st.hits.push({ id, px, py, w, h });
    }
    function hud() {
      x.fillStyle = "#15223b"; x.fillRect(0, 0, W, 64); x.strokeStyle = C.line; x.beginPath(); x.moveTo(0, 64); x.lineTo(W, 64); x.stroke();
      x.font = "bold 26px Segoe UI, sans-serif"; x.textBaseline = "middle"; x.textAlign = "left";
      x.fillStyle = C.edge; x.fillText("Budget " + money(st.budget), 20, 32);
      x.fillStyle = C.fg; x.fillText("Score " + st.score, 290, 32);
      x.fillText("Round " + Math.max(1, st.round), 470, 32);
      x.textAlign = "right"; x.fillStyle = C.bad; x.fillText("♥".repeat(st.lives) + "♡".repeat(3 - st.lives), W - 20, 32);
    }
    function draw() {
      st.hits = []; x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
      x.strokeStyle = C.grid; x.lineWidth = 1; for (let i = 0; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
      if (st.screen === "intro") {
        x.textAlign = "center"; x.fillStyle = C.edge; x.font = "bold 44px Segoe UI, sans-serif"; x.fillText("Cyber defence", W / 2, 70);
        let y = textBlock("You run the network for a small company. You have a budget to spend on protections, and attacks are coming.", 80, 130, W - 160, 28, C.fg);
        y = textBlock("Each round: spend what you can afford, then a threat arrives. Identify which form of attack it is, then decide whether your protections would stop it.", 80, y + 16, W - 160, 26, C.soft);
        y = textBlock("100 points for naming the attack, 100 for predicting the outcome correctly, and a 150 bonus if you really are protected. An attack that gets through costs a life. Three lives and you're shut down.", 80, y + 16, W - 160, 26, C.soft);
        textBlock("Personal best: " + (opts.best || 0), 80, y + 20, W - 160, 28, C.edge, true);
        button("start", "Start the game", W / 2 - 180, H - 110, 360, 70, "primary");
      } else if (st.screen === "shop") {
        hud();
        x.textAlign = "left"; x.fillStyle = C.fg; x.font = "bold 28px Segoe UI, sans-serif"; x.fillText(st.round <= 1 ? "Choose your protections" : "Upgrade your defences", 20, 92);
        x.fillStyle = C.soft; x.font = "20px Segoe UI, sans-serif"; x.fillText("You can't afford everything. Tap to buy, then start the round.", 20, 122);
        SHOP.forEach((it, i) => {
          const px = 20 + (i % 3) * 320, py = 145 + Math.floor(i / 3) * 96, w = 300, h = 82;
          const owned = st.owned.includes(it.id), afford = st.budget >= it.cost;
          rr(px, py, w, h, 12); x.fillStyle = owned ? "#143a2c" : afford ? (st.hover === "buy" + it.id ? "#1d2f52" : "#15223b") : "#141821"; x.fill();
          x.lineWidth = 3; x.strokeStyle = owned ? C.ok : afford ? C.line : "#2a3040"; x.stroke();
          x.textAlign = "left"; x.fillStyle = owned ? C.ok : afford ? C.fg : "#5c6678"; x.font = "bold 21px Segoe UI, sans-serif"; x.textBaseline = "top";
          wrap(it.name, "bold 21px Segoe UI, sans-serif", w - 100).forEach((l, j) => x.fillText(l, px + 12, py + 10 + j * 24));
          x.font = "17px Segoe UI, sans-serif"; x.fillStyle = owned ? C.soft : afford ? C.soft : "#4c5568"; x.fillText(owned ? "Installed" : money(it.cost), px + 12, py + h - 26);
          if (!owned && afford) st.hits.push({ id: "buy" + it.id, px, py, w, h });
        });
        button("go", "Start round " + st.round, W - 340, H - 70, 320, 58, "primary");
        if (st.round > 1) button("info", "What I own: " + (st.owned.length || 0), 20, H - 70, 300, 58, "off");
      } else if (st.screen === "identify") {
        hud();
        x.textAlign = "left"; x.fillStyle = C.bad; x.font = "bold 28px Segoe UI, sans-serif"; x.textBaseline = "top"; x.fillText("⚠ Incident report", 20, 84);
        const y = textBlock(st.threat.text, 20, 120, W - 40, 27, C.fg);
        textBlock("Which form of attack is this?", 20, y + 14, W - 40, 25, C.edge, true);
        st.options.forEach((k, i) => button("k" + i, k, 20 + (i % 2) * 490, 300 + Math.floor(i / 2) * 78, 470, 64));
      } else if (st.screen === "predict") {
        hud();
        x.textAlign = "left"; x.fillStyle = C.fg; x.font = "bold 26px Segoe UI, sans-serif"; x.textBaseline = "top";
        x.fillText("You identified this as: " + st.guessKind, 20, 84);
        const y = textBlock(st.threat.text, 20, 122, W - 40, 24, C.soft);
        textBlock("Would your protections stop this attack?", 20, y + 16, W - 40, 28, C.edge, true);
        x.fillStyle = C.soft; x.font = "20px Segoe UI, sans-serif";
        x.fillText("You own: " + (st.owned.length ? st.owned.map(id => SHOP.find(s => s.id === id).name).join(", ") : "nothing yet"), 20, y + 66);
        button("safe", "Yes, we're protected", 60, H - 150, 400, 80, "ok");
        button("hit", "No, this one gets through", 540, H - 150, 400, 80, "bad");
      } else if (st.screen === "result") {
        hud();
        const r = st.result;
        x.textAlign = "left"; x.textBaseline = "top";
        x.fillStyle = r.blocked ? C.ok : C.bad; x.font = "bold 32px Segoe UI, sans-serif";
        x.fillText(r.blocked ? "✔ Attack blocked" : "✘ Your network was hit", 20, 84);
        let y = textBlock(r.explain, 20, 130, W - 40, 26, C.fg);
        y = textBlock(r.kindMsg, 20, y + 14, W - 40, 24, r.kindOk ? C.ok : C.bad);
        y = textBlock(r.predMsg, 20, y + 10, W - 40, 24, r.predOk ? C.ok : C.bad);
        y = textBlock(`Points this round: ${r.points}` + (r.bonus ? "  (including a 150 protection bonus)" : ""), 20, y + 14, W - 40, 28, C.edge, true);
        button("next", st.lives > 0 ? "Next round" : "See your score", W - 340, H - 80, 320, 62, "primary");
      } else if (st.screen === "over") {
        x.textAlign = "center"; x.fillStyle = C.bad; x.font = "bold 40px Segoe UI, sans-serif"; x.fillText("Network shut down", W / 2, 70);
        x.fillStyle = C.edge; x.font = "bold 90px Segoe UI, sans-serif"; x.fillText(String(st.score), W / 2, 190);
        x.fillStyle = C.fg; x.font = "26px Segoe UI, sans-serif";
        x.fillText(`You survived ${st.round - 1} rounds and identified ${st.correctKinds} of ${st.round - 1} attacks correctly.`, W / 2, 300);
        x.fillText(opts.isBest && opts.isBest() ? "🏆 New personal best!" : "Personal best: " + (opts.best || 0), W / 2, 345);
        x.fillStyle = C.soft; x.font = "22px Segoe UI, sans-serif";
        wrap("Tip: cheap protections like backups, training and a password policy stop a lot of attacks for very little money.", "22px Segoe UI, sans-serif", W - 160)
          .forEach((l, i) => x.fillText(l, W / 2, 400 + i * 28));
        button("again", "Play again", W / 2 - 170, H - 110, 340, 70, "primary");
      }
      api.dirty = true;
    }
    function pickThreat() {
      const lvl = st.round <= 2 ? 0 : st.round <= 4 ? 1 : 2;
      const pool = THREATS.filter(t => t.lvl <= lvl && !st.used.includes(t.text));
      const t = (pool.length ? pool : THREATS.filter(t => t.lvl <= lvl))[Math.floor(Math.random() * Math.max(1, pool.length || THREATS.length))];
      st.used.push(t.text); st.threat = t;
      const others = KINDS.filter(k => k !== t.kind).sort(() => Math.random() - .5).slice(0, 3);
      st.options = [t.kind, ...others].sort(() => Math.random() - .5);
    }
    function startRound() { st.round++; pickThreat(); st.screen = "identify"; draw(); }
    function resolve() {
      const t = st.threat, blocked = t.stops.some(id => st.owned.includes(id));
      const kindOk = st.guessKind === t.kind, predOk = st.guessSafe === blocked;
      let points = (kindOk ? 100 : 0) + (predOk ? 100 : 0) + (blocked ? 150 : 0);
      st.score += points; if (kindOk) st.correctKinds = (st.correctKinds || 0) + 1;
      if (!blocked) st.lives--;
      const need = t.stops.map(id => SHOP.find(s => s.id === id).name).join(" or ");
      st.result = { blocked, kindOk, predOk, points, bonus: blocked,
        explain: blocked ? `Your ${t.stops.filter(id => st.owned.includes(id)).map(id => SHOP.find(s => s.id === id).name).join(" and ")} stopped it.`
                         : `You needed ${need}. You lost a life: ${st.lives} left.`,
        kindMsg: kindOk ? `Correct: this was ${t.kind}.` : `It was actually ${t.kind}, not ${st.guessKind}.`,
        predMsg: predOk ? "Your prediction about your defences was right." : "Your prediction about your defences was wrong." };
      st.budget += 2000 + (kindOk ? 500 : 0);
      st.screen = "result"; draw();
      if (st.lives <= 0) st.gameOver = true;
    }
    const api = {
      canvas: cv, dirty: true, state: st,
      down(px, py) {
        const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); if (!h) return;
        const id = h.id;
        if (id === "start") { st.screen = "shop"; st.round = 1; draw(); }
        else if (id.startsWith("buy")) { const it = SHOP.find(s => "buy" + s.id === id); if (st.budget >= it.cost) { st.budget -= it.cost; st.owned.push(it.id); } draw(); }
        else if (id === "go") startRound();
        else if (id.startsWith("k")) { st.guessKind = st.options[+id.slice(1)]; st.screen = "predict"; draw(); }
        else if (id === "safe" || id === "hit") { st.guessSafe = id === "safe"; resolve(); }
        else if (id === "next") { if (st.gameOver) { st.screen = "over"; draw(); if (opts.onEnd) opts.onEnd({ score: st.score, rounds: st.round - 1, correct: st.correctKinds || 0 }); } else { st.screen = "shop"; draw(); } }
        else if (id === "again") { st.budget = 10000; st.owned = []; st.lives = 3; st.score = 0; st.round = 1; st.used = []; st.correctKinds = 0; st.gameOver = false; st.screen = "shop"; draw(); }
      },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); }, clear() {},
      check() { return { incomplete: true, msg: "Play through the game: it scores itself." }; }
    };
    draw(); return api;
  }
  window.R360Defence = { Defence, SHOP, THREATS };
})();
