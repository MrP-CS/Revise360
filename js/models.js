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
