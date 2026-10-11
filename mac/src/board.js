// The whiteboard in the office: the services, hand-written in marker with a few doodles, and written out line by
// line, left to right, when the camera arrives in front of it.
//
// It's three textures over the plain board: the ink (colour and coverage), which line each inked pixel belongs to,
// and when each line is written and where it starts and ends. The board's shader shows a line's ink up to where the
// pen has got to, so the writing animates without redrawing anything; the page only moves one number.
import * as THREE from "three";

const INK = { black: "#121316", blue: "#173ea8", red: "#b81f1f", green: "#16693a" };
const K = 8;                                   // texture pixels per centimetre of board
const MAX = 64;                                // most lines the board can hold
const FONTS = [["Permanent Marker", "fonts/permanent-marker-latin-400-normal.woff2", "400"],
               ["Caveat", "fonts/caveat-latin-700-normal.woff2", "700"]];
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

export function makeBoard(portrait) {
  const { w: W, h: H } = boardSize(portrait), cw = Math.round(W * K), ch = Math.round(H * K);
  const base = new THREE.CanvasTexture(blankBoard(cw, ch));
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
    const els = layout(portrait, W, H, inkCanvas.getContext("2d"));
    const idxCanvas = document.createElement("canvas"); idxCanvas.width = cw; idxCanvas.height = ch;
    paint(els, inkCanvas.getContext("2d"), idxCanvas.getContext("2d"));
    // marker ink isn't perfectly even
    const ix = inkCanvas.getContext("2d"), img = ix.getImageData(0, 0, cw, ch), d = img.data, r = rng(99);
    for (let i = 3; i < d.length; i += 4) if (d[i]) d[i] = Math.round(d[i] * (0.93 + 0.07 * r()));
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
    const cost = els.map(e => (e.text ? 0.12 + e.text.length * 0.05 : 0.35) + 0.08), total = cost.reduce((a, b) => a + b, 0);
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
  const measure = (font, size, text) => { ctx.font = `${font} ${size * K}px ${font === "700" ? '"Caveat"' : '"Permanent Marker"'}`; return ctx.measureText(text).width / K; };
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

// draw every element twice: its ink, and (a little thicker, so it covers the ink's soft edges) its number
function paint(els, ink, ids) {
  for (const c of [ink, ids]) { c.lineCap = "round"; c.lineJoin = "round"; c.textBaseline = "alphabetic"; }
  els.forEach((e, i) => {
    const idColor = `rgb(${i + 1},0,0)`;
    for (const [c, color, extra] of [[ink, e.color, 0], [ids, idColor, 0.5]]) {
      c.save();
      c.fillStyle = c.strokeStyle = color;
      if (e.text) {
        c.translate(e.x * K, e.y * K); c.rotate(e.rot);
        c.font = `${e.font} ${e.size * K}px ${e.font === "700" ? '"Caveat"' : '"Permanent Marker"'}`;
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
