(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.hero-title .w, .hero-impact').forEach((el, i) => el.style.setProperty('--i', i));

  const rot = document.querySelector('[data-rot]');
  if (rot && !reduced) {
    const words = [...rot.children];
    let cur = 0;
    setInterval(() => {
      const prev = words[cur];
      cur = (cur + 1) % words.length;
      const next = words[cur];
      prev.classList.remove('is-on');
      prev.classList.add('is-out');
      next.style.transition = 'none';
      next.classList.remove('is-out');
      next.offsetWidth;
      next.style.transition = '';
      next.classList.add('is-on');
    }, 2400);
  }

  const lanyard = document.querySelector('.lanyard');
  const card = lanyard?.querySelector('.pass-card');
  const cords = [document.getElementById('cord-l'), document.getElementById('cord-r')];
  if (!card) return;

  const HOOK = 20;
  const MAX = 1.1;
  const compact = matchMedia('(max-width: 900px)').matches;
  let theta = reduced ? 0 : compact ? 0.12 : 0.42, omega = 0;
  let dragging = false, lastT = 0, lastAngle = 0, lastMove = 0;
  let w = 0, h = 0, L = 0, raf = 0;

  const measure = () => {
    w = lanyard.clientWidth;
    h = lanyard.clientHeight;
    L = card.offsetTop - HOOK;
  };

  const render = () => {
    const hx = w / 2 + Math.sin(theta) * L;
    const hy = Math.cos(theta) * L;
    card.style.transform = `translate(-50%) translate(${hx - w / 2}px, ${hy - L}px) rotate(${-theta}rad)`;
    card.style.setProperty('--tilt', (theta / MAX).toFixed(3));

    const sx = 360 / w, sy = 480 / h;
    const ex = hx * sx, ey = (hy + 6) * sy;
    cords[0].setAttribute('d', `M126 0 Q${(120 + ex) / 2 - 30} ${ey * .7} ${ex} ${ey}`);
    cords[1].setAttribute('d', `M234 0 Q${(240 + ex) / 2 + 30} ${ey * .7} ${ex} ${ey}`);
  };

  const step = (t) => {
    const dt = Math.min((t - lastT) / 1000 || 0.016, 0.032);
    lastT = t;
    if (!dragging) {
      const g = 9.81 * 1000 / Math.max(L, compact ? 130 : 60) * 0.35;
      omega += (-g * Math.sin(theta) - 1.6 * omega) * dt;
      theta = Math.max(-MAX, Math.min(MAX, theta + omega * dt));
    }
    render();
    if (dragging || Math.abs(omega) > 0.002 || Math.abs(theta) > 0.002) raf = requestAnimationFrame(step);
    else { theta = omega = 0; render(); raf = 0; }
  };
  const wake = () => { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(step); } };

  const angleFrom = (e) => {
    const r = lanyard.getBoundingClientRect();
    const dx = e.clientX - (r.left + w / 2);
    const dy = Math.max(e.clientY - r.top, 20);
    return Math.max(-MAX, Math.min(MAX, Math.atan2(dx, dy)));
  };

  card.addEventListener('pointerdown', (e) => {
    dragging = true;
    card.setPointerCapture(e.pointerId);
    lanyard.classList.add('is-dragging');
    lastAngle = angleFrom(e);
    lastMove = performance.now();
    omega = 0;
    wake();
  });
  card.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const a = angleFrom(e), now = performance.now();
    const dt = Math.max((now - lastMove) / 1000, 0.001);
    omega = omega * 0.5 + ((a - lastAngle) / dt) * 0.5;
    theta = a;
    lastAngle = a;
    lastMove = now;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    lanyard.classList.remove('is-dragging');
    omega = Math.max(-8, Math.min(8, omega));
    wake();
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);

  card.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    omega += e.key === 'ArrowLeft' ? -2.2 : 2.2;
    wake();
  });

  addEventListener('resize', () => { measure(); render(); });
  measure();
  render();

  if (!reduced) setTimeout(wake, 900);
})();

(() => {

  const buttons = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('.pcard');
  buttons.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    cards.forEach((c) => { c.hidden = f !== 'all' && c.dataset.cat !== f; });
  }));

  const toReveal = document.querySelectorAll('.sec-head, .xcard, .og, .proj-head, .pcard');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px' });
    toReveal.forEach((el, i) => {
      el.classList.add('reveal');
      if (el.classList.contains('pcard')) el.style.setProperty('--d', `${(i % 2) * 0.08}s`);
      io.observe(el);
    });
  }

  const links = [...document.querySelectorAll('.dock a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      const link = links.find((a) => a.getAttribute('href') === `#${e.target.id}`);
      link?.classList.toggle('is-on', e.isIntersecting);
    }), { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach((s) => spy.observe(s));
  }
})();
