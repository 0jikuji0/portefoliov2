(() => {
  const stage = document.querySelector('[data-globe]');
  const filter = document.querySelector('.tf');
  const counter = document.querySelector('[data-count]');
  if (!stage || !filter) return;

  const TOOLS = [
    ['c', 'C', 'lang'],
    ['cplusplus', 'C++', 'lang'],
    ['rust', 'Rust', 'lang'],
    ['go', 'Go', 'lang'],
    ['php', 'PHP', 'lang'],
    ['python', 'Python', 'lang'],
    ['csharp', 'C#', 'lang'],
    ['javascript', 'JavaScript', 'lang'],
    ['axum', 'Axum', 'fw'],
    ['laravel', 'Laravel', 'fw'],
    ['spring', 'Spring', 'fw'],
    ['nuxtjs', 'Nuxt', 'fw'],
    ['nextjs', 'Next.js', 'fw'],
    ['threejs', 'Three.js', 'fw'],
    ['pytorch', 'PyTorch', 'fw'],
    ['mongodb', 'MongoDB', 'data'],
    ['mysql', 'MySQL', 'data'],
    ['mariadb', 'MariaDB', 'data'],
    ['linux', 'Linux', 'sys'],
    ['bash', 'Bash', 'sys'],
    ['git', 'Git', 'sys'],
    ['github', 'GitHub', 'sys'],
    ['docker', 'Docker', 'sys'],
    ['nginx', 'nginx', 'sys'],
    ['n8n', 'n8n', 'sys'],
    ['android', 'Android', 'sys'],
  ];
  const CATS = ['lang', 'fw', 'data', 'sys'];
  const t = (k) => (window.t && window.t(k)) || k;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 'all';

  const count = (cat) => (cat === 'all' ? TOOLS.length : TOOLS.filter((x) => x[2] === cat).length);
  const buttons = ['all', ...CATS].map((cat) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.cat = cat;
    b.setAttribute('aria-pressed', String(cat === 'all'));
    b.innerHTML = `<b>${count(cat)}</b><strong></strong>`;
    if (cat !== 'all') {
      const small = document.createElement('small');
      small.textContent = TOOLS.filter((x) => x[2] === cat).map((x) => x[1]).join(', ');
      b.append(small);
    }
    b.addEventListener('click', () => select(cat === current ? 'all' : cat));
    filter.append(b);
    return b;
  });
  const label = () => buttons.forEach((b) => {
    b.querySelector('strong').textContent = t(b.dataset.cat === 'all' ? 'langs.all' : `langs.c.${b.dataset.cat}`);
  });
  label();
  document.addEventListener('langchange', label);

  function select(cat) {
    current = cat;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    counter.textContent = count(cat);
    orbs.forEach((o) => o.el.classList.toggle('is-hot', cat !== 'all' && o.cat === cat));
    if (reduced) { rings.concat(orbs).forEach((x) => { x.f = cat === 'all' || x.cat === cat ? 1 : 0; }); draw(); }
    else start();
  }

  const DEG = Math.PI / 180;
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const mix = (a, b, k) => a + (b - a) * k;
  const easeOut = (v) => 1 - Math.pow(1 - clamp(v), 3);
  const INK = [13, 13, 12], HOT = [255, 79, 18];

  const RING_DEFS = [
    { r: 1.62, tilt: 72, az: 14, w: 0.17 },
    { r: 1.32, tilt: 60, az: 78, w: -0.21 },
    { r: 1.84, tilt: 80, az: 142, w: 0.12 },
    { r: 1.48, tilt: 64, az: 214, w: -0.15 },
  ];
  const rings = CATS.map((cat, i) => {
    const d = RING_DEFS[i], tl = d.tilt * DEG, az = d.az * DEG;
    return {
      ...d, cat, i, f: 1,
      phase: i * 1.7,
      u: [Math.cos(az), 0, Math.sin(az)],
      v: [-Math.cos(tl) * Math.sin(az), -Math.sin(tl), Math.cos(tl) * Math.cos(az)],
    };
  });
  const onRing = (ring, radius, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [0, 1, 2].map((k) => radius * (c * ring.u[k] + s * ring.v[k]));
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'og-canvas';
  const ctx = canvas.getContext('2d');
  stage.prepend(canvas);

  const tip = stage.querySelector('.og-tip');
  let hovered = null;
  const orbs = [];
  CATS.forEach((cat, ri) => {
    const list = TOOLS.filter((x) => x[2] === cat);
    list.forEach(([icon, name], k) => {
      const el = document.createElement('span');
      el.className = 'gl-orb';
      el.innerHTML = `<img src="assets/icons/${icon}.svg" alt="" draggable="false">`;
      stage.append(el);
      const o = { el, name, cat, ring: rings[ri], a0: (Math.PI * 2 * k) / list.length, f: 1, hov: 0, delay: (orbs.length % 7) / 7 };
      el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') setHover(o); });
      el.addEventListener('pointerleave', () => { if (hovered === o) setHover(null); });
      orbs.push(o);
    });
  });

  function setHover(o) {
    hovered = o;
    if (o) {
      tip.querySelector('b').textContent = o.name;
      tip.querySelector('span').textContent = t(`langs.c.${o.cat}`);
    }
    tip.classList.toggle('on', !!o);
    if (!running) draw();
  }

  let W = 0, R = 0, cam = 0, dpr = 1, orbSize = 46;
  let yaw = 1.75, pitch = 0.36, vyaw = 0, time = 0, speed = 1;
  let grow = reduced ? 1 : 0;

  const resize = () => {
    W = stage.clientWidth || 500;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(W * dpr);
    R = W * 0.25;
    cam = R * 6;
    orbSize = W < 440 ? 36 : 48;
    stage.style.setProperty('--orb', `${orbSize}px`);
  };

  const project = (p) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = p[0] * cy - p[2] * sy;
    const z1 = p[0] * sy + p[2] * cy;
    const y = p[1] * cp - z1 * sp;
    const z = p[1] * sp + z1 * cp;
    const k = cam / (cam - z);
    return { x: W / 2 + x * k, y: W / 2 - y * k, z, k };
  };

  function draw() {
    const g = easeOut(grow);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);

    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    for (const ring of rings) {
      const drawn = easeOut((grow - ring.i * 0.08) / 0.6);
      const radius = ring.r * R * mix(0.7, 1, g);
      const hot = current !== 'all' && ring.cat === current;
      const rgb = (hot ? HOT : INK).join(',');
      const N = 120;
      const pts = [];
      for (let j = 0; j <= N * drawn; j++) pts.push(project(onRing(ring, radius, ring.phase + (j / N) * Math.PI * 2)));

      let level = -1;
      const flush = () => { if (level >= 0) ctx.stroke(); };
      for (let j = 1; j < pts.length; j++) {
        const a = pts[j - 1], b = pts[j];
        const d = clamp(((a.z + b.z) / 2 / radius + 1) / 2);
        const lv = Math.round(d * d * (3 - 2 * d) * 12) / 12;
        if (lv !== level) {
          flush();
          level = lv;
          const alpha = mix(0.12, 0.5, lv) * mix(0.25, 1, ring.f) + (hot ? 0.35 * ring.f : 0);
          ctx.strokeStyle = `rgba(${rgb},${Math.min(1, alpha).toFixed(3)})`;
          ctx.lineWidth = hot ? 3 : mix(1.1, 1.7, lv);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
        }
        ctx.lineTo(b.x, b.y);
      }
      flush();
    }

    for (const o of orbs) {
      const appear = easeOut((grow - 0.15 - o.delay * 0.45) / 0.4);
      const st = o.el.style;
      if (appear <= 0) { st.opacity = '0'; continue; }
      const ringR = o.ring.r * R;
      const ang = o.a0 + o.ring.phase + o.ring.w * time;
      const p = project(onRing(o.ring, ringR * mix(0.25, 1, appear) * mix(0.7, 1, g), ang));
      const depth = clamp((p.z / ringR + 1) / 2);
      const scale = p.k * mix(0.35, 1, appear) * (0.8 + 0.28 * depth) * mix(0.82, 1.1, o.f) * (1 + 0.35 * o.hov);
      const behind = p.z < 0 ? 0.5 + 0.4 * depth : 1;
      st.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      st.opacity = (clamp(appear * 2) * behind * mix(0.18, 1, o.f)).toFixed(3);
      st.zIndex = o.hov > 0.5 ? '2500' : String(Math.round(1000 + p.z));
      if (o === hovered) {
        tip.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - (orbSize / 2) * scale - 10).toFixed(1)}px) translate(-50%, -100%)`;
      }
    }
  }

  let running = false, visible = false, last = 0, raf = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    speed = mix(speed, hovered ? 0 : 1, Math.min(1, dt * 6));
    time += dt * speed;
    yaw += vyaw * dt - 0.07 * dt * speed;
    vyaw *= Math.pow(0.04, dt);
    if (grow < 1) grow = Math.min(1, grow + dt / 1.6);
    const k = Math.min(1, dt * 7);
    for (const x of rings) x.f = mix(x.f, current === 'all' || x.cat === current ? 1 : 0, k);
    for (const o of orbs) {
      o.f = mix(o.f, current === 'all' || o.cat === current ? 1 : 0, k);
      o.hov = mix(o.hov, hovered === o ? 1 : 0, Math.min(1, dt * 10));
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduced || !visible) return;
    running = true;
    stage.classList.add('is-running');
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; stage.classList.remove('is-running'); cancelAnimationFrame(raf); }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0.15 }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  let dragging = false, px = 0, py = 0, pt = 0;
  stage.addEventListener('pointerdown', (e) => {
    dragging = true; px = e.clientX; py = e.clientY; pt = performance.now(); vyaw = 0;
    stage.classList.add('is-drag');
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), dx = e.clientX - px, dy = e.clientY - py, k = 2.6 / W;
    yaw -= dx * k;
    pitch = Math.max(0.05, Math.min(0.8, pitch + dy * k * 0.5));
    vyaw = (-dx * k) / Math.max(0.008, (now - pt) / 1000);
    px = e.clientX; py = e.clientY; pt = now;
    if (!running) draw();
  });
  const endDrag = () => { dragging = false; stage.classList.remove('is-drag'); };
  addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  new ResizeObserver(() => { resize(); draw(); }).observe(stage);
  resize();
  select('all');
  draw();
})();
