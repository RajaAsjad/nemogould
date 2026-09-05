/**
 * Advanced kinetic canvas loader — gears, sparks, brass ring progress.
 */
(function () {
  const root = document.getElementById("loader");
  const canvas = document.getElementById("loader-canvas");
  const pctEl = document.getElementById("loader-pct");
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
  let gears = [];

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
    const cy = h * 0.42;
    const s = Math.min(1.15, Math.min(w, h) / 700);
    gears = [
      makeGear(cx - 58 * s, cy + 8 * s, 56 * s, 14, 0.018, 0),
      makeGear(cx + 48 * s, cy - 18 * s, 38 * s, 10, -0.026, 0.4),
      makeGear(cx + 12 * s, cy + 58 * s, 26 * s, 8, 0.034, 1.1),
    ];
    sparks = Array.from({ length: 48 }, () => ({
      x: cx + (Math.random() - 0.5) * 220,
      y: cy + (Math.random() - 0.5) * 180,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      life: Math.random(),
      size: 1 + Math.random() * 2.2,
    }));
  }

  function drawGear(g, alpha) {
    const { x, y, radius, teeth, angle } = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? radius : radius * 0.78;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(201, 166, 107, ${0.55 * alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(224, 192, 138, ${0.7 * alpha})`;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201, 166, 107, ${0.85 * alpha})`;
    ctx.fill();
    ctx.restore();
  }

  function drawRing(cx, cy, r, p, alpha) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(242, 239, 232, ${0.08 * alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.strokeStyle = `rgba(201, 166, 107, ${0.95 * alpha})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    // Ember tick
    const a = -Math.PI / 2 + Math.PI * 2 * p;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(214, 69, 61, ${0.9 * alpha})`;
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    const elapsed = now - start;
    // Simulated asset assembly curve
    const auto = Math.min(1, elapsed / 2400);
    target = Math.max(target, auto * 0.92);
    progress += (target - progress) * 0.08;

    ctx.clearRect(0, 0, w, h);

    // Soft vignette dust
    const grd = ctx.createRadialGradient(w / 2, h * 0.4, 40, w / 2, h * 0.4, Math.max(w, h) * 0.55);
    grd.addColorStop(0, "rgba(28, 26, 22, 0.15)");
    grd.addColorStop(1, "rgba(10, 10, 9, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const alpha = 1;
    gears.forEach((g) => {
      g.angle += g.speed * (0.6 + progress);
      drawGear(g, alpha);
    });

    const cx = w * 0.5;
    const cy = h * 0.42;
    drawRing(cx, cy, Math.min(w, h) * 0.22, progress, alpha);

    sparks.forEach((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.008;
      if (s.life <= 0) {
        s.x = cx + (Math.random() - 0.5) * 200;
        s.y = cy + (Math.random() - 0.5) * 160;
        s.life = 1;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 166, 107, ${0.35 * s.life})`;
      ctx.fill();
    });

    if (pctEl) pctEl.textContent = String(Math.round(progress * 100));

    if (progress > 0.995 && target >= 1) {
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    if (pctEl) pctEl.textContent = "100";
    root.classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    window.dispatchEvent(new CustomEvent("ng:ready"));
  }

  function preload() {
    const urls = Array.from(document.images)
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean);
    const unique = [...new Set(urls)].slice(0, 16);
    let done = 0;
    const bump = () => {
      done += 1;
      target = Math.max(target, 0.15 + (done / Math.max(unique.length, 1)) * 0.85);
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
  // Safety unlock
  setTimeout(() => {
    target = 1;
  }, 3200);

  raf = requestAnimationFrame(frame);
})();
