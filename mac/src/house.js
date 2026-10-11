// A modern two-storey house on the lawn, in centimetres like the laptop: white lap siding, black flat roofs with
// deep fascias, black-framed windows, a glass garage door and a balcony with a cable railing over it. Behind the
// balcony's open door is the office, with a chalkboard in the middle of its back wall.
//
// The house's own axes: +z is the front. The office's door, the balcony and the chalkboard all sit on x = 0, so
// the camera flies straight in along that line. The laptop lies on the same line, out on the lawn in front.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const T = 15;                         // wall thickness
const FLOOR = 335.5;                  // the office floor, on top of the ground floor's roof
const EYE = FLOOR + 150;              // standing eye height in the office
export const OFFICE = {
  eye: EYE,
  door: 120,                          // the office's front wall (outer face), where the balcony door is
  board: { y: EYE, z: -314.7 + 1.6, w: 252, h: 132 },   // the chalkboard's face, on the back wall
};

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- textures, painted on canvases ---------- */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / repeat[0], 1 / repeat[1]); }
  return t;
}
// lap siding: boards 15 cm deep, each with a soft shadow under the one above
const sidingTex = () => canvasTex(64, 256, (x, w, h) => {
  const n = 8, bh = h / n;
  for (let i = 0; i < n; i++) {
    const g = x.createLinearGradient(0, i * bh, 0, (i + 1) * bh);
    g.addColorStop(0, "#d9d9d6"); g.addColorStop(0.1, "#f3f3f1"); g.addColorStop(0.85, "#fbfbfa"); g.addColorStop(1, "#ececea");
    x.fillStyle = g; x.fillRect(0, i * bh, w, bh);
  }
}, [64 * 120 / 256, 120]);
const woodTex = (base, rep, plank) => canvasTex(512, 512, (x, w, h) => {
  const r = rng(base.length * 977 + plank);
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  const n = Math.round(w / plank);
  for (let i = 0; i < n; i++) {
    x.fillStyle = `rgba(${r() < 0.5 ? "255,240,220" : "60,35,15"},${0.04 + r() * 0.08})`;
    x.fillRect(i * plank, 0, plank, h);
    for (let k = 0; k < 14; k++) {          // grain
      x.strokeStyle = `rgba(70,40,20,${0.05 + r() * 0.08})`; x.lineWidth = 0.6 + r();
      const gx = i * plank + r() * plank;
      x.beginPath(); x.moveTo(gx, 0); x.bezierCurveTo(gx + (r() - 0.5) * 6, h * 0.3, gx + (r() - 0.5) * 6, h * 0.7, gx + (r() - 0.5) * 4, h); x.stroke();
    }
    x.fillStyle = "rgba(40,25,10,0.35)"; x.fillRect(i * plank, 0, 1.2, h);   // the joint
    const cut = r() * h; x.fillRect(i * plank, cut, plank, 1.2);
  }
}, rep);
// a well-used slate: dark green-black, a fine tooth, and the faint swirls of a board that's been wiped many times
const slateTex = () => {
  const t = canvasTex(1024, 512, (x, w, h) => {
    const r = rng(4242);
    x.fillStyle = "#1e2924"; x.fillRect(0, 0, w, h);
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 10; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    x.putImageData(img, 0, 0);
    x.lineCap = "round";
    for (let i = 0; i < 70; i++) {
      x.strokeStyle = `rgba(230,236,232,${0.012 + r() * 0.025})`;
      x.lineWidth = 30 + r() * 60;
      const cx = r() * w, cy = r() * h, rad = 40 + r() * 160, a0 = r() * 6.3;
      x.beginPath(); x.arc(cx, cy, rad, a0, a0 + 0.8 + r() * 2); x.stroke();
    }
    const g = x.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.28)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  return t;
};

/* ---------- materials ---------- */
const mats = () => ({
  siding: new THREE.MeshStandardMaterial({ map: sidingTex(), roughness: 0.82, envMapIntensity: 0.55 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.55, metalness: 0.15, envMapIntensity: 0.7 }),
  glassDark: new THREE.MeshStandardMaterial({ color: 0x1d242b, roughness: 0.04, metalness: 0.1, envMapIntensity: 1.6 }),
  glassClear: new THREE.MeshStandardMaterial({ color: 0xd8e8f0, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 }),
  deck: new THREE.MeshStandardMaterial({ map: woodTex("#9a6f4a", [120, 120], 512 / 8), roughness: 0.75, envMapIntensity: 0.5 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xc9c6bf, roughness: 0.92, envMapIntensity: 0.45 }),
  paint: new THREE.MeshStandardMaterial({ color: 0xefebe4, roughness: 0.92, envMapIntensity: 0.75 }),
  // the ceiling faces the floor, so the sky's light doesn't reach it: it's lit by what bounces off the room instead
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: 0.95, envMapIntensity: 0.2, emissive: 0xcdc8bf, emissiveIntensity: 0.62 }),
  floor: new THREE.MeshStandardMaterial({ map: woodTex("#c49a6a", [150, 150], 512 / 8), roughness: 0.5, envMapIntensity: 0.6 }),
  oak: new THREE.MeshStandardMaterial({ map: woodTex("#b98c5c", [80, 80], 512 / 5), roughness: 0.6, envMapIntensity: 0.6 }),
  slate: new THREE.MeshStandardMaterial({ map: slateTex(), roughness: 0.93, envMapIntensity: 0.35 }),
  chalk: new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: 1 }),
  felt: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 1 }),
  rug: new THREE.MeshStandardMaterial({ color: 0xd6d0c6, roughness: 1, envMapIntensity: 0.5 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.35, envMapIntensity: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3d6a2c, roughness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.6 }),
  books: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, envMapIntensity: 0.6 }),
  glow: new THREE.MeshStandardMaterial({ color: 0xfff3dd, emissive: 0xffe2b0, emissiveIntensity: 1.6, roughness: 1 }),
  plants: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, envMapIntensity: 0.45 }),
});

/* ---------- building blocks: geometry is gathered per material and merged, so the house is a few draw calls ---------- */
function collector() {
  const lists = new Map();
  const put = (mat, geo, m) => {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (m) g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
    if (!lists.has(mat)) lists.set(mat, []);
    lists.get(mat).push(g);
  };
  const box = (mat, x0, x1, y0, y1, z0, z1, m) =>
    put(mat, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m);
  const build = (group, shadows = true) => {
    for (const [mat, geos] of lists) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.castShadow = shadows && !mat.transparent;
      mesh.receiveShadow = !mat.transparent;
      group.add(mesh);
    }
  };
  return { put, box, build };
}
const mat4 = (x, y, z, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);

// a wall's outline, len along and h up, with door notches cut up from the bottom and windows as holes; mirror flips
// it end to end (for the side seen from inside)
function wallShape(len, h, doors, windows, mirror) {
  const X = x => (mirror ? len - x : x);
  const s = new THREE.Shape();
  const pts = [[0, 0]];
  for (const [x, w, dh] of [...doors].sort((a, b) => a[0] - b[0])) pts.push([x, 0], [x, dh], [x + w, dh], [x + w, 0]);
  pts.push([len, 0], [len, h], [0, h]);
  const p = pts.map(([x, y]) => new THREE.Vector2(X(x), y));
  if (mirror) p.reverse();
  s.setFromPoints(p);
  for (const [x, y, w, wh] of windows) {
    const hole = [[x, y], [x, y + wh], [x + w, y + wh], [x + w, y]].map(([a, b]) => new THREE.Vector2(X(a), b));
    s.holes.push(new THREE.Path(mirror ? hole.reverse() : hole));
  }
  return s;
}

/* ---------- the house ---------- */
export function makeHouse(quality) {
  const M = mats(), C = collector(), group = new THREE.Group();
  const lights = [];

  // a wall: from (x0, z0) along its own x, facing outwards along its own z (ry turns it), its outer face on that
  // line; T thick inwards. Windows get black frames and glass; `inside` lines it with paint for the office.
  function wall({ x0, z0, ry, y0, len, h, doors = [], windows = [], inside = false }) {
    const m = mat4(x0, y0, z0, ry);
    const g = new THREE.ExtrudeGeometry(wallShape(len, h, doors, windows, false), { depth: T, bevelEnabled: false });
    g.translate(0, 0, -T);
    C.put(M.siding, g, m);
    if (inside) {
      const l = new THREE.ShapeGeometry(wallShape(len, h, doors, windows, true));
      l.rotateY(Math.PI); l.translate(len, 0, -T - 0.3);
      C.put(M.paint, l, m);
    }
    const F = 5;   // frame width
    for (const [x, y, w, wh, kind = "dark", bars = []] of windows) {
      C.box(M.trim, x, x + w, y, y + F, -T - 1, 1.5, m); C.box(M.trim, x, x + w, y + wh - F, y + wh, -T - 1, 1.5, m);
      C.box(M.trim, x, x + F, y, y + wh, -T - 1, 1.5, m); C.box(M.trim, x + w - F, x + w, y, y + wh, -T - 1, 1.5, m);
      for (const b of bars) b < 1 ? C.box(M.trim, x, x + w, y + wh * b - 2, y + wh * b + 2, -T / 2 - 2, -T / 2 + 2, m)
                            : C.box(M.trim, x + b - 2, x + b + 2, y, y + wh, -T / 2 - 2, -T / 2 + 2, m);
      C.put(kind === "clear" ? M.glassClear : M.glassDark, new THREE.PlaneGeometry(w - 2 * F, wh - 2 * F).translate(x + w / 2, y + wh / 2, -T / 2), m);
    }
    for (const [x, w, dh] of doors) {
      C.box(M.trim, x - 4, x, 0, dh + 4, -T - 1, 2, m); C.box(M.trim, x + w, x + w + 4, 0, dh + 4, -T - 1, 2, m);
      C.box(M.trim, x - 4, x + w + 4, dh, dh + 4, -T - 1, 2, m);
    }
    return m;
  }

  /* ground floor: x -630..290, z -330..330, 300 tall; the front door on the left and the glass garage door on the right */
  wall({ x0: -630, z0: 330, ry: 0, y0: -6, len: 920, h: 306, doors: [[200, 96, 221], [606, 292, 241]] });
  wall({ x0: -630, z0: -315, ry: -Math.PI / 2, y0: -6, len: 630, h: 306, windows: [[250, 126, 110, 126, "dark", [55]]] });
  wall({ x0: 290, z0: 315, ry: Math.PI / 2, y0: -6, len: 630, h: 306, windows: [[200, 136, 150, 110, "dark"]] });
  wall({ x0: 290, z0: -330, ry: Math.PI, y0: -6, len: 920, h: 306 });
  // the front door: black, with a tall glass light, and a lantern beside it
  C.box(M.trim, -430, -334, -6, 215, 330 - T + 3, 330 - T + 7);
  C.put(M.glassDark, new THREE.PlaneGeometry(14, 160).translate(-354, 115, 330 - T + 7.3));
  C.box(M.trim, -456, -446, 150, 178, 330, 338);
  C.put(M.glow, new THREE.BoxGeometry(6, 18, 2).translate(-451, 162, 338.2));
  // the garage door: a black grid of tinted glass
  {
    const x0 = -24, x1 = 268, y1 = 235, z = 330 - T + 5;
    C.put(M.glassDark, new THREE.PlaneGeometry(x1 - x0, y1 + 6).translate((x0 + x1) / 2, (y1 - 6) / 2, z));
    for (let i = 0; i <= 4; i++) C.box(M.trim, x0 + ((x1 - x0) * i) / 4 - 2.5, x0 + ((x1 - x0) * i) / 4 + 2.5, -6, y1, z, z + 4);
    for (let j = 0; j <= 4; j++) C.box(M.trim, x0, x1, (y1 * j) / 4 - 2.5, (y1 * j) / 4 + 2.5, z, z + 4);
  }
  // the ground floor's roof: a deep black band all round, and the balcony's deck on top with a wooden edge
  C.box(M.trim, -655, 315, 300, 335, -355, 355);
  C.box(M.deck, -290, 315, 335, 337.5, 120, 355);
  C.box(M.deck, -290, 315, 300, 335.5, 355, 357.5);
  // the driveway and the path to the door
  C.box(M.concrete, -40, 284, -5, 1.2, 330, 700);
  for (let i = 0; i < 4; i++) C.box(M.concrete, -430 + (i % 2) * 14, -340 + (i % 2) * 14, -5, 1.0, 360 + i * 70, 410 + i * 70);

  /* upstairs, left: a closed volume flush with the front, with one window */
  wall({ x0: -630, z0: 330, ry: 0, y0: 335, len: 340, h: 275, windows: [[105, 85, 85, 130, "dark"]] });
  wall({ x0: -630, z0: -315, ry: -Math.PI / 2, y0: 335, len: 630, h: 275 });
  wall({ x0: -290, z0: -330, ry: Math.PI, y0: 335, len: 340, h: 275 });
  // its right-hand wall runs the full depth: on the balcony outside, and the office's left wall inside
  wall({ x0: -290, z0: 330 - T, ry: Math.PI / 2, y0: 335, len: 660 - 2 * T, h: 295 });
  C.box(M.trim, -665, -275, 610, 645, -365, 365);

  /* upstairs, right: the office, set back behind the balcony; its open door is 230 wide on x = 0 */
  const DOOR = [175, 230, 232];   // along the wall from x = -290: start, width, height
  wall({ x0: -290, z0: 120, ry: 0, y0: 335, len: 580, h: 295, doors: [DOOR],
        windows: [[38, 70, 92, 140, "clear"], [450, 50, 105, 182, "clear"]], inside: true });
  wall({ x0: 290, z0: 120 - T, ry: Math.PI / 2, y0: 335, len: 450 - 2 * T, h: 295, windows: [[150, 70, 150, 150, "clear", [75]]], inside: true });
  wall({ x0: 290, z0: -330, ry: Math.PI, y0: 335, len: 580, h: 295, inside: true });
  C.box(M.trim, -290, 322, 630, 668, -362, 152);
  // the door, slid all the way open into the wall
  C.box(M.trim, -115, 115, 335, 337.5, 120 - T, 120);

  // the balcony railing: black posts and a top rail, with steel cables between
  {
    const y0 = 337.5, top = y0 + 104, zf = 348, xr = 308;
    const posts = [[-286, zf], [-100, zf], [100, zf], [xr, zf], [xr, 236], [xr, 126]];
    for (const [x, z] of posts) C.box(M.trim, x - 2.5, x + 2.5, y0, top, z - 2.5, z + 2.5);
    C.box(M.trim, -288, xr + 3, top - 4, top + 1, zf - 3, zf + 3);
    C.box(M.trim, xr - 3, xr + 3, top - 4, top + 1, 120, zf + 3);
    for (let i = 1; i <= 7; i++) {
      const y = y0 + (i * (top - y0 - 8)) / 8;
      C.box(M.trim, -286, xr, y - 0.4, y + 0.4, zf - 0.4, zf + 0.4);
      C.box(M.trim, xr - 0.4, xr + 0.4, y - 0.4, y + 0.4, 120, zf);
    }
  }

  /* ---------- the office ---------- */
  {
    const xl = -290, xr = 290 - T, zb = -330 + T, zf = 120 - T, ceil = 628;
    C.put(M.floor, new THREE.PlaneGeometry(xr - xl, zf - zb).rotateX(-Math.PI / 2).translate((xl + xr) / 2, FLOOR, (zb + zf) / 2));
    C.put(M.ceiling, new THREE.PlaneGeometry(xr - xl, zf - zb).rotateX(Math.PI / 2).translate((xl + xr) / 2, ceil, (zb + zf) / 2));
    C.put(M.paint, new THREE.PlaneGeometry(zf - zb, ceil - FLOOR).rotateY(Math.PI / 2).translate(xl + 0.3, (FLOOR + ceil) / 2, (zb + zf) / 2));
    // skirting boards
    C.box(M.ceiling, xl, xr, FLOOR, FLOOR + 9, zb, zb + 1.4);
    C.box(M.ceiling, xl, xl + 1.4, FLOOR, FLOOR + 9, zb, zf);
    C.box(M.ceiling, xr - 1.4, xr, FLOOR, FLOOR + 9, zb, zf);
    // the rug
    C.put(M.rug, new THREE.PlaneGeometry(300, 210).rotateX(-Math.PI / 2).translate(0, FLOOR + 0.4, -110));

    // the chalkboard: an oak frame round a slate, with a chalk ledge underneath
    const b = OFFICE.board, bw = b.w - 12, bh = b.h - 12, z = zb + 0.3;
    C.put(M.slate, new THREE.PlaneGeometry(bw, bh).translate(0, b.y, z + 1.3));
    C.box(M.oak, -b.w / 2, b.w / 2, b.y + bh / 2, b.y + b.h / 2, z, z + 3);
    C.box(M.oak, -b.w / 2, b.w / 2, b.y - b.h / 2, b.y - bh / 2, z, z + 3);
    C.box(M.oak, -b.w / 2, -bw / 2, b.y - bh / 2, b.y + bh / 2, z, z + 3);
    C.box(M.oak, bw / 2, b.w / 2, b.y - bh / 2, b.y + bh / 2, z, z + 3);
    C.box(M.oak, -b.w / 2 + 4, b.w / 2 - 4, b.y - b.h / 2 - 2.5, b.y - b.h / 2, z, z + 8);
    const ly = b.y - b.h / 2;
    for (const [cx, rot] of [[-62, 0.1], [-50, -0.05], [34, 0.3]]) {
      const g = new THREE.CylinderGeometry(0.55, 0.55, 8, 10).rotateZ(Math.PI / 2).rotateY(rot);
      C.put(M.chalk, g.translate(cx, ly + 0.55, z + 5));
    }
    C.box(M.felt, 72, 86, ly, ly + 2.2, z + 1.5, z + 6.5);
    C.box(M.oak, 72, 86, ly + 2.2, ly + 4, z + 1.5, z + 6.5);

    // a picture light over the board, and a soft spotlight on it from the ceiling
    C.box(M.trim, -60, 60, b.y + b.h / 2 + 10, b.y + b.h / 2 + 14, z, z + 12);
    C.put(M.glow, new THREE.BoxGeometry(110, 0.6, 3).translate(0, b.y + b.h / 2 + 9.6, z + 9));
    const spot = new THREE.SpotLight(0xfff0dc, 2.6, 0, 0.62, 0.9, 0);
    spot.position.set(0, ceil - 6, -40);
    spot.target.position.set(0, b.y - 10, zb);
    lights.push(spot, spot.target);
    const fill = new THREE.PointLight(0xffe9cc, 0.55, 700, 0);
    fill.position.set(0, ceil - 40, -100);
    lights.push(fill);
    // ceiling downlights
    for (const [x, zz] of [[-150, -200], [150, -200], [-150, 20], [150, 20]])
      C.put(M.glow, new THREE.CircleGeometry(5, 20).rotateX(Math.PI / 2).translate(x, ceil - 0.2, zz));

    // a tall plant to the left of the board
    {
      const r = rng(77), px = -205, pz = -262;
      C.put(M.ceramic, new THREE.CylinderGeometry(20, 16, 44, 28).translate(px, FLOOR + 22, pz));
      C.put(M.felt, new THREE.CylinderGeometry(18.5, 18.5, 1, 24).translate(px, FLOOR + 43, pz));
      C.put(M.oak, new THREE.CylinderGeometry(1.4, 2, 150, 8).translate(px, FLOOR + 115, pz));
      for (let i = 0; i < 22; i++) {
        const y = FLOOR + 80 + r() * 110, a = r() * 6.3, out = 6 + r() * 22;
        const g = new THREE.SphereGeometry(1, 10, 6).scale(15 + r() * 6, 1.2, 9 + r() * 3);
        g.translate(10, 0, 0).rotateZ(0.2 + r() * 0.5).rotateY(a);
        C.put(M.leaf, g.translate(px + Math.cos(a) * out * 0.3, y, pz - Math.sin(a) * out * 0.3));
      }
    }
    // a low oak cabinet on the right, with books and a lamp
    {
      const x0 = 140, x1 = 272, zz = zb + 1;
      C.box(M.oak, x0, x1, FLOOR + 12, FLOOR + 66, zz, zz + 42);
      for (const lx of [x0 + 4, x1 - 8]) for (const lz of [zz + 4, zz + 36]) C.box(M.trim, lx, lx + 3, FLOOR, FLOOR + 12, lz, lz + 3);
      C.box(M.trim, (x0 + x1) / 2 - 0.4, (x0 + x1) / 2 + 0.4, FLOOR + 14, FLOOR + 64, zz + 42, zz + 42.3);
      const r = rng(5), cols = [0x2f4858, 0xc8553d, 0xe0d6c3, 0x1f1f1f, 0x8a9a5b, 0xd9a441];
      let bx = x0 + 10;
      for (let i = 0; i < 6; i++) {
        const w = 3 + r() * 2.5, hh = 20 + r() * 8, g = new THREE.BoxGeometry(w, hh, 17).translate(bx + w / 2, FLOOR + 66 + hh / 2, zz + 14);
        const c = new THREE.Color(cols[i]), col = new Float32Array(g.attributes.position.count * 3);
        for (let k = 0; k < col.length; k += 3) col.set([c.r, c.g, c.b], k);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        C.put(M.books, g); bx += w + 0.4;
      }
      C.put(M.ceramic, new THREE.CylinderGeometry(5, 7, 26, 20).translate(x1 - 26, FLOOR + 79, zz + 20));
      C.put(M.glow, new THREE.SphereGeometry(13, 24, 16).translate(x1 - 26, FLOOR + 104, zz + 20));
    }
    // a desk along the left wall, with a chair
    {
      const dx = xl + 2, dz0 = -150, dz1 = 10, top = FLOOR + 74;
      C.box(M.oak, dx, dx + 72, top - 3, top, dz0, dz1);
      for (const lz of [dz0 + 3, dz1 - 6]) { C.box(M.trim, dx + 4, dx + 7, FLOOR, top - 3, lz, lz + 3); C.box(M.trim, dx + 64, dx + 67, FLOOR, top - 3, lz, lz + 3); }
      C.box(M.trim, dx + 20, dx + 45, top, top + 1.5, -80, -50);   // a closed notebook
      const cx = dx + 95, cz = -70;
      C.box(M.felt, cx - 23, cx + 23, FLOOR + 44, FLOOR + 50, cz - 23, cz + 23);
      C.box(M.felt, cx + 18, cx + 24, FLOOR + 50, FLOOR + 95, cz - 22, cz + 22);
      C.put(M.trim, new THREE.CylinderGeometry(2.5, 2.5, 40, 10).translate(cx, FLOOR + 22, cz));
      C.box(M.trim, cx - 28, cx + 28, FLOOR + 1, FLOOR + 4, cz - 3, cz + 3);
      C.box(M.trim, cx - 3, cx + 3, FLOOR + 1, FLOOR + 4, cz - 28, cz + 28);
    }
  }

  /* ---------- planting: shrubs and ornamental grasses along the front, and trees round the house ---------- */
  {
    const r = rng(31), parts = [];
    const blob = (x, y, z, rad, col, sq = 1) => {
      const g = new THREE.SphereGeometry(rad, 18, 12), p = g.attributes.position, c = new THREE.Color(col), cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const k = 1 + Math.sin(p.getX(i) * 0.11 + p.getY(i) * 0.07) * 0.08 + Math.sin(p.getZ(i) * 0.13 + p.getX(i) * 0.05) * 0.08;
        p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * sq, p.getZ(i) * k);
      }
      g.computeVertexNormals();
      const col2 = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { cc.copy(c).multiplyScalar(0.75 + 0.45 * (p.getY(i) / rad * 0.5 + 0.5)); col2.set([cc.r, cc.g, cc.b], i * 3); }
      g.setAttribute("color", new THREE.BufferAttribute(col2, 3));
      parts.push(g.translate(x, y, z));
    };
    const trunk = (x, z, h, rad) => {
      const g = new THREE.CylinderGeometry(rad * 0.7, rad, h, 8).translate(x, h / 2, z), c = new THREE.Color(0x5a4632);
      const col = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < col.length; i += 3) col.set([c.r, c.g, c.b], i);
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      parts.push(g);
    };
    const tree = (x, z, s) => {
      trunk(x, z, 330 * s, 16 * s);
      const greens = [0x2f5a24, 0x3a6a2a, 0x274d1f];
      for (let i = 0; i < 4; i++) blob(x + (r() - 0.5) * 140 * s, (380 + r() * 220) * s, z + (r() - 0.5) * 140 * s, (140 + r() * 70) * s, greens[i % 3]);
    };
    // shrubs and lavender in a bed along the front
    for (let i = 0; i < 7; i++) blob(-600 + i * 34 + r() * 10, 18, 352 + r() * 12, 22 + r() * 10, i % 3 === 1 ? 0x7d6aa8 : 0x4f7a34, 0.8);
    for (let i = 0; i < 3; i++) blob(-320 + i * 40, 16, 352 + r() * 8, 18 + r() * 6, 0x6b8f3a, 1.4);
    blob(330, 60, 260, 70, 0x2f5a24, 1.5);
    // trees: two by the house, more behind it and away off across the fields
    tree(-900, -120, 1.1); tree(560, -520, 1.25); tree(-760, -760, 1); tree(150, -900, 1.3); tree(-300, -1150, 1.15);
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * 0.95 + (i / 17) * Math.PI * 1.9 + (r() - 0.5) * 0.15, d = 2600 + r() * 2600;
      tree(Math.sin(a) * d, -Math.cos(a) * d * 0.9 - 400, 1 + r() * 0.6);
    }
    const g = mergeGeometries(parts.map(p => (p.index ? p.toNonIndexed() : p)));
    const m = new THREE.Mesh(g, M.plants);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  }

  C.build(group);
  for (const l of lights) group.add(l);
  return { group, quality };
}
