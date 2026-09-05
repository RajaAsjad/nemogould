/**
 * Premium antique kinetic loader: interlocking gears, brass ring, ember tip, dust.
 */
(function () {
  const root = document.getElementById("loader");
  const canvas = document.getElementById("loader-canvas");
  const pctEl = document.getElementById("loader-pct");
  const hintEl = root ? root.querySelector(".loader__hint") : null;
  if (!root || !canvas) return;

  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let progress = 0;
  let target = 0;
  let start = performance.now();
  let sparks = [];
  let orbit = [];
  let gears = [];
  let trail = [];
  let finishing = false;
  let fade = 1;

  const hints = [
    "Warming the gears",
    "Sorting found parts",
    "Assembling the cabinet",
    "Almost ready",
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeGear(x, y, radius, teeth, speed, phase) {
    return { x, y, radius, teeth, speed, phase, angle: phase };
  }

  function initScene() {
    const cx = w * 0.5;
    const cy = h * 0.4;
    const s = Math.min(1.2, Math.min(w, h) / 720);
    gears = [
      makeGear(cx - 62 * s, cy + 6 * s, 62 * s, 16, 0.016, 0),
      makeGear(cx + 52 * s, cy - 16 * s, 42 * s, 12, -0.022, 0.35),
      makeGear(cx + 14 * s, cy + 62 * s, 28 * s, 10, 0.03, 1.05),
    ];
    sparks = Array.from({ length: 56 }, () => spawnSpark(cx, cy));
    orbit = Array.from({ length: 18 }, (_, i) => ({
      a: (i / 18) * Math.PI * 2,
      r: Math.min(w, h) * (0.18 + Math.random() * 0.06),
      speed: 0.004 + Math.random() * 0.006,
      size: 1 + Math.random() * 1.8,
      glow: Math.random() > 0.7,
    }));
    trail = [];
  }

  function spawnSpark(cx, cy) {
    return {
      x: cx + (Math.random() - 0.5) * 260,
      y: cy + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -0.2 - Math.random() * 0.7,
      life: 0.4 + Math.random() * 0.6,
      size: 0.8 + Math.random() * 2,
      ember: Math.random() > 0.82,
    };
  }

  function drawGear(g, alpha, t) {
    const { x, y, radius, teeth, angle } = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Soft brass glow
    const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.15);
    glow.addColorStop(0, `rgba(184, 149, 90, ${0.12 * alpha})`);
    glow.addColorStop(1, "rgba(184, 149, 90, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Tooth path
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? radius : radius * 0.76;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(212, 176, 106, ${0.72 * alpha})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Inner rings
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(184, 149, 90, ${0.35 * alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232, 200, 137, ${0.7 * alpha})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Spokes
    const spokes = Math.max(4, Math.floor(teeth / 3));
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2 + t * 0.002;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.12, Math.sin(a) * radius * 0.12);
      ctx.lineTo(Math.cos(a) * radius * 0.55, Math.sin(a) * radius * 0.55);
      ctx.strokeStyle = `rgba(184, 149, 90, ${0.28 * alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hub
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212, 176, 106, ${0.9 * alpha})`;
    ctx.fill();
    ctx.restore();
  }

  function drawRing(cx, cy, r, p, alpha) {
    // Tick marks
    for (let i = 0; i < 48; i++) {
      const a = -Math.PI / 2 + (i / 48) * Math.PI * 2;
      const outer = r + (i % 4 === 0 ? 6 : 3.5);
      const lit = i / 48 <= p;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1));
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.strokeStyle = lit
        ? `rgba(184, 149, 90, ${0.45 * alpha})`
        : `rgba(242, 239, 232, ${0.08 * alpha})`;
      ctx.lineWidth = i % 4 === 0 ? 1.4 : 1;
      ctx.stroke();
    }

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(242, 239, 232, ${0.1 * alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Progress arc with glow
    const startA = -Math.PI / 2;
    const endA = startA + Math.PI * 2 * p;
    ctx.save();
    ctx.shadowColor = "rgba(184, 149, 90, 0.55)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, endA);
    ctx.strokeStyle = `rgba(212, 176, 106, ${0.95 * alpha})`;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Ember tip + trail
    const tipX = cx + Math.cos(endA) * r;
    const tipY = cy + Math.sin(endA) * r;
    trail.push({ x: tipX, y: tipY, life: 1 });
    if (trail.length > 18) trail.shift();
    trail.forEach((t, i) => {
      t.life *= 0.92;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 1.2 + i * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214, 69, 61, ${0.25 * t.life * alpha})`;
      ctx.fill();
    });

    const tipGlow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 14);
    tipGlow.addColorStop(0, `rgba(255, 120, 90, ${0.85 * alpha})`);
    tipGlow.addColorStop(0.4, `rgba(214, 69, 61, ${0.35 * alpha})`);
    tipGlow.addColorStop(1, "rgba(214, 69, 61, 0)");
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tipX, tipY, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 210, 180, ${0.95 * alpha})`;
    ctx.fill();
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function frame(now) {
    const elapsed = now - start;
    const auto = easeOutCubic(Math.min(1, elapsed / 2800));
    target = Math.max(target, auto * 0.9);
    progress += (target - progress) * (finishing ? 0.14 : 0.065);

    if (hintEl) {
      const idx = Math.min(hints.length - 1, Math.floor(progress * hints.length));
      if (hintEl.textContent !== hints[idx]) hintEl.textContent = hints[idx];
    }

    if (finishing) {
      fade = Math.max(0, fade - 0.035);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = fade;

    // Warm vignette
    const grd = ctx.createRadialGradient(w / 2, h * 0.38, 20, w / 2, h * 0.42, Math.max(w, h) * 0.62);
    grd.addColorStop(0, "rgba(42, 32, 24, 0.35)");
    grd.addColorStop(0.55, "rgba(20, 15, 12, 0.08)");
    grd.addColorStop(1, "rgba(10, 8, 6, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.4;
    const ringR = Math.min(w, h) * 0.235;
    const speedMul = 0.55 + progress * 1.15;

    gears.forEach((g) => {
      g.angle += g.speed * speedMul;
      drawGear(g, 1, now);
    });

    // Orbiting brass motes
    orbit.forEach((o) => {
      o.a += o.speed * (0.7 + progress);
      const x = cx + Math.cos(o.a) * o.r;
      const y = cy + Math.sin(o.a) * o.r * 0.92;
      ctx.beginPath();
      ctx.arc(x, y, o.size, 0, Math.PI * 2);
      ctx.fillStyle = o.glow
        ? `rgba(214, 69, 61, ${0.35 + progress * 0.25})`
        : `rgba(212, 176, 106, ${0.25 + progress * 0.25})`;
      ctx.fill();
    });

    drawRing(cx, cy, ringR, progress, 1);

    sparks.forEach((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.007;
      if (s.life <= 0) Object.assign(s, spawnSpark(cx, cy));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = s.ember
        ? `rgba(214, 69, 61, ${0.4 * s.life})`
        : `rgba(212, 176, 106, ${0.32 * s.life})`;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    if (pctEl) pctEl.textContent = String(Math.round(progress * 100));

    if (!finishing && progress > 0.992 && target >= 1) {
      finishing = true;
      root.classList.add("is-exiting");
      if (pctEl) pctEl.textContent = "100";
      if (hintEl) hintEl.textContent = "Welcome";
    }

    if (finishing && fade <= 0.02) {
      finish();
      return;
    }

    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    root.classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    window.dispatchEvent(new CustomEvent("ng:ready"));
  }

  function preload() {
    const urls = Array.from(document.images)
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean);
    const unique = [...new Set(urls)].slice(0, 18);
    let done = 0;
    const bump = () => {
      done += 1;
      target = Math.max(target, 0.12 + (done / Math.max(unique.length, 1)) * 0.88);
    };
    if (!unique.length) {
      target = 1;
      return;
    }
    unique.forEach((src) => {
      const im = new Image();
      im.onload = bump;
      im.onerror = bump;
      im.src = src;
    });
  }

  document.body.classList.add("is-loading");
  resize();
  initScene();
  window.addEventListener("resize", () => {
    resize();
    initScene();
  });

  if (reduced) {
    target = 1;
    progress = 1;
    finish();
    return;
  }

  preload();
  setTimeout(() => {
    target = 1;
  }, 3600);

  raf = requestAnimationFrame(frame);
})();
