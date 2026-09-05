/**
 * Site interactions: nav, reveal, lightbox, magnetic hover, hero particles.
 */
(function () {
  const header = document.getElementById("header");
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  const year = document.getElementById("year");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (year) year.textContent = String(new Date().getFullYear());

  // Header scroll state
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  // Reveal on scroll (staggered within grids)
  const reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el, i) => {
      const parent = el.parentElement;
      const siblings = parent
        ? Array.from(parent.children).filter((c) => c.hasAttribute("data-reveal"))
        : [];
      const idx = siblings.indexOf(el);
      const delay = Math.max(0, idx) * 70 + (i % 3) * 20;
      el.style.transitionDelay = `${Math.min(delay, 420)}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // Magnetic buttons
  if (!reduced) {
    document.querySelectorAll(".btn, .social-link, .back-top").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  // Soft tilt on work cards
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".work").forEach((card) => {
      const hit = card.querySelector(".work__hit");
      if (!hit) return;
      hit.addEventListener("pointermove", (e) => {
        const r = hit.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-4px)`;
      });
      hit.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  // Lightbox
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbCap = document.getElementById("lightbox-caption");
  const lbClose = document.getElementById("lightbox-close");

  function openLightbox(src, title) {
    if (!lb || !lbImg) return;
    lbImg.src = src;
    lbImg.alt = title || "";
    if (lbCap) lbCap.textContent = title || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".work__hit").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLightbox(btn.dataset.src, btn.dataset.title);
    });
  });
  lbClose?.addEventListener("click", closeLightbox);
  lb?.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // Hero ambient canvas (dust / ember motes)
  const heroCanvas = document.getElementById("hero-canvas");
  if (!heroCanvas || reduced) return;

  const ctx = heroCanvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let running = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = heroCanvas.clientWidth;
    h = heroCanvas.clientHeight;
    heroCanvas.width = Math.floor(w * dpr);
    heroCanvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vy: -0.15 - Math.random() * 0.35,
      vx: (Math.random() - 0.5) * 0.2,
      a: 0.15 + Math.random() * 0.35,
      brass: Math.random() > 0.82,
    }));
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.brass
        ? `rgba(201, 166, 107, ${p.a})`
        : `rgba(242, 239, 232, ${p.a * 0.7})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  function startHeroFx() {
    resize();
    spawn();
    running = true;
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    resize();
    spawn();
  });

  if (document.body.classList.contains("is-ready")) startHeroFx();
  else window.addEventListener("ng:ready", startHeroFx, { once: true });
})();
