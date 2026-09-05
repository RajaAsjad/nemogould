/**
 * Antique cabinet canvases:
 * 1) ambient dust / parchment motes
 * 2) ornate brass corner frames on pieces
 * 3) richer hero dust (extends main if present)
 */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Ambient full-page canvas —— */
  const ambient = document.getElementById("ambient-canvas");
  if (ambient && !reduced) {
    const ctx = ambient.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes = [];
    let gears = [];
    let t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      ambient.width = Math.floor(w * dpr);
      ambient.height = Math.floor(h * dpr);
      ambient.style.width = w + "px";
      ambient.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.min(70, Math.floor((w * h) / 18000)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.22,
        a: 0.08 + Math.random() * 0.22,
        tone: Math.random(),
      }));
      gears = [
        { x: w * 0.08, y: h * 0.78, r: 46, teeth: 12, speed: 0.004, a: 0 },
        { x: w * 0.14, y: h * 0.86, r: 28, teeth: 9, speed: -0.006, a: 0.5 },
        { x: w * 0.92, y: h * 0.18, r: 38, teeth: 11, speed: -0.0035, a: 1 },
      ];
    }

    function drawGear(g, alpha) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.a);
      ctx.beginPath();
      for (let i = 0; i < g.teeth * 2; i++) {
        const ang = (i / (g.teeth * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? g.r : g.r * 0.78;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(184, 149, 90, ${0.12 * alpha})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, g.r * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function frame() {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      // soft parchment vignette wash
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      g.addColorStop(0, "rgba(232, 220, 200, 0.015)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      gears.forEach((gear) => {
        gear.a += gear.speed;
        drawGear(gear, 1);
      });

      motes.forEach((m) => {
        m.x += m.vx + Math.sin((t + m.y) * 0.008) * 0.05;
        m.y += m.vy;
        if (m.y < -8) {
          m.y = h + 8;
          m.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle =
          m.tone > 0.7
            ? `rgba(184, 149, 90, ${m.a})`
            : m.tone > 0.4
              ? `rgba(214, 69, 61, ${m.a * 0.45})`
              : `rgba(232, 220, 200, ${m.a})`;
        ctx.fill();
      });

      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    const start = () => requestAnimationFrame(frame);
    if (document.body.classList.contains("is-ready")) start();
    else window.addEventListener("ng:ready", start, { once: true });
  }

  /* —— Ornate brass corner frames —— */
  function drawOrnateFrame(canvas) {
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const inset = 8;
    const len = Math.min(34, w * 0.12, h * 0.12);
    const color = "rgba(184, 149, 90, 0.85)";
    const soft = "rgba(232, 200, 137, 0.35)";

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.rect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.stroke();

    ctx.strokeStyle = soft;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.rect(inset + 4, inset + 4, w - (inset + 4) * 2, h - (inset + 4) * 2);
    ctx.stroke();

    function corner(x, y, dx, dy) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + dy * len);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * len, y);
      ctx.stroke();
      // fleur tip
      ctx.beginPath();
      ctx.arc(x + dx * 7, y + dy * 7, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(214, 69, 61, 0.75)";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + dx * 3, y + dy * 12);
      ctx.quadraticCurveTo(x + dx * 10, y + dy * 10, x + dx * 12, y + dy * 3);
      ctx.stroke();
    }

    corner(inset, inset, 1, 1);
    corner(w - inset, inset, -1, 1);
    corner(inset, h - inset, 1, -1);
    corner(w - inset, h - inset, -1, -1);
  }

  function refreshFrames() {
    document.querySelectorAll("canvas[data-frame]").forEach(drawOrnateFrame);
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(window.__ngFrameTimer);
    window.__ngFrameTimer = window.setTimeout(refreshFrames, 120);
  });

  if (document.body.classList.contains("is-ready")) {
    requestAnimationFrame(refreshFrames);
  } else {
    window.addEventListener(
      "ng:ready",
      () => requestAnimationFrame(refreshFrames),
      { once: true }
    );
  }

  // redraw when images load (layout shift)
  document.querySelectorAll(".work__hit img, .spotlight__hit img").forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", refreshFrames, { once: true });
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const c = e.target.querySelector("canvas[data-frame]");
          if (c) drawOrnateFrame(c);
        }
      });
    });
    document.querySelectorAll(".ornate-frame").forEach((el) => io.observe(el));
  }
})();
