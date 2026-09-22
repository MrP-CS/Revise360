// Revise 360: interactive 3D hardware models, built from simple shapes so no model files are needed.
(function () {
  const T = THREE;
  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .55, metalness: .15 }, o || {}));
  const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg) => { const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 32), m); o.position.set(x || 0, y || 0, z || 0); return o; };
  const tube = (a, b, r, m) => { const d = new T.Vector3().subVectors(b, a); const o = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 16), m);
    o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); return o; };
  function labelTex(text, bg, fg) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d");
    x.fillStyle = bg; x.fillRect(0, 0, 256, 128); x.fillStyle = fg || "#0f1626"; x.font = "bold 54px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 66);
    const t = new T.CanvasTexture(c); return t;
  }
  function labelled(w, h, d, color, text, x, y, z) {
    const side = mat(color); const top = new T.MeshStandardMaterial({ map: labelTex(text, color), roughness: .6 });
    const o = new T.Mesh(new T.BoxGeometry(w, h, d), [side, side, top, side, side, side]); o.position.set(x, y, z); return o;
  }
  function kit() {
    const group = new T.Group(), parts = [];
    const part = (obj, name, text) => { obj.traverse(o => { if (o.isMesh) { o.userData.part = parts.length; } }); group.add(obj); parts.push({ obj, name, text }); return obj; };
    return { group, parts, part };
  }

  const BUILD = {
    cpu() {
      const { group, parts, part } = kit();
      part(box(4, .14, 4, mat(0x2f7a4a)), "Substrate", "The green circuit board the chip sits on. It carries connections from the silicon die to the contacts underneath.");
      const pins = new T.InstancedMesh(new T.CylinderGeometry(.05, .05, .12, 8), mat(0xd4af37, { metalness: .9, roughness: .3 }), 400);
      const m4 = new T.Matrix4(); let i = 0;
      for (let a = 0; a < 20; a++) for (let b = 0; b < 20; b++) { m4.makeTranslation(-1.8 + a * .19, -.12, -1.8 + b * .19); pins.setMatrixAt(i++, m4); }
      part(pins, "Contacts", "Hundreds of gold contacts connect the CPU to the motherboard, carrying power, data and control signals.");
      const die = new T.Group(); die.add(box(2, .08, 2, mat(0x3a3f4a), 0, .11, 0));
      part(die, "Silicon die", "The chip itself: a slice of silicon containing billions of tiny transistors.");
      const cores = new T.Group();
      [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]].forEach(([x, z], k) => cores.add(labelled(.8, .06, .7, "#40c4ff", "Core " + (k + 1), x * 1, .18, z * .95 - .15)));
      part(cores, "Cores", "Each core is a complete processing unit that can fetch, decode and execute instructions on its own. A quad-core CPU can process four sets of instructions at the same time.");
      part(labelled(1.8, .06, .35, "#ffd046", "Cache", 0, .18, .78), "Cache", "Very fast memory on the CPU itself. It holds frequently used instructions and data, so the CPU doesn't have to wait for slower RAM.");
      part(box(3.2, .16, 3.2, mat(0xc8ccd4, { metalness: .8, roughness: .35, transparent: true, opacity: .35 }), 0, .32, 0), "Heat spreader", "A metal lid that spreads heat from the die out to the cooler. It's see-through here so you can look inside.");
      return { group, parts, scale: .9 };
    },
    vonneumann() {
      const { group, parts, part } = kit();
      part(box(3.6, .1, 3.2, mat(0x1c2c4a, { transparent: true, opacity: .55 }), -.7, -.2, 0), "CPU", "The central processing unit: it fetches, decodes and executes instructions. Everything on this dark base is inside the CPU.");
      part(labelled(1.3, .5, .9, "#aa6eeb", "CU", -1.6, .1, -.9), "Control unit (CU)", "Decodes instructions and sends signals to control how data moves around the CPU.");
      part(labelled(1.3, .5, .9, "#ff785a", "ALU", .2, .1, -.9), "Arithmetic logic unit (ALU)", "Performs calculations, such as addition and subtraction, and logical decisions, such as comparing two values.");
      part(labelled(.75, .35, .6, "#40c4ff", "PC", -2.05, .02, .35), "Program counter (PC)", "A register that holds the address of the next instruction. It is incremented after each instruction is fetched.");
      part(labelled(.75, .35, .6, "#40c4ff", "MAR", -1.2, .02, .35), "Memory address register (MAR)", "A register that holds the address of the data or instruction to be fetched from, or written to, memory.");
      part(labelled(.75, .35, .6, "#40c4ff", "MDR", -.35, .02, .35), "Memory data register (MDR)", "A register that holds the data or instruction fetched from memory, or waiting to be written to memory.");
      part(labelled(.75, .35, .6, "#40c4ff", "ACC", .5, .02, .35), "Accumulator (ACC)", "A register that holds the results of calculations carried out by the ALU.");
      part(labelled(3, .3, .5, "#ffd046", "Cache", -.7, .0, 1.25), "Cache", "Fast memory inside the CPU for frequently used instructions and data.");
      part(labelled(1.2, 1.4, 2.6, "#50dc96", "RAM", 2.4, .5, 0), "Main memory (RAM)", "The key idea of von Neumann architecture: instructions and data are stored together in the same memory, and the CPU fetches both from it.");
      const buses = new T.Group(); const bm = mat(0xf05aaa, { emissive: 0x401030 });
      buses.add(tube(new T.Vector3(-1.2, .3, .35), new T.Vector3(1.8, .9, .35), .06, bm));
      buses.add(tube(new T.Vector3(-.35, .3, .5), new T.Vector3(1.8, .6, .6), .06, mat(0x50dc96, { emissive: 0x103020 })));
      part(buses, "Buses", "Wires that carry addresses from the MAR to RAM (pink), and data and instructions between RAM and the MDR (green).");
      return { group, parts, scale: .75 };
    },
    motherboard() {
      const { group, parts, part } = kit();
      part(box(5, .12, 4.2, mat(0x1d5c3a)), "Motherboard", "The main circuit board. It connects the CPU, memory, storage and other components so they can communicate.");
      const cpu = new T.Group(); cpu.add(box(1.2, .12, 1.2, mat(0x2f7a4a), -1, .12, -.6)); cpu.add(box(.9, .1, .9, mat(0xc8ccd4, { metalness: .8, roughness: .3 }), -1, .22, -.6));
      part(cpu, "CPU", "The processor sits in a socket on the motherboard. A faster clock speed means more instructions per second, but also more heat.");
      const cool = new T.Group(); for (let k = 0; k < 9; k++) cool.add(box(1.5, .7, .05, mat(0x9aa4b4, { metalness: .8, roughness: .3 }), -1, .65, -1.1 + k * .12));
      cool.add(cyl(.55, .55, .12, mat(0x303640), -1, 1.08, -.6)); for (let k = 0; k < 7; k++) { const b = box(.5, .03, .12, mat(0x505866), -1, 1.15, -.6); b.rotation.y = k * Math.PI / 7; cool.add(b); }
      part(cool, "Heatsink and fan", "Metal fins draw heat away from the CPU and a fan blows it away. Without cooling, a fast CPU would overheat and slow itself down.");
      const ram = new T.Group(); [.6, .9].forEach(x => { ram.add(box(.12, .9, 2.4, mat(0x2d6b8a), x, .5, -.3)); for (let k = 0; k < 6; k++) ram.add(box(.14, .25, .3, mat(0x20232a), x, .6, -1.25 + k * .38)); });
      part(ram, "RAM", "Main memory: holds the programs and data currently in use. The CPU fetches instructions from here.");
      part(box(.8, .15, .8, mat(0x30343c), 1.3, .12, 1.3), "Chipset", "Controls communication between the CPU and other parts, such as storage and USB ports.");
      part(box(.4, .5, 2.2, mat(0x8a92a0, { metalness: .6 }), 2.3, .3, -.2), "Ports", "Connections for devices such as USB peripherals, displays and network cables.");
      return { group, parts, scale: .7 };
    },
    washingmachine() {
      const { group, parts, part } = kit();
      part(box(3, 3.4, 3, mat(0xe8ecf2, { transparent: true, opacity: .3 })), "Casing", "The washing machine is the larger device. The computer inside it is the embedded system. The casing is see-through so you can look inside.");
      const drum = new T.Group(); const d = cyl(1.1, 1.1, 1.8, mat(0xb8c0cc, { metalness: .7, roughness: .3 }), 0, -.1, -.1); d.rotation.x = Math.PI / 2; drum.add(d);
      const ring = new T.Mesh(new T.TorusGeometry(1.05, .12, 16, 48), mat(0x404652)); ring.position.set(0, -.1, 1.52); drum.add(ring);
      part(drum, "Drum and door", "The drum holds the clothes. A door lock stops it opening while the machine is running.");
      part(labelled(2.8, .5, .3, "#40c4ff", "Controls", 0, 1.45, 1.4), "Control panel", "Input: the user chooses a wash program and temperature with buttons and a dial.");
      part(labelled(1.1, .08, .8, "#50dc96", "MCU", .6, 1.2, -.6), "Microcontroller", "Process: a small embedded computer runs one dedicated program that controls the whole wash cycle.");
      const motor = cyl(.4, .4, .9, mat(0x606874, { metalness: .6 }), .7, -1.3, -.9); motor.rotation.z = Math.PI / 2;
      part(motor, "Motor", "Output: the microcontroller switches the motor on and off, and controls its speed to turn the drum.");
      part(labelled(.5, .3, .5, "#ff785a", "Temp", -.9, -1.5, .6), "Temperature sensor", "Input: tells the microcontroller how hot the water is, so it can switch the heater on or off.");
      part(cyl(.08, .08, 1.6, mat(0xff5f5f, { emissive: 0x401010 }), -.4, -1.5, 0), "Heater", "Output: heats the water to the temperature the user chose.");
      return { group, parts, scale: .6 };
    }
  };

  function build(kind) {
    const b = (BUILD[kind] || BUILD.cpu)();
    b.parts.forEach(p => p.obj.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); } }));
    return b;
  }
  function highlight(b, idx) {
    b.parts.forEach((p, i) => p.obj.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.emissive) { if (m.userData.baseE === undefined) m.userData.baseE = m.emissive.getHex(); m.emissive.setHex(i === idx ? 0x886600 : m.userData.baseE); } }); }));
  }
  function lights(scene) {
    scene.add(new T.HemisphereLight(0xffffff, 0x334466, 1.0));
    const dl = new T.DirectionalLight(0xffffff, .8); dl.position.set(3, 6, 4); scene.add(dl);
  }

  // Desktop viewer: drag to rotate, click a part (or a part button) to learn about it
  function viewer(container, kind, onPart) {
    const b = build(kind), scene = new T.Scene(); lights(scene); scene.add(b.group);
    const cam = new T.PerspectiveCamera(40, 1, .1, 100); cam.position.set(0, 2.5, 5); cam.lookAt(0, 0, 0);
    const r = new T.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); container.appendChild(r.domElement);
    r.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab;border-radius:12px";
    const size = () => { const w = container.clientWidth, h = container.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(container);
    let rx = .35, ry = -.6, auto = true, down = null, sel = -1, alive = true;
    const ray = new T.Raycaster();
    r.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY, e.clientX, e.clientY]; r.domElement.setPointerCapture(e.pointerId); auto = false; });
    r.domElement.addEventListener("pointermove", e => { if (!down) return; ry += (e.clientX - down[2]) * .01; rx = Math.max(-1.2, Math.min(1.2, rx + (e.clientY - down[3]) * .01)); down[2] = e.clientX; down[3] = e.clientY; });
    r.domElement.addEventListener("pointerup", e => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) {
        const rc = r.domElement.getBoundingClientRect();
        ray.setFromCamera(new T.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), cam);
        const hs = ray.intersectObjects(b.group.children, true).filter(x => x.object.userData.part !== undefined); const h = hs.find(x => !(x.object.material && x.object.material.transparent)) || hs[0];
        if (h) api.select(h.object.userData.part);
      }
      down = null;
    });
    const api = { parts: b.parts, select(i) { sel = i; highlight(b, i); onPart && onPart(i, b.parts[i]); },
      dispose() { alive = false; ro.disconnect(); r.dispose(); r.domElement.remove(); } };
    (function loop() { if (!alive) return; if (auto) ry += .004; b.group.rotation.set(rx, ry, 0); b.group.scale.setScalar(b.scale); r.render(scene, cam); requestAnimationFrame(loop); })();
    return api;
  }
  window.R360Models = { build, highlight, lights, viewer, kinds: Object.keys(BUILD) };
})();
