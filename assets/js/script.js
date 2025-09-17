// assets/js/script.js
// Smooth scroll, DPR-aware starfield (twinkle), parallax, sparkles.
// Respects prefers-reduced-motion.

// Smooth scroll for internal anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});

const PREFERS_REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------ STARFIELD ------------------ */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) {
    console.error('starfield canvas not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const DPR = Math.max(window.devicePixelRatio || 1, 1);
  let w = 0, h = 0, stars = [];

  function setup() {
    const hero = document.querySelector('.hero');
    if (!hero) {
      console.error('hero element not found');
      return;
    }
    const rect = hero.getBoundingClientRect();
    w = Math.max(window.innerWidth, Math.round(rect.width));
    h = Math.max(rect.height, 400);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    stars = [];
    const NUM = 220, NUM_BIG = 30;
    for (let i = 0; i < NUM; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        b: 0.2 + Math.random() * 0.8,
        s: 0.004 + Math.random() * 0.02,
        d: Math.random() < 0.5 ? 1 : -1
      });
    }
    for (let i = 0; i < NUM_BIG; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.6 + Math.random() * 2.2,
        b: 0.6 + Math.random() * 0.4,
        s: 0.01 + Math.random() * 0.02,
        d: Math.random() < 0.5 ? 1 : -1
      });
    }
    for (let s of stars) {
      s.x += (Math.random() - 0.5) * 2;
      s.y += (Math.random() - 0.5) * 2;
    }

    console.log('Starfield ready —', canvas.width, 'x', canvas.height, 'DPR', DPR, 'stars', stars.length);
  }

  function animate() {
    ctx.fillStyle = '#000014';
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      s.b += s.d * s.s;
      if (s.b >= 1) { s.b = 1; s.d = -1; }
      if (s.b <= 0.12) { s.b = 0.12; s.d = 1; }

      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
      grad.addColorStop(0, `rgba(255,255,255,${s.b})`);
      grad.addColorStop(0.3, `rgba(180,210,255,${s.b * 0.55})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, s.b + 0.15)})`;
      ctx.arc(s.x, s.y, Math.max(0.5, s.r), 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { setup(); });

  setup();
  requestAnimationFrame(animate);

  // expose for parallax
  window.__reportx_starfield = { canvasEl: canvas, heroSelector: '.hero' };
})();

/* ------------------ PARALLAX (mouse + scroll) ------------------ */
(function initParallax() {
  if (PREFERS_REDUCE) {
    console.log('prefers-reduced-motion: parallax disabled');
    return;
  }

  const info = window.__reportx_starfield;
  if (!info) {
    window.addEventListener('load', () => requestAnimationFrame(initParallax));
    return;
  }

  const canvas = info.canvasEl;
  const hero = document.querySelector(info.heroSelector);
  const heroContent = document.querySelector('.hero-content');

  const MAX_MOVE = 20;
  const CONTENT_MOVE = 8;
  const DAMPING = 0.12;

  let pointerX = 0, pointerY = 0;
  let targetCx = 0, targetCy = 0;
  let currentCx = 0, currentCy = 0;
  let lastScrollY = window.scrollY || 0;

  function onMouseMove(e) {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    pointerX = x - 0.5;
    pointerY = y - 0.5;
    targetCx = -pointerX * MAX_MOVE;
    targetCy = -pointerY * MAX_MOVE * 0.6;
  }

  function onPointer(e) {
    if (e.touches && e.touches[0]) {
      onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    } else {
      onMouseMove(e);
    }
  }

  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollOffset = Math.max(-30, Math.min(30, (scrollY / (window.innerHeight || 1)) * 20));
    targetCy += scrollOffset * 0.08;
    lastScrollY = scrollY;
  }

  function rafLoop() {
    currentCx += (targetCx - currentCx) * DAMPING;
    currentCy += (targetCy - currentCy) * DAMPING;

    if (canvas) {
      canvas.style.transform = `translate3d(${currentCx}px, ${currentCy}px, 0)`;
      canvas.style.willChange = 'transform';
    }

    if (hero) {
      const nebX = currentCx * 0.35;
      const nebY = currentCy * 0.45;
      hero.style.setProperty('--nebula-translate', `translate3d(${nebX}px, ${nebY}px, 0)`);
    }

    if (heroContent) {
      const contentX = -currentCx * (CONTENT_MOVE / MAX_MOVE);
      const contentY = -currentCy * (CONTENT_MOVE / MAX_MOVE);
      heroContent.style.transform = `translate3d(${contentX}px, ${contentY}px, 0)`;
      heroContent.style.willChange = 'transform';
    }

    targetCx *= 0.995;
    targetCy *= 0.995;

    requestAnimationFrame(rafLoop);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  requestAnimationFrame(rafLoop);
})();

/* ------------------ SPARKLES (pointer + scroll) ------------------ */
(function initSparkles() {
  const canvas = document.getElementById('sparkles');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) {
    console.warn('Sparkles: canvas or hero not found');
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  const DPR = Math.max(window.devicePixelRatio || 1, 1);
  let w = 0, h = 0;
  let particles = [];
  let lastMove = 0;
  const MOVE_THROTTLE = 40; // ms

  function resizeCanvas() {
    const rect = hero.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function spawnAt(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        r: Math.random() * 2 + 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        dx: (Math.random() - 0.5) * 1.6,
        dy: (Math.random() - 0.5) * 1.6,
      });
    }
  }

  function spawnRandom(count = 4) {
    for (let i = 0; i < count; i++) {
      spawnAt(Math.random() * w, Math.random() * h, 5 + Math.floor(Math.random() * 6));
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w * DPR, h * DPR);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      grad.addColorStop(0, `rgba(255,255,255,${p.life})`);
      grad.addColorStop(0.4, `rgba(20,184,166,${p.life * 0.6})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  function handlePointerMove(clientX, clientY) {
    const now = performance.now();
    if (now - lastMove < MOVE_THROTTLE) return;
    lastMove = now;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    spawnAt(x, y, 6);
  }

  function onPointer(e) {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.clientX != null) {
      handlePointerMove(e.clientX, e.clientY);
    }
  }

  function onScroll() {
    const speed = Math.min(Math.abs(window.scrollY - (onScroll._last || 0)), 120);
    onScroll._last = window.scrollY;
    const clusters = 1 + Math.round((speed / 120) * 6);
    for (let i = 0; i < clusters; i++) spawnRandom(1);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animate();

  hero.addEventListener('pointermove', onPointer, { passive: true });
  hero.addEventListener('touchmove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  console.log('Sparkles initialized — canvas', canvas.width, 'x', canvas.height, 'DPR', DPR);
})();

// Horizontal auto-scroll with fade pause/resume + mouse controls
// Robust horizontal auto-scroll for .screenshot-grid
// - waits for images to load before measuring/cloning
// - smooth fade pause/resume, prev/next + hold controls
// - logs debug info to console

// Robust horizontal auto-scroll (simpler & reliable)
// - Waits for images, clones once, uses originalWidth as wrap threshold
// - Pause/resume fade, prev/next controls, wheel & touch support

// ---- Auto-scroll using transform (robust) ----
// Replace the previous screenshot auto-scroll block with this.

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.screenshot-grid');
  if (!grid) {
    console.warn('AutoScroll: .screenshot-grid not found');
    return;
  }
  const prevBtn = document.querySelector('.screenshot-prev');
  const nextBtn = document.querySelector('.screenshot-next');

  // wait for images inside the grid to load (safe)
  async function waitForImages(parent) {
    const imgs = Array.from(parent.querySelectorAll('img'));
    if (!imgs.length) return;
    const decodes = imgs.map(img => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      if (img.decode) return img.decode().catch(() => Promise.resolve());
      return new Promise(resolve => { img.addEventListener('load', resolve); img.addEventListener('error', resolve); });
    });
    await Promise.all(decodes);
    // small delay to allow layout to settle
    await new Promise(r => setTimeout(r, 40));
  }

  (async function init() {
    try { await waitForImages(grid); } catch(e) { console.warn('AutoScroll image wait failed', e); }

    // collect original items
    const originals = Array.from(grid.children);
    if (!originals.length) {
      console.warn('AutoScroll: no children');
      return;
    }

    // wrap originals into a track element
    const track = document.createElement('div');
    track.className = 'screenshot-track';
    // copy computed gap if present (so spacing is preserved)
    const cs = getComputedStyle(grid);
    const gap = cs.gap || cs.getPropertyValue('gap') || '1.5rem';
    track.style.display = 'flex';
    track.style.gap = gap;
    track.style.alignItems = 'center';
    track.style.flexWrap = 'nowrap';
    track.style.willChange = 'transform';
    // move originals into track
    originals.forEach(node => track.appendChild(node));
    // clear grid and append track
    grid.innerHTML = '';
    grid.appendChild(track);
    // make sure grid hides overflow (we will translate the track)
    grid.style.overflow = 'hidden';
    grid.style.position = grid.style.position || 'relative';

    // measure original track width
    await new Promise(r => requestAnimationFrame(r)); // ensure layout
    const originalWidth = track.scrollWidth;
    if (originalWidth <= 10) {
      // fallback: compute by summing children widths
      let wsum = 0;
      Array.from(track.children).forEach(ch => { wsum += ch.getBoundingClientRect().width; });
      console.warn('AutoScroll: originalWidth fallback used', originalWidth, wsum);
    }

    // clone the original children once to allow seamless looping
    const cloneFrag = document.createDocumentFragment();
    Array.from(track.children).forEach(node => cloneFrag.appendChild(node.cloneNode(true)));
    track.appendChild(cloneFrag);

    // force reflow
    await new Promise(r => requestAnimationFrame(r));
    const totalWidth = track.scrollWidth;

    console.log('AutoScroll initialized:', { originalWidth, totalWidth, items: originals.length, gap });

    // animation state
    const BASE_SPEED = 40;   // px/sec normal
    const HOLD_SPEED = 220;  // px/sec while holding arrow
    let targetSpeed = BASE_SPEED;
    let currentSpeed = BASE_SPEED;
    let paused = false;
    let holding = 0; // -1 left, +1 right
    const SMOOTH = 0.12;
    let offset = 0; // current translate x (starts 0)

    // helpers
    function clampOffset() {
      // when offset <= -originalWidth, wrap forward by originalWidth
      if (originalWidth > 0) {
        if (offset <= -originalWidth) offset += originalWidth;
        if (offset >= originalWidth) offset -= originalWidth;
      }
    }

    function stepBy(direction = 1) {
      // approximate item width (first child)
      const first = track.querySelector('img, *');
      const gapPx = parseFloat(gap) || 24;
      const itemW = first ? (first.getBoundingClientRect().width + gapPx) : 200;
      // decrement offset because moving left visually => translateX negative
      offset -= direction * itemW;
      clampOffset();
      // apply transform instantly (smooth visual because we use transform)
      track.style.transition = 'transform 420ms cubic-bezier(.2,.9,.3,1)';
      track.style.transform = `translate3d(${offset}px,0,0)`;
      // clear transition after done
      setTimeout(() => { track.style.transition = ''; }, 450);
    }

    // pointer/touch/wheel interactions that pause
    grid.addEventListener('mouseenter', () => { paused = true; targetSpeed = 0; });
    grid.addEventListener('mouseleave', () => { paused = false; if (!holding) targetSpeed = BASE_SPEED; });
    grid.addEventListener('focusin', () => { paused = true; targetSpeed = 0; });
    grid.addEventListener('focusout', () => { paused = false; if (!holding) targetSpeed = BASE_SPEED; });

    grid.addEventListener('touchstart', () => { paused = true; targetSpeed = 0; }, { passive: true });
    grid.addEventListener('touchend', () => { paused = false; if (!holding) targetSpeed = BASE_SPEED; }, { passive: true });

    grid.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        offset -= Math.sign(e.deltaY) * 60;
        clampOffset();
        track.style.transform = `translate3d(${offset}px,0,0)`;
      }
    }, { passive: true });

    // Prev / Next buttons (click + hold)
    // Prev/Next buttons (click-only, no hold)
if (prevBtn) {
  prevBtn.addEventListener('click', () => stepBy(-1));
}
if (nextBtn) {
  nextBtn.addEventListener('click', () => stepBy(1));
}

    // main RAF loop
    let last = null;
    function raf(now) {
      if (!last) last = now;
      const dt = (now - last) / 1000;
      last = now;

      // smooth interpolation of speed
      currentSpeed += (targetSpeed - currentSpeed) * SMOOTH;

      // move offset leftwards by currentSpeed
      offset -= currentSpeed * dt;

      // wrap by originalWidth (originalWidth measured before clone)
      if (originalWidth > 0) {
        if (offset <= -originalWidth) offset += originalWidth;
        if (offset >= originalWidth) offset -= originalWidth;
      }

      // apply transform (no transition for smooth continuous movement)
      track.style.transform = `translate3d(${offset}px,0,0)`;

      requestAnimationFrame(raf);
    }

    // start
    requestAnimationFrame(raf);

    // on resize, re-measure widths (simple approach: recalc originalWidth)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(async () => {
        await waitForImages(grid);
        // measure only the first (original) set width by summing first N children (originals.length)
        let sum = 0;
        for (let i = 0; i < originals.length; i++) {
          const el = track.children[i];
          if (el) sum += el.getBoundingClientRect().width;
        }
        if (sum > 0) {
          console.log('AutoScroll: resized, new originalWidth', sum);
          // update originalWidth variable (closure capture)
          // NOTE: originalWidth is const earlier — so use measuredOriginal by reassigning via property
          // We'll store measuredOriginal on track for reuse
          track._measuredOriginal = sum;
        }
      }, 180);
    });

    console.log('Auto-scroll (transform) started — base speed', BASE_SPEED, 'px/s');
  })();
});
