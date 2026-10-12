// The reviews on the living-room wall: three framed prints over the sofa, side by side on a wide screen and stacked
// on a phone held upright (so they're big enough to read there).
//
// They're placeholders until real reviews come in: put each one's words, name and business in REVIEWS below.
import * as THREE from "three";

export const REVIEWS = [
  { stars: 5, quote: "Your review here.", who: "Your name", biz: "Your business" },
  { title: "REVIEWS", lines: ["Worked with me?", "Send me a few words and", "they'll go up on this wall."], email: "lenodrips@gmail.com" },
  { stars: 5, quote: "Your review here.", who: "Your name", biz: "Your business" },
];

const K = 8;                                   // texture pixels per centimetre
const FONTS = [["League Spartan", "reel/fonts/league-spartan-latin-700-normal.woff2", "700"],
               ["League Spartan", "reel/fonts/league-spartan-latin-900-normal.woff2", "900"],
               ["Readex Pro", "fonts/readex-pro-latin-400-normal.woff2", "400"]];

// a print's size in centimetres (inside its frame): upright side by side, or wide and stacked on a phone
export const printSize = portrait => (portrait ? { w: 74, h: 38 } : { w: 50, h: 64 });

export function makePrints(portrait) {
  const { w, h } = printSize(portrait), cw = Math.round(w * K), ch = Math.round(h * K);
  const canvases = REVIEWS.map(() => { const c = document.createElement("canvas"); c.width = cw; c.height = ch; return c; });
  const textures = canvases.map(c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });
  canvases.forEach(c => paper(c.getContext("2d"), w, h));
  const ready = Promise.all(FONTS.map(([family, file, weight]) => {
    const f = new FontFace(family, `url(${new URL(file, document.baseURI).href})`, { weight });
    document.fonts.add(f);
    return f.load();
  })).catch(() => {}).then(() => {
    REVIEWS.forEach((r, i) => { const x = canvases[i].getContext("2d"); paper(x, w, h); card(x, w, h, r, portrait); textures[i].needsUpdate = true; });
  });
  return { textures, size: { w, h }, ready };
}

// warm white paper inside a white mat
function paper(x, w, h) {
  x.setTransform(K, 0, 0, K, 0, 0);
  x.fillStyle = "#fbfaf7"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#f3efe6"; x.fillRect(3.5, 3.5, w - 7, h - 7);
  x.strokeStyle = "rgba(0,0,0,0.12)"; x.lineWidth = 0.15; x.strokeRect(3.5, 3.5, w - 7, h - 7);
}

// the words, centred: a block of lines, each with its own font, size (cm) and colour, wrapped to the card's width
function card(x, w, h, r, wide) {
  const ink = "#1c1c1e", soft = "#6b665e", gold = "#c9962e";
  const font = (weight, size) => `${weight} ${size}px ${weight === "400" ? '"Readex Pro"' : '"League Spartan"'}`;
  const items = [];
  const add = (text, weight, size, color, gap) => {
    x.font = font(weight, size);
    const max = w - 13, words = text.split(" ");
    let line = "";
    for (const word of words) {
      const t = line ? line + " " + word : word;
      if (x.measureText(t).width > max && line) { items.push({ t: line, weight, size, color, gap }); line = word; gap = size * 0.28; }
      else line = t;
    }
    items.push({ t: line, weight, size, color, gap });
  };
  const s = wide ? 0.82 : 1;
  if (r.title) {
    add(r.title, "900", 6.2 * s, ink, 0);
    r.lines.forEach((t, i) => add(t, "400", 2.9 * s, ink, i ? 0.9 * s : 3.2 * s));
    add(r.email, "700", 3.2 * s, gold, 2.6 * s);
  } else {
    items.push({ stars: r.stars, size: 4.2 * s, gap: 0 });
    add(`“${r.quote}”`, "700", 5 * s, ink, 3 * s);
    add(`— ${r.who}`, "400", 3 * s, ink, 3.4 * s);
    add(r.biz, "400", 2.7 * s, soft, 0.6 * s);
  }
  const heightOf = it => it.gap + it.size;
  let y = (h - items.reduce((a, it) => a + heightOf(it), 0)) / 2;
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  for (const it of items) {
    y += it.gap + it.size;
    if (it.stars) { stars(x, w / 2, y - it.size / 2, it.size, it.stars, gold); continue; }
    x.font = font(it.weight, it.size); x.fillStyle = it.color;
    x.fillText(it.t, w / 2, y - it.size * 0.18);
  }
}
function stars(x, cx, cy, size, n, color) {
  x.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const sx = cx + (i - (n - 1) / 2) * size * 1.15;
    x.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? size * 0.22 : size * 0.5;
      k ? x.lineTo(sx + Math.cos(a) * rad, cy + Math.sin(a) * rad) : x.moveTo(sx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    x.closePath(); x.fill();
  }
}
