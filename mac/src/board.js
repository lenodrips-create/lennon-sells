// The boards in the house, written out line by line, left to right, when the camera arrives in front of them: the
// whiteboard in the office, with the services hand-written in marker and a few doodles; the monitor on the office
// desk, which types out an about page; and the chalk menu in the kitchen, with what Lennon does and what it costs.
//
// It's three textures over the plain board: the ink (colour and coverage), which line each inked pixel belongs to,
// and when each line is written and where it starts and ends. The board's shader shows a line's ink up to where the
// pen has got to, so the writing animates without redrawing anything; the page only moves one number.
import * as THREE from "three";

const INK = { black: "#121316", blue: "#173ea8", red: "#b81f1f", green: "#16693a" };
const CHALK = { white: "#f3f2ec", yellow: "#f4d774", pink: "#f3a6b8", blue: "#a9d2f3" };
// texture pixels per centimetre of board: 8, or 12 for the monitor's small type. (Set by makeBoard at the start of
// each piece of drawing it does, which all runs straight through, so boards being made side by side don't clash.)
let K = 8;
const MAX = 64;                                // most lines the board can hold
const FONTS = [["Permanent Marker", "fonts/permanent-marker-latin-400-normal.woff2", "400"],
               ["Caveat", "fonts/caveat-latin-700-normal.woff2", "700"],
               ["League Spartan", "reel/fonts/league-spartan-latin-900-normal.woff2", "900"],
               ["Readex Pro", "fonts/readex-pro-latin-400-normal.woff2", "400"]];
const FAMILY = { 400: ["400", '"Permanent Marker"'], 700: ["700", '"Caveat"'], 900: ["900", '"League Spartan"'],
                 rx: ["400", '"Readex Pro"'], mono: ["600", 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'] };
const fontOf = (font, px) => `${FAMILY[font][0]} ${px}px ${FAMILY[font][1]}`;
export const WRITE_SECONDS = 4.2;              // how long the writing takes

const SERVICES = [
  { name: "Websites", lines: ["custom built for you", "design + animation", "fast, clean code"], doodle: "browser" },
  { name: "Bug Fixes", lines: ["broken, slow or weird?", "I track down the cause", "and fix it for good"], doodle: "bug" },
  { name: "Electronics", lines: ["circuits + sensors", "microcontrollers", "prototypes that work"], doodle: "chip" },
];

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// the writing surface's size in centimetres: wide on a landscape screen, upright on a phone held upright so the
// writing is big enough to read there
export const boardSize = portrait => (portrait ? { w: 150, h: 196 } : { w: 240, h: 120 });
// the kitchen's menu board: upright, the same everywhere
export const MENU_SIZE = { w: 84, h: 118 };
// the office monitor's picture: wide, or turned upright on a phone held upright (as coders often have them)
export const screenSize = portrait => (portrait ? { w: 40, h: 71 } : { w: 71, h: 40 });

// kind: "services" (the office's whiteboard), "about" (the office monitor) or "menu" (the kitchen's chalkboard)
export function makeBoard(kind, portrait) {
  const menu = kind === "menu", about = kind === "about", k = about ? 12 : 8;
  K = k;
  const { w: W, h: H } = menu ? MENU_SIZE : about ? screenSize(portrait) : boardSize(portrait), cw = Math.round(W * K), ch = Math.round(H * K);
  const base = new THREE.CanvasTexture(menu ? slateBoard(cw, ch) : about ? editorScreen(cw, ch) : blankBoard(cw, ch));
  base.colorSpace = THREE.SRGBColorSpace; base.anisotropy = 8;
  const inkCanvas = document.createElement("canvas"); inkCanvas.width = cw; inkCanvas.height = ch;
  const ink = new THREE.CanvasTexture(inkCanvas);
  ink.colorSpace = THREE.SRGBColorSpace; ink.anisotropy = 8;
  const idx = new THREE.DataTexture(new Uint8Array(cw * ch * 4), cw, ch, THREE.RGBAFormat);
  idx.magFilter = idx.minFilter = THREE.NearestFilter; idx.generateMipmaps = false; idx.needsUpdate = true;
  const segData = new Float32Array(MAX * 4).fill(9);
  const seg = new THREE.DataTexture(segData, MAX, 1, THREE.RGBAFormat, THREE.FloatType);
  seg.magFilter = seg.minFilter = THREE.NearestFilter; seg.needsUpdate = true;
  const reveal = { value: 0 };

  // the board's own shader: the ink goes on over the plain board, each line only as far as the pen has got
  const writeOn = mat => {
    const before = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      if (before) before(sh, r);
      Object.assign(sh.uniforms, { uInk: { value: ink }, uIdx: { value: idx }, uSeg: { value: seg }, uReveal: reveal });
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uInk, uIdx, uSeg;\nuniform float uReveal;")
        .replace("#include <map_fragment>", `#include <map_fragment>
          {
            vec4 ink = texture2D(uInk, vMapUv);
            float id = floor(texture2D(uIdx, vMapUv).r * 255.0 + 0.5), show = 1.0;
            if (id > 0.5) {
              vec4 sg = texture2D(uSeg, vec2((id - 0.5) / ${MAX.toFixed(1)}, 0.5));
              float pr = clamp((uReveal - sg.x) / max(sg.y - sg.x, 1e-4), 0.0, 1.0);
              float pen = mix(sg.z, sg.w, pr);
              show = pr <= 0.0 ? 0.0 : pr >= 1.0 ? 1.0 : 1.0 - smoothstep(pen - 0.003, pen + 0.003, vMapUv.x);
            }
            diffuseColor.rgb = mix(diffuseColor.rgb, ink.rgb, ink.a * show);
          }`);
    };
    const key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : "";
    mat.customProgramCacheKey = () => key + "-board";
    return mat;
  };

  // once the handwriting fonts are in, write it all out (hidden until the reveal) and say when each line is written
  const ready = Promise.all(FONTS.map(([family, file, weight]) => {
    const f = new FontFace(family, `url(${new URL(file, document.baseURI).href})`, { weight });
    document.fonts.add(f);
    return f.load();
  })).then(() => {
    K = k;
    const els = (menu ? menuLayout : about ? aboutLayout : layout)(portrait, W, H, inkCanvas.getContext("2d"));
    const idxCanvas = document.createElement("canvas"); idxCanvas.width = cw; idxCanvas.height = ch;
    paint(els, inkCanvas.getContext("2d"), idxCanvas.getContext("2d"), menu);
    // marker ink isn't perfectly even; chalk is grainy, catching on the board's tooth
    const ix = inkCanvas.getContext("2d"), img = ix.getImageData(0, 0, cw, ch), d = img.data, r = rng(99);
    if (!about) for (let i = 3; i < d.length; i += 4) if (d[i]) d[i] = Math.round(d[i] * (menu ? 0.5 + 0.5 * Math.pow(r(), 0.6) : 0.93 + 0.07 * r()));
    ix.putImageData(img, 0, 0);
    ink.needsUpdate = true;
    // which line each pixel belongs to, flipped to the texture's bottom-up rows
    const src = idxCanvas.getContext("2d").getImageData(0, 0, cw, ch).data, dst = idx.image.data;
    for (let y = 0; y < ch; y++) {
      const sy = (ch - 1 - y) * cw * 4, dy = y * cw * 4;
      for (let x = 0; x < cw * 4; x += 4) { dst[dy + x] = src[sy + x + 3] > 8 ? src[sy + x] : 0; dst[dy + x + 3] = 255; }
    }
    idx.needsUpdate = true;
    // timing: each line takes time in proportion to its length, with a short pause between
    const cost = els.map(e => (e.text ? 0.12 + e.text.length * (about ? 0.022 : 0.05) : 0.35) + 0.08), total = cost.reduce((a, b) => a + b, 0);
    let t = 0;
    els.forEach((e, i) => {
      const t0 = t / total, t1 = (t + cost[i] - 0.08) / total;
      t += cost[i];
      segData.set([t0, t1, e.x0 / W, e.x1 / W], i * 4);
    });
    seg.needsUpdate = true;
  }).catch(() => {});

  return { base, writeOn, reveal, ready, size: { w: W, h: H } };
}

// a white board, not quite new: faint grey ghosts of things written and wiped before
function blankBoard(cw, ch) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const x = c.getContext("2d"), r = rng(1234);
  const g = x.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, "#f7f8f6"); g.addColorStop(1, "#eeefed");
  x.fillStyle = g; x.fillRect(0, 0, cw, ch);
  x.lineCap = "round"; x.lineJoin = "round";
  for (let i = 0; i < 26; i++) {
    x.strokeStyle = `rgba(120,128,135,${0.025 + r() * 0.035})`;
    x.lineWidth = 6 + r() * 10;
    let px = r() * cw, py = r() * ch;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 14; k++) { px += (r() - 0.3) * 60; py += (r() - 0.5) * 40; x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 8; i++) {   // wiped patches
    const px = r() * cw, py = r() * ch, rad = 80 + r() * 200, gr = x.createRadialGradient(px, py, 0, px, py, rad);
    gr.addColorStop(0, "rgba(150,155,160,0.05)"); gr.addColorStop(1, "rgba(150,155,160,0)");
    x.fillStyle = gr; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  return c;
}

/* ---------- the layout, in centimetres from the board's top left ---------- */
// Each element is one thing the pen writes: text (with a font, size and colour) or a drawing (a function that strokes
// paths). x0..x1 is its horizontal extent, which the pen crosses as it's written.
function layout(portrait, W, H, ctx) {
  const els = [], r = rng(portrait ? 7 : 3);
  const measure = (font, size, text) => { ctx.font = fontOf(font, size * K); return ctx.measureText(text).width / K; };
  const PM = "400", CV = "700";
  const text = (t, x, y, size, color, font = CV, rot = (r() - 0.5) * 0.03, maxW = 1e9) => {
    let w = measure(font, size, t);
    if (w > maxW) { size *= maxW / w; w = maxW; }   // too long for its column: written a little smaller
    els.push({ text: t, x, y, size, color, font, rot, x0: x, x1: x + w });
    return w;
  };
  const draw = (x0, x1, color, width, fn) => els.push({ x0, x1, color, width, fn });

  const titleW = text("My Services", portrait ? 10 : 12, portrait ? 21 : 20, 13, INK.blue, PM, -0.02);
  const tx = portrait ? 10 : 12;
  draw(tx - 1, tx + titleW + 3, INK.red, 0.9, p => wave(p, tx - 1, tx + titleW + 3, portrait ? 25.5 : 24.5, 0.7, 9));
  if (portrait) text("what I can do for you", 11, 35, 8.5, INK.red, CV, -0.01);
  else text("what I can do for you!", tx + titleW + 10, 18.5, 8.5, INK.red, CV, -0.03);

  SERVICES.forEach((s, i) => {
    const cx = portrait ? 8 : 10 + i * 78, y0 = portrait ? 52 + i * 41 : 39;
    // the number in a circle, then the service's name
    draw(cx, cx + 10, INK.red, 0.7, p => ring(p, cx + 5, y0 - 3.2, 5));
    text(String(i + 1), cx + 2.7, y0 + 0.2, 6.5, INK.black, PM, 0);
    text(s.name, cx + 13, y0, 8.5, INK.black, PM);
    const lx = cx + (portrait ? 13 : 3), size = portrait ? 8.2 : 8.4, gap = portrait ? 8.6 : 9.6;
    s.lines.forEach((t, k) => {
      const y = y0 + (portrait ? 9.5 : 13.5) + k * gap;
      draw(lx, lx + 2.4, INK.black, 0.55, p => line(p, lx, y - 2.2, lx + 2.4, y - 2.4));
      text(t, lx + 4, y, size, INK.black, CV, (r() - 0.5) * 0.03, portrait ? 98 - lx - 4 : 72);
    });
    // a doodle: beside the lines on an upright board, under them on a wide one
    const dx = portrait ? 103 : cx + 14, dy = portrait ? y0 - 6 : 79;
    doodle(s.doodle, dx, dy, draw);
  });

  // how to get in touch, boxed in red
  const cy = portrait ? 178 : 110, cx = portrait ? 12 : 30;
  const a = text("Start a project", cx, cy, 7, INK.red, PM, -0.01);
  draw(cx + a + 2, cx + a + 12, INK.red, 0.7, p => arrow(p, cx + a + 2, cy - 2.6, cx + a + 12, cy - 2.8));
  const e = portrait ? text("lenodrips@gmail.com", cx, cy + 11, 9.5, INK.blue, CV, 0) : text("lenodrips@gmail.com", cx + a + 15, cy, 10, INK.blue, CV, -0.01);
  const bx1 = portrait ? cx + Math.max(a + 14, e) + 4 : cx + a + 15 + e + 4, by0 = cy - 9, by1 = portrait ? cy + 15.5 : cy + 4.5;
  draw(cx - 4, bx1, INK.red, 0.6, p => box(p, cx - 4, by0, bx1, by1));
  return els;
}

/* ---------- pen strokes: a little unsteady, like a hand ---------- */
function wave(p, x0, x1, y, amp, n) {
  for (let i = 0; i <= 60; i++) { const t = i / 60, x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI * n) * amp + t * 0.6; i ? p.lineTo(x, yy) : p.moveTo(x, yy); }
}
function line(p, x0, y0, x1, y1) { p.moveTo(x0, y0); p.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 0.25, x1, y1); }
function ring(p, cx, cy, rad) {
  for (let i = 0; i <= 50; i++) { const a = -2.2 + (i / 50) * Math.PI * 2.15, rr = rad * (1 + 0.06 * Math.sin(i * 0.4)); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92; i ? p.lineTo(x, y) : p.moveTo(x, y); }
}
function arrow(p, x0, y0, x1, y1) { line(p, x0, y0, x1, y1); p.moveTo(x1 - 2.6, y1 - 2); p.lineTo(x1, y1); p.lineTo(x1 - 2.4, y1 + 2.2); }
function box(p, x0, y0, x1, y1) {
  p.moveTo(x0 + 1, y0); p.quadraticCurveTo((x0 + x1) / 2, y0 - 0.6, x1, y0 + 0.4); p.quadraticCurveTo(x1 + 0.6, (y0 + y1) / 2, x1 - 0.4, y1);
  p.quadraticCurveTo((x0 + x1) / 2, y1 + 0.7, x0, y1 - 0.3); p.quadraticCurveTo(x0 - 0.5, (y0 + y1) / 2, x0 + 1.4, y0 - 0.6);
}
function doodle(kind, x, y, draw) {
  if (kind === "browser") {          // a browser window with code in it
    draw(x, x + 32, INK.blue, 0.6, p => { box(p, x, y, x + 32, y + 20); p.moveTo(x, y + 4.5); p.lineTo(x + 32, y + 4.2); });
    draw(x + 2, x + 9, INK.red, 0.5, p => { for (const k of [0, 1, 2]) { p.moveTo(x + 3 + k * 2.6 + 0.6, y + 2.3); p.arc(x + 3 + k * 2.6, y + 2.3, 0.6, 0, Math.PI * 2); } });
    draw(x + 8, x + 25, INK.blue, 0.7, p => { p.moveTo(x + 12, y + 9); p.lineTo(x + 8.5, y + 12.5); p.lineTo(x + 12, y + 16); p.moveTo(x + 18, y + 8.5); p.lineTo(x + 15, y + 16.5); p.moveTo(x + 21, y + 9); p.lineTo(x + 24.5, y + 12.5); p.lineTo(x + 21, y + 16); });
  } else if (kind === "bug") {       // a bug, and a big red tick: fixed
    draw(x, x + 22, INK.black, 0.6, p => {
      p.moveTo(x + 21, y + 10); p.ellipse(x + 14, y + 10, 7, 5, 0, 0, Math.PI * 2);
      p.moveTo(x + 7.5, y + 10); p.arc(x + 5, y + 10, 2.6, 0, Math.PI * 2);
      for (const k of [-1, 0, 1]) { p.moveTo(x + 14 + k * 4, y + 5.4); p.lineTo(x + 13 + k * 5, y + 1.5); p.moveTo(x + 14 + k * 4, y + 14.6); p.lineTo(x + 13 + k * 5, y + 18.5); }
      p.moveTo(x + 3.5, y + 8); p.lineTo(x + 0.5, y + 4.5); p.moveTo(x + 4, y + 7.6); p.lineTo(x + 2.5, y + 3.6);
      p.moveTo(x + 14, y + 5.2); p.lineTo(x + 14, y + 14.8);
    });
    draw(x + 25, x + 38, INK.green, 0.9, p => { p.moveTo(x + 25, y + 11); p.lineTo(x + 29.5, y + 16); p.lineTo(x + 38, y + 3); });
  } else {                           // a microcontroller, wired to a lit LED
    draw(x, x + 22, INK.black, 0.6, p => {
      box(p, x + 3, y + 2, x + 19, y + 18);
      for (let k = 0; k < 4; k++) { const t = y + 4.5 + k * 3.7; p.moveTo(x + 3, t); p.lineTo(x, t); p.moveTo(x + 19, t); p.lineTo(x + 22, t); }
    });
    draw(x + 22, x + 34, INK.blue, 0.55, p => { p.moveTo(x + 22, y + 8.2); p.bezierCurveTo(x + 26, y + 2, x + 28, y + 14, x + 32.5, y + 9); });
    draw(x + 31, x + 42, INK.red, 0.6, p => {
      p.moveTo(x + 39.6, y + 9); p.arc(x + 36.5, y + 9, 3.1, 0, Math.PI * 2);
      for (const a of [-1.2, -0.4, 0.4, 1.2]) { p.moveTo(x + 36.5 + Math.cos(a) * 4.8, y + 9 + Math.sin(a) * 4.8); p.lineTo(x + 36.5 + Math.cos(a) * 7, y + 9 + Math.sin(a) * 7); }
    });
  }
}

// a chalkboard that's been used and wiped: dark green-black, a fine tooth, and faint swirls of old chalk
function slateBoard(cw, ch) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const x = c.getContext("2d"), r = rng(4242);
  x.fillStyle = "#1c2420"; x.fillRect(0, 0, cw, ch);
  const img = x.getImageData(0, 0, cw, ch), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 12; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
  x.putImageData(img, 0, 0);
  x.lineCap = "round";
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = `rgba(230,236,232,${0.015 + r() * 0.03})`;
    x.lineWidth = 20 + r() * 50;
    const cx = r() * cw, cy = r() * ch, rad = 30 + r() * 120, a0 = r() * 6.3;
    x.beginPath(); x.arc(cx, cy, rad, a0, a0 + 0.8 + r() * 2); x.stroke();
  }
  return c;
}

/* ---------- the kitchen's menu: what Lennon does, and the prices, like a café's specials board ---------- */
function menuLayout(portrait, W, H, ctx) {
  const els = [], r = rng(11);
  const measure = (font, size, text) => { ctx.font = fontOf(font, size * K); return ctx.measureText(text).width / K; };
  const LS = "900", CV = "700";
  const put = (t, x, y, size, color, font, rot = (r() - 0.5) * 0.02) => {
    const w = measure(font, size, t);
    els.push({ text: t, x, y, size, color, font, rot, x0: x, x1: x + w });
    return w;
  };
  const centre = (t, y, size, color, font) => put(t, (W - measure(font, size, t)) / 2, y, size, color, font);
  const draw = (x0, x1, color, width, fn) => els.push({ x0, x1, color, width, fn });

  const tw = measure(LS, 9, "DEVELOPER");
  centre("DEVELOPER", 14, 9, CHALK.white, LS);
  draw((W - tw) / 2 - 2, (W + tw) / 2 + 2, CHALK.yellow, 0.5, p => wave(p, (W - tw) / 2 - 2, (W + tw) / 2 + 2, 17.6, 0.45, 7));
  centre("~ what I do ~", 25.5, 6, CHALK.yellow, CV);
  centre("I design & build websites,", 33, 5.6, CHALK.white, CV);
  centre("fix bugs, and make", 39.5, 5.6, CHALK.white, CV);
  centre("electronics that work.", 46, 5.6, CHALK.white, CV);
  draw(14, W - 14, CHALK.white, 0.35, p => dashes(p, 14, W - 14, 51.5));

  const tiers = [["STARTER", "$200", "a clean one-page site"], ["MAIN COURSE", "$400", "a custom multi-page site"],
                 ["CHEF'S SPECIAL", "$600", "custom + animation & 3D"]];
  tiers.forEach(([name, price, what], i) => {
    const y = 61 + i * 13;
    const nw = put(name, 7, y, 4.6, CHALK.white, LS, 0);
    const pw = measure(CV, 7.2, price);
    draw(7 + nw + 1.5, W - 7 - pw - 1.5, CHALK.white, 0.42, p => dots(p, 7 + nw + 1.5, W - 7 - pw - 1.5, y - 0.4));
    put(price, W - 7 - pw, y + 0.3, 7.2, CHALK.yellow, CV, -0.03);
    put(what, 8.5, y + 6, 4.9, CHALK.pink, CV);
  });
  draw(14, W - 14, CHALK.white, 0.35, p => dashes(p, 14, W - 14, 99));
  centre("every project $200 - $600", 106.5, 5.8, CHALK.blue, CV);
  centre("lenodrips@gmail.com", 113.5, 5.6, CHALK.white, CV);
  return els;
}
function dashes(p, x0, x1, y) { for (let x = x0; x < x1 - 1; x += 3.4) { p.moveTo(x, y + Math.sin(x) * 0.15); p.lineTo(x + 1.9, y + Math.sin(x + 2) * 0.15); } }
function dots(p, x0, x1, y) { for (let x = x0; x <= x1; x += 1.8) { p.moveTo(x + 0.15, y); p.arc(x, y, 0.15, 0, Math.PI * 2); } }

// the monitor: a dark code editor, with its title bar, a tab for about.md, and line numbers down the side
function editorScreen(cw, ch) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const x = c.getContext("2d"), bar = 2.6 * K;
  x.fillStyle = "#14161b"; x.fillRect(0, 0, cw, ch);
  x.fillStyle = "#1d2027"; x.fillRect(0, 0, cw, bar);
  for (const [i, col] of ["#ff5f57", "#febc2e", "#28c840"].entries()) { x.fillStyle = col; x.beginPath(); x.arc((1.4 + i * 1.2) * K, bar / 2, 0.38 * K, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = "#14161b"; x.fillRect(5 * K, 0.5 * K, 9 * K, bar - 0.5 * K);
  x.fillStyle = "#c9ced6"; x.font = `500 ${1.05 * K}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`; x.textBaseline = "middle";
  x.fillText("about.md", 6.2 * K, bar / 2 + 0.2 * K);
  x.fillStyle = "#4b5160"; x.textAlign = "right"; x.font = `500 ${0.95 * K}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  for (let i = 0, y = bar + 2.4 * K; y < ch - 0.8 * K; i++, y += 2.05 * K) x.fillText(String(i + 1), 2.6 * K, y);
  x.fillStyle = "#1a1d23"; x.fillRect(3.3 * K, bar, 0.08 * K, ch - bar);
  return c;
}

/* ---------- the monitor's about page: Lennon, in his own words from the site's earlier about section ---------- */
function aboutLayout(portrait, W, H, ctx) {
  const els = [], s = portrait ? 1.12 : 1, col = { head: "#7dd3fc", sub: "#c4b5fd", text: "#e6e8eb", soft: "#aeb4bd", code: "#fdba74", link: "#86efac" };
  const measure = (font, size, text) => { ctx.font = fontOf(font, size * K); return ctx.measureText(text).width / K; };
  // wrapped lines, typed left to right one after another; returns where the next block starts
  const block = (text, x, y, maxW, font, size, color, lead = 1.38) => {
    let line = "";
    const out = [];
    for (const word of text.split(" ")) {
      const t = line ? line + " " + word : word;
      if (measure(font, size, t) > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
    out.forEach((t, i) => { const yy = y + size + i * size * lead; els.push({ text: t, x, y: yy, size, color, font, rot: 0, x0: x, x1: x + measure(font, size, t) }); });
    return y + size + (out.length - 1) * size * lead + size * 0.75;
  };
  const left = 5, colW = portrait ? W - left - 2.5 : (W - left - 4) / 2, right = portrait ? left : left + colW + 3;
  let y = 3.6;
  y = block("# About me", left, y, colW, "mono", 2.4 * s, col.head) + 0.4;
  y = block("I'm Lennon. I build what I imagine, from Greencastle, Pennsylvania.", left, y, colW, "rx", 1.62 * s, col.text) + 0.5;
  y = block("I'm a developer who likes building the whole thing: the engine, the interface and the page that tells people about it. Most of my work starts as a question.", left, y, colW, "rx", 1.36 * s, col.soft) + 0.5;
  y = block("Greencastle is a small town in Franklin County, in the Cumberland Valley: quiet and friendly, and where all of this gets made.", left, y, colW, "rx", 1.36 * s, col.soft) + 0.9;
  if (!portrait) y = 3.6;
  y = block("## Projects", right, y, colW, "mono", 1.75 * s, col.sub) + 0.2;
  y = block("- Kepler: my own web browser, in C++ on Qt and Chromium", right, y, colW, "rx", 1.36 * s, col.text) + 0.3;
  y = block("- CTerm Studio: a code studio in a browser tab, with a C core compiled to WebAssembly", right, y, colW, "rx", 1.36 * s, col.text) + 0.9;
  y = block("## Stack", right, y, colW, "mono", 1.75 * s, col.sub) + 0.2;
  y = block("C++  Qt 6  Rust  C  WebAssembly  JavaScript  React  Vite", right, y, colW, "mono", 1.25 * s, col.code, 1.5) + 0.9;
  y = block("## Find me", right, y, colW, "mono", 1.75 * s, col.sub) + 0.2;
  y = block("@lenodrips  github.com/lenodrips-create  lenodrips@gmail.com", right, y, colW, "rx", 1.32 * s, col.link, 1.5);
  return els;
}

// draw every element twice: its ink, and (a little thicker, so it covers the ink's soft edges) its number
function paint(els, ink, ids, chalk) {
  for (const c of [ink, ids]) { c.lineCap = "round"; c.lineJoin = "round"; c.textBaseline = "alphabetic"; }
  els.forEach((e, i) => {
    const idColor = `rgb(${i + 1},0,0)`;
    for (const [c, color, extra] of [[ink, e.color, 0], [ids, idColor, 4 / K]]) {
      c.save();
      c.fillStyle = c.strokeStyle = color;
      if (e.text) {
        c.translate(e.x * K, e.y * K); c.rotate(e.rot);
        c.font = fontOf(e.font, e.size * K);
        if (chalk && !extra) { c.shadowColor = "rgba(240,240,232,0.35)"; c.shadowBlur = 5; }   // chalk dust
        c.fillText(e.text, 0, 0);
        if (extra) { c.lineWidth = extra * K; c.strokeText(e.text, 0, 0); }
      } else {
        c.scale(K, K);
        c.lineWidth = e.width + extra;
        c.beginPath(); e.fn(c); c.stroke();
      }
      c.restore();
    }
  });
}
