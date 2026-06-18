/* =====================================================
   DARREN SUTTER — Portfolio  ·  script.js
   ===================================================== */

// ---- Smooth Scroll (Lenis) ----
const lenis = new Lenis({
  lerp: 0.1,
  wheelMultiplier: 1,
  smoothWheel: true,
  smoothTouch: false,
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ---- GSAP / ScrollTrigger an Lenis koppeln ----
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  lenis.on("scroll", ScrollTrigger.update);

  // Beispiel: Sektionen sanft einblenden (kann später angepasst werden)
  gsap.utils.toArray(".section, .hero-title").forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // Programm-Balken füllen sich beim Scrollen
  gsap.utils.toArray(".skill-bar > span").forEach((el) => {
    const w = el.style.width || (el.dataset.pct || 0) + "%";
    gsap.fromTo(
      el,
      { width: 0 },
      {
        width: w,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%" },
      }
    );
  });
}

// ---- Justified Galerie: jede Reihe füllt die Breite (keine übrigen Plätze) ----
function arOf(fig) {
  let a = parseFloat(fig.dataset.ar);
  if (!a || isNaN(a)) {
    const im = fig.querySelector("img");
    a = im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 0.7;
  }
  return a;
}
function layoutGalleries() {
  document.querySelectorAll(".gallery").forEach((g) => {
    const figs = Array.from(g.querySelectorAll("figure"));
    if (!figs.length) return;
    const gap = parseFloat(getComputedStyle(g).gap) || 16;
    const cw = g.clientWidth;
    if (!cw) return;
    const vw = window.innerWidth;
    let target = vw < 700 ? 300 : vw < 1100 ? 400 : 480;
    if (g.dataset.target && vw >= 1100) target = +g.dataset.target;
    figs.forEach((f) => (f._ar = arOf(f)));
    const rows = [];
    let row = [], sum = 0;
    figs.forEach((f) => {
      row.push(f);
      sum += f._ar;
      if (sum * target + gap * (row.length - 1) >= cw) {
        rows.push(row);
        row = [];
        sum = 0;
      }
    });
    if (row.length) rows.push(row);

    // zu kurze Schlussreihe in die vorherige zusammenführen, damit rechts nichts übrig bleibt
    if (rows.length > 1) {
      const last = rows[rows.length - 1];
      const sLast = last.reduce((a, f) => a + f._ar, 0);
      const fillH = (cw - gap * (last.length - 1)) / sLast;
      if (fillH > target * 1.4) {
        rows[rows.length - 2] = rows[rows.length - 2].concat(last);
        rows.pop();
      }
    }

    rows.forEach((r) => {
      const s = r.reduce((acc, f) => acc + f._ar, 0);
      let h = (cw - gap * (r.length - 1)) / s;
      let fill = true;
      if (rows.length === 1 && h > target * 1.6) { h = target * 1.6; fill = false; }
      h = Math.round(h);
      let used = gap * (r.length - 1);
      r.forEach((f, i) => {
        let w;
        if (fill && i === r.length - 1) {
          w = cw - used; // letztes Bild füllt den Rest exakt
        } else {
          w = Math.floor(f._ar * h);
          used += w;
        }
        f.style.width = w + "px";
        f.style.height = h + "px";
      });
    });
  });
}
window.addEventListener("DOMContentLoaded", layoutGalleries);
window.addEventListener("load", layoutGalleries);
let _galleryRT;
window.addEventListener("resize", () => {
  clearTimeout(_galleryRT);
  _galleryRT = setTimeout(layoutGalleries, 150);
});

// ---- Lightbox: Galeriebilder anklicken, mit Pfeiltasten blättern ----
(function () {
  const imgs = Array.from(document.querySelectorAll(".gallery img"));
  if (!imgs.length) return;

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML =
    '<button class="lb-close" type="button" aria-label="Schliessen">×</button>' +
    '<button class="lb-prev" type="button" aria-label="Zurück">‹</button>' +
    '<img alt="" />' +
    '<button class="lb-next" type="button" aria-label="Weiter">›</button>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector("img");
  let idx = 0;

  const show = (i) => { idx = (i + imgs.length) % imgs.length; lbImg.src = imgs[idx].src; };
  const open = (i) => {
    show(i);
    lb.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    if (typeof lenis !== "undefined" && lenis) lenis.stop();
  };
  const close = () => {
    lb.classList.remove("open");
    document.documentElement.style.overflow = "";
    if (typeof lenis !== "undefined" && lenis) lenis.start();
  };

  imgs.forEach((im, i) => {
    im.style.cursor = "zoom-in";
    im.addEventListener("click", () => open(i));
  });
  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); show(idx - 1); });
  lb.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
})();

// ---- Mobile Burger-Menü ----
(function () {
  const header = document.querySelector(".site-header");
  const nav = header && header.querySelector(".nav");
  if (!header || !nav) return;

  const burger = document.createElement("button");
  burger.className = "burger";
  burger.type = "button";
  burger.setAttribute("aria-label", "Menü");
  burger.innerHTML = "<span></span><span></span><span></span>";
  header.appendChild(burger);

  const menu = document.createElement("div");
  menu.className = "mobile-menu";
  const inner = document.createElement("nav");
  inner.className = "mobile-nav";
  nav.querySelectorAll("a").forEach((a) => {
    const link = document.createElement("a");
    link.href = a.getAttribute("href");
    link.textContent = a.textContent;
    inner.appendChild(link);
  });
  menu.appendChild(inner);
  document.body.appendChild(menu);

  const setOpen = (open) => {
    burger.classList.toggle("is-open", open);
    menu.classList.toggle("open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (typeof lenis !== "undefined" && lenis) (open ? lenis.stop() : lenis.start());
  };
  burger.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  inner.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();

// ---- YouTube erst bei Klick laden (Performance) ----
(function () {
  document.querySelectorAll(".video-embed iframe, .dual-video iframe").forEach((frame) => {
    const src = frame.getAttribute("src");
    const m = src && src.match(/embed\/([\w-]+)/);
    if (!m) return;
    const id = m[1];
    const wrap = frame.parentElement;
    const facade = document.createElement("button");
    facade.type = "button";
    facade.className = "video-facade";
    facade.setAttribute("aria-label", "Video abspielen");
    facade.style.backgroundImage = "url(https://img.youtube.com/vi/" + id + "/maxresdefault.jpg)";
    facade.innerHTML = '<span class="vf-play" aria-hidden="true"></span>';
    facade.addEventListener("click", () => {
      const ifr = document.createElement("iframe");
      ifr.src = src + (src.includes("?") ? "&" : "?") + "autoplay=1";
      ifr.title = frame.title || "Video";
      if (frame.allow) ifr.allow = frame.allow;
      ifr.allowFullscreen = true;
      wrap.replaceChild(ifr, facade);
    });
    wrap.replaceChild(facade, frame);
  });
})();
