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

  /* ---------- projects ---------- */
  const PROJECTS = [
    { num: "01", name: "Kepler", kind: "Desktop browser", shots: ["01", "02", "03"],
      text: "A web browser from another orbit, written in C++ on Qt 6 and Chromium: a built-in tracker blocker, private Orbit windows, session restore and an animated new-tab page.",
      tags: ["C++17", "Qt 6", "Qt WebEngine", "CMake"], href: "https://github.com/lenodrips-create/kepler", cta: "View on GitHub" },
    { num: "02", name: "keplerbrowser.org", kind: "Website + Rust server", shots: ["04", "05", "06"],
      text: "The download and docs site for Kepler, served by a zero-dependency Rust release server with a JSON releases API.",
      tags: ["Rust", "HTML", "CSS", "JavaScript"], href: "https://keplerbrowser.org", cta: "Visit keplerbrowser.org" },
    { num: "03", name: "CTerm Studio", kind: "Browser code studio", shots: ["11", "12", "13"],
      text: "An editor, live preview, file explorer and two shells in one page, all running on a C core compiled to WebAssembly.",
      tags: ["C", "WebAssembly", "React 19", "Vite"], href: "https://github.com/lenodrips-create/cterm-studio", cta: "View on GitHub" },
    { num: "04", name: "FORGIVN", kind: "Storefront", shots: ["14", "16", "20"],
      text: "A clothing storefront in one dependency-free file: dove intro, filterable products, a saved cart, a contact form and scroll animations.",
      tags: ["HTML", "CSS", "JavaScript"], href: "https://github.com/lenodrips-create/zay-website", cta: "View on GitHub" },
    { num: "05", name: "This portfolio", kind: "Interactive site", shots: ["21"],
      text: "A HyperFrames showreel, a laptop with a living picture strip and this foldable phone, built in plain HTML, CSS and JavaScript.",
      tags: ["HyperFrames", "GSAP", "CSS 3D", "JavaScript"], href: "https://github.com/lenodrips-create/lennon-sells", cta: "View on GitHub" },
  ];
  const grid = live.querySelector("#ff-grid");
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  grid.innerHTML = PROJECTS.map((p, i) => `
    <button class="ff-card rv" style="--i:${i % 2}" data-i="${i}" aria-haspopup="dialog">
      <span class="ff-media"><img src="fold/work/${p.shots[0]}.jpg" alt="" loading="lazy"></span>
      <span class="ff-body">
        <span class="ff-num">${p.num}</span>
        <span class="ff-name">${esc(p.name)}</span>
        <span class="ff-arrow" aria-hidden="true">↗</span>
        <span class="ff-kind">${esc(p.kind)}</span>
        <span class="ff-tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join("")}</span>
      </span>
    </button>`).join("");

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

  /* ---------- project detail sheet ---------- */
  const detail = live.querySelector(".ff-detail"), sheet = detail.querySelector(".ff-sheet");
  let opener = null;
  function openDetail(i, from) {
    const p = PROJECTS[i];
    detail.querySelector(".ff-d-kicker").textContent = `${p.num} — ${p.kind}`;
    detail.querySelector(".ff-d-title").textContent = p.name;
    detail.querySelector(".ff-d-text").textContent = p.text;
    detail.querySelector(".ff-d-tags").innerHTML = p.tags.map(t => `<span>${esc(t)}</span>`).join("");
    detail.querySelector(".ff-gallery").innerHTML = p.shots.map(s => `<img src="fold/work/${s}.jpg" alt="${esc(p.name)} screenshot">`).join("");
    const link = detail.querySelector(".ff-d-link");
    link.href = p.href;
    link.querySelector("span").textContent = p.cta;
    sheet.scrollTop = 0;
    opener = from;
    detail.classList.add("open");
    detail.removeAttribute("inert");
    detail.querySelector(".ff-close").focus({ preventScroll: true });
  }
  function closeDetail() {
    if (!detail.classList.contains("open")) return;
    detail.classList.remove("open");
    detail.inert = true;
    if (opener && live.classList.contains("on")) opener.focus({ preventScroll: true });
  }
  detail.inert = true;
  grid.addEventListener("click", e => { const c = e.target.closest(".ff-card"); if (c) openDetail(+c.dataset.i, c); });
  detail.querySelector(".ff-close").addEventListener("click", closeDetail);
  detail.addEventListener("click", e => { if (e.target === detail) closeDetail(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

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
      if (!on) {
        closeDetail();
        clones.forEach(c => (c.scrollTop = scroller.scrollTop));
      }
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
