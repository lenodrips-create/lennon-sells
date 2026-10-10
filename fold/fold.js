/* Foldfolio-style section: a closed foldable phone that unfolds into the portfolio.
   The page calls Fold.update(rise, open, dt) every frame with two 0..1 values:
   rise moves the dark card up over the laptop, open unfolds the device. */
window.Fold = (function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.getElementById("fold");
  const device = root.querySelector(".device");
  const halfB = root.querySelector(".half-b");
  const live = root.querySelector(".live");
  const scroller = live.querySelector(".ff-scroll");
  const hint = root.querySelector(".fold-hint");
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- the folding panes show copies of the display; the live one takes over when open ---------- */
  const clones = [];
  root.querySelectorAll(".pane").forEach(pane => {
    const c = document.createElement("div");
    c.className = "clone ff";
    const copy = scroller.cloneNode(true);
    copy.querySelectorAll("[id]").forEach(n => n.removeAttribute("id"));
    c.appendChild(copy);
    c.setAttribute("aria-hidden", "true");
    c.inert = true;
    pane.appendChild(c);
    clones.push(copy);
    // a soft crease shadow that deepens as the screen folds (its own layer, so only its opacity changes)
    const cr = document.createElement("div");
    cr.className = "crease";
    pane.appendChild(cr);
  });

  /* ---------- size the device to the screen ---------- */
  let portrait = false, dw = 0, dh = 0;
  function size() {
    const vw = innerWidth, vh = innerHeight;
    portrait = vw < 700 || vh > vw * 1.25;
    if (portrait) {
      dw = Math.min(vw * 0.9, 460);
      dh = Math.min(vh * 0.8, dw * 2.05);
    } else {
      dw = Math.min(1180, vw * 0.9, vh * 0.8 * 1.62);
      dh = dw / 1.62;
    }
    const bz = Math.round(Math.max(7, Math.min(12, dw * 0.011)));
    const r = Math.round(Math.max(26, Math.min(40, dw * 0.034)));
    device.classList.toggle("portrait", portrait);
    device.style.setProperty("--dw", dw + "px");
    device.style.setProperty("--dh", dh + "px");
    device.style.setProperty("--bz", bz + "px");
    device.style.setProperty("--r", r + "px");
    device.style.setProperty("--ri", r - bz + "px");
  }
  size();
  addEventListener("resize", () => { size(); lastRise = -1; });  // re-apply transforms for the new size

  /* ---------- cover screen clock ---------- */
  const clock = root.querySelector(".cover-clock"), date = root.querySelector(".cover-date");
  function tick() {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "");
    date.textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- frame finishes ---------- */
  root.querySelectorAll(".finishes button").forEach(b => b.addEventListener("click", () => {
    root.dataset.finish = b.dataset.f;
    root.querySelectorAll(".finishes button").forEach(x => x.setAttribute("aria-pressed", x === b));
  }));

  /* ---------- in-display navigation scrolls the display, not the page ---------- */
  live.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#ff-"]');
    if (!a) return;
    e.preventDefault();
    const t = live.querySelector(a.getAttribute("href"));
    if (t) scroller.scrollTo({ top: t.offsetTop - 70, behavior: reduce ? "auto" : "smooth" });
  });

  /* ---------- reveal content as it scrolls into view inside the display ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { root: scroller, threshold: 0.15 });
  scroller.querySelectorAll(".rv:not(.ff-hero .rv)").forEach(el => io.observe(el));

  /* ---------- per-frame update ---------- */
  let isOn = false, lastRise = -1, lastOpen = -1, hintText = "", wasShut = null;
  const creases = Array.from(root.querySelectorAll(".crease")), hingeEl = root.querySelector(".hinge");
  live.inert = true;
  // the hero is already on screen in the folding copies, so it starts visible rather than fading in at hand-over
  live.querySelectorAll(".ff-hero .rv").forEach(el => el.classList.add("in"));
  function update(rise, open) {
    if (rise === lastRise && open === lastOpen) return;  // nothing moved: skip all style writes
    lastRise = rise; lastOpen = open;
    // the dark card slides up over the laptop; its rounded top ends just above the screen
    root.style.transform = `translate3d(0, ${((1 - rise) * 100).toFixed(3)}%, 0)`;
    if (rise <= 0) return;

    // unfold: the second half swings 180° on the hinge; while closed the device turns slightly to show its depth
    const o = reduce ? (open > 0.5 ? 1 : 0) : smooth(0, 1, open);
    const angle = 180 * (1 - o);
    const lift = 1 - o;
    if (portrait) {
      halfB.style.transform = `rotateX(${angle}deg)`;
      device.style.transform = `translate3d(0, ${(dh / 4) * lift}px, 0) rotateX(${14 * lift}deg) rotateZ(${-2 * lift}deg)`;
    } else {
      halfB.style.transform = `rotateY(${-angle}deg)`;
      device.style.transform = `translate3d(${(dw / 4) * lift}px, 0, 0) rotateY(${-16 * lift}deg) rotateX(${8 * lift}deg)`;
    }
    const isShut = angle > 176;
    if (isShut !== wasShut) { wasShut = isShut; device.classList.toggle("shut", isShut); }
    const cr = (Math.sin(Math.PI * Math.min(1, angle / 180)) * 0.9).toFixed(3);
    creases.forEach(el => { if (el.style.opacity !== cr) el.style.opacity = cr; });
    hingeEl.style.opacity = (1 - 0.6 * o).toFixed(3);
    const text = o > 0.98 ? "Scroll up to fold" : "Scroll to unfold";
    if (text !== hintText) hint.textContent = hintText = text;
    hint.style.opacity = rise > 0.98 && (o < 0.04 || o > 0.98) ? 1 : 0;

    // fully open: hand over to the live, interactive display; folding again copies its scroll position back
    const on = o >= 0.999;
    if (on !== isOn) {
      isOn = on;
      live.classList.toggle("on", on);
      live.inert = !on;
      if (!on) clones.forEach(c => (c.scrollTop = scroller.scrollTop));
    }
  }

  // jump the display to a section: instantly (and in the folding copies too) when closed, smoothly when open
  function jump(sel) {
    const t = live.querySelector(sel);
    if (!t) return;
    const top = Math.max(0, t.offsetTop - 70);
    if (isOn && !reduce) { scroller.scrollTo({ top, behavior: "smooth" }); return; }
    scroller.style.scrollBehavior = "auto";
    scroller.scrollTop = top;
    scroller.style.scrollBehavior = "";
    clones.forEach(c => (c.scrollTop = top));
  }

  return { update, jump };
})();
