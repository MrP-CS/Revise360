/* Revise 360 - animated diagrams for 1.3 Networks (OCR J277).
 *
 * Engine: js/diagrams.js. House style: `fde` in js/diagrams-set.js - one idea
 * per step, something always moving, one annotation that says the thing the
 * picture alone cannot.
 *
 *   clientserver  client-server and peer-to-peer, and the honest trade-off
 *   topologies    star and mesh, and what happens when a link breaks
 *   encryption    a shift cipher, an eavesdropper, and why it does not help them
 *   dns           typing a web address: name -> number -> page
 *   tcpip         the four layers, wrapping and unwrapping headers
 *   packets       split, addressed, routed, lost, re-sent, reassembled
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  /* A failure marker that sits in the corner of a box instead of across the
   * middle of it, so the label underneath stays readable. */
  function fail(d, cx, cy, t) {
    const r = 13 + 2.5 * Math.sin(t * Math.PI * 4);
    d.dot(cx, cy, r, { fill: d.c.bad, glow: true, label: "X", labelFill: d.c.fg, size: 15 });
  }

  /* Pull both ends of a line in by m, so a chip travelling along it never sits
   * on top of the label of the box it started from. */
  function inset(a, b, m) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const k = Math.min(m, L / 2 - 4);
    return [[a[0] + dx / L * k, a[1] + dy / L * k], [b[0] - dx / L * k, b[1] - dy / L * k]];
  }

  // =========================================================================
  // Client-server and peer-to-peer
  // =========================================================================
  A("clientserver", function () {
    const W = 980, H = 580;
    const SRV = { x: 390, y: 78, w: 200, h: 96 };
    const CW = 150, CH = 80, CY = 318;
    const CLI = [["Laptop", 121], ["Phone", 317], ["Tablet", 513], ["Desktop", 709]]
      .map(function (o, i) {
        return { label: o[0], x: o[1], cx: o[1] + CW / 2,
                 sx: SRV.x + 30 + i * (SRV.w - 60) / 3 };
      });

    const PCX = 490, PCY = 262, PR = 160;
    const PEER = ["A", "B", "C", "D", "E"].map(function (n, i) {
      const a = (-90 + i * 72) * Math.PI / 180;
      const cx = PCX + Math.cos(a) * PR, cy = PCY + Math.sin(a) * PR;
      return { n: n, cx: cx, cy: cy, x: cx - 66, y: cy - 29, w: 132, h: 58 };
    });
    const PAIRS = [];
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) PAIRS.push([i, j]);
    const HOPS = [[0, 2], [4, 3], [1, 0]];

    const PANELS = [
      { x: 50, head: "Client - server", col: "info", rows: [
        [1, "All the shared files sit in one place, so backups, updates and virus checks are done once."],
        [1, "An administrator controls every account, so you decide who may open what."],
        [0, "If the server fails, nobody can work. It is a single point of failure."],
        [0, "The server costs money to buy, and somebody has to be paid to look after it."]
      ] },
      { x: 510, head: "Peer - to - peer", col: "violet", rows: [
        [1, "No server to buy or maintain, so it is cheap and quick to set up."],
        [1, "There is no single machine that everything else depends on."],
        [0, "No central control, so files are scattered and backups and security are patchy."],
        [0, "Every peer must be switched on, and sharing files slows that peer's own work."]
      ] }
    ];

    const steps = [
      { name: "1. Clients ask", caption: "On a client-server network the clients do not hold the shared files. Each one sends a request to the server whenever it needs something." },
      { name: "2. Server answers", caption: "The server finds what was asked for and sends a response straight back. It spends its whole day answering requests." },
      { name: "3. Server down", caption: "Switch the server off and every client stops at once, because everything depended on that one machine." },
      { name: "4. Peer to peer", caption: "In a peer-to-peer network there is no server at all. Every computer is an equal and holds some of the files itself." },
      { name: "5. Peers share", caption: "A peer that wants a file asks another peer directly. Each machine is a client and a server at the same time." },
      { name: "6. The trade-off", caption: "Neither one simply wins. One buys you central control at the price of a machine everything depends on." }
    ];

    return { w: W, h: H, steps: steps, render: function (d, s, t) {
      const c = d.c;
      d.title("Client-server and peer-to-peer");

      // ------------------------------------------------- client-server scene
      if (s <= 2) {
        const dead = s === 2;
        d.text(40, 60, "CLIENT - SERVER", { size: 13, weight: 800, fill: c.info, baseline: "middle", max: 260 });

        CLI.forEach(function (cl, i) {
          const lit = !dead && ((s === 0 && t > .04 + i * .1) || s === 1);
          d.line(cl.cx, CY, cl.sx, SRV.y + SRV.h, {
            stroke: dead ? c.bad : (lit ? c.info : c.line), width: lit ? 3 : 2,
            dash: dead ? [7, 6] : null, alpha: dead ? .65 : 1
          });
          d.box(cl.x, CY, CW, CH, {
            fill: c.panel, stroke: dead ? c.bad : (lit ? c.info : c.line), on: lit,
            label: cl.label, sub: dead ? "no service" : "client",
            subFill: dead ? c.bad : c.soft
          });
        });

        d.box(SRV.x, SRV.y, SRV.w, SRV.h, {
          fill: c.panel2, stroke: dead ? c.bad : c.edge, on: true, r: 14,
          label: "Server", sub: dead ? "FAILED" : "files, accounts, backups",
          subFill: dead ? c.bad : c.soft
        });

        if (s === 0) CLI.forEach(function (cl, i) {
          const p = d.onPath([[cl.cx, CY], [cl.sx, SRV.y + SRV.h]], d.seg(t, .04 + i * .1, .6 + i * .1));
          d.chip(p[0], p[1], "request", { fill: c.info, glow: true });
        });
        if (s === 1) CLI.forEach(function (cl, i) {
          const p = d.onPath([[cl.sx, SRV.y + SRV.h], [cl.cx, CY]], d.seg(t, .04 + i * .1, .6 + i * .1));
          d.chip(p[0], p[1], "response", { fill: c.ok, glow: true });
        });
        if (s === 2) {
          fail(d, SRV.x + SRV.w - 22, SRV.y + 22, t);
          d.text(490, 440, "every client stops at once", {
            size: 15, weight: 700, align: "center", baseline: "middle", fill: c.bad,
            alpha: d.seg(t, .12, .35), max: 440 });
        }
      }

      // --------------------------------------------------- peer-to-peer scene
      if (s === 3 || s === 4) {
        d.text(40, 60, "PEER - TO - PEER", { size: 13, weight: 800, fill: c.violet, baseline: "middle", max: 260 });
        d.text(940, 60, "no server anywhere", { size: 13, weight: 700, align: "right", baseline: "middle", fill: c.dim, max: 260 });

        PAIRS.forEach(function (p, i) {
          const a = PEER[p[0]], b = PEER[p[1]];
          d.line(a.cx, a.cy, b.cx, b.cy, { stroke: c.line, width: 1.8,
            alpha: s === 3 ? d.seg(t, i * .022, i * .022 + .16) : .5 });
        });
        if (s === 4) HOPS.forEach(function (h, i) {
          const a = PEER[h[0]], b = PEER[h[1]];
          d.line(a.cx, a.cy, b.cx, b.cy, { stroke: [c.ok, c.edge, c.teal][i], width: 3.4, alpha: .85 });
        });
        PEER.forEach(function (p, i) {
          const lit = s === 3 ? t > .08 + i * .05 : true;
          d.box(p.x, p.y, p.w, p.h, {
            fill: c.panel, stroke: lit ? c.violet : c.line, on: lit,
            label: "Peer " + p.n, sub: "holds part " + (i + 1) });
        });
        if (s === 4) {
          const cols = [c.ok, c.edge, c.teal];
          HOPS.forEach(function (h, i) {
            const a = PEER[h[0]], b = PEER[h[1]];
            const seg = inset([a.cx, a.cy], [b.cx, b.cy], 58);
            const p = d.onPath(seg, d.seg(t, .06 + i * .08, .7 + i * .08));
            d.chip(p[0], p[1], "part " + (h[0] + 1), { fill: cols[i], glow: true });
          });
          d.text(400, 452, "every peer serves as well as asks", {
            size: 13, weight: 700, align: "center", baseline: "middle", fill: c.dim, max: 440 });
        }
      }

      // ------------------------------------------------------ the trade-off
      if (s === 5) {
        let k = 0;
        PANELS.forEach(function (p) {
          d.box(p.x, 70, 420, 362, { fill: c.panel, stroke: c[p.col], r: 14 });
          d.text(p.x + 22, 96, p.head, { size: 16, weight: 800, fill: c[p.col], baseline: "middle", max: 376 });
          p.rows.forEach(function (r, i) {
            const y = 126 + i * 74, show = t > k * .035; k++;
            if (!show) return;
            d.chip(p.x + 34, y + 15, r[0] ? "+" : "-",
                   { fill: r[0] ? c.ok : c.bad, w: 26, h: 26, size: 15 });
            d.wrap(p.x + 60, y, r[1], 330, { size: 12.5, fill: r[0] ? c.fg : c.soft });
          });
        });
      }

      const notes = [
        ["Clients hold nothing", "A client asks and waits. Because it keeps none of the shared files, any client can be swapped for another.", [CLI[0].cx, CY]],
        ["One machine, all the work", "A busy server needs fast storage and plenty of bandwidth, because every single request lands there.", [SRV.x + SRV.w / 2, SRV.y + SRV.h]],
        ["Single point of failure", "This is the price of centralising. Schools still pay it, because one place to back up, patch and police is worth more.", [SRV.x + 40, SRV.y + 48]],
        ["Equals, not clients", "Each peer is a client and a server at once. Lose one and the rest carry on, minus whatever only it held.", [PEER[0].cx, PEER[0].y + 58]],
        ["Nobody in charge", "Nothing forces a backup or an update, so the same file can end up in five slightly different versions.", [PEER[2].x, PEER[2].y + PEER[2].h]],
        ["Choose by need", "A school picks client-server to control hundreds of accounts. Two people sharing one folder do not need a server at all.", [84, 291]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 190, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =========================================================================
  // Star and mesh topologies
  // =========================================================================
  A("topologies", function () {
    const W = 980, H = 580;
    const DW = 96, DH = 46;

    function ring(cx, cy, r) {
      return ["A", "B", "C", "D", "E"].map(function (n, i) {
        const a = (-90 + i * 72) * Math.PI / 180;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        return { n: n, cx: px, cy: py, x: px - DW / 2, y: py - DH / 2 };
      });
    }
    const SC = [256, 256], MC = [724, 256], RAD = 148;
    const ST = ring(SC[0], SC[1], RAD);
    const ME = ring(MC[0], MC[1], RAD);
    const SW = { x: SC[0] - 52, y: SC[1] - 29, w: 104, h: 58 };
    const MPAIRS = [];
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) MPAIRS.push([i, j]);

    const steps = [
      { name: "1. Two shapes", caption: "A star joins every device to one central switch. A full mesh joins every device to every other device." },
      { name: "2. Through the switch", caption: "In a star, A cannot reach D directly. The message goes to the switch, which forwards it out of D's cable only." },
      { name: "3. Straight there", caption: "In a full mesh every pair already shares a link, so A sends to D with no middleman at all." },
      { name: "4. Cut one cable", caption: "Cut A's cable in the star and A is cut off completely. Cut the same link in the mesh and the message simply goes round." },
      { name: "5. The switch fails", caption: "Lose the switch and the whole star stops. A mesh has no central device, so there is nothing whose failure stops everything." },
      { name: "6. What mesh costs", caption: "Resilience is paid for in cable. Five devices need five cables in a star, but ten in a full mesh." }
    ];

    return { w: W, h: H, steps: steps, render: function (d, s, t) {
      const c = d.c;
      d.title("Star and mesh: the same message, two shapes");

      const starDim = s === 2 ? .3 : 1;
      const meshDim = s === 1 ? .3 : 1;
      const cut = s === 3;                      // A's star cable / the mesh A-D link
      const swDead = s === 4;
      const build = s === 0;

      d.box(36, 56, 440, 400, { fill: c.panel, stroke: c.line, r: 16, alpha: starDim * .55 });
      d.box(504, 56, 440, 400, { fill: c.panel, stroke: c.line, r: 16, alpha: meshDim * .55 });
      d.text(52, 78, "STAR", { size: 14, weight: 800, fill: c.teal, baseline: "middle", alpha: starDim, max: 180 });
      d.text(520, 78, "FULL MESH", { size: 14, weight: 800, fill: c.violet, baseline: "middle", alpha: meshDim, max: 180 });

      // ---- star
      const starLit = s === 5 ? Math.floor(d.seg(t, .05, .5) * 5.99) : -1;
      ST.forEach(function (p, i) {
        const broken = cut && i === 0;
        const hot = s === 5 && i < starLit;
        const a = build ? d.seg(t, i * .07, i * .07 + .2) : 1;
        d.line(SC[0], SC[1], p.cx, p.cy, {
          stroke: swDead ? c.bad : broken ? c.bad : hot ? c.edge : c.teal,
          width: hot ? 4 : 2.4, dash: broken || swDead ? [7, 6] : null,
          alpha: a * starDim * (broken || swDead ? .7 : 1) });
        d.box(p.x, p.y, DW, DH, {
          fill: c.panel2, stroke: broken || swDead ? c.bad : c.line,
          label: p.n, size: 20, alpha: a * starDim * (broken || swDead ? .6 : 1) });
      });
      if (cut) {
        const mx = (SC[0] + ST[0].cx) / 2, my = (SC[1] + ST[0].cy) / 2;
        d.dot(mx, my, 13, { fill: c.bad, glow: true, label: "X", labelFill: c.fg, size: 14, alpha: starDim });
      }
      d.box(SW.x, SW.y, SW.w, SW.h, {
        fill: swDead ? c.panel : c.panel2, stroke: swDead ? c.bad : c.teal, on: !swDead,
        label: "Switch", sub: swDead ? "FAILED" : "all traffic", subFill: swDead ? c.bad : c.soft,
        alpha: starDim });
      if (swDead) {
        fail(d, SW.x + SW.w + 2, SW.y + 2, t);
        d.text(256, 430, "no device can reach any other", {
          size: 13, weight: 700, align: "center", baseline: "middle", fill: c.bad, max: 400,
          alpha: d.seg(t, .12, .35) });
      }

      // ---- mesh
      const meshLit = s === 5 ? Math.floor(d.seg(t, .05, .9) * 10.99) : -1;
      MPAIRS.forEach(function (p, i) {
        const broken = cut && p[0] === 0 && p[1] === 3;
        const hot = s === 5 && i < meshLit;
        const a = build ? d.seg(t, .1 + i * .05, .3 + i * .05) : 1;
        d.line(ME[p[0]].cx, ME[p[0]].cy, ME[p[1]].cx, ME[p[1]].cy, {
          stroke: broken ? c.bad : hot ? c.edge : c.violet,
          width: hot ? 4 : 1.9, dash: broken ? [7, 6] : null,
          alpha: a * meshDim * (broken ? .7 : .8) });
      });
      if (cut) {
        const mx = (ME[0].cx + ME[3].cx) / 2, my = (ME[0].cy + ME[3].cy) / 2;
        d.dot(mx, my, 13, { fill: c.bad, glow: true, label: "X", labelFill: c.fg, size: 14, alpha: meshDim });
      }
      ME.forEach(function (p, i) {
        d.box(p.x, p.y, DW, DH, { fill: c.panel2, stroke: c.line, label: p.n, size: 20,
          alpha: meshDim * (build ? d.seg(t, i * .07, i * .07 + .2) : 1) });
      });

      // ---- the message
      if (s === 1 || s === 3) {
        const path = [[ST[0].cx, ST[0].cy], [SC[0], SC[1]], [ST[3].cx, ST[3].cy]];
        if (!cut) {
          d.path(path, { stroke: c.edge, width: 4, alpha: .55 });
          const p = d.onPath(path, d.seg(t, .08, .9));
          d.chip(p[0], p[1], "A to D", { fill: c.edge, glow: true });
        } else {
          d.chip(ST[0].cx + 98, ST[0].cy, "stuck", { fill: c.bad, glow: true, labelFill: c.fg });
          d.text(256, 430, "A is cut off from everything", {
            size: 13, weight: 700, align: "center", baseline: "middle", fill: c.bad, max: 400 });
        }
      }
      if (s === 2) {
        const path = [[ME[0].cx, ME[0].cy], [ME[3].cx, ME[3].cy]];
        d.path(path, { stroke: c.edge, width: 4, alpha: .55 });
        const p = d.onPath(path, d.seg(t, .08, .9));
        d.chip(p[0], p[1], "A to D", { fill: c.edge, glow: true });
      }
      if (s === 3) {
        const path = [[ME[0].cx, ME[0].cy], [ME[4].cx, ME[4].cy], [ME[3].cx, ME[3].cy]];
        d.path(path, { stroke: c.ok, width: 4, alpha: .6 });
        const p = d.onPath(path, d.seg(t, 0, .75));
        d.chip(p[0], p[1], "A to D", { fill: c.ok, glow: true });
        d.text(724, 430, "round through E instead", {
          size: 13, weight: 700, align: "center", baseline: "middle", fill: c.ok, max: 400 });
      }
      if (s === 4) {
        const path = [[ME[1].cx, ME[1].cy], [ME[4].cx, ME[4].cy]];
        d.path(path, { stroke: c.ok, width: 4, alpha: .6 });
        const p = d.onPath(path, d.seg(t, .08, .9));
        d.chip(p[0], p[1], "B to E", { fill: c.ok, glow: true });
        d.text(724, 430, "still working", {
          size: 13, weight: 700, align: "center", baseline: "middle", fill: c.ok, max: 400 });
      }
      if (s === 5) {
        d.text(256, 426, "5 devices, 5 cables", {
          size: 14, weight: 800, align: "center", baseline: "middle", fill: c.edge, max: 400 });
        d.text(724, 420, "5 devices, 10 cables  (" + Math.max(0, Math.min(10, meshLit)) + " so far)", {
          size: 14, weight: 800, align: "center", baseline: "middle", fill: c.edge, max: 400 });
        d.text(724, 442, "n x (n - 1) / 2", {
          size: 12, weight: 700, align: "center", baseline: "middle", fill: c.dim, max: 400 });
      }

      const notes = [
        ["Why both exist", "A star is cheap and tidy. A mesh is expensive and tangled, but it has no single piece that everything relies on.", [SW.x, SC[1]]],
        ["The switch is clever", "It reads the destination MAC address and sends the frame down that one cable, so the other devices never see it.", [SC[0] + 52, SC[1]]],
        ["Where you meet mesh", "The internet is a partial mesh: important routers have several links each, so traffic can always be sent another way.", [ME[2].cx, ME[2].cy + 23]],
        ["One fault, two outcomes", "In a star the broken cable only isolates one device - everyone else is fine. In a mesh, nobody notices.", [(ME[0].cx + ME[3].cx) / 2, (ME[0].cy + ME[3].cy) / 2]],
        ["Still a single point", "A star survives a broken cable but not a broken switch. That is the one weakness you must name in an exam answer.", [SW.x, SW.y]],
        ["It gets worse fast", "Ten devices would need 45 cables in a full mesh. That is why wired full mesh is rare and wireless mesh is common.", [ST[3].x, ST[3].y]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 170, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =========================================================================
  // Encryption: a shift cipher, and an eavesdropper who gains nothing
  // =========================================================================
  A("encryption", function () {
    const W = 980, H = 580;
    const SHIFT = 3;
    const PT = "PASSWORD".split("");
    const CT = PT.map(function (ch) {
      return String.fromCharCode(65 + (ch.charCodeAt(0) - 65 + SHIFT) % 26);
    });
    const N = PT.length;
    const CX = 150, CWD = 40, GAP = 4;
    const ROWA = 196, ROWB = 258;
    const AX = 74, ASTEP = 21.1;
    const WIRE_Y = 110;

    const steps = [
      { name: "1. Plaintext", caption: "This is the message before anything is done to it. Anyone who reads it understands it, which is the problem." },
      { name: "2. The key", caption: "The key here is a shift of 3: every letter moves three places along the alphabet. Both ends must know it." },
      { name: "3. Encrypt", caption: "Each letter is replaced using the key. P becomes S, A becomes D, and so on, giving the ciphertext." },
      { name: "4. Across the network", caption: "Only the ciphertext is sent. The letters that travel along the cable carry no meaning on their own." },
      { name: "5. Intercepted", caption: "An eavesdropper can still copy everything that passes. They get the ciphertext - and no way to turn it back." },
      { name: "6. Decrypt", caption: "The receiver knows the key, so it shifts every letter back three places and the original message appears." }
    ];

    return { w: W, h: H, steps: steps, render: function (d, s, t) {
      const c = d.c;
      d.title("Encryption: scrambling a message with a key");

      const sendOn = s <= 3, recvOn = s === 5, tapOn = s >= 3, caught = s === 4;

      // ---- sender, wire, receiver
      d.box(40, 64, 210, 92, { fill: c.panel, stroke: sendOn ? c.ok : c.line, on: sendOn,
        label: "Sender", sub: "has the key", r: 12 });
      d.box(730, 64, 210, 92, { fill: c.panel, stroke: recvOn ? c.ok : c.line, on: recvOn,
        label: "Receiver", sub: "has the key", r: 12 });
      d.line(250, WIRE_Y, 730, WIRE_Y, { stroke: s === 3 ? c.edge : c.line, width: s === 3 ? 4 : 2.6 });
      d.text(490, 84, "the network", { size: 12, weight: 700, align: "center", baseline: "middle", fill: c.dim, max: 180 });

      if (tapOn) {
        d.line(620, WIRE_Y, 772, 280, { stroke: c.bad, width: 1.8, dash: [6, 5], alpha: .85 });
        d.dot(620, WIRE_Y, 5, { fill: c.bad });
      }

      // ---- message rows
      const typed = s === 0 ? Math.floor(d.seg(t, 0, .55) * (N + .99)) : N;
      const enc = s === 2 ? Math.floor(d.seg(t, .05, .85) * (N + .99)) : (s >= 2 ? N : 0);
      const dec = s === 5 ? Math.floor(d.seg(t, .05, .85) * (N + .99)) : N;

      const aAlpha = (s === 3 || s === 4) ? .28 : 1;
      const aList = [], bList = [], aFills = {}, bFills = {};
      for (let i = 0; i < N; i++) {
        const showA = s === 5 ? i < dec : i < typed;
        aList.push(showA ? PT[i] : "");
        bList.push(i < enc ? CT[i] : "");
        if (s === 2 && i === enc - 1) { aFills[i] = c.edge; bFills[i] = c.edge; }
        if (s === 5 && i === dec - 1) { aFills[i] = c.ok; bFills[i] = c.ok; }
      }
      d.text(40, ROWA + 20, "Plaintext", { size: 13, weight: 700, baseline: "middle", fill: c.soft, max: 102, alpha: aAlpha });
      d.text(40, ROWB + 20, "Ciphertext", { size: 13, weight: 700, baseline: "middle", fill: c.soft, max: 102 });
      d.cells(CX, ROWA, aList, { cw: CWD, ch: 40, gap: GAP, fills: aFills, accent: c.ok, alpha: aAlpha });
      d.cells(CX, ROWB, bList, { cw: CWD, ch: 40, gap: GAP, fills: bFills, accent: c.edge });
      if (s === 3 || s === 4)
        d.text(40, ROWA - 14, "never leaves the sender", { size: 11.5, weight: 700, baseline: "middle", fill: c.dim, max: 300 });

      // ---- the key
      const keyOn = s === 1 || s === 2 || s === 5;
      d.box(524, ROWA, 106, 102, { fill: keyOn ? c.panel2 : c.panel, stroke: keyOn ? c.edge : c.line,
        on: keyOn, r: 12, label: "KEY", sub: s === 5 ? "shift back 3" : "shift 3" });

      // ---- alphabet strips (the key, drawn out)
      const stripA = keyOn ? 1 : .45;
      d.text(AX, 324, "Key: shift 3 - every letter moves three places along the alphabet",
             { size: 12, weight: 700, baseline: "middle", fill: keyOn ? c.soft : c.dim, max: 540, alpha: stripA });
      let hot = -1;
      if (s === 1) hot = Math.min(25, Math.floor(d.seg(t, .05, .9) * 25.99));
      if (s === 2 && enc > 0) hot = PT[enc - 1].charCodeAt(0) - 65;
      if (s === 5 && dec > 0) hot = PT[dec - 1].charCodeAt(0) - 65;
      d.text(58, 354, "plain", { size: 10.5, weight: 700, align: "right", baseline: "middle", fill: c.dim, max: 46, alpha: stripA });
      d.text(58, 384, "+ 3", { size: 10.5, weight: 700, align: "right", baseline: "middle", fill: c.dim, max: 46, alpha: stripA });
      for (let i = 0; i < 26; i++) {
        const px = AX + i * ASTEP, isHot = i === hot;
        if (isHot) d.box(px - 10, 338, 20, 60, { fill: c.panel2, stroke: c.edge, on: true, r: 5 });
        d.text(px, 354, String.fromCharCode(65 + i), { size: 12.5, weight: 700, align: "center",
          baseline: "middle", fill: isHot ? c.fg : c.soft, max: 18, alpha: isHot ? 1 : stripA });
        d.text(px, 384, String.fromCharCode(65 + (i + SHIFT) % 26), { size: 12.5, weight: 700, align: "center",
          baseline: "middle", fill: isHot ? c.edge : c.dim, max: 18, alpha: isHot ? 1 : stripA });
      }

      // ---- the eavesdropper
      d.box(660, 280, 280, 140, { fill: c.panel, stroke: tapOn ? c.bad : c.line, on: caught, r: 12 });
      d.text(800, 300, "Eavesdropper", { size: 14, weight: 800, align: "center", baseline: "middle",
        fill: tapOn ? c.bad : c.dim, max: 250 });
      if (caught) {
        d.cells(678, 314, CT, { cw: 28, ch: 26, gap: 3, size: 13 });
        d.cells(678, 348, PT.map(function () { return "?"; }),
                { cw: 28, ch: 26, gap: 3, size: 13, alpha: .8 });
        d.text(800, 402, "has the letters, has no key", { size: 12, weight: 700, align: "center",
          baseline: "middle", fill: c.bad, max: 258 });
      } else {
        d.text(800, 350, tapOn ? "listening on the line" : "nothing to see yet",
               { size: 12, weight: 700, align: "center", baseline: "middle",
                 fill: tapOn ? c.bad : c.dim, max: 250 });
      }

      // ---- the travelling ciphertext
      if (s === 3) {
        const px = d.lerp(260, 720, d.seg(t, .05, .9));
        d.chip(px, WIRE_Y, CT.join(""), { fill: c.edge, glow: true, size: 13 });
      }
      if (s === 4) {
        const p = d.onPath([[620, WIRE_Y], [772, 280]], d.seg(t, .1, .8));
        d.chip(620, WIRE_Y - 26, CT.join(""), { fill: c.edge, size: 12 });
        d.chip(p[0], p[1], "copy", { fill: c.bad, glow: true, labelFill: c.fg });
      }

      const notes = [
        ["Plain means readable", "Plaintext is not only text: it could be a photo, a password or a bank balance. Encryption treats it all the same way.", [CX + 174, ROWA + 48]],
        ["A real key is huge", "A shift of 3 has only 25 possible keys, so it is easy to break. Real keys are long enough that guessing would take centuries.", [577, ROWA + 102]],
        ["Watch one letter", "W is near the end of the alphabet, so shifting it by 3 wraps round past Z: W becomes Z, and X would become A.", [AX + 22 * ASTEP, 384]],
        ["No protection from copying", "Encryption does nothing to stop the signal being captured, especially over Wi-Fi where the radio waves reach outside the building.", [620, WIRE_Y]],
        ["Useless, not unseen", "That is the whole teaching point. You cannot stop interception, so you make what is intercepted worthless.", [800, 402]],
        ["Both ends, same key", "This cipher uses one shared key for both jobs. Getting that key to the other end safely is the hard part of encryption.", [577, ROWA + 102]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 170, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =========================================================================
  // DNS: what happens when you type a web address
  // =========================================================================
  A("dns", function () {
    const W = 980, H = 580;
    const NAME = "revise360.co.uk";
    const IP = "198.51.100.24";
    const BR = { x: 40, y: 190, w: 250, h: 210 };
    const DN = { x: 352, y: 56, w: 300, h: 112 };
    const WS = { x: 690, y: 190, w: 250, h: 210 };
    const ASK = [[244, 196], [396, 166]];
    const REP = [[404, 174], [256, 212]];

    const steps = [
      { name: "1. Type it", caption: "You type a name because names are easy to remember. The network itself cannot use a name - it needs a number." },
      { name: "2. Ask DNS", caption: "The browser sends the name to a DNS server. DNS is the directory that turns domain names into IP addresses." },
      { name: "3. Get the IP", caption: "DNS looks the name up in its records and sends back the IP address of the web server that holds the site." },
      { name: "4. Ask the server", caption: "Now the browser can address the request properly. It sends an HTTP request to the web server at that IP address." },
      { name: "5. Page comes back", caption: "The web server responds with the HTML, the stylesheets and the images, and the browser draws the page." },
      { name: "6. Next time", caption: "The browser remembers the name and IP in its cache, so the next visit skips the DNS lookup and feels faster." }
    ];

    return { w: W, h: H, steps: steps, render: function (d, s, t) {
      const c = d.c;
      d.title("What happens when you type a web address");

      const dnsOn = s === 1 || s === 2;
      const dnsDim = s === 5 ? .28 : 1;
      const cacheOn = s === 5;

      // ---- DNS server
      d.box(DN.x, DN.y, DN.w, DN.h, { fill: c.panel, stroke: dnsOn ? c.teal : c.line,
        on: dnsOn, r: 14, alpha: dnsDim });
      d.text(DN.x + DN.w / 2, DN.y + 20, "DNS server", { size: 15, weight: 800, align: "center",
        baseline: "middle", fill: dnsOn ? c.teal : c.soft, max: 220, alpha: dnsDim });
      [[NAME, IP], ["unity.example", "203.0.113.9"]].forEach(function (r, i) {
        const lit = dnsOn && i === 0;
        d.box(DN.x + 16, DN.y + 36 + i * 36, DN.w - 32, 30, {
          fill: lit ? c.panel2 : c.panel, stroke: lit ? c.teal : c.line, on: lit,
          label: r[0] + "  →  " + r[1], size: 12, alpha: dnsDim });
      });

      // ---- browser
      d.box(BR.x, BR.y, BR.w, BR.h, { fill: c.panel, stroke: c.info, r: 14 });
      d.text(BR.x + 14, BR.y + 18, "Your browser", { size: 13, weight: 800, fill: c.info,
        baseline: "middle", max: 220 });
      const typed = s === 0 ? NAME.slice(0, Math.ceil(d.seg(t, 0, .6) * NAME.length)) : NAME;
      d.box(BR.x + 16, BR.y + 34, BR.w - 32, 32, { fill: c.bg, stroke: s === 0 ? c.edge : c.line,
        on: s === 0, r: 8, label: typed + (s === 0 && t < .95 ? "|" : ""), size: 14 });
      const pageOn = s >= 4;
      d.box(BR.x + 16, BR.y + 78, BR.w - 32, 72, { fill: pageOn ? c.panel2 : c.bg,
        stroke: pageOn ? c.ok : c.line, on: pageOn, r: 8,
        label: pageOn ? "page drawn" : "blank", sub: pageOn ? "HTML, CSS, images" : "waiting",
        size: 14 });
      d.box(BR.x + 16, BR.y + 160, BR.w - 32, 34, { fill: cacheOn ? c.panel2 : c.bg,
        stroke: cacheOn ? c.edge : c.line, on: cacheOn, r: 8,
        label: s >= 2 ? "cached: " + NAME : "cache: empty", size: 11.5 });

      // ---- web server
      const wsOn = s >= 3;
      d.box(WS.x, WS.y, WS.w, WS.h, { fill: c.panel, stroke: wsOn ? c.ok : c.line, on: wsOn, r: 14 });
      d.text(WS.x + WS.w / 2, WS.y + 28, "Web server", { size: 15, weight: 800, align: "center",
        baseline: "middle", fill: wsOn ? c.ok : c.soft, max: 220 });
      d.box(WS.x + 20, WS.y + 54, WS.w - 40, 38, { fill: c.panel2, stroke: c.ok, r: 8,
        label: IP, size: 15 });
      d.text(WS.x + WS.w / 2, WS.y + 110, "its address on the internet", { size: 12, weight: 600,
        align: "center", baseline: "middle", fill: c.dim, max: 220 });
      d.box(WS.x + 20, WS.y + 130, WS.w - 40, 56, { fill: c.panel, stroke: c.line, r: 8,
        label: "the site's files", sub: "pages, images, scripts", size: 13 });

      // ---- DNS exchange arrows
      d.arrow(ASK[0][0], ASK[0][1], ASK[1][0], ASK[1][1], {
        stroke: s === 1 ? c.teal : c.line, width: s === 1 ? 3.5 : 2, alpha: dnsDim });
      d.arrow(REP[0][0], REP[0][1], REP[1][0], REP[1][1], {
        stroke: s === 2 ? c.teal : c.line, width: s === 2 ? 3.5 : 2, alpha: dnsDim });
      d.text(300, 138, "name out", { size: 11.5, weight: 700, align: "center", baseline: "middle",
        fill: s === 1 ? c.teal : c.dim, max: 120, alpha: dnsDim });
      d.text(364, 216, "number back", { size: 11.5, weight: 700, align: "center", baseline: "middle",
        fill: s === 2 ? c.teal : c.dim, max: 140, alpha: dnsDim });

      // ---- HTTP arrows
      const reqOn = s === 3 || s === 5, resOn = s === 4;
      d.arrow(BR.x + BR.w + 6, 300, WS.x - 6, 300, { stroke: reqOn ? c.edge : c.line,
        width: reqOn ? 3.5 : 2 });
      d.arrow(WS.x - 6, 352, BR.x + BR.w + 6, 352, { stroke: resOn ? c.ok : c.line,
        width: resOn ? 3.5 : 2 });
      d.text(490, 272, "HTTP request", { size: 12, weight: 700, align: "center", baseline: "middle",
        fill: reqOn ? c.edge : c.dim, max: 200 });
      d.text(490, 380, "HTTP response", { size: 12, weight: 700, align: "center", baseline: "middle",
        fill: resOn ? c.ok : c.dim, max: 200 });

      // ---- moving things
      if (s === 1) {
        const p = d.onPath(ASK, d.seg(t, .08, .9));
        d.chip(p[0], p[1], NAME, { fill: c.teal, glow: true, size: 12 });
      }
      if (s === 2) {
        const p = d.onPath(REP, d.seg(t, .08, .9));
        d.chip(p[0], p[1], IP, { fill: c.teal, glow: true, size: 12 });
      }
      if (s === 3) {
        const px = d.lerp(BR.x + BR.w + 34, WS.x - 34, d.seg(t, .08, .9));
        d.chip(px, 300, "GET /  →  " + IP, { fill: c.edge, glow: true, size: 12 });
      }
      if (s === 4) {
        const px = d.lerp(WS.x - 34, BR.x + BR.w + 34, d.seg(t, .08, .9));
        d.chip(px, 352, "page data", { fill: c.ok, glow: true, size: 12 });
      }
      if (s === 5) {
        d.line(BR.x + BR.w - 14, BR.y + 177, 312, 380, { stroke: c.edge, width: 1.6, dash: [5, 4] });
        const path = [[312, 380], [380, 300], [WS.x - 34, 300]];
        const p = d.onPath(path, d.seg(t, .05, .92));
        d.chip(p[0], p[1], IP, { fill: c.edge, glow: true, size: 12 });
        d.text(495, 182, "DNS lookup skipped", { size: 14, weight: 800, align: "center",
          baseline: "middle", fill: c.edge, max: 240 });
      }

      const notes = [
        ["Names are for people", "A domain name can move to a different machine with a different IP address and you would never notice. That is why we use names.", [BR.x, BR.y + 50]],
        ["Not one directory", "There is no single DNS machine. If the first server does not know the name it asks another, and so on up the chain.", [DN.x + DN.w / 2, DN.y + DN.h]],
        ["Four numbers", "An IPv4 address is four numbers, each 0 to 255. There are not enough of them left, which is why IPv6 exists.", [WS.x + 30, WS.y + 73]],
        ["HTTP is the protocol", "The rules for how to ask for a page and what the reply looks like. HTTPS is the same thing with the traffic encrypted.", [WS.x, 320]],
        ["Many requests, not one", "The page arrives first, then the browser asks again for every image, font and script it mentions.", [WS.x, 330]],
        ["Caches can go stale", "A cached entry has a time limit. If a site moves to a new IP address before that runs out, the cached answer stops working.", [BR.x + 130, BR.y + 194]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 180, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =========================================================================
  // The four-layer TCP/IP model: encapsulation and its reverse
  // =========================================================================
  A("tcpip", function () {
    const W = 980, H = 580;
    const LAY = [
      { n: "Application", job: "makes the request itself", prot: "HTTP, HTTPS, SMTP, IMAP, FTP" },
      { n: "Transport", job: "splits it into numbered packets", prot: "TCP, UDP" },
      { n: "Internet", job: "adds IP addresses, picks a route", prot: "IP" },
      { n: "Link", job: "puts the bits onto cable or Wi-Fi", prot: "Ethernet, Wi-Fi, MAC" }
    ];
    const RH = 76, RY = [76, 164, 252, 340];
    const MID = RY.map(function (y) { return y + RH / 2; });
    const LX = 40, LW = 186, RX = 754;
    const SLANE = 350, RLANE = 630, NETY = 440;
    const FLD = { data: 72, tcp: 46, ip: 40, mac: 50 };

    const steps = [
      { name: "1. Four layers", caption: "Networking is split into four layers. Each one has a single job and relies on the layer below it to do the next part." },
      { name: "2. Application", caption: "The top layer creates the actual request - a web page asked for over HTTP, or an email handed to SMTP." },
      { name: "3. Transport", caption: "The transport layer splits the data into packets and wraps each one in a TCP header holding its sequence number." },
      { name: "4. Internet", caption: "The internet layer wraps that again, adding the source and destination IP addresses so routers know where to send it." },
      { name: "5. Link", caption: "The link layer adds the MAC addresses for the next hop, turns it into signals and sends it. Each wrap is called encapsulation." },
      { name: "6. Unwrap", caption: "On the receiving machine the headers come off in the opposite order - link first, then internet, then transport." },
      { name: "7. Same data", caption: "The application layer at the top is handed exactly what the application layer at the other end sent down." }
    ];

    function packet(d, cx, cy, parts) {
      let tot = 0;
      parts.forEach(function (p) { tot += p.w; });
      let bx = cx - tot / 2;
      parts.forEach(function (p) {
        if (p.w > 3) d.box(bx, cy - 18, p.w, 36, { fill: p.col, stroke: d.c.fg, r: 6,
          label: p.w > 26 ? p.t : "", labelFill: d.c.bg, size: 12.5 });
        bx += p.w;
      });
    }

    return { w: W, h: H, steps: steps, render: function (d, s, t) {
      const c = d.c;
      d.title("The four-layer TCP/IP model: wrapping and unwrapping");

      const sweep = s === 0 ? Math.floor(d.seg(t, .05, .95) * 3.99) : -1;
      const sendRow = s >= 1 && s <= 4 ? s - 1 : -1;
      let recvRow = -1;
      if (s === 5) recvRow = t < .3 ? 3 : (t < .6 ? 2 : 1);
      if (s === 6) recvRow = 0;

      d.text(LX, 56, "SENDING DEVICE", { size: 13, weight: 800, fill: c.info, baseline: "middle", max: 200 });
      d.text(RX, 56, "RECEIVING DEVICE", { size: 13, weight: 800, fill: c.ok, baseline: "middle", max: 200 });

      LAY.forEach(function (L, i) {
        const sOn = i === sendRow || i === sweep;
        const rOn = i === recvRow;
        d.box(LX, RY[i], LW, RH, { fill: sOn ? c.panel2 : c.panel, stroke: sOn ? c.info : c.line,
          on: sOn, r: 10, label: L.n, sub: L.job, size: 15, subSize: 11 });
        d.text(LX + LW / 2, RY[i] + 64, L.prot, { size: 10.5, weight: 700, align: "center",
          baseline: "middle", fill: sOn ? c.info : c.dim, max: LW - 16 });
        d.box(RX, RY[i], LW, RH, { fill: rOn ? c.panel2 : c.panel, stroke: rOn ? c.ok : c.line,
          on: rOn, r: 10, label: L.n, sub: L.job, size: 15, subSize: 11 });
        d.text(RX + LW / 2, RY[i] + 64, L.prot, { size: 10.5, weight: 700, align: "center",
          baseline: "middle", fill: rOn ? c.ok : c.dim, max: LW - 16 });
        if (i < 3) {
          d.head(LX + LW / 2, RY[i + 1] - 2, Math.PI / 2, { stroke: c.info, size: 7 });
          d.head(RX + LW / 2, RY[i] + RH + 2, -Math.PI / 2, { stroke: c.ok, size: 7 });
        }
      });
      d.text(LX + LW / 2, 434, "data goes DOWN", { size: 11.5, weight: 800, align: "center",
        baseline: "middle", fill: c.info, max: LW });
      d.text(RX + LW / 2, 434, "data comes UP", { size: 11.5, weight: 800, align: "center",
        baseline: "middle", fill: c.ok, max: LW });

      // ---- the physical network, drawn as the path the frame actually takes
      const netPath = [[SLANE, MID[3]], [SLANE, NETY], [RLANE, NETY], [RLANE, MID[3]]];
      d.path(netPath, { stroke: s === 4 ? c.orange : c.line, width: s === 4 ? 4 : 2.4 });
      d.dot(490, NETY, 9, { fill: s === 4 ? c.orange : c.line });
      d.text(490, 410, "the network", { size: 12, weight: 700, align: "center",
        baseline: "middle", fill: s === 4 ? c.orange : c.dim, max: 240 });

      // ---- the packet, with headers growing and shrinking
      const D = { t: "DATA", w: FLD.data, col: c.ok };
      if (s === 0) {
        d.text(SLANE, MID[0], "nothing sent yet", { size: 13, weight: 700, align: "center",
          baseline: "middle", fill: c.dim, max: 200 });
        d.text(RLANE, MID[0], "nothing received yet", { size: 13, weight: 700, align: "center",
          baseline: "middle", fill: c.dim, max: 200 });
      }
      if (s === 1) {
        packet(d, SLANE, MID[0], [{ t: "DATA", w: FLD.data * d.seg(t, .05, .5), col: c.ok }]);
        d.text(SLANE, MID[0] + 44, "your data", { size: 12, weight: 700, align: "center",
          baseline: "middle", fill: c.soft, max: 220 });
      }
      if (s === 2) {
        const w = FLD.tcp * d.seg(t, .1, .55);
        const y = d.lerp(MID[0], MID[1], d.seg(t, 0, .4));
        packet(d, SLANE, y, [{ t: "TCP", w: w, col: c.info }, D]);
        d.text(SLANE, y + 44, "+ TCP header: packet 1 of 4", { size: 12, weight: 700,
          align: "center", baseline: "middle", fill: c.info, max: 240 });
      }
      if (s === 3) {
        const w = FLD.ip * d.seg(t, .1, .55);
        const y = d.lerp(MID[1], MID[2], d.seg(t, 0, .4));
        packet(d, SLANE, y, [{ t: "IP", w: w, col: c.violet }, { t: "TCP", w: FLD.tcp, col: c.info }, D]);
        d.text(SLANE, y + 44, "+ IP header: from 203.0.113.7", { size: 12, weight: 700,
          align: "center", baseline: "middle", fill: c.violet, max: 250 });
      }
      if (s === 4) {
        const w = FLD.mac * d.seg(t, .02, .16);
        const parts = [{ t: "MAC", w: w, col: c.orange }, { t: "IP", w: FLD.ip, col: c.violet },
                       { t: "TCP", w: FLD.tcp, col: c.info }, D];
        const y0 = d.lerp(MID[2], MID[3], d.seg(t, 0, .14));
        const run = d.clamp((t - .18) / .62, 0, 1);
        const p = run <= 0 ? [SLANE, y0] : d.onPath(netPath, run);
        packet(d, p[0], p[1], parts);
        d.text(SLANE, MID[2] + 10, "+ MAC header, then onto the wire", { size: 12, weight: 700,
          align: "center", baseline: "middle", fill: c.orange, max: 250 });
      }
      if (s === 5) {
        const macW = FLD.mac * (1 - d.seg(t, .02, .22));
        const ipW = FLD.ip * (1 - d.seg(t, .34, .52));
        const tcpW = FLD.tcp * (1 - d.seg(t, .64, .82));
        const y = t < .3 ? MID[3] : (t < .6 ? d.lerp(MID[3], MID[2], d.seg(t, .24, .34))
                                            : d.lerp(MID[2], MID[1], d.seg(t, .54, .64)));
        packet(d, RLANE, y, [{ t: "MAC", w: macW, col: c.orange }, { t: "IP", w: ipW, col: c.violet },
                             { t: "TCP", w: tcpW, col: c.info }, D]);
        const drop = [[c.orange, "MAC", .02], [c.violet, "IP", .34], [c.info, "TCP", .64]];
        drop.forEach(function (g, i) {
          const a = d.clamp((t - g[2]) / .3, 0, 1);
          if (a <= 0 || a >= 1) return;
          d.chip(RLANE - 120, MID[3 - i] + a * 28, g[1] + " off", { fill: g[0], alpha: 1 - a, size: 11 });
        });
        d.text(RLANE, 116, "headers come off in reverse order", { size: 12, weight: 700,
          align: "center", baseline: "middle", fill: c.ok, max: 260 });
      }
      if (s === 6) {
        const y = d.lerp(MID[1], MID[0], d.seg(t, .05, .6));
        packet(d, RLANE, y, [D]);
        d.text(RLANE, MID[0] + 48, "exactly what was sent", { size: 12, weight: 700,
          align: "center", baseline: "middle", fill: c.ok, max: 240 });
      }

      const notes = [
        ["Why bother with layers", "One layer can be changed without touching the others. Swapping a cable for Wi-Fi changes the link layer only - HTTP never notices.", [LX + LW, MID[1]]],
        ["Where your program sits", "A browser or an email client talks to this layer and nothing lower. It never deals with IP addresses itself.", [LX + LW, MID[0]]],
        ["Transport counts", "TCP numbers every packet and waits for an acknowledgement, so anything missing can be asked for again.", [LX + LW, MID[1]]],
        ["Internet routes", "IP addresses are the ones that matter across the whole journey. Routers read this header and nothing deeper.", [LX + LW, MID[2]]],
        ["MAC is local only", "The MAC addresses change at every hop, because they name the next device along. The IP addresses stay the same all the way.", [LX + LW, MID[3]]],
        ["Each layer undoes its own", "The receiving link layer strips the link header, the internet layer strips the IP header, and so on. Nothing skips a step.", [RX, MID[2]]],
        ["That is the promise", "Layering only works because each layer hands up precisely what it was handed down. Same data, both ends.", [RX, MID[0]]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 160, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =========================================================================
  // Packet switching
  // =========================================================================
  A("packets", function () {
    const W = 980, H = 580;
    const SND = { x: 40, y: 150, w: 140, h: 100 }, RCV = { x: 800, y: 150, w: 140, h: 100 };
    const S0 = [110, 200], R0 = [870, 200];
    const RT = { R1: [290, 110], R2: [290, 350], R3: [480, 230], R4: [650, 110], R5: [650, 350] };
    const LINKS = [["S", "R1"], ["S", "R2"], ["R1", "R3"], ["R1", "R4"], ["R2", "R3"],
                   ["R2", "R5"], ["R3", "R4"], ["R3", "R5"], ["R4", "R"], ["R5", "R"]];
    const AT = { S: S0, R: R0, R1: RT.R1, R2: RT.R2, R3: RT.R3, R4: RT.R4, R5: RT.R5 };
    const ROUTE = [
      ["S", "R1", "R3", "R4", "R"],
      ["S", "R2", "R5", "R"],
      ["S", "R1", "R4", "R"],
      ["S", "R2", "R3", "R5", "R"]
    ];
    const ALT = [S0, RT.R1, RT.R4, R0];
    const COL = ["ok", "teal", "edge", "violet"];
    const SLOT = function (i) { return 276 + i * 36; };
    const LOSS = [716, 305];                   // on the R5 -> receiver link

    const steps = [
      { name: "1. Split it up", caption: "A file is not sent in one piece. It is chopped into small packets, and each one travels on its own." },
      { name: "2. The header", caption: "Every packet carries a header. It says where it came from, where it is going, and which packet of how many it is." },
      { name: "3. Different routes", caption: "Routers choose whichever route is quickest at that moment, so packets from one file can take different paths." },
      { name: "4. Out of order", caption: "Because the routes differ, packets arrive in the wrong order. Packet 3 got here before packet 1." },
      { name: "5. One is missing", caption: "Packet 4 never arrived. The sequence numbers make the gap obvious, so the receiver asks for it again." },
      { name: "6. Sent again", caption: "The sender transmits packet 4 a second time, and the routers send it by a different path." },
      { name: "7. Reassembled", caption: "With all four packets in, the sequence numbers put them back in order and the file is rebuilt." }
    ];

    return { w: W, h: H, steps: steps, render: function (d, s, t) {
      const c = d.c;
      d.title("Packet switching: one file, four packets, four routes");

      const dim = s === 1 ? .16 : 1;

      // ---- network, then the highlighted routes, then the boxes on top
      LINKS.forEach(function (L) {
        d.line(AT[L[0]][0], AT[L[0]][1], AT[L[1]][0], AT[L[1]][1],
               { stroke: c.line, width: 2, alpha: dim * .9 });
      });
      if (s === 2) ROUTE.forEach(function (r, i) {
        d.path(r.map(function (k) { return AT[k]; }), { stroke: c[COL[i]], width: 3, alpha: .5 });
      });
      if (s === 4) d.path([R0, RT.R4, RT.R1, S0], { stroke: c.bad, width: 2.6, dash: [7, 6], alpha: .8 });
      if (s === 5) d.path(ALT, { stroke: c.ok, width: 3.4, alpha: .8 });

      Object.keys(RT).forEach(function (k, i) {
        const p = RT[k];
        d.box(p[0] - 34, p[1] - 22, 68, 44, { fill: c.panel2, stroke: c.line,
          label: "R" + (i + 1), size: 15, alpha: dim });
      });
      d.box(SND.x, SND.y, SND.w, SND.h, { fill: c.panel, stroke: c.info, on: s === 0 || s === 5,
        r: 12, label: "Sender", sub: "203.0.113.7", alpha: dim });
      d.box(RCV.x, RCV.y, RCV.w, RCV.h, { fill: c.panel, stroke: c.ok, on: s >= 3,
        r: 12, label: "Receiver", sub: "198.51.100.24", alpha: dim });

      // ---- the sender's queue
      d.text(110, 262, "to send", { size: 12, weight: 800, align: "center", baseline: "middle",
        fill: c.info, max: 140, alpha: dim });
      // Step 1 cuts the file up in front of you: the single block shrinks from the
      // top as each numbered packet is taken off it.
      const cutN = s === 0 ? Math.floor(d.seg(t, .05, .85) * 4.99) : 4;
      for (let i = 0; i < cutN; i++) {
        d.box(40, SLOT(i), 140, 30, { fill: c.panel2, stroke: c[COL[i]],
          label: "Packet " + (i + 1), size: 12.5, r: 8, alpha: dim });
      }
      if (cutN < 4) {
        d.box(40, SLOT(cutN), 140, 414 - SLOT(cutN), { fill: c.panel, stroke: c.info,
          r: 8, label: "the file", sub: "not yet cut up", size: 13 });
      }
      if (s === 0) d.text(110, 434, "one file, cut into four", { size: 12, weight: 700,
        align: "center", baseline: "middle", fill: c.dim, max: 200 });

      // ---- the receiver's buffer
      if (s >= 3) {
        d.text(870, 262, s === 6 ? "in order" : "arrived", { size: 12, weight: 800, align: "center",
          baseline: "middle", fill: c.ok, max: 140 });
      }
      if (s >= 3 && s <= 5) {
        const late = s === 5 && t > .85;
        [3, 1, 2, late ? 4 : 0].forEach(function (pk, i) {
          if (s === 3 && t < .05 + i * .11) return;
          if (pk === 0) {
            d.box(800, SLOT(i), 140, 30, { fill: c.panel, stroke: c.bad, on: true,
              label: "4 missing", size: 12.5, r: 8, labelFill: c.bad });
          } else {
            d.box(800, SLOT(i), 140, 30, { fill: c.panel2, stroke: c[COL[pk - 1]],
              label: "Packet " + pk, size: 12.5, r: 8 });
          }
        });
      }
      if (s === 6) {
        [1, 2, 3, 4].forEach(function (pk, i) {
          const on = t > .06 + i * .13;
          d.text(790, SLOT(i) + 15, String(pk), { size: 12, weight: 800, align: "right",
            baseline: "middle", fill: on ? c.edge : c.dim, max: 20 });
          d.box(800, SLOT(i), 140, 30, { fill: on ? c.panel2 : c.panel,
            stroke: on ? c[COL[pk - 1]] : c.line, on: on, label: "Packet " + pk,
            size: 12.5, r: 8 });
        });
        d.text(870, 434, "file rebuilt", { size: 13, weight: 800, align: "center",
          baseline: "middle", fill: c.ok, max: 160, alpha: d.seg(t, .25, .5) });
        d.text(700, 262, "sorted by sequence number", { size: 11.5, weight: 700, align: "right",
          baseline: "middle", fill: c.dim, max: 240 });
      }

      // ---- step 2: the header, laid out over a dimmed network
      if (s === 1) {
        d.box(170, 112, 640, 200, { fill: c.bg, stroke: c.edge, r: 14 });
        d.text(221, 136, "HEADER", { size: 12.5, weight: 800, baseline: "middle", fill: c.edge, max: 200 });
        d.text(221, 224, "PAYLOAD", { size: 12.5, weight: 800, baseline: "middle", fill: c.ok, max: 200 });
        const f = [["From", "203.0.113.7", 150], ["To", "198.51.100.24", 150],
                   ["Packet", "3 of 4", 128], ["Checksum", "error check", 110]];
        let bx = 221;
        f.forEach(function (fd, i) {
          const show = t > .05 + i * .1;
          d.box(bx, 150, fd[2], 56, { fill: show ? c.panel2 : c.panel,
            stroke: show ? c.edge : c.line, on: show && i === 2,
            label: fd[0], sub: show ? fd[1] : "", size: 14, r: 8 });
          bx += fd[2];
        });
        d.box(221, 238, 538, 56, { fill: t > .5 ? c.panel2 : c.panel, stroke: t > .5 ? c.ok : c.line,
          on: t > .5, label: "Payload", sub: "this packet's slice of the file", size: 14, r: 8 });
      }

      // ---- step 3: four packets in flight
      if (s === 2) ROUTE.forEach(function (r, i) {
        const p = d.onPath(r.map(function (k) { return AT[k]; }), d.seg(t, .05 + i * .07, .8 + i * .07));
        d.chip(p[0], p[1], String(i + 1), { fill: c[COL[i]], glow: true, w: 30, size: 13 });
      });

      // ---- steps 4 and 5: packet 4 never made it past R5
      if (s === 3 || s === 4) {
        fail(d, LOSS[0], LOSS[1], t);
        d.text(650, 400, "packet 4 lost here", { size: 12, weight: 700, align: "center",
          baseline: "middle", fill: c.bad, max: 220 });
      }
      if (s === 4) {
        const p = d.onPath([R0, RT.R4, RT.R1, S0], d.seg(t, .05, .75));
        d.chip(p[0], p[1], "resend 4", { fill: c.bad, glow: true, labelFill: c.fg, size: 12 });
      }

      // ---- step 6: packet 4 again, by a different route
      if (s === 5) {
        const p = d.onPath(ALT, d.seg(t, .08, .9));
        d.chip(p[0], p[1], "4", { fill: c.ok, glow: true, w: 30, size: 13 });
        d.text(470, 70, "a different route this time", { size: 12.5, weight: 700, align: "center",
          baseline: "middle", fill: c.ok, max: 320 });
      }

      const notes = [
        ["Why split at all", "Small packets share a line fairly. One huge file sent whole would block everyone else until it finished.", [40, SLOT(1) + 15]],
        ["What the header is for", "Without the sequence number the packets could not be reordered, and without the checksum a damaged packet would pass unnoticed.", [490, 206]],
        ["Routers decide, not you", "Each router picks the next hop as the packet reaches it, based on how busy the links are right then.", [RT.R3[0], RT.R3[1] + 22]],
        ["Out of order is normal", "A shorter route is not always a faster one. Arriving jumbled is expected, not a fault.", [794, SLOT(1) + 15]],
        ["TCP spots the gap", "The receiver sends an acknowledgement for what did arrive. No acknowledgement for packet 4 means the sender tries again.", [794, SLOT(3) + 15]],
        ["Same file, new path", "Nothing ties a packet to the route its brothers took, so the retry can go round the congestion that lost the first attempt.", [RT.R4[0], RT.R4[1] + 22]],
        ["Reassembly is the last job", "Only when every sequence number is present can the file be put back together. Until then it is held in a buffer.", [794, SLOT(2) + 15]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 170, alpha: d.seg(t, 0, .25) });
    } };
  });
})();
