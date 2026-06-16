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
    const target = vw < 700 ? 300 : vw < 1100 ? 400 : 480;
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
