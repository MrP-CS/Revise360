// Revise 360: interactive 3D hardware models.
// Everything is built in code: shapes, plus textures drawn on canvases at load time
// (circuit boards, brushed metal, chip markings), lit by a generated studio environment.
(function () {
  const T = THREE;
  const TEX = {};                                   // texture cache, so each is drawn once
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  function canvas(key, w, h, draw) {
    if (TEX[key]) return TEX[key];
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); draw(x, w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 8; TEX[key] = t; return t;
  }
  function noise(x, w, h, n, a) { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${rand() > .5 ? "255,255,255" : "0,0,0"},${a * rand()})`; x.fillRect(rand() * w, rand() * h, 2, 2); } }

  // ---------- texture painters ----------
  function pcb(key, labels, opts) {
    opts = opts || {};
    const draw = (bump) => (x, w, h) => {
      x.fillStyle = bump ? "#000" : (opts.base || "#1a5a36"); x.fillRect(0, 0, w, h);
      if (!bump) noise(x, w, h, 4000, .08);
      x.strokeStyle = bump ? "#888" : "rgba(80,170,110,.75)"; x.lineWidth = 3; x.lineCap = "round";
      for (let i = 0; i < 90; i++) {                 // circuit traces with 45-degree bends
        let px = rand() * w, py = rand() * h; x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 4; k++) { const len = 20 + rand() * 90, dir = Math.floor(rand() * 8) * Math.PI / 4; px += Math.cos(dir) * len; py += Math.sin(dir) * len; x.lineTo(px, py); }
        x.stroke();
        if (!bump) { x.fillStyle = "#d9b24a"; x.beginPath(); x.arc(px, py, 4, 0, 7); x.fill(); }
      }
      if (!bump) {
        x.fillStyle = "rgba(255,255,255,.85)"; x.font = "bold 20px monospace";
        (labels || []).forEach(([t, lx, ly]) => x.fillText(t, lx * w, ly * h));
        if (opts.edge) { x.fillStyle = "#d4af37"; for (let i = 8; i < w - 8; i += 14) x.fillRect(i, h - 26, 9, 24); }
      }
    };
    return { map: canvas(key, 1024, 1024, draw(false)), bump: canvas(key + "b", 512, 512, draw(true)) };
  }
  function brushed(key, tint, text) {
    return canvas(key, 1024, 1024, (x, w, h) => {
      x.fillStyle = tint || "#b9bec7"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) { const y = rand() * h, v = 150 + rand() * 90; x.strokeStyle = `rgba(${v},${v},${v + 6},.18)`; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + rand() * 4 - 2); x.stroke(); }
      if (text) {
        x.fillStyle = "rgba(40,44,54,.75)"; x.textAlign = "center";
        x.font = "bold 70px Segoe UI, sans-serif"; x.fillText(text[0], w / 2, h * .42);
        x.font = "44px monospace"; text.slice(1).forEach((t, i) => x.fillText(t, w / 2, h * .54 + i * 56));
        x.beginPath(); x.moveTo(60, 60); x.lineTo(130, 60); x.lineTo(60, 130); x.closePath(); x.fill();
      }
    });
  }
  function epoxy(key, lines, accent) {
    return canvas(key, 512, 512, (x, w, h) => {
      x.fillStyle = "#16181d"; x.fillRect(0, 0, w, h); noise(x, w, h, 2500, .06);
      if (accent) { x.fillStyle = accent; x.fillRect(0, 0, w, 70); x.fillStyle = "#0f1626"; x.font = "bold 50px Segoe UI, sans-serif"; x.textAlign = "center"; x.fillText(lines[0], w / 2, 52); lines = lines.slice(1); }
      x.fillStyle = "rgba(230,232,236,.9)"; x.textAlign = "center";
      lines.forEach((t, i) => { x.font = i === 0 ? "bold 58px Segoe UI, sans-serif" : "34px monospace"; x.fillText(t, w / 2, (accent ? 190 : 180) + i * 70); });
      x.beginPath(); x.arc(46, h - 46, 16, 0, 7); x.strokeStyle = "rgba(230,232,236,.6)"; x.lineWidth = 4; x.stroke();
    });
  }
  function die() {
    return canvas("die", 1024, 1024, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#2a2f5a"); g.addColorStop(.5, "#3c2f55"); g.addColorStop(1, "#1f3a55"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { const bw = 6 + rand() * 30, bh = 6 + rand() * 30; x.fillStyle = `rgba(${120 + rand() * 120},${120 + rand() * 120},255,${.08 + rand() * .15})`; x.fillRect(rand() * w, rand() * h, bw, bh); }
      x.strokeStyle = "rgba(200,210,255,.25)"; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    });
  }
  function coreTex(n) {
    return canvas("core" + n, 512, 512, (x, w, h) => {
      x.fillStyle = "#1e4f7a"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(120,200,255,${.1 + rand() * .25})`; x.fillRect(rand() * w, rand() * h, 4 + rand() * 20, 4 + rand() * 20); }
      x.fillStyle = "rgba(255,255,255,.95)"; x.font = "bold 88px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("Core " + n, w / 2, h / 2);
    });
  }
  function blockTex(key, label, color) {
    return canvas(key, 512, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, color); g.addColorStop(1, "#1a2238"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${.04 + rand() * .08})`; x.fillRect(rand() * w, rand() * h, 6 + rand() * 24, 4 + rand() * 12); }
      x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24);
      x.fillStyle = "#fff"; x.font = `bold ${label.length > 4 ? 90 : 130}px Segoe UI, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(label, w / 2, h / 2);
    });
  }
  function plastic(key, c) { return canvas(key, 256, 256, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); noise(x, w, h, 3000, .05); }); }
  function panelTex() {
    return canvas("wmpanel", 1024, 256, (x, w, h) => {
      x.fillStyle = "#e9edf3"; x.fillRect(0, 0, w, h); noise(x, w, h, 3000, .04);
      x.fillStyle = "#0e1a14"; x.fillRect(560, 70, 220, 110); x.fillStyle = "#7dffb0"; x.font = "bold 72px monospace"; x.fillText("1:15", 580, 150);
      x.fillStyle = "#c9ced6"; x.beginPath(); x.arc(160, 128, 90, 0, 7); x.fill(); x.fillStyle = "#9aa2ae"; x.beginPath(); x.arc(160, 128, 60, 0, 7); x.fill();
      x.strokeStyle = "#39414d"; x.lineWidth = 8; x.beginPath(); x.moveTo(160, 128); x.lineTo(160, 60); x.stroke();
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; x.fillStyle = "#39414d"; x.fillRect(160 + Math.cos(a) * 105 - 3, 128 + Math.sin(a) * 105 - 3, 6, 6); }
      ["#40c4ff", "#50dc96", "#ff785a"].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(860 + i * 55, 128, 20, 0, 7); x.fill(); });
      x.fillStyle = "#39414d"; x.font = "bold 30px Segoe UI, sans-serif"; x.fillText("COTTONS  ECO  QUICK  40°", 300, 225);
    });
  }
  function drumTex() {
    return canvas("drum", 1024, 512, (x, w, h) => {
      x.fillStyle = "#c9ced6"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 1600; i++) { const y = rand() * h, v = 170 + rand() * 70; x.strokeStyle = `rgba(${v},${v},${v},.2)`; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
      x.fillStyle = "#5a616c"; for (let i = 20; i < w; i += 34) for (let j = 20; j < h; j += 34) { x.beginPath(); x.arc(i + (j % 68 ? 17 : 0), j, 6, 0, 7); x.fill(); }
    });
  }
  function shadowTex() {
    return canvas("shadow", 256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  }

  // ---------- materials and shapes ----------
  const std = (o) => new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, roughness: .55, metalness: .1, envMapIntensity: .7 }, o || {}));
  const metal = (map, o) => std(Object.assign({ map, metalness: .9, roughness: .32 }, o || {}));
  const gold = () => std({ color: 0xe0b44a, metalness: 1, roughness: .25 });
  const board = (p) => std({ map: p.map, bumpMap: p.bump, bumpScale: .02, color: 0x9aa39c, roughness: .62, metalness: .05, envMapIntensity: .45 });
  const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); return o; };
  const topBox = (w, h, d, sideM, topM, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), [sideM, sideM, topM, sideM, sideM, sideM]); o.position.set(x || 0, y || 0, z || 0); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg) => { const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 40), m); o.position.set(x || 0, y || 0, z || 0); return o; };
  const tube = (a, b, r, m) => { const d = new T.Vector3().subVectors(b, a); const o = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 16), m);
    o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); return o; };
  function kit() {
    const group = new T.Group(), parts = [];
    const part = (obj, name, text) => { obj.traverse(o => { if (o.isMesh) o.userData.part = parts.length; }); group.add(obj); parts.push({ obj, name, text }); return obj; };
    return { group, parts, part };
  }
  function chip(w, h, d, lines, x, y, z, accent) { const side = std({ color: 0x16181d, roughness: .6 }); return topBox(w, h, d, side, std({ map: epoxy("chip" + lines.join(), lines, accent), roughness: .5 }), x, y, z); }
  // Same chip, but printed on a vertical face: for anything mounted on a board
  // that stands upright, where the markings face the viewer rather than the sky.
  // BoxGeometry material order is +X, -X, +Y, -Y, +Z, -Z.
  function chipFacing(w, h, d, lines, x, y, z, faceIdx, accent) {
    const side = std({ color: 0x16181d, roughness: .6 });
    const m = [side, side, side, side, side, side];
    m[faceIdx] = std({ map: epoxy("chip" + lines.join(), lines, accent), roughness: .5 });
    const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    o.position.set(x || 0, y || 0, z || 0);
    return o;
  }

  const BUILD = {
    cpu() {
      const { group, parts, part } = kit();
      const sub = pcb("cpusub", [["R360-9000", .06, .95]], { base: "#1f6b3f" });
      part(topBox(4, .14, 4, std({ color: 0x1f6b3f, roughness: .5 }), board(sub)), "Substrate", "The circuit board the chip sits on. Tiny copper traces carry connections from the silicon die to the contacts underneath.");
      const pins = new T.InstancedMesh(new T.CylinderGeometry(.05, .05, .1, 10), gold(), 400); const m4 = new T.Matrix4(); let i = 0;
      for (let a = 0; a < 20; a++) for (let b = 0; b < 20; b++) { m4.makeTranslation(-1.8 + a * .19, -.11, -1.8 + b * .19); pins.setMatrixAt(i++, m4); }
      part(pins, "Contacts", "Hundreds of gold-plated contacts connect the CPU to the motherboard, carrying power, data and control signals. Gold is used because it doesn't corrode.");
      const dieG = new T.Group(); dieG.add(topBox(2.2, .06, 2.2, std({ color: 0x2a2f45 }), std({ map: die(), metalness: .5, roughness: .25 }), 0, .1, 0));
      part(dieG, "Silicon die", "The chip itself: a thin slice of silicon containing billions of tiny transistors, etched in patterns far too small to see.");
      const cores = new T.Group();
      [[-.5, -.62], [.5, -.62], [-.5, .28], [.5, .28]].forEach(([x, z], k) => cores.add(topBox(.85, .05, .75, std({ color: 0x1e4f7a }), std({ map: coreTex(k + 1), roughness: .3, metalness: .3 }), x, .155, z)));
      part(cores, "Cores", "Each core is a complete processing unit that can fetch, decode and execute instructions on its own. A quad-core CPU can process four sets of instructions at the same time.");
      part(topBox(1.85, .05, .38, std({ color: 0x8a6d1a }), std({ map: blockTex("cachecpu", "Cache", "#c9a227"), roughness: .3, metalness: .3 }), 0, .155, .88), "Cache", "Very fast memory on the CPU itself. It holds frequently used instructions and data, so the CPU doesn't have to wait for slower RAM.");
      const lid = metal(brushed("ihs", "#c3c8cf", ["REVISE 360", "R3-9000  3.5 GHz", "4 CORES  8 MB CACHE"]), { transparent: true, opacity: .42 });
      part(topBox(3.2, .16, 3.2, metal(null, { color: 0xc3c8cf, transparent: true, opacity: .42 }), lid, 0, .32, 0), "Heat spreader", "A metal lid that spreads heat from the die out to the cooler. It's see-through here so you can look inside.");
      return { group, parts, scale: .9 };
    },
    vonneumann() {
      const { group, parts, part } = kit();
      const base = pcb("vnbase", [["CPU", .04, .08]], { base: "#16304f" });
      part(topBox(3.7, .1, 3.2, std({ color: 0x16304f }), board(base), -.7, -.2, 0), "CPU", "The central processing unit. Everything on this dark blue board is inside the CPU.");
      const blk = (label, color, w, h, d, x, y, z) => topBox(w, h, d, std({ color: new T.Color(color).multiplyScalar(.6), roughness: .4 }), std({ map: blockTex("vn" + label, label, color), roughness: .35, metalness: .2 }), x, y, z);
      part(blk("CU", "#8f5bd6", 1.3, .5, .9, -1.6, .1, -.9), "Control unit (CU)", "Decodes instructions and sends signals to control how data moves around the CPU.");
      part(blk("ALU", "#e0603f", 1.3, .5, .9, .2, .1, -.9), "Arithmetic logic unit (ALU)", "Performs calculations, such as addition and subtraction, and logical decisions, such as comparing two values.");
      part(blk("PC", "#2e8fc7", .75, .35, .6, -2.05, .02, .35), "Program counter (PC)", "A register that holds the address of the next instruction. It is incremented after each instruction is fetched.");
      part(blk("MAR", "#2e8fc7", .75, .35, .6, -1.2, .02, .35), "Memory address register (MAR)", "A register that holds the address of the data or instruction to be fetched from, or written to, memory.");
      part(blk("MDR", "#2e8fc7", .75, .35, .6, -.35, .02, .35), "Memory data register (MDR)", "A register that holds the data or instruction fetched from memory, or waiting to be written to memory.");
      part(blk("ACC", "#2e8fc7", .75, .35, .6, .5, .02, .35), "Accumulator (ACC)", "A register that holds the results of calculations carried out by the ALU.");
      part(blk("Cache", "#c9a227", 3, .3, .5, -.7, 0, 1.25), "Cache", "Fast memory inside the CPU for frequently used instructions and data.");
      const ram = new T.Group(); const rp = pcb("vnram", [["RAM  8GB", .05, .1]], { edge: true, base: "#1e4f6b" });
      ram.add(topBox(.14, 1.5, 2.6, board(rp), std({ color: 0x1e4f6b }), 2.4, .55, 0)); ram.children[0].material[0] = board(rp); ram.children[0].material[1] = board(rp);
      for (let k = 0; k < 5; k++) { const c = chip(.06, .3, .4, ["R360", "DDR5"], 2.49, .6, -1 + k * .5); c.rotation.z = Math.PI / 2; ram.add(c); }
      part(ram, "Main memory (RAM)", "The key idea of von Neumann architecture: instructions and data are stored together in this one memory, and the CPU fetches both from it.");
      const buses = new T.Group();
      buses.add(tube(new T.Vector3(-1.2, .25, .35), new T.Vector3(2.3, .9, .35), .05, std({ color: 0xf05aaa, emissive: 0x3a0c24, metalness: .6, roughness: .3 })));
      buses.add(tube(new T.Vector3(-.35, .25, .5), new T.Vector3(2.3, .6, .6), .05, std({ color: 0x50dc96, emissive: 0x0c3020, metalness: .6, roughness: .3 })));
      part(buses, "Buses", "Wires that carry addresses from the MAR to RAM (pink), and data and instructions between RAM and the MDR (green).");
      return { group, parts, scale: .75 };
    },
    // The software stack: hardware at the bottom, the operating system between, applications on top
    stack() {
      const { group, parts, part } = kit();
      const slab = (label, color, y, h, note) => {
        const g = new T.Group();
        const top = std({ map: blockTex("stk" + label, label, color), roughness: .4, metalness: .2 });
        const side = std({ color: new T.Color(color).multiplyScalar(.55), roughness: .5 });
        g.add(topBox(3.6, h, 3.6, side, top, 0, y, 0));
        return g;
      };
      part(slab("Applications", "#40c4ff", 1.25, .5), "Applications", "The programs people actually use: a browser, a game, a word processor. They ask the operating system for everything: memory, files, the printer, the network.");
      part(slab("Operating system", "#c88cff", .55, .7), "Operating system", "The layer in the middle. It manages memory, processes, files, users and devices, and gives every application one consistent way to reach the hardware.");
      part(slab("Hardware", "#50dc96", -.15, .5), "Hardware", "The physical machine: CPU, memory, storage, input and output devices. On its own it can do nothing useful until software tells it what to do.");
      const arrows = new T.Group();
      [[-1.1, "#ffd046"], [1.1, "#ffd046"]].forEach(([xo]) => {
        arrows.add(tube(new T.Vector3(xo, 1.1, 1.9), new T.Vector3(xo, .2, 1.9), .05, std({ color: 0xffd046, emissive: 0x3a2e00, metalness: .5, roughness: .35 })));
      });
      part(arrows, "Requests and responses", "An application never touches the hardware directly. It asks the operating system, which does the work and passes the result back. That is why the same program runs on very different machines.");
      return { group, parts, scale: .72 };
    },

    // A hard disk drive, for storage, file management and defragmentation
    harddisk() {
      const { group, parts, part } = kit();
      const case_ = std({ map: brushed("hdcase", "#b6bcc6"), metalness: .85, roughness: .38, transparent: true, opacity: .35 });
      part(box(4.2, .35, 3.4, case_, 0, -.55, 0), "Casing", "A sealed metal case keeps dust out. Even a speck would be a boulder to a head flying this close to the surface.");
      const platters = new T.Group();
      [0, .34, .68].forEach((dy, i) => {
        const pl = cyl(1.45, 1.45, .06, metal(brushed("platter" + i, "#cfd4dc"), { metalness: 1, roughness: .12 }), -.35, -.15 + dy, 0, 64);
        platters.add(pl);
      });
      platters.add(cyl(.18, .18, 1.1, metal(null, { color: 0x8a929e }), -.35, .2, 0));
      part(platters, "Platters", "Spinning magnetic discs, typically at 5,400 or 7,200 revolutions per minute. Data is stored by magnetising tiny areas in circular tracks.");
      const arm = new T.Group();
      const a = box(2.6, .09, .3, metal(brushed("arm", "#9aa2ae")), .5, .92, .1);
      a.rotation.y = -.42; arm.add(a);
      const head = box(.34, .08, .2, std({ color: 0xffd046, emissive: 0x3a2e00, metalness: .6, roughness: .3 }), -.62, .9, .48);
      arm.add(head);
      arm.add(cyl(.3, .3, .9, metal(null, { color: 0x6e7684 }), 1.62, .55, -.2));
      part(arm, "Read/write head and actuator arm", "The head floats nanometres above the surface, reading and writing as the platter passes. The arm swings it to the right track. Every jump to a new track costs time: that is why a fragmented disk is slower.");
      part(chip(.9, .12, .7, ["CONTROLLER", "R360-HD"], 1.35, -.32, -1.1), "Controller board", "Turns requests from the operating system into movements of the head, and manages the drive's own cache.");
      const tracks = new T.Group();
      [1.25, .95, .65].forEach((r, i) => {
        const ring = new T.Mesh(new T.TorusGeometry(r, .012, 6, 64), std({ color: i === 0 ? 0x40c4ff : i === 1 ? 0xff785a : 0x50dc96, emissive: 0x102030 }));
        ring.rotation.x = Math.PI / 2; ring.position.set(-.35, .58, 0); tracks.add(ring);
      });
      part(tracks, "Tracks", "Data sits in concentric tracks. A file written in one run sits on neighbouring tracks and reads quickly; a file scattered across the disk makes the head hunt for each piece.");
      return { group, parts, scale: .85 };
    },
    motherboard() {
      const { group, parts, part } = kit();
      const mb = pcb("mb", [["REVISE 360  MB-1", .62, .95], ["CPU_FAN", .05, .06], ["DIMM_A1", .6, .12], ["PCIE_1", .1, .8], ["USB 3.2", .82, .5]]);
      part(topBox(5, .1, 4.2, std({ color: 0x1a5a36 }), board(mb)), "Motherboard", "The main circuit board. Copper traces connect the CPU, memory, storage and other components so they can communicate.");
      const cpu = new T.Group(); cpu.add(box(1.25, .1, 1.25, std({ color: 0x2b2f36, metalness: .5 }), -1, .1, -.6));
      cpu.add(topBox(1, .1, 1, metal(null, { color: 0xc3c8cf }), metal(brushed("ihs2", "#c3c8cf", ["REVISE 360", "R3-9000"])), -1, .2, -.6));
      part(cpu, "CPU", "The processor sits in a socket on the motherboard. A faster clock speed means more instructions per second, but also more heat.");
      const cool = new T.Group(); const fin = metal(brushed("fin", "#aeb5c0"));
      for (let k = 0; k < 11; k++) cool.add(box(1.5, .7, .04, fin, -1, .62, -1.2 + k * .12));
      [-.25, .25].forEach(dx => cool.add(tube(new T.Vector3(-1 + dx, .25, -.6), new T.Vector3(-1 + dx, .95, -.6), .05, std({ color: 0xc7773b, metalness: 1, roughness: .3 }))));
      const hub = cyl(.56, .56, .1, std({ color: 0x1b1e24, roughness: .7 }), -1, 1.04, -.6); cool.add(hub);
      for (let k = 0; k < 9; k++) { const b = box(.48, .02, .16, std({ color: 0x2c3038, roughness: .5 }), -1, 1.1, -.6); b.rotation.y = k * Math.PI * 2 / 9; b.rotation.x = .3; b.translateX(.26); cool.add(b); }
      const ring = new T.Mesh(new T.TorusGeometry(.56, .03, 8, 48), std({ color: 0x1b1e24 })); ring.rotation.x = Math.PI / 2; ring.position.set(-1, 1.12, -.6); cool.add(ring);
      part(cool, "Heatsink and fan", "Copper heat pipes carry heat into aluminium fins, and the fan blows it away. Without cooling, a fast CPU would overheat and slow itself down.");
      const ram = new T.Group(); const rp = pcb("ramstick", [["DDR5 16GB", .05, .12]], { edge: true, base: "#1e4f6b" });
      [.6, .9].forEach(x => { const s = box(.1, .9, 2.4, board(rp), x, .5, -.3); ram.add(s); for (let k = 0; k < 6; k++) ram.add(chip(.12, .22, .3, ["R360", "16Gb"], x, .6, -1.25 + k * .38)); });
      part(ram, "RAM", "Main memory: holds the programs and data currently in use. The CPU fetches instructions from here.");
      part(chip(.8, .12, .8, ["CHIPSET", "R360-X"], 1.3, .1, 1.3), "Chipset", "Controls communication between the CPU and other parts, such as storage and USB ports.");
      const ports = new T.Group(); ports.add(box(.4, .5, 2.2, metal(brushed("ports", "#9aa2ae")), 2.3, .3, -.2));
      for (let k = 0; k < 4; k++) ports.add(box(.05, .12, .3, std({ color: 0x2a6ad8 }), 2.52, .35, -1 + k * .45));
      part(ports, "Ports", "Connections for devices such as USB peripherals, displays and network cables.");
      return { group, parts, scale: .7 };
    },
    washingmachine() {
      const { group, parts, part } = kit();
      part(box(3, 3.4, 3, std({ map: plastic("wmcase", "#eef1f5"), transparent: true, opacity: .28, roughness: .35 })), "Casing", "The washing machine is the larger device. The computer inside it is the embedded system. The casing is see-through so you can look inside.");
      const drum = new T.Group(); const d = cyl(1.1, 1.1, 1.8, metal(drumTex()), 0, -.1, -.1, 48); d.rotation.x = Math.PI / 2; drum.add(d);
      const ring = new T.Mesh(new T.TorusGeometry(1.05, .13, 20, 64), std({ color: 0x3a404a, roughness: .35, metalness: .4 })); ring.position.set(0, -.1, 1.52); drum.add(ring);
      const glass = new T.Mesh(new T.CircleGeometry(.95, 48), std({ color: 0x9fc4e8, transparent: true, opacity: .35, roughness: .05, metalness: .2 })); glass.position.set(0, -.1, 1.53); drum.add(glass);
      part(drum, "Drum and door", "The steel drum holds the clothes. A door lock stops the door opening while the machine is running.");
      part(topBox(2.9, .12, .55, std({ color: 0xe9edf3 }), std({ map: plastic("wmtop", "#e9edf3") }), 0, 1.5, 1.2), "Control panel", "Input: the user chooses a wash program and temperature with the dial and buttons.");
      group.children[group.children.length - 1].add((() => { const f = new T.Mesh(new T.PlaneGeometry(2.8, .7), std({ map: panelTex(), roughness: .4 })); f.position.set(0, -.05, .28); f.rotation.x = -.2; f.userData.part = parts.length - 1; return f; })());
      const mcu = new T.Group(); const mp = pcb("mcu", [["WASH-CTRL v2", .06, .12]], { base: "#1a5a36" });
      mcu.add(topBox(1.1, .06, .8, std({ color: 0x1a5a36 }), board(mp), .6, 1.2, -.6)); mcu.add(chip(.4, .06, .4, ["MCU", "32-bit"], .6, 1.26, -.6));
      part(mcu, "Microcontroller", "Process: a small embedded computer on this board runs one dedicated program that controls the whole wash cycle.");
      const motor = new T.Group(); const mbody = cyl(.4, .4, .9, metal(brushed("motor", "#8a929e")), .7, -1.3, -.9); mbody.rotation.z = Math.PI / 2; motor.add(mbody);
      const coil = cyl(.3, .3, .5, std({ color: 0xc7773b, metalness: 1, roughness: .35 }), .1, -1.3, -.9); coil.rotation.z = Math.PI / 2; motor.add(coil);
      part(motor, "Motor", "Output: the microcontroller switches the motor on and off, and controls its speed to turn the drum.");
      part(chip(.5, .3, .5, ["TEMP", "SENSOR"], -.9, -1.5, .6, "#ff785a"), "Temperature sensor", "Input: tells the microcontroller how hot the water is, so it can switch the heater on or off.");
      part(cyl(.07, .07, 1.6, std({ color: 0xb8322a, emissive: 0x3a0806, metalness: .6, roughness: .3 }), -.4, -1.5, 0), "Heater", "Output: heats the water to the temperature the user chose.");
      return { group, parts, scale: .6 };
    },

    // A memory module, for primary storage and virtual memory
    ram() {
      const { group, parts, part } = kit();
      const rp = pcb("rammod", [["R360  DDR  16GB", .08, .18], ["PC5-44800", .08, .3]], { edge: true, base: "#1e4f6b" });
      // The module stands upright: the board is thin in Z, so everything mounted
      // on it is thin in Z too, standing proud of the face rather than lying flat.
      const TH = .09;                                  // board thickness
      const stick = topBox(5.4, 1.4, TH, board(rp), board(rp));
      part(stick, "Circuit board", "The module is a small circuit board that slots into the motherboard. Everything the CPU is working on right now is held on the chips mounted here.");
      const chips = new T.Group();
      for (let k = 0; k < 8; k++) {
        const cx = -2.31 + k * .66;
        chips.add(chipFacing(.52, .44, .07, ["R360", "2Gb"], cx, .18, TH / 2 + .035, 4));
        chips.add(chipFacing(.52, .44, .07, ["R360", "2Gb"], cx, .18, -TH / 2 - .035, 5));
      }
      part(chips, "Memory chips", "Each chip holds billions of tiny cells, and each cell stores one bit as a charge. The charge leaks away in a fraction of a second, so every cell is refreshed thousands of times a second. Cut the power and all of it is gone: this is why RAM is volatile.");
      // Contacts are plated onto each face of the board along the bottom edge,
      // with a gap where the notch is.
      const pins = new T.Group();
      const NOTCH_AT = -.52, NOTCH_W = .17;
      for (let k = 0; k < 44; k++) {
        const px = -2.56 + k * .119;
        if (Math.abs(px - NOTCH_AT) < NOTCH_W) continue;
        pins.add(box(.075, .3, .012, gold(), px, -.82, TH / 2 + .006));
        pins.add(box(.075, .3, .012, gold(), px, -.82, -TH / 2 - .006));
      }
      part(pins, "Contacts", "Gold-plated contacts along the bottom edge carry data, addresses and power between the module and the memory controller. Gold is used because it does not corrode, so the connection stays reliable.");
      const notch = box(NOTCH_W * 1.5, .40, TH + .05, std({ color: 0x080a10, roughness: .9, emissive: 0x0a1626 }), NOTCH_AT, -.80, 0);
      part(notch, "The notch", "A gap cut through the contacts, in a different position for each generation of memory. It stops a module being fitted the wrong way round, or into a motherboard that cannot use it.");
      return { group, parts, scale: .66 };
    },

    // A solid state drive: the point is that nothing moves
    ssd() {
      const { group, parts, part } = kit();
      const shell = std({ map: brushed("ssdcase", "#c3c8cf"), metalness: .85, roughness: .4, transparent: true, opacity: .3 });
      part(box(4.7, .78, 3.5, shell, 0, .16, 0), "Casing", "A plain metal shell with nothing inside it that turns. There is no motor, no disc and no arm, so an SSD makes no noise and is not damaged by being knocked while it works.");
      const bp = pcb("ssdpcb", [["R360-SSD", .06, .1], ["NAND x8", .6, .9]], { base: "#13303f" });
      part(topBox(4.1, .08, 2.9, std({ color: 0x13303f }), board(bp), 0, 0, 0), "Circuit board", "Everything sits flat on one board. With no moving parts to wait for, the drive can start reading any block as soon as it is asked.");
      const nand = new T.Group();
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++)
        nand.add(chip(.78, .16, .6, ["NAND", "FLASH", "512Gb"], -1.45 + c * .97, .12, -.75 + r * 1.5));
      part(nand, "Flash memory chips", "Data is stored as a trapped charge inside each cell, and the charge stays put with the power off. This is what makes an SSD non-volatile, and why it keeps your files when the machine is switched off.");
      part(chip(.95, .2, .95, ["CONTROLLER", "R360-S1"], 1.5, .14, 0, "#40c4ff"), "Controller", "Decides which chips to write to, spreads writes evenly so no part wears out early, and keeps track of where every file is.");
      part(chip(.6, .16, .45, ["DRAM", "CACHE"], 1.5, .12, 1.1), "Cache", "A small amount of fast memory holding the map of where data lives, so the controller does not have to look it up from flash every time.");
      const conn = new T.Group();
      for (let k = 0; k < 14; k++) conn.add(box(.08, .09, .3, gold(), -2.0, .02, -1.0 + k * .155));
      part(conn, "Connector", "Carries data and power to the motherboard. The drive is faster than a hard disk partly because this connection is faster, and partly because there is no head to move.");
      return { group, parts, scale: .68 };
    },

    // An optical disc, cut open so the track and the laser are visible
    opticaldisc() {
      const { group, parts, part } = kit();
      const discM = std({ color: 0xdfe6ef, metalness: .35, roughness: .12, transparent: true, opacity: .45, side: T.DoubleSide });
      part(cyl(2.4, 2.4, .04, discM, 0, 0, 0, 96), "Polycarbonate layer", "A clear plastic disc. The laser shines up through it, so a scratch on this surface blurs the beam rather than destroying the data itself.");
      const refl = cyl(2.3, 2.3, .015, metal(null, { color: 0xd8dde6, metalness: 1, roughness: .08 }), 0, .035, 0, 96);
      part(refl, "Reflective layer", "A mirror-thin coating of aluminium. The laser bounces off it, and how much light comes back is what the drive actually measures.");
      const track = new T.Group();
      for (let i = 0; i < 26; i++) {
        const r = .75 + i * .058;
        const ring = new T.Mesh(new T.TorusGeometry(r, .009, 6, 128), std({ color: 0x40c4ff, emissive: 0x0d2740 }));
        ring.rotation.x = Math.PI / 2; ring.position.y = .05; track.add(ring);
      }
      part(track, "The spiral track", "One continuous groove winding out from the centre. On a CD it is about five kilometres long. The disc spins and the laser follows the groove outwards.");
      const pits = new T.Group();
      for (let i = 0; i < 90; i++) {
        const a = i * .42, r = .8 + (i % 24) * .058;
        pits.add(box(.055, .03, .1, std({ color: 0x1b2433, roughness: .6 }), Math.cos(a) * r, .055, Math.sin(a) * r));
      }
      part(pits, "Pits and lands", "The groove is moulded with pits. A pit scatters the light and a land reflects it straight back, so the drive sees a change in brightness. Those changes are read as the 1s and 0s.");
      const laser = new T.Group();
      laser.add(cyl(.22, .3, .45, metal(brushed("lens", "#9aa2ae")), 1.4, -.9, 0));
      laser.add(tube(new T.Vector3(1.4, -.68, 0), new T.Vector3(1.4, .03, 0), .035, std({ color: 0xff5a6e, emissive: 0x6a1020, transparent: true, opacity: .85 })));
      part(laser, "Laser and lens", "The lens focuses the beam to a spot smaller than the pits. A shorter wavelength makes a smaller spot, which is how a DVD and then Blu-ray fitted far more data on the same size disc.");
      const hub = new T.Mesh(new T.RingGeometry(.38, .72, 48), std({ color: 0x2a3140, roughness: .7, side: T.DoubleSide }));
      hub.rotation.x = -Math.PI / 2; hub.position.y = .07;
      part(hub, "Centre hole", "The spindle grips here and spins the disc. The drive changes the speed as the head moves out, so the track passes the laser at a steady rate.");
      return { group, parts, scale: .78 };
    },

    // A network switch, for building a LAN and for where traffic can be intercepted
    switch() {
      const { group, parts, part } = kit();
      const caseM = metal(brushed("swcase", "#51596b"), { metalness: .7, roughness: .45, transparent: true, opacity: .34 });
      part(topBox(6.2, .9, 2.6, caseM, caseM, 0, 0, 0), "Casing", "A switch is usually a flat box in a cabinet. A school might have one in each corridor, with every room's cable running back to it.");
      const ports = new T.Group(); const pm = std({ color: 0x11151d, roughness: .8 });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 12; c++) {
        const px = -2.75 + c * .5, py = -.12 + r * .36;
        ports.add(box(.36, .3, .1, pm, px, py, 1.31));
        ports.add(box(.12, .1, .06, std({ color: 0x2a3140 }), px, py + .13, 1.34));
      }
      part(ports, "Ports", "Each device on the network plugs into its own port with a twisted pair cable. The switch learns which device is on which port, so it can send a frame to just that one.");
      const leds = new T.Group();
      for (let c = 0; c < 12; c++) {
        const on = c % 3 !== 1;
        leds.add(box(.12, .07, .05, std({ color: on ? 0x50dc96 : 0x2a3140, emissive: on ? 0x1d6b44 : 0 }), -2.75 + c * .5, -.36, 1.33));
      }
      part(leds, "Status lights", "One light per port. It tells you whether anything is plugged in, how fast the link is running, and whether data is flowing. The first thing to check when a room has no network.");
      const asic = new T.Group();
      const sp = pcb("swpcb", [["R360-SW24", .08, .12]], { base: "#17323f" });
      asic.add(topBox(5.8, .06, 2.2, std({ color: 0x17323f }), board(sp), 0, -.35, 0));
      asic.add(chip(1.1, .18, 1.1, ["SWITCH", "ASIC"], 0, -.22, -.1, "#40c4ff"));
      part(asic, "Switching chip", "Holds a table matching each device's MAC address to a port. When a frame arrives the chip looks up the destination and forwards it out of that one port, instead of to everybody.");
      part(box(.5, .34, .1, std({ color: 0x1b2433, roughness: .7 }), 2.75, .1, 1.31), "Uplink port", "A faster port for the cable that runs to the next switch or to the router. All the traffic leaving this part of the network squeezes through here, so it needs to be the quickest link.");
      return { group, parts, scale: .55 };
    },

    // Fibre optic cable, cut away so total internal reflection is visible
    fibre() {
      const { group, parts, part } = kit();
      // Drawn like a cable stripped back in stages, so each layer is visible as
      // a ring at the cut end rather than hidden inside the one outside it.
      const X0 = -3.6;
      const layer = (rad, endX, mat, segs) => {
        const len = endX - X0;
        const c = cyl(rad, rad, len, mat, X0 + len / 2, 0, 0, segs || 40);
        c.rotation.z = Math.PI / 2;
        return c;
      };
      part(layer(.62, 0.6, std({ color: 0xf4b942, roughness: .7 })),
           "Outer jacket", "Tough plastic that takes the wear. The colour is a convention: yellow usually means a single mode fibre, the kind used for long distances.");
      part(layer(.42, 1.7, std({ color: 0x8a6bd1, roughness: .6 })),
           "Strengthening and buffer", "Strands of tough fibre take the strain if the cable is pulled, and a soft buffer stops the glass being crushed. Bend a fibre too tightly and the light escapes instead of reflecting.");
      part(layer(.26, 2.8, std({ color: 0x9fd8ff, roughness: .15, metalness: .1, transparent: true, opacity: .55 })),
           "Cladding", "Glass with a lower refractive index than the core. That difference is what makes the light bounce back in instead of leaking out: total internal reflection.");
      part(layer(.1, 3.8, std({ color: 0xeaf6ff, roughness: .05, emissive: 0x16304a, transparent: true, opacity: .42 }), 24),
           "Glass core", "A thread of extremely pure glass, thinner than a human hair. The signal is pulses of light travelling down this core: on for a 1, off for a 0.");
      const ray = new T.Group();
      const beam = std({ color: 0xff5a6e, emissive: 0xb02038 });
      const A = .085;                       // stays inside the core, where it belongs
      let x = X0 + .15, up = true;
      for (let i = 0; i < 14; i++) {
        const nx = x + .52;
        ray.add(tube(new T.Vector3(x, up ? -A : A, 0), new T.Vector3(nx, up ? A : -A, 0), .028, beam));
        x = nx; up = !up;
      }
      part(ray, "The light bouncing", "The beam hits the boundary at a shallow angle and reflects, over and over, all the way along. Because it is light rather than electricity, it carries far more data, goes much further without a boost, and nothing electrical nearby can interfere with it.");
      return { group, parts, scale: .48 };
    },

    // Twisted pair cable and its connector, for wired connections
    rj45() {
      const { group, parts, part } = kit();
      const L = 6;
      const sheath = cyl(.62, .62, L, std({ color: 0x3f6fd8, roughness: .65, transparent: true, opacity: .26 }), -.6, 0, 0, 40);
      sheath.rotation.z = Math.PI / 2;
      part(sheath, "Outer sheath", "The plastic jacket holding the four pairs together. Cable is sold in categories: a higher category is made to tighter tolerances and carries data faster.");
      const COLS = [0xff785a, 0x50dc96, 0x40c4ff, 0xc8a24a];
      const pairs = new T.Group();
      COLS.forEach((c, p) => {
        const ang = p * Math.PI / 2;
        for (let s = 0; s < 2; s++) {
          const m = std({ color: s ? 0xf0f3f7 : c, roughness: .5 });
          const pts = [];
          for (let i = 0; i <= 40; i++) {
            const t = i / 40, xx = -L / 2 - .6 + t * L, a = ang + t * 22 + s * Math.PI;
            pts.push(new T.Vector3(xx, Math.cos(a) * .22 + Math.sin(ang) * .0, Math.sin(a) * .22));
          }
          const g = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, .055, 8, false);
          pairs.add(new T.Mesh(g, m));
        }
      });
      part(pairs, "Four twisted pairs", "Eight wires in four pairs, and every pair is twisted along its length at a slightly different rate, so neighbouring pairs do not pick each other up. Interference hits both wires of a pair almost equally, and the receiver listens to the difference between them, so the interference cancels out. Untwist too much at the ends and the connection becomes unreliable.");
      const plug = new T.Group();
      plug.add(box(1.25, .95, .75, std({ color: 0xdfe6ef, roughness: .25, transparent: true, opacity: .55 }), 3.1, 0, 0));
      const clip = box(.5, .28, .1, std({ color: 0xdfe6ef, roughness: .3, transparent: true, opacity: .65 }), 3.0, .58, 0);
      clip.rotation.z = -.18; plug.add(clip);
      part(plug, "The connector", "The familiar clip-in plug. The clip is the part that snaps off, and a cable with a broken clip works loose and drops the connection.");
      const pins = new T.Group();
      for (let k = 0; k < 8; k++) pins.add(box(.06, .42, .07, gold(), 3.45, .12, -.3 + k * .085));
      part(pins, "Eight pins", "Each wire is pressed onto its own gold pin, in a fixed order. Get the order wrong at one end and the cable either will not work or will only run at a fraction of its speed.");
      return { group, parts, scale: .47 };
    },

    // A server rack: what "the cloud" actually is
    rack() {
      const { group, parts, part } = kit();
      const frame = new T.Group();
      const railM = metal(brushed("rackrail", "#464d5c"), { roughness: .5 });
      [[-1.7, -1.1], [1.7, -1.1], [-1.7, 1.1], [1.7, 1.1]].forEach(([x, z]) => frame.add(box(.16, 6.2, .16, railM, x, 0, z)));
      frame.add(box(3.56, .14, 2.36, railM, 0, -3.1, 0));
      frame.add(box(3.56, .14, 2.36, railM, 0, 3.1, 0));
      part(frame, "The rack", "A standard steel frame. Every piece of equipment is built to the same width and fixed height steps, so kit from any manufacturer bolts into any rack anywhere in the world.");
      const servers = new T.Group();
      for (let k = 0; k < 7; k++) {
        const y = -2.5 + k * .62;
        const body = topBox(3.3, .46, 2.2, metal(brushed("srv" + k, "#6b7382")), metal(brushed("srvtop" + k, "#767e8d")), 0, y, 0);
        servers.add(body);
        for (let d = 0; d < 6; d++) servers.add(box(.18, .34, .06, std({ color: 0x323a49, roughness: .6 }), -1.3 + d * .3, y, 1.13));
        servers.add(box(.08, .06, .04, std({ color: 0x50dc96, emissive: 0x12402a }), 1.35, y + .12, 1.13));
      }
      part(servers, "Servers", "Each slot is a complete computer: processors, memory and storage, but no screen or keyboard. Nobody sits at these. They are reached over the network, and one rack can serve many thousands of people at once.");
      const net = new T.Group();
      net.add(topBox(3.3, .4, 2.2, metal(brushed("rsw", "#51596b")), metal(brushed("rswt", "#5a6274")), 0, 1.72, 0));
      for (let k = 0; k < 14; k++) net.add(box(.14, .12, .06, std({ color: 0x11151d }), -1.35 + k * .2, 1.72, 1.13));
      part(net, "Switch and patch panel", "Everything in the rack plugs into the switch at the top, and the switch connects out to the rest of the data centre and then the internet. This is the route your request takes to reach the server.");
      const cables = new T.Group();
      [0x40c4ff, 0x50dc96, 0xff785a, 0xffd046].forEach((c, i) => {
        for (let k = 0; k < 3; k++) {
          const y0 = -2.5 + (i + k) * .42;
          const pts = [new T.Vector3(1.2 - i * .2, y0, 1.2), new T.Vector3(1.9, (y0 + 1.72) / 2, 1.5), new T.Vector3(1.0 - i * .2, 1.72, 1.2)];
          cables.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, .035, 6, false), std({ color: c, roughness: .6 })));
        }
      });
      part(cables, "Patch cables", "Short cables from each server to the switch. A data centre holds thousands of these, which is why they are colour coded and routed so carefully.");
      part(box(3.4, .3, .5, std({ color: 0x2a3140, roughness: .7 }), 0, -3.4, 1.0), "Cooling", "All that electricity turns into heat. Cold air is pushed in at the front and hot air pulled out at the back, and cooling can use nearly as much power as the computers do. This is the main reason data centres are built where power and cooling are cheap.");
      return { group, parts, scale: .70 };
    },

    // A smartphone opened up, for the environmental cost of making and binning devices
    phone() {
      const { group, parts, part } = kit();
      const glass = std({ color: 0x1b2433, roughness: .08, metalness: .3, transparent: true, opacity: .55 });
      part(box(2.6, .07, 5.2, glass, 0, .62, 0), "Screen", "The display needs indium, a rare metal, for its transparent conducting layer. Very little of it is ever recovered: once a screen is crushed, the indium is effectively gone.");
      part(box(2.7, .16, 5.3, metal(brushed("phoneframe", "#9aa2ae")), 0, -.75, 0), "Aluminium body", "The case is mined bauxite, smelted using a great deal of electricity. Recycling aluminium takes a small fraction of that energy, which is why the casing is worth recovering.");
      const batt = box(2.1, .42, 3.0, std({ color: 0x2f7d5a, roughness: .5 }), 0, -.35, -.7);
      part(batt, "Battery", "Lithium, cobalt and nickel. Cobalt in particular is concentrated in a few countries, and mining it has well documented human costs. The battery is also the part that wears out first, which is often what sends a working phone to the bin.");
      const bp = pcb("phonepcb", [["R360-MOBILE", .1, .14], ["RF", .7, .8]], { base: "#163a2c" });
      const logic = new T.Group();
      logic.add(topBox(2.1, .07, 1.6, std({ color: 0x163a2c }), board(bp), 0, -.3, 1.7));
      logic.add(chip(.7, .14, .7, ["SoC", "R360"], -.4, -.2, 1.7, "#40c4ff"));
      logic.add(chip(.45, .12, .45, ["RAM"], .55, -.2, 1.45));
      for (let k = 0; k < 10; k++) logic.add(box(.08, .04, .5, gold(), -.9 + k * .2, -.25, 2.35));
      part(logic, "Circuit board", "Gold, silver, copper, tantalum and a dozen rare earth elements, in quantities too small to see. A tonne of old phones contains far more gold than a tonne of ore, which is why recovering them is worth doing.");
      const cam = new T.Group();
      [[-.65, -1.8], [-.65, -2.45], [.1, -2.1]].forEach(([x, z]) => {
        cam.add(cyl(.3, .3, .2, metal(null, { color: 0x2a3140 }), x, -.96, z, 32));
        cam.add(cyl(.2, .2, .08, std({ color: 0x0d1018, roughness: .05, metalness: .5 }), x, -1.07, z, 32));
      });
      part(cam, "Cameras", "Ground glass and rare earth elements. Each new model adds more of them, and a device is often replaced while the old one still works perfectly.");
      part(box(2.4, .05, 4.9, std({ color: 0x3a4150, roughness: .8 }), 0, -.62, 0), "Adhesive and plastics", "Glued together rather than screwed, which makes a phone thin and waterproof but hard to repair or take apart. Parts that cannot be separated cannot be recycled, so they are burned or buried.");
      return { group, parts, scale: .62 };
    },

    // A logic chip, to anchor Boolean logic in something physical
    logicchip() {
      const { group, parts, part } = kit();
      const body = topBox(1.6, .5, 3.4, std({ color: 0x16181d, roughness: .62 }),
                          std({ map: epoxy("lgc", ["R360", "7408", "QUAD 2-IN AND"], "#40c4ff"), roughness: .5 }),
                          0, 0, 0);
      body.material[2].transparent = true; body.material[2].opacity = .32;
      part(body, "The package", "A black plastic case about a centimetre across. Inside it is a single sliver of silicon: the four gates in here would once have filled a cupboard. The lid is see-through so you can look in.");
      const pins = new T.Group();
      for (let s = 0; s < 2; s++) for (let k = 0; k < 7; k++) {
        const z = -1.35 + k * .45, x = s ? .95 : -.95;
        pins.add(box(.12, .5, .14, metal(null, { color: 0xc9ced6 }), x, -.42, z));
        pins.add(box(.5, .12, .14, metal(null, { color: 0xc9ced6 }), s ? .72 : -.72, -.18, z));
      }
      part(pins, "The pins", "Fourteen legs. Twelve carry the inputs and outputs of the four gates, and the other two are power and ground, because a gate needs electricity to do anything at all.");
      const dieM = std({ map: die(), roughness: .35, metalness: .25, emissive: 0x0a1424 });
      part(box(.9, .05, 2.2, dieM, 0, .2, 0), "Silicon die", "The chip itself. Every gate is built from transistors: tiny switches with no moving parts, each one either letting current through or not. That on-or-off behaviour is where the 1s and 0s come from.");
      const gates = new T.Group();
      for (let k = 0; k < 4; k++) {
        const z = -.85 + k * .57;
        const g = new T.Mesh(new T.BoxGeometry(.52, .04, .3), std({ color: 0x40c4ff, emissive: 0x0d2740 }));
        g.position.set(0, .24, z); gates.add(g);
        gates.add(tube(new T.Vector3(-.75, .24, z - .07), new T.Vector3(-.26, .24, z - .07), .02, std({ color: 0x50dc96, emissive: 0x12402a })));
        gates.add(tube(new T.Vector3(-.75, .24, z + .07), new T.Vector3(-.26, .24, z + .07), .02, std({ color: 0x50dc96, emissive: 0x12402a })));
        gates.add(tube(new T.Vector3(.26, .24, z), new T.Vector3(.75, .24, z), .02, std({ color: 0xffd046, emissive: 0x3a2e00 })));
      }
      part(gates, "Four AND gates", "One chip, four separate gates, each with two inputs and one output. The output goes high only when both of its inputs are high. The truth table you fill in on paper is a description of what this piece of silicon physically does.");
      return { group, parts, scale: .9 };
    }
  };

  function build(kind) {
    const b = (BUILD[kind] || BUILD.cpu)();
    b.parts.forEach(p => p.obj.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); }));
    // soft contact shadow under the model
    const bb = new T.Box3().setFromObject(b.group), sz = bb.getSize(new T.Vector3());
    const sh = new T.Mesh(new T.PlaneGeometry(sz.x * 1.5, sz.z * 1.5), new T.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set((bb.min.x + bb.max.x) / 2, bb.min.y - .02, (bb.min.z + bb.max.z) / 2); b.group.add(sh);
    return b;
  }
  function highlight(b, idx) {
    b.parts.forEach((p, i) => p.obj.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m.emissive) return;
      if (m.userData.baseE === undefined) m.userData.baseE = m.emissive.getHex(); m.emissive.setHex(i === idx ? 0x5a4200 : m.userData.baseE); }); }));
  }
  // Studio lighting: key, fill and rim lights, plus a generated reflection environment for the metal parts
  const ENV = new WeakMap();
  function envMap(renderer) {
    if (!renderer) return null;
    if (ENV.has(renderer)) return ENV.get(renderer);
    const es = new T.Scene();
    const sky = canvas("envsky", 256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffffff"); g.addColorStop(.45, "#8a98b0"); g.addColorStop(1, "#1a2030"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    es.add(new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ map: sky, side: T.BackSide })));
    [[6, 8, 4], [-8, 4, -2], [0, 6, -8]].forEach(p => { const s = new T.Mesh(new T.PlaneGeometry(6, 6), new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide })); s.position.set(...p); s.lookAt(0, 0, 0); es.add(s); });
    const pm = new T.PMREMGenerator(renderer); const tex = pm.fromScene(es, .04).texture; pm.dispose(); ENV.set(renderer, tex); return tex;
  }
  function lights(scene, renderer) {
    scene.add(new T.HemisphereLight(0xdfe8ff, 0x2a3040, .55));
    const key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(4, 7, 5); scene.add(key);
    const rim = new T.DirectionalLight(0x9fc4ff, .5); rim.position.set(-5, 3, -4); scene.add(rim);
    const env = envMap(renderer); if (env) scene.environment = env;
  }

  // Desktop viewer: drag to rotate, scroll to zoom, click a part (or a part button) to learn about it
  function viewer(container, kind, onPart) {
    const b = build(kind), scene = new T.Scene(); scene.add(b.group);
    const cam = new T.PerspectiveCamera(38, 1, .1, 100);
    const r = new T.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); container.appendChild(r.domElement);
    lights(scene, r);
    r.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab;border-radius:12px";
    const size = () => { const w = container.clientWidth, h = container.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(container);
    let rx = .45, ry = -.6, dist = 5, auto = true, down = null, alive = true;
    const ray = new T.Raycaster();
    r.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY, e.clientX, e.clientY]; r.domElement.setPointerCapture(e.pointerId); auto = false; });
    r.domElement.addEventListener("pointermove", e => { if (!down) return; ry += (e.clientX - down[2]) * .01; rx = Math.max(-1.2, Math.min(1.3, rx + (e.clientY - down[3]) * .01)); down[2] = e.clientX; down[3] = e.clientY; });
    r.domElement.addEventListener("wheel", e => { e.preventDefault(); dist = Math.max(2.8, Math.min(9, dist + e.deltaY * .004)); }, { passive: false });
    r.domElement.addEventListener("pointerup", e => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) {
        const rc = r.domElement.getBoundingClientRect();
        ray.setFromCamera(new T.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), cam);
        const hs = ray.intersectObjects(b.group.children, true).filter(x => x.object.userData.part !== undefined);
        const h = hs.find(x => !(x.object.material && x.object.material.transparent)) || hs[0];
        if (h) api.select(h.object.userData.part);
      }
      down = null;
    });
    const api = { parts: b.parts, select(i) { highlight(b, i); onPart && onPart(i, b.parts[i]); },
      dispose() { alive = false; ro.disconnect(); r.dispose(); r.domElement.remove(); } };
    (function loop() {
      if (!alive) return; if (auto) ry += .004;
      cam.position.set(0, Math.sin(rx) * dist, Math.cos(rx) * dist); cam.lookAt(0, 0, 0);
      b.group.rotation.set(0, ry, 0); b.group.scale.setScalar(b.scale); r.render(scene, cam); requestAnimationFrame(loop);
    })();
    return api;
  }
  window.R360Models = { build, highlight, lights, viewer, kinds: Object.keys(BUILD) };
})();
