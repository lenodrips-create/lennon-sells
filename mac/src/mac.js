// A real-time 3D MacBook (Air-like proportions, in centimetres) for the laptop page.
// Its display shows the project gallery strip; further scrolling closes the lid on its hinge while the camera
// cranes over it until the lid fills the screen. The page drives it from the scroll position with
// Mac.update(rise, close, now, dt): rise is how far the card has come up (0..1), close how far the lid has shut.
// Build: cd mac && npm install && npm run build  (bundles three.js into mac/mac.min.js)
import * as THREE from "three";

const canvas = document.getElementById("mac");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- renderer ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
// a white photo studio for the metal to reflect, matching the page it sits on: softboxes in front and behind, two
// strip lights, and a black flag overhead so the top of the closed lid reads as deep, dark aluminium.
// Reflections are what make anodised aluminium look like metal rather than paint.
function studio() {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(220, 140, 220), new THREE.MeshBasicMaterial({ color: 0xd9dce0, side: THREE.BackSide }));
  room.position.y = 50;
  s.add(room);
  const panel = (w, h, rgb, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(110, 80, [0.5, 0.51, 0.53], 0, 100, 0);           // grey flag overhead
  panel(90, 32, [4, 4, 4], 0, 55, -88);                    // softbox behind
  panel(90, 32, [2.6, 2.6, 2.6], 0, 50, 92);               // softbox in front
  panel(18, 80, [2.6, 2.6, 2.6], -95, 30, 10);             // strip, left
  panel(18, 80, [1.8, 1.8, 1.8], 95, 30, -10);             // strip, right
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshBasicMaterial({ color: 0xeef0f3 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -19.9;
  s.add(floor);
  return s;
}
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(studio(), 0.02).texture;
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(-18, 40, 26);
scene.add(key);

/* ---------- dimensions (cm) ---------- */
const W = 30.41, D = 21.5;           // footprint
const BASE_H = 0.73, LID_H = 0.4;    // base and lid thickness; 1.13 closed
const CORNER = 1.05;                 // plan-view corner radius
const OPEN = THREE.MathUtils.degToRad(110);
const REST = 0.03;                    // the closed lid rests this far above the deck
const PIVOT = new THREE.Vector3(0, BASE_H + REST + LID_H / 2, -D / 2 + LID_H / 2);

function roundedRect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// a rounded slab lying flat, bottom at y=0, softly bevelled edges; holes are [w, d, r, z] cut-outs
function slab(w, d, h, r, bevel, holes = [], seg = 28) {
  const shape = roundedRect(w - 2 * bevel, d - 2 * bevel, Math.max(0.01, r - bevel));
  for (const [hw, hd, hr, hz] of holes) {
    const hole = roundedRect(hw + 2 * bevel, hd + 2 * bevel, hr + bevel);
    shape.holes.push(new THREE.Path(hole.getPoints(28).map(pt => new THREE.Vector2(pt.x, pt.y - hz)).reverse()));
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: h - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg > 8 ? 6 : 3, curveSegments: seg,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  g.computeVertexNormals();
  return g;
}
const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };
function flat(w, d, r) {          // a flat rounded rectangle facing up
  const g = new THREE.ShapeGeometry(roundedRect(w, d, r), 24);
  g.rotateX(-Math.PI / 2);
  return g;
}

/* ---------- materials ---------- */
// a faint sandblasted grain on the aluminium
function grain() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d"), img = x.createImageData(256, 256);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = 150 + (seed % 60);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10);
  return t;
}
const grainTex = grain();
// Space Black: dark anodised aluminium, with keys, trackpad and hinge to match
const alu = new THREE.MeshStandardMaterial({ color: 0x55585d, metalness: 0.88, roughness: 0.4, roughnessMap: grainTex, envMapIntensity: 1.25 });
const keyMat = new THREE.MeshStandardMaterial({ color: 0x0e0e10, metalness: 0, roughness: 0.68 });
const wellMat = new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: 0, roughness: 0.8 });
// decals lie exactly on another surface; a depth offset keeps them from flickering through it
const decal = (m, n = 2) => Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -n, polygonOffsetUnits: -n });
const padMat = decal(new THREE.MeshStandardMaterial({ color: 0x55585d, metalness: 0.7, roughness: 0.26, envMapIntensity: 1.25 }), 4);
const padEdge = decal(new THREE.MeshStandardMaterial({ color: 0x111113, metalness: 0.2, roughness: 0.6 }));
const glass = decal(new THREE.MeshPhysicalMaterial({ color: 0x050506, metalness: 0, roughness: 0.1, clearcoat: 0.2, clearcoatRoughness: 0.05, envMapIntensity: 0.3 }), 2);
const hingeMat = new THREE.MeshStandardMaterial({ color: 0x232427, metalness: 0.9, roughness: 0.42 });

const mac = new THREE.Group();
scene.add(mac);

/* ---------- base ---------- */
// keyboard: US layout, 14.5 key units across, sitting in a well cut into the deck
const PITCH = 27.3 / 14.5, GAP = 0.27, WELL = 0.16, KEY_H = 0.13;
const ROWS = [
  [["esc", 1.5], ...Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, 1]), ["", 1, "touch"]],
  [["`", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["delete", 1.5]],
  [["tab", 1.5], ..."QWERTYUIOP".split("").map(k => [k, 1]), ["[", 1], ["]", 1], ["\\", 1]],
  [["caps lock", 1.75], ..."ASDFGHJKL".split("").map(k => [k, 1]), [";", 1], ["'", 1], ["return", 1.75]],
  [["shift", 2.25], ..."ZXCVBNM".split("").map(k => [k, 1]), [",", 1], [".", 1], ["/", 1], ["shift", 2.25]],
  [["fn", 1], ["control", 1], ["option", 1], ["command", 1.25], ["", 5], ["command", 1.25], ["option", 1], ["arrows", 3]],
];
const KB_BACK = -D / 2 + 1.05, KB_W = 14.5 * PITCH, KB_D = ROWS.length * PITCH, KB_Z = KB_BACK + KB_D / 2;
const base = new THREE.Mesh(slab(W, D, BASE_H, CORNER, 0.14, [[KB_W + 0.5, KB_D + 0.45, 0.42, KB_Z]]), alu);
mac.add(base);
const TOP = BASE_H + 0.0005, FLOOR = BASE_H - WELL;
mac.add(at(new THREE.Mesh(flat(KB_W + 0.9, KB_D + 0.85, 0.5), wellMat), 0, FLOOR, KB_Z));

const keyGeoms = new Map();
function keyGeom(w, d) {
  const id = `${w.toFixed(3)}x${d.toFixed(3)}`;
  if (!keyGeoms.has(id)) keyGeoms.set(id, slab(w, d, KEY_H, 0.16, 0.03, [], 5));   // small keys need few segments
  return keyGeoms.get(id);
}
const legends = [];  // [label, x, z, w, d]
function addKey(label, x, z, w, d) {
  const m = new THREE.Mesh(keyGeom(w, d), keyMat);
  m.position.set(x, FLOOR, z);
  mac.add(m);
  if (label) legends.push([label, x, z, w, d]);
}
ROWS.forEach((row, r) => {
  let x = -KB_W / 2;
  const zc = KB_BACK + (r + 0.5) * PITCH;
  for (const [label, u] of row) {
    const w = u * PITCH - GAP;
    if (label === "arrows") {           // inverted T: half-height keys
      const h = (PITCH - GAP) / 2 - 0.04, kw = PITCH - GAP;
      addKey("◀", x + PITCH * 0.5, zc + PITCH / 4 - 0.02, kw, h);
      addKey("▲", x + PITCH * 1.5, zc - PITCH / 4 + 0.02, kw, h);
      addKey("▼", x + PITCH * 1.5, zc + PITCH / 4 - 0.02, kw, h);
      addKey("▶", x + PITCH * 2.5, zc + PITCH / 4 - 0.02, kw, h);
    } else addKey(label, x + (u * PITCH) / 2, zc, w, PITCH - GAP);
    x += u * PITCH;
  }
});
// key legends, drawn once onto a transparent sheet lying on the key tops
(function legendSheet() {
  const s = 64, c = document.createElement("canvas");
  c.width = Math.round(KB_W * s); c.height = Math.round(KB_D * s);
  const x = c.getContext("2d");
  x.fillStyle = "rgba(226,226,230,0.82)";
  x.textAlign = "center"; x.textBaseline = "middle";
  for (const [label, kx, kz, w, d] of legends) {
    const cx = (kx + KB_W / 2) * s, cy = (kz - KB_BACK) * s;
    const word = label.length > 1 && !/^F\d+$/.test(label) && !"◀▲▼▶".includes(label);
    x.font = `${word ? 500 : 600} ${word ? 0.2 * s : /^F\d+$/.test(label) ? 0.2 * s : 0.3 * s}px -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`;
    if (word) { x.textAlign = label === "delete" || label === "return" || (label === "shift" && kx > 0) || (label === "command" && kx > 0) || (label === "option" && kx > 0) ? "right" : "left";
      const px = x.textAlign === "left" ? cx - (w / 2) * s + 0.18 * s : cx + (w / 2) * s - 0.18 * s;
      x.fillText(label, px, cy + (d / 2) * s - 0.22 * s);
      x.textAlign = "center";
    } else x.fillText(label, cx, cy);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(KB_W, KB_D), decal(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9 })));
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, FLOOR + KEY_H + 0.002, KB_Z);
  mac.add(m);
})();

// trackpad: glass, with a hairline gap around it
const PAD_W = 14.2, PAD_D = 8.1, PAD_Z = KB_BACK + KB_D + 0.85 + PAD_D / 2;
mac.add(at(new THREE.Mesh(flat(PAD_W + 0.12, PAD_D + 0.12, 0.62), padEdge), 0, TOP + 0.0004, PAD_Z));
mac.add(at(new THREE.Mesh(flat(PAD_W, PAD_D, 0.56), padMat), 0, TOP + 0.0008, PAD_Z));

// ports in the side walls: MagSafe and two USB-C on the left, the headphone jack on the right
const portMat = decal(new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.3, roughness: 0.5 }), 4);
function port(side, z, len, h) {
  const g = new THREE.ShapeGeometry(roundedRect(len, h, h / 2 - 0.001), 12);
  const m = new THREE.Mesh(g, portMat);
  m.rotation.y = side * Math.PI / 2;            // face outwards, the slot running front to back
  m.position.set(side * (W / 2 + 0.0005), BASE_H * 0.46, z);
  mac.add(m);
}
port(-1, -D / 2 + 2.4, 1.05, 0.22);   // MagSafe
port(-1, -D / 2 + 4.0, 0.84, 0.26);   // USB-C
port(-1, -D / 2 + 5.3, 0.84, 0.26);   // USB-C
port(1, -D / 2 + 2.2, 0.36, 0.36);    // headphone jack

/* ---------- hinge and lid ---------- */
const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 25.2, 32), hingeMat);
hinge.rotation.z = Math.PI / 2;
hinge.position.copy(PIVOT);
mac.add(hinge);

const lid = new THREE.Group();
lid.position.copy(PIVOT);
mac.add(lid);
const lidShell = new THREE.Mesh(slab(W, D, LID_H, CORNER, 0.12), alu);
lidShell.position.set(0, -LID_H / 2, D / 2 - LID_H / 2);
lid.add(lidShell);
// the inner face: edge-to-edge glass, the display, the notch
const INNER_Y = -LID_H / 2 - 0.0008;
const bezel = new THREE.Mesh(flat(W - 0.36, D - 0.36, CORNER - 0.18), glass);
bezel.rotation.x = Math.PI;                // face down when closed (towards the keyboard)
bezel.position.set(0, INNER_Y, D / 2 - LID_H / 2);
lid.add(bezel);
const SCR_W = 28.8, SCR_H = SCR_W / 1.538, SCR_TOP_BEZEL = 0.62;
const SCR_ZC = D - LID_H / 2 - SCR_TOP_BEZEL - SCR_H / 2;   // centre along the lid, measured from the hinge

/* ---------- the display: the gallery strip, rendered into a texture ---------- */
const TW = 1280, TH = Math.round(TW / 1.538);
const rt = new THREE.WebGLRenderTarget(TW, TH, { samples: 4 });
const screenScene = new THREE.Scene();
const screenCam = new THREE.OrthographicCamera(-TW / 2, TW / 2, TH / 2, -TH / 2, -10, 10);
const loader = new THREE.TextureLoader();
const SHOTS = [["01", 1.78], ["02", 1.02], ["03", 1.84], ["04", 1.5], ["05", 1.5], ["06", 1.5], ["11", 1.5],
               ["12", 1.5], ["13", 1.5], ["14", 1.5], ["16", 1.5], ["20", 0.8], ["21", 1.78]].map(([n, a]) => [n, Math.round(118 * a)]);
const COPIES = 2, CGAP = 6, TOTAL = SHOTS.reduce((a, [, w]) => a + w + CGAP, 0), SEG = 12;
const k = TW / 934, baseH = TH * 0.36;

// background and text, drawn once
const bgCanvas = document.createElement("canvas");
bgCanvas.width = TW; bgCanvas.height = TH;
const bgTex = new THREE.CanvasTexture(bgCanvas);
bgTex.colorSpace = THREE.SRGBColorSpace;
const bg = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ map: bgTex, toneMapped: false }));
bg.position.z = -1;
screenScene.add(bg);
function drawBackground(img) {
  const x = bgCanvas.getContext("2d");
  x.fillStyle = "#151515"; x.fillRect(0, 0, TW, TH);
  if (img) {   // blur by drawing small and scaling up
    const t = document.createElement("canvas"); t.width = 48; t.height = 31;
    t.getContext("2d").drawImage(img, 0, 0, 48, 31);
    x.imageSmoothingQuality = "high";
    x.drawImage(t, -TW * 0.04, -TH * 0.04, TW * 1.08, TH * 1.08);
    x.fillStyle = "rgba(8,8,10,0.62)"; x.fillRect(0, 0, TW, TH);
  }
  const font = s => `${s}px -apple-system, "Helvetica Neue", Inter, Arial, sans-serif`;
  x.fillStyle = "#f2f2f2"; x.textBaseline = "top"; x.textAlign = "left";
  x.font = font(19); x.fillText("Lennon Helman", 26, 58);
  x.fillText("Software Developer", 236, 58); x.fillText("based in Greencastle, PA", 236, 82);
  x.fillText("Index   Info   Archive", 730, 58);
  x.textAlign = "right"; x.fillText("Email", TW - 26, 58);
  x.textAlign = "center"; x.font = font(17); x.fillText("© 2026 Lennon Helman", TW / 2, TH - 52);
  bgTex.needsUpdate = true;
}
drawBackground(null);
const bgImg = new Image();
bgImg.onload = () => { drawBackground(bgImg); dirty = true; };
bgImg.src = "img/work/01.jpg";

const cards = [];
for (let copy = 0; copy < COPIES; copy++)
  SHOTS.forEach(([n, w], i) => {
    const geo = new THREE.PlaneGeometry(1, 1, SEG, 1);
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const mesh = new THREE.Mesh(geo, mat);
    screenScene.add(mesh);
    const card = { mesh, w, start: copy * TOTAL + SHOTS.slice(0, i).reduce((a, [, v]) => a + v + CGAP, 0) };
    loader.load(`img/work/${n}.jpg`, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      // crop the picture to cover its card
      const ac = (w * k) / baseH, ai = tex.image.width / tex.image.height;
      const uv = geo.attributes.uv;
      let u0 = 0, u1 = 1, v0 = 0, v1 = 1;
      if (ai > ac) { const uw = ac / ai; u0 = (1 - uw) / 2; u1 = 1 - u0; } else { const vh = ai / ac; v0 = (1 - vh) / 2; v1 = 1 - v0; }
      for (let i2 = 0; i2 < uv.count; i2++) uv.setXY(i2, u0 + (u1 - u0) * uv.getX(i2), v0 + (v1 - v0) * uv.getY(i2));
      uv.needsUpdate = true;
      mat.map = tex; mat.needsUpdate = true;
      dirty = true;
    });
    cards.push(card);
  });
const centre = (u, t) => 0.57 + 0.028 * Math.sin(2 * Math.PI * (u * 1.1 - t * 0.12)) + 0.012 * Math.sin(2 * Math.PI * (u * 2.3 + t * 0.21));
const half = (u, t) => 0.112 + 0.108 * Math.sin(Math.PI * clamp01(u)) * (1 + 0.06 * Math.sin(t * 0.9 + u * 4));
let offset = 0;
function layoutStrip(t) {
  const span = COPIES * TOTAL;
  for (const c of cards) {
    let x0 = ((c.start - offset) % span + span) % span;
    if (x0 > 934) x0 -= span;
    const x1 = x0 + c.w;
    c.mesh.visible = x1 > 0 && x0 < 934;
    if (!c.mesh.visible) continue;
    const p = c.mesh.geometry.attributes.position;
    for (let i = 0; i <= SEG; i++) {
      const xs = x0 + ((x1 - x0) * i) / SEG, u = xs / 934;
      const top = (centre(u, t) - half(u, t)) * TH, bot = (centre(u, t) + half(u, t)) * TH;
      p.setXYZ(i, xs * k - TW / 2, TH / 2 - top, 0);             // top row
      p.setXYZ(i + SEG + 1, xs * k - TW / 2, TH / 2 - bot, 0);   // bottom row
    }
    p.needsUpdate = true;
  }
}

const display = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), decal(new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false }), 4));
display.rotation.x = Math.PI / 2;          // face down when closed; the picture's top is at the lid's far edge
display.position.set(0, INNER_Y - 0.0006, SCR_ZC);
lid.add(display);
// the camera housing notch at the top centre of the display
const notchMesh = new THREE.Mesh(flat(3.1, 0.62 * 2, 0.32), decal(new THREE.MeshBasicMaterial({ color: 0x030303 }), 6));
notchMesh.rotation.x = Math.PI;
notchMesh.position.set(0, INNER_Y - 0.0012, D - LID_H / 2 - SCR_TOP_BEZEL);
lid.add(notchMesh);

/* ---------- shadows: a tight contact shadow under the edges and a wide, faint one around it ---------- */
function softShadow(pw, pd, blur, alpha, z) {
  const k = 512 / pw, cw = 512, ch = Math.round(pd * k);
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const x = c.getContext("2d");
  // draw the footprint off the canvas and keep only its blurred shadow
  x.shadowColor = `rgba(0,0,0,${alpha})`; x.shadowBlur = blur * k; x.shadowOffsetX = cw * 2;
  x.beginPath();
  const rx = (cw - W * k) / 2 - cw * 2, ry = (ch - D * k) / 2;
  x.roundRect ? x.roundRect(rx, ry, W * k, D * k, CORNER * k) : x.rect(rx, ry, W * k, D * k);
  x.fill();
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, -0.02, z);
  mac.add(m);
}
softShadow(W * 1.9, D * 2.2, 5.5, 0.32, -1.2);
softShadow(W + 5, D + 5, 0.7, 0.8, 0);

/* ---------- camera ---------- */
const camera = new THREE.PerspectiveCamera(26, 1, 1, 400);
let vw = 1, vh = 1, headPx = 0, openFit = null, closedFit = null;
const box = new THREE.Box3();
function corners() {
  lid.rotation.x = -OPEN;
  mac.position.set(0, 0, 0); mac.rotation.set(0, 0, 0);   // framed at rest; update() sets its lift again
  mac.updateMatrixWorld(true);
  box.makeEmpty();
  box.expandByObject(base);
  box.expandByObject(lidShell);   // the laptop itself, not its soft shadow
  const pts = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [0, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z));
  return pts;
}
// place the camera on a sphere around a target, with an up vector that stays valid looking straight down
function place(target, elev, dist, az) {
  const e = THREE.MathUtils.degToRad(elev), a = THREE.MathUtils.degToRad(az);
  camera.position.set(target.x + Math.cos(e) * Math.sin(a) * dist, target.y + Math.sin(e) * dist, target.z + Math.cos(e) * Math.cos(a) * dist);
  camera.up.set(-Math.sin(e) * Math.sin(a), Math.cos(e), -Math.sin(e) * Math.cos(a));
  camera.lookAt(target);
}
// open: a low three-quarter view, like a product photo; narrow screens look more from the front
const T_OPEN = new THREE.Vector3(0, 7.2, 0.6), E_OPEN = 15;
const azOpen = () => (vw < 700 ? -14 : -24);
function fitOpen() {
  const pts = corners(), v = new THREE.Vector3();
  // the headline takes the top of the card; frame the laptop in the space below it
  const availH = vh - headPx, fx = vw < 520 ? 1.06 : vw < 700 ? 0.94 : 0.86, fy = 0.9;
  let lo = 20, hi = 600;
  for (let i = 0; i < 30; i++) {
    const d = (lo + hi) / 2;
    place(T_OPEN, E_OPEN, d, azOpen());
    camera.updateMatrixWorld();
    let ok = true;
    for (const p of pts) { v.copy(p).project(camera); if (Math.abs(v.x) > fx || Math.abs(v.y) * (vh / availH) > fy) { ok = false; break; } }
    if (ok) hi = d; else lo = d;
  }
  return { target: T_OPEN.clone(), elev: E_OPEN, az: azOpen(), dist: hi, shift: headPx / 2 };
}
function fitClosed() {
  // straight down over the closed lid, close enough that the lid (minus its rounded corners) covers the screen
  const aspect = vw / vh, inset = 2 * CORNER;
  const visH = Math.min(D - inset, (W - inset) / aspect) * 0.98;
  const dist = visH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + 0.4;
  return { target: new THREE.Vector3(0, BASE_H + REST + LID_H, 0), elev: 90, az: 0, dist, shift: 0 };
}

function resize() {
  vw = Math.max(1, canvas.clientWidth); vh = Math.max(1, canvas.clientHeight);
  const dpr = Math.min(2, devicePixelRatio || 1, Math.sqrt(4.2e6 / (vw * vh)));
  renderer.setPixelRatio(dpr);
  renderer.setSize(vw, vh, false);
  camera.aspect = vw / vh;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();   // the fits below project through it
  const title = document.querySelector(".work-title");
  // layout positions, not the on-screen ones: the page moves both elements with transforms while they rise
  headPx = title ? title.offsetTop + title.offsetHeight - canvas.offsetTop + 12 : 0;
  openFit = fitOpen();
  closedFit = fitClosed();
  dirty = true;
}

/* ---------- per-frame update ---------- */
let dirty = true, last = { rise: -1, close: -1 };
const tgt = new THREE.Vector3();
function update(rise, close, now, dt) {
  if (!openFit) resize();
  const stripOn = rise > 0 && close < 0.75;
  if (stripOn && !reduce) offset = (offset + dt * 38) % TOTAL;
  if (!stripOn && !dirty && rise === last.rise && close === last.close) return;
  last.rise = rise; last.close = close; dirty = false;

  // as the card arrives the laptop lifts into place with a slight turn, and settles as the card finishes
  const lift = reduce ? 0 : 1 - easeInOut(smooth(0.3, 1, rise));
  mac.position.y = -5 * lift;
  mac.rotation.y = 0.22 * lift;
  // the lid closes over the first 60% of the move, with a soft landing
  const lc = easeInOut(clamp01(close / 0.6));
  lid.rotation.x = -OPEN * (1 - lc);
  // the camera cranes up and over the lid, then settles straight above it
  const m = easeInOut(clamp01((close - 0.08) / 0.92));
  tgt.lerpVectors(openFit.target, closedFit.target, m);
  const elev = THREE.MathUtils.lerp(openFit.elev, closedFit.elev, m);
  const dist = Math.exp(THREE.MathUtils.lerp(Math.log(openFit.dist), Math.log(closedFit.dist), m));
  place(tgt, elev, dist, THREE.MathUtils.lerp(openFit.az, closedFit.az, m));
  const shift = openFit.shift * (1 - m);
  camera.setViewOffset(vw, vh, 0, -shift, vw, vh);
  camera.updateProjectionMatrix();

  if (stripOn || lc < 1) {
    layoutStrip(now / 1000);
    renderer.setRenderTarget(rt);
    renderer.render(screenScene, screenCam);
    renderer.setRenderTarget(null);
  }
  renderer.render(scene, camera);
}

addEventListener("resize", () => { resize(); });
// once the web fonts are in, redraw the display's text and re-measure the headline the laptop sits under
document.fonts && document.fonts.ready.then(() => { drawBackground(bgImg.complete && bgImg.naturalWidth ? bgImg : null); resize(); });
window.Mac = { update, resize };
// draw once while the reel plays, so shaders and textures are ready before the laptop first rises
(window.requestIdleCallback || (f => setTimeout(f, 200)))(() => update(0, 0, performance.now(), 0));
window.dispatchEvent(new Event("mac-ready"));
