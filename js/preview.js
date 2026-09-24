// Public interactive homepage demo for Memory bay.
// Uses the real lesson artwork/data, but keeps all demo progress in memory only.
(() => {
  const root = document.getElementById('heroDemo');
  const host = document.getElementById('heroExperience');
  const panel = document.getElementById('demoPanel');
  const loading = document.getElementById('demoLoading');
  const hint = document.getElementById('demoHint');
  const reset = document.getElementById('demoReset');
  const progress = document.getElementById('demoProgress');
  if (!root || !host || !panel || !loading || !reset || !progress || !window.THREE) return;

  let renderer, scene, camera, sphere, raycaster, lon = 0, lat = 0;
  let dragging = false, dragX = 0, dragY = 0, downX = 0, downY = 0;
  let exp = null, sc = null, sprites = [];
  const answered = new Set();
  const foundFacts = new Set();

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const cubeFrom = o => {
    const u = o.x / 2048, v = o.y / 2048;
    switch (o.face) {
      case 'front': return [2*u-1, 1-2*v, 1];
      case 'right': return [1, 1-2*v, 1-2*u];
      case 'back': return [1-2*u, 1-2*v, -1];
      case 'left': return [-1, 1-2*v, 2*u-1];
      case 'up': return [2*u-1, 1, 2*v-1];
      default: return [2*u-1, -1, 1-2*u];
    }
  };
  const world = p => new THREE.Vector3(-p[2], p[1], -p[0]).normalize().multiplyScalar(38);

  function makeBadge(label, colour, small) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.beginPath(); x.arc(128,128,105,0,Math.PI*2);
    x.fillStyle = 'rgba(10,16,30,.9)'; x.fill();
    x.lineWidth = small ? 12 : 15; x.strokeStyle = colour; x.stroke();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = small ? 'italic 700 112px Georgia,serif' : '700 104px Segoe UI,sans-serif';
    x.fillText(label,128,132);
    return new THREE.CanvasTexture(c);
  }

  function addSprite(data, texture, size) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
    s.position.copy(world(cubeFrom(data)));
    s.scale.set(size,size,1);
    s.userData = data;
    s.renderOrder = data.kind === 'station' ? 2 : 1;
    scene.add(s); sprites.push(s);
  }

  function updateProgress() {
    progress.textContent = answered.size
      ? `${answered.size} station${answered.size === 1 ? '' : 's'} tried · ${foundFacts.size} fact${foundFacts.size === 1 ? '' : 's'} found`
      : 'Drag to explore · try a station';
  }

  function closePanel() {
    panel.hidden = true;
    panel.innerHTML = '';
  }

  function showFact(inf) {
    foundFacts.add(inf.id);
    updateProgress();
    panel.innerHTML = `<button class="hero-demo-close" type="button" aria-label="Close">×</button><span class="hero-demo-kicker">BLUE i / FACT</span><h3>${esc(inf.title)}</h3><p>${esc(inf.text)}</p>`;
    panel.hidden = false;
    panel.querySelector('button').addEventListener('click', closePanel);
  }

  function showStation(index) {
    const st = sc.stations[index];
    const task = st.tasks[0];
    if (!task || task.t !== 'mcq') {
      panel.innerHTML = `<button class="hero-demo-close" type="button" aria-label="Close">×</button><span class="hero-demo-kicker">STATION ${esc(st.label)}</span><h3>${esc(st.name)}</h3><p>This station uses a richer activity in the full experience. Open the topic to try every challenge.</p><a class="hero-demo-link" href="topics.html?topic=1.2">Explore Memory &amp; Storage →</a>`;
      panel.hidden = false;
      panel.querySelector('button').addEventListener('click', closePanel);
      return;
    }

    const options = task.a.map((a,i) => ({text:a, correct:i===0})).sort(() => Math.random() - .5);
    panel.innerHTML = `<button class="hero-demo-close" type="button" aria-label="Close">×</button><span class="hero-demo-kicker">STATION ${esc(st.label)} / ${esc(st.name)}</span><h3>${esc(task.q)}</h3><div class="hero-demo-options">${options.map((o,i)=>`<button type="button" data-correct="${o.correct}" data-i="${i}">${esc(o.text)}</button>`).join('')}</div><p class="hero-demo-feedback" id="demoFeedback" aria-live="polite"></p>`;
    panel.hidden = false;
    panel.querySelector('.hero-demo-close').addEventListener('click', closePanel);
    panel.querySelectorAll('.hero-demo-options button').forEach(btn => {
      btn.addEventListener('click', () => {
        const correct = btn.dataset.correct === 'true';
        answered.add(index);
        updateProgress();
        panel.querySelectorAll('.hero-demo-options button').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === 'true') b.classList.add('is-right');
        });
        if (!correct) btn.classList.add('is-wrong');
        const fb = panel.querySelector('#demoFeedback');
        fb.innerHTML = `<strong>${correct ? 'Correct.' : 'Not quite.'}</strong> ${esc(task.fb)}`;
      });
    });
  }

  function pick(clientX, clientY) {
    const rect = host.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(p,camera);
    const hit = raycaster.intersectObjects(sprites).sort((a,b)=>b.object.renderOrder-a.object.renderOrder)[0];
    if (!hit) return;
    const d = hit.object.userData;
    if (d.kind === 'station') showStation(d.index);
    else showFact(d);
  }

  function resetView() {
    lon = 0; lat = 0; closePanel();
    if (hint) hint.hidden = false;
    host.focus({preventScroll:true});
  }

  async function init() {
    try {
      exp = await fetch('experiences/ms-l01.json',{cache:'no-cache'}).then(r => {
        if (!r.ok) throw new Error('Lesson data unavailable');
        return r.json();
      });
      sc = exp.scenes[0];

      renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
      renderer.domElement.setAttribute('aria-hidden','true');
      host.prepend(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(78,1,.1,100);
      raycaster = new THREE.Raycaster();

      const geo = new THREE.SphereGeometry(50,72,48); geo.scale(-1,1,1);
      const tex = new THREE.TextureLoader().load('experiences/' + sc.img, () => {
        loading.hidden = true;
        updateProgress();
      }, undefined, () => {
        loading.textContent = 'Could not load the 360° scene.';
      });
      tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      sphere = new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex}));
      scene.add(sphere);

      sc.stations.forEach((st,index) => addSprite(
        {...st,kind:'station',index},
        makeBadge(st.label,st.col,false),
        5.0
      ));
      (sc.info || []).forEach(inf => addSprite(
        {...inf,kind:'info'},
        makeBadge('i','#5ab4ff',true),
        2.7
      ));

      const resize = () => {
        const r = host.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width,r.height,false);
        camera.aspect = r.width/r.height;
        camera.updateProjectionMatrix();
      };
      new ResizeObserver(resize).observe(host); resize();

      renderer.setAnimationLoop(() => {
        lat = Math.max(-75,Math.min(75,lat));
        const phi = THREE.MathUtils.degToRad(90-lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(
          50*Math.sin(phi)*Math.cos(theta),
          50*Math.cos(phi),
          50*Math.sin(phi)*Math.sin(theta)
        );
        renderer.render(scene,camera);
      });

      host.addEventListener('pointerdown', e => {
        dragging = true; dragX = downX = e.clientX; dragY = downY = e.clientY;
        host.setPointerCapture(e.pointerId);
        if (hint) hint.hidden = true;
      });
      host.addEventListener('pointermove', e => {
        if (!dragging) return;
        lon -= (e.clientX-dragX)*.16; lat += (e.clientY-dragY)*.16;
        dragX = e.clientX; dragY = e.clientY;
      });
      host.addEventListener('pointerup', e => {
        const moved = Math.hypot(e.clientX-downX,e.clientY-downY);
        dragging = false;
        if (moved < 7) pick(e.clientX,e.clientY);
      });
      host.addEventListener('pointercancel', () => { dragging = false; });
      host.addEventListener('keydown', e => {
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
          e.preventDefault();
          if (e.key === 'ArrowLeft') lon -= 8;
          if (e.key === 'ArrowRight') lon += 8;
          if (e.key === 'ArrowUp') lat += 8;
          if (e.key === 'ArrowDown') lat -= 8;
          if (hint) hint.hidden = true;
        }
      });
      host.addEventListener('wheel', e => {
        e.preventDefault();
        camera.fov = Math.max(45,Math.min(95,camera.fov + e.deltaY*.035));
        camera.updateProjectionMatrix();
      },{passive:false});
      host.addEventListener('mousemove', e => {
        if (dragging) return;
        const rect = host.getBoundingClientRect();
        const p = new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
        raycaster.setFromCamera(p,camera);
        host.style.cursor = raycaster.intersectObjects(sprites).length ? 'pointer' : 'grab';
      });
      reset.addEventListener('click', resetView);
      updateProgress();
    } catch (err) {
      loading.textContent = 'Interactive preview unavailable. You can still explore the full topic below.';
      progress.textContent = 'Open Memory & Storage to explore';
    }
  }

  init();
})();