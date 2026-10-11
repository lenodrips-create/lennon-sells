// A modern two-storey house on the lawn, in centimetres like the laptop: white lap siding, black flat roofs with
// deep fascias, black-framed windows, a glass garage door and a balcony with a cable railing over it. Behind the
// balcony's open door is the office, with a chalkboard in the middle of its back wall.
//
// It's built to look real: the siding, decking, oak floor and concrete are painted with relief (normal maps) and
// varied roughness; the house reflects a real sky (a Poly Haven HDRI, noon_grass, CC0) in its glass and metal;
// corners, the ground and the undersides of the overhangs are shaded the way bounced light leaves them; the glass is
// see-through, with curtained rooms behind it; and the office is lit by a model of the daylight coming in through
// its door and windows. Its plant and armchair are models with photographed materials, from the Khronos glTF samples.
//
// The house's own axes: +z is the front. The office's door, the balcony and the chalkboard all sit on x = 0, so
// the camera flies straight in along that line. The laptop lies on the same line, out on the lawn in front.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import painterSrc from "./paint.worker.txt";   // paint.js, built as text (see package.json)

const T = 15;                         // wall thickness
const FLOOR = 335.5;                  // the office floor, on top of the ground floor's roof
const EYE = FLOOR + 150;              // standing eye height in the office
const ROOM = { x0: -290, x1: 290 - T, z0: -330 + T, z1: 120 - T, y0: FLOOR, y1: 628 };
export const OFFICE = {
  eye: EYE,
  door: 120,                          // the office's front wall (outer face), where the balcony door is
  board: { y: EYE, z: -314.7 + 1.6, w: 252, h: 132 },   // the chalkboard's face, on the back wall
};
const ASSETS = "mac/assets/";
const SKY_K = 2.7;                    // brings the HDRI to the brightness of the rest of the scene's sky

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
/* ---------- textures from the painter (paint.js, in a worker) ---------- */
function dataTex(data, w, h, srgb, rep) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8;
  t.repeat.set(1 / rep[0], 1 / rep[1]);
  t.needsUpdate = true;
  return t;
}
const surfaceMaps = s => {
  const rep = [s.cmW, s.cmH];
  return { map: dataTex(s.col, s.w, s.h, true, rep), normalMap: dataTex(s.nrm, s.w, s.h, false, rep), roughnessMap: dataTex(s.rgh, s.w, s.h, false, rep) };
};

// a well-used slate: dark green-black, a fine tooth, and the faint swirls of a board that's been wiped many times
function slateTex() {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const x = c.getContext("2d"), r = rng(4242), w = 1024, h = 512;
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
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// a soft contact shadow, for under furniture: a blurred dark square (drawn as the shadow of one off the canvas)
function contactTex() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  x.shadowColor = "#000"; x.shadowBlur = 16; x.shadowOffsetX = 256;
  x.fillRect(26 - 256, 26, 76, 76);
  return new THREE.CanvasTexture(c);
}

/* ---------- light that bounces: soft shading where surfaces meet, worked out from where the point is ---------- */
// Each material gets a little GLSL that dims its bounced (ambient) light near corners, the ground and under the
// overhangs; direct sunlight and its shadows are left to the shadow map.
const AO_LIB = `
  float aoPlane(float d, float r, float k) { return 1.0 - k * exp(-max(d, 0.0) / r) * smoothstep(0.4, 2.5, d); }
  float aoRoom(vec3 p) {
    return aoPlane(p.x - (${ROOM.x0.toFixed(1)}), 42.0, 0.34) * aoPlane(${ROOM.x1.toFixed(1)} - p.x, 42.0, 0.34)
         * aoPlane(p.z - (${ROOM.z0.toFixed(1)}), 42.0, 0.34) * aoPlane(${ROOM.z1.toFixed(1)} - p.z, 42.0, 0.34)
         * aoPlane(p.y - ${ROOM.y0.toFixed(1)}, 36.0, 0.32) * aoPlane(${ROOM.y1.toFixed(1)} - p.y, 48.0, 0.3);
  }`;
function shaded(mat, key, code) {
  const top = code.includes("vTop");
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vHL;${top ? "\nattribute float aoTop;\nvarying float vTop;" : ""}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvHL = position;${top ? "\nvTop = aoTop;" : ""}`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vHL;${top ? "\nvarying float vTop;" : ""}\n${AO_LIB}`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>
        { vec3 p = vHL; float aoH = ${code};
          reflectedLight.indirectDiffuse *= aoH; reflectedLight.indirectSpecular *= mix(1.0, aoH, 0.75); }`);
  };
  mat.customProgramCacheKey = () => "house-" + key;
  return mat;
}

/* ---------- materials ---------- */
function mats(q) {
  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    // outside: these reflect the real sky once it has loaded
    siding: shaded(std({ color: 0xffffff, roughness: 1 }), "siding",
      "aoPlane(vTop - p.y, 46.0, 0.5) * aoPlane(p.y + 6.0, 24.0, 0.38) * (1.0 - 0.32 * exp(-length(vec2(p.x + 290.0, p.z - 120.0)) / 46.0))"),
    corner: shaded(std({ color: 0xe9e9e6, roughness: 0.55 }), "corner", "aoPlane(vTop - p.y, 46.0, 0.45) * aoPlane(p.y + 6.0, 24.0, 0.35)"),
    found: shaded(std({ color: 0x8f8c86, roughness: 0.95 }), "found", "aoPlane(p.y + 6.0, 10.0, 0.4)"),
    alu: std({ color: 0x111214, roughness: 0.32, metalness: 0.6 }),          // window and door frames, railing
    fascia: std({ color: 0x17181a, roughness: 0.45, metalness: 0.35 }),       // the roofs' deep black edges
    soffit: std({ color: 0x232426, roughness: 0.7, metalness: 0.1 }),
    deck: shaded(std({ roughness: 1 }), "deck", "aoPlane(p.x + 290.0, 36.0, 0.38) * aoPlane(p.z - 120.0, 36.0, 0.38)"),
    cedar: std({ roughness: 1 }),
    concrete: shaded(std({ roughness: 1 }), "concrete", "aoPlane(p.z - 330.0, 32.0, 0.38)"),
    cable: std({ color: 0xc4c8cc, roughness: 0.28, metalness: 1 }),
    steel: std({ color: 0xd2d4d6, roughness: 0.22, metalness: 1 }),
    // glass: what's behind it shows through, a little darkened, with the sky reflected on top (Fresnel-weighted)
    glass: std({ color: 0x000000, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false,
                 blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide }),
    frosted: std({ color: 0xa9afb3, roughness: 0.55, metalness: 0, transparent: true, opacity: 0.9, depthWrite: false }),
    glow: std({ color: 0xfff3dd, emissive: 0xffe2b0, emissiveIntensity: 1.8, roughness: 1 }),
    plants: std({ vertexColors: true, roughness: 0.85, envMapIntensity: 0.45 }),
    // behind the ground floor's windows: rooms in shade, seen from the bright outside
    roomBack: new THREE.MeshBasicMaterial({ vertexColors: true }),
    curtain: new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    // inside the office: lit by the daylight that comes in through its door and windows
    paint: shaded(std({ color: 0xeeeae3, roughness: 0.9 }), "paint", "aoRoom(p)"),
    ceiling: shaded(std({ color: 0xf6f4ef, roughness: 0.95 }), "ceiling", "aoRoom(p)"),
    skirting: shaded(std({ color: 0xf4f2ee, roughness: 0.5 }), "skirting", "aoRoom(p)"),
    floor: shaded(std({ roughness: 1 }), "floor", "aoRoom(p)"),
    rug: shaded(std({ roughness: 1 }), "rug", "aoRoom(p)"),
    oak: shaded(std({ roughness: 1 }), "oak", "aoRoom(p)"),
    slate: shaded(std({ map: slateTex(), roughness: 0.9 }), "slate", "aoRoom(p)"),
    chalk: std({ color: 0xf4f2ea, roughness: 1 }),
    felt: std({ color: 0x3a3d42, roughness: 1 }),
    ceramic: std({ color: 0xf2f0ec, roughness: 0.3 }),
    blackMetal: std({ color: 0x141416, roughness: 0.4, metalness: 0.7 }),
    books: std({ vertexColors: true, roughness: 0.8 }),
    contact: new THREE.MeshBasicMaterial({ color: 0x000000, map: contactTex(), transparent: true, opacity: 0.5, depthWrite: false }),
  };
  M.exterior = [M.siding, M.corner, M.found, M.alu, M.fascia, M.soffit, M.deck, M.cedar, M.concrete, M.cable, M.steel, M.glass, M.frosted];
  M.interior = [M.paint, M.ceiling, M.skirting, M.floor, M.rug, M.oak, M.slate, M.chalk, M.felt, M.ceramic, M.blackMetal, M.books];
  // the painted surfaces, and what paint.js calls them
  M.surfaces = [[M.siding, "siding"], [M.floor, "floor"], [M.deck, "deck"], [M.cedar, "cedar"], [M.oak, "oak"], [M.concrete, "concrete"], [M.rug, "rug"]];
  return M;
}

/* ---------- building blocks: geometry is gathered per material and merged, so the house is a few draw calls ---------- */
function collector() {
  const lists = new Map();
  const put = (mat, geo, m) => {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (m) g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color", "aoTop"].includes(k)) g.deleteAttribute(k);
    if (!lists.has(mat)) lists.set(mat, []);
    lists.get(mat).push(g);
  };
  // a box whose texture coordinates are in centimetres, so textures keep their size whatever the box's
  const boxGeo = (w, h, d) => {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sizes[f][0], uv.getY(i) * sizes[f][1]); }
    return g;
  };
  const box = (mat, x0, x1, y0, y1, z0, z1, m) =>
    put(mat, boxGeo(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m);
  // a horizontal surface facing up (or down), its texture coordinates in centimetres
  const flatXZ = (mat, x0, x1, z0, z1, y, down = false) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(down ? Math.PI / 2 : -Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
    put(mat, g);
  };
  const build = group => {
    for (const [mat, geos] of lists) {
      if (geos.some(g => g.attributes.aoTop))
        for (const g of geos) if (!g.attributes.aoTop) g.setAttribute("aoTop", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(1e4), 1));
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.castShadow = !mat.transparent && mat.isMeshStandardMaterial;
      mesh.receiveShadow = !mat.transparent && !mat.isMeshBasicMaterial;
      if (mat.transparent) mesh.renderOrder = 1;
      group.add(mesh);
    }
  };
  return { put, box, boxGeo, flatXZ, build };
}
const mat4 = (x, y, z, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const withTop = (g, top) => g.setAttribute("aoTop", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(top), 1));

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

// folded curtain fabric, w wide and h tall, its folds shaded into its colours (it's lit by the room, not the sun)
function curtainGeo(w, h, base, seed) {
  const r = rng(seed), seg = Math.max(8, Math.round(w / 3));
  const g = new THREE.PlaneGeometry(w, h, seg, 1), p = g.attributes.position, col = new Float32Array(p.count * 3);
  const ph = r() * 6, f = 0.75 + r() * 0.2;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), a = x * f + ph;
    p.setZ(i, Math.sin(a) * 2.2);
    const k = (0.78 + 0.22 * Math.cos(a)) * (0.82 + 0.18 * (y / h + 0.5));
    col.set([base[0] * k, base[1] * k, base[2] * k], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
// colour a geometry from bottom to top
const vcol = (g, top, bottom) => {
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  g.computeBoundingBox();
  const y0 = g.boundingBox.min.y, y1 = g.boundingBox.max.y;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - y0) / Math.max(1e-3, y1 - y0); col.set([0, 1, 2].map(k => bottom[k] + (top[k] - bottom[k]) * t), i * 3); }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
};

/* ---------- the house ---------- */
export function makeHouse(quality, renderer, ready = () => {}) {
  const q = quality === "high", M = mats(q), C = collector(), group = new THREE.Group();
  const lights = [];
  const r = rng(909);

  // a wall: from (x0, z0) along its own x, facing outwards along its own z (ry turns it), its outer face on that
  // line; T thick inwards. `top` is the underside of the overhang above it, for the shading. Windows get frames,
  // sills and glass; `inside` lines it with paint for the office.
  function wall({ x0, z0, ry, y0, len, h, top, doors = [], windows = [], inside = false }) {
    const m = mat4(x0, y0, z0, ry);
    const g = new THREE.ExtrudeGeometry(wallShape(len, h, doors, windows, false), { depth: T, bevelEnabled: false });
    g.translate(0, 0, -T);
    C.put(M.siding, withTop(g, top), m);
    if (inside) {
      const l = new THREE.ShapeGeometry(wallShape(len, h, doors, windows, true));
      l.rotateY(Math.PI); l.translate(len, 0, -T - 0.3);
      C.put(M.paint, l, m);
    }
    for (const [x, y, w, wh, kind = "room", bars = []] of windows) windowUnit(m, x, y, w, wh, kind, bars, inside);
    for (const [x, w, dh] of doors) {   // the door's black frame
      C.box(M.alu, x - 5, x, 0, dh + 5, -T - 1, 2, m); C.box(M.alu, x + w, x + w + 5, 0, dh + 5, -T - 1, 2, m);
      C.box(M.alu, x - 5, x + w + 5, dh, dh + 5, -T - 1, 2, m);
    }
    return m;
  }
  // a window: a black aluminium frame through the wall's depth, a sash set back in it, the glass, a sill, and
  // (on the ground floor and the closed upstairs room) a curtained room behind
  function windowUnit(m, x, y, w, wh, kind, bars, inside) {
    const F = 6, S = 3.5, gz = -T / 2 - 1;
    C.box(M.alu, x, x + w, y, y + F, -T - 1, 1.5, m); C.box(M.alu, x, x + w, y + wh - F, y + wh, -T - 1, 1.5, m);
    C.box(M.alu, x, x + F, y, y + wh, -T - 1, 1.5, m); C.box(M.alu, x + w - F, x + w, y, y + wh, -T - 1, 1.5, m);
    // the sash: a slimmer frame inside, a little behind the face
    C.box(M.alu, x + F, x + w - F, y + F, y + F + S, gz - 1.5, gz + 2.5, m); C.box(M.alu, x + F, x + w - F, y + wh - F - S, y + wh - F, gz - 1.5, gz + 2.5, m);
    C.box(M.alu, x + F, x + F + S, y + F, y + wh - F, gz - 1.5, gz + 2.5, m); C.box(M.alu, x + w - F - S, x + w - F, y + F, y + wh - F, gz - 1.5, gz + 2.5, m);
    for (const b of bars) b < 1 ? C.box(M.alu, x + F, x + w - F, y + wh * b - 2, y + wh * b + 2, gz - 1.5, gz + 2.5, m)
                          : C.box(M.alu, x + b - 2, x + b + 2, y + F, y + wh - F, gz - 1.5, gz + 2.5, m);
    // the sill: a black metal flashing that sheds water off the wall
    C.box(M.alu, x - 3, x + w + 3, y - 2.2, y, -2, 4.5, m);
    C.put(M.glass, new THREE.PlaneGeometry(w - 2 * F - 2 * S, wh - 2 * F - 2 * S).translate(x + w / 2, y + wh / 2, gz), m);
    if (kind === "room") {
      // the room behind: its back wall in shade, a little lighter towards the window, and curtains half drawn
      const back = vcol(new THREE.PlaneGeometry(w + 60, wh + 60), [0.2, 0.185, 0.17], [0.11, 0.1, 0.09]);
      C.put(M.roomBack, back.translate(x + w / 2, y + wh / 2, -T - 90), m);
      for (const [sx, sw] of [[x + F - 2, w * (0.22 + r() * 0.1)], [x + w - F + 2, -w * (0.18 + r() * 0.1)]]) {
        const cg = curtainGeo(Math.abs(sw), wh + 10, [0.62, 0.59, 0.54], Math.floor(r() * 1e6));
        C.put(M.curtain, cg.translate(sx + sw / 2, y + wh / 2, -T - 6), m);
      }
      const sheer = vcol(new THREE.PlaneGeometry(w, wh), [0.36, 0.35, 0.33], [0.3, 0.29, 0.27]);   // a sheer across it all
      C.put(M.roomBack, sheer.translate(x + w / 2, y + wh / 2, -T - 12), m);
    }
    if (kind === "office" && inside) {   // a painted casing and a sill on the inside
      const zc = -T - 0.3;
      C.box(M.skirting, x - 7, x + w + 7, y + wh, y + wh + 7, zc - 2, zc, m);
      C.box(M.skirting, x - 7, x, y - 3, y + wh, zc - 2, zc, m); C.box(M.skirting, x + w, x + w + 7, y - 3, y + wh, zc - 2, zc, m);
      C.box(M.skirting, x - 9, x + w + 9, y - 3, y, zc - 4, zc + T - 3, m);
    }
  }
  // a white corner board at an outside corner (cx, cz), whose faces look along sx and sz
  const corner = (cx, cz, sx, sz, y0, y1, top) => {
    const add = (x0, x1, z0, z1) => C.put(M.corner, withTop(C.boxGeo(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), top));
    add(cx - sx * 11, cx + sx * 2.5, cz, cz + sz * 2.5);
    add(cx, cx + sx * 2.5, cz - sz * 11, cz);
  };
  const sconce = (x, y, z) => {   // a black cylinder wall light, washing up and down
    C.put(M.alu, new THREE.CylinderGeometry(5, 5, 26, 24).translate(x, y, z + 6.5));
    C.box(M.alu, x - 2, x + 2, y - 3, y + 3, z, z + 2);
    C.put(M.glow, new THREE.CircleGeometry(4.2, 20).rotateX(Math.PI / 2).translate(x, y - 13.05, z + 6.5));
    C.put(M.glow, new THREE.CircleGeometry(4.2, 20).rotateX(-Math.PI / 2).translate(x, y + 13.05, z + 6.5));
  };
  const downlight = (x, y, z) => C.put(M.glow, new THREE.CircleGeometry(3.5, 20).rotateX(Math.PI / 2).translate(x, y - 0.1, z));

  /* ground floor: x -630..290, z -330..330, siding from a concrete foundation at 14 cm up to 300 */
  const G0 = 14;
  wall({ x0: -630, z0: 330, ry: 0, y0: G0, len: 920, h: 300 - G0, top: 300, doors: [[200, 96, 215 - G0], [606, 292, 235 - G0]] });
  wall({ x0: -630, z0: -315, ry: -Math.PI / 2, y0: G0, len: 630, h: 300 - G0, top: 300, windows: [[250, 120 - G0, 110, 126, "room", [55]]] });
  wall({ x0: 290, z0: 315, ry: Math.PI / 2, y0: G0, len: 630, h: 300 - G0, top: 300, windows: [[200, 136 - G0, 150, 110, "room"]] });
  wall({ x0: 290, z0: -330, ry: Math.PI, y0: G0, len: 920, h: 300 - G0, top: 300 });
  // the foundation, a little proud of the siding, with a concrete step at the front door
  C.box(M.found, -631, 291, -6, G0, -331, 316);
  for (const [a, b] of [[-631, -430], [-334, -24], [268, 291]]) C.box(M.found, a, b, -6, G0, 316, 331);
  C.box(M.concrete, -452, -312, -5, G0 - 1, 331, 376);
  for (const [cx, cz, sx, sz] of [[-630, 330, -1, 1], [290, 330, 1, 1], [-630, -330, -1, -1], [290, -330, 1, -1]]) corner(cx, cz, sx, sz, G0, 300, 300);

  // the front door: black aluminium with a full-height frosted glass light and a long steel pull
  {
    const x0 = -430, x1 = -334, z = 330 - T + 4;
    C.box(M.alu, x0, x0 + 9, G0, 215, z, z + 4); C.box(M.alu, x1 - 9, x1, G0, 215, z, z + 4);
    C.box(M.alu, x0, x1, 215 - 9, 215, z, z + 4); C.box(M.alu, x0, x1, G0, G0 + 12, z, z + 4);
    C.put(M.roomBack, vcol(new THREE.PlaneGeometry(110, 220), [0.17, 0.16, 0.15], [0.09, 0.085, 0.08]).translate((x0 + x1) / 2, 110, 290));
    C.put(M.frosted, new THREE.PlaneGeometry(x1 - x0 - 18, 215 - G0 - 21).translate((x0 + x1) / 2, (G0 + 12 + 206) / 2, z + 2));
    C.put(M.glass, new THREE.PlaneGeometry(x1 - x0 - 18, 215 - G0 - 21).translate((x0 + x1) / 2, (G0 + 12 + 206) / 2, z + 2.3));
    C.put(M.steel, new THREE.CylinderGeometry(1.3, 1.3, 90, 12).translate(x1 - 16, 120, z + 9));
    for (const yy of [80, 160]) C.put(M.steel, new THREE.CylinderGeometry(0.9, 0.9, 5, 10).rotateX(Math.PI / 2).translate(x1 - 16, yy, z + 6));
  }
  sconce(-458, 175, 330); sconce(281, 175, 330);
  // the garage door: an aluminium grid of frosted glass, 4 by 4
  {
    const x0 = -24, x1 = 268, y0 = 1.2, y1 = 235, z = 330 - T + 5;
    C.put(M.roomBack, vcol(new THREE.PlaneGeometry(x1 - x0, y1 - y0), [0.2, 0.2, 0.2], [0.07, 0.07, 0.07]).translate((x0 + x1) / 2, (y0 + y1) / 2, 250));
    C.put(M.frosted, new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z));
    C.put(M.glass, new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z + 0.4));
    for (let i = 0; i <= 4; i++) { const xx = x0 + ((x1 - x0) * i) / 4; C.box(M.alu, xx - 3, xx + 3, y0, y1, z - 1, z + 3.5); }
    for (let j = 0; j <= 4; j++) { const yy = y0 + ((y1 - y0) * j) / 4; C.box(M.alu, x0, x1, yy - 3, yy + 3, z - 1, z + 3.5); }
  }
  // a downpipe from the ground floor's roof, at the front right corner
  C.box(M.alu, 293, 300, 6, 300, 318, 325);
  C.box(M.alu, 293, 300, 0, 6, 318, 337);

  // the ground floor's roof: a deep black band all round, soffit lights under it, and the balcony's deck on top
  // with a cedar edge
  C.box(M.fascia, -655, 315, 300, 335, -355, 355);
  for (const x of [-560, -380, -200, 40, 220]) downlight(x, 300, 344);
  C.flatXZ(M.deck, -290, 315, 120, 355, 337.5);
  C.box(M.deck, -290, 315, 335, 337.4, 120, 355);
  C.box(M.cedar, -290, 315, 300, 335.5, 355, 357.5);
  C.box(M.cedar, 315, 317.5, 300, 335.5, 120, 357.5);
  // the driveway, in slabs with sawn joints, and stepping stones to the door
  for (let i = 0; i < 2; i++) C.flatXZ(M.concrete, -40, 284, 331 + i * 185, 331 + (i + 1) * 185 - 1.2, 1.2);
  C.box(M.found, -40, 284, -5, 0.6, 331, 701);
  for (let i = 0; i < 4; i++) {
    const x0 = -432 + (i % 2) * 14;
    C.flatXZ(M.concrete, x0, x0 + 96, 386 + i * 66, 386 + i * 66 + 52, 1.2);
    C.box(M.found, x0, x0 + 96, -5, 1.15, 386 + i * 66, 386 + i * 66 + 52);
  }

  /* upstairs, left: a closed volume flush with the front, with one window */
  wall({ x0: -630, z0: 330, ry: 0, y0: 335, len: 340, h: 275, top: 610, windows: [[105, 85, 85, 130, "room"]] });
  wall({ x0: -630, z0: -315, ry: -Math.PI / 2, y0: 335, len: 630, h: 275, top: 610 });
  wall({ x0: -290, z0: -330, ry: Math.PI, y0: 335, len: 340, h: 275, top: 610 });
  // its right-hand wall runs the full depth: on the balcony outside, and the office's left wall inside
  wall({ x0: -290, z0: 330 - T, ry: Math.PI / 2, y0: 335, len: 660 - 2 * T, h: 295, top: 630 });
  for (const [cx, cz, sx, sz] of [[-630, 330, -1, 1], [-630, -330, -1, -1], [-290, 330, 1, 1]]) corner(cx, cz, sx, sz, 335, 610, 610);
  C.box(M.fascia, -665, -275, 610, 645, -365, 365);
  C.flatXZ(M.soffit, -665, -275, -365, 365, 609.9, true);
  for (const z of [-200, 0, 200]) downlight(-648, 610, z);

  /* upstairs, right: the office, set back behind the balcony; its open door is 230 wide on x = 0 */
  const DOOR = [175, 230, 232];   // along the wall from x = -290: start, width, height
  wall({ x0: -290, z0: 120, ry: 0, y0: 335, len: 580, h: 295, top: 630, doors: [DOOR],
        windows: [[38, 70, 92, 140, "office"], [450, 50, 105, 182, "office", [52.5]]], inside: true });
  wall({ x0: 290, z0: 120 - T, ry: Math.PI / 2, y0: 335, len: 450 - 2 * T, h: 295, top: 630, windows: [[150, 70, 150, 150, "office", [75]]], inside: true });
  wall({ x0: 290, z0: -330, ry: Math.PI, y0: 335, len: 580, h: 295, top: 630, inside: true });
  for (const [cx, cz, sx, sz] of [[290, 120, 1, 1], [290, -330, 1, -1]]) corner(cx, cz, sx, sz, 335, 630, 630);
  C.box(M.fascia, -290, 322, 630, 668, -362, 152);
  C.flatXZ(M.soffit, -290, 322, 120, 152, 629.9, true);
  for (const x of [-200, -60, 60, 200]) downlight(x, 630, 138);
  // the door, slid all the way open into the wall: its sill track and the edge of the panel showing
  C.box(M.alu, -115, 115, 335, 337.8, 120 - T, 121);
  C.box(M.alu, 115, 121, 337.8, 567, 120 - T + 3, 120 - 3);

  // the balcony railing: black posts and top rail, with taut steel cables between
  {
    const y0 = 337.5, top = y0 + 104, zf = 348, xr = 308;
    const posts = [[-286, zf], [-100, zf], [100, zf], [xr, zf], [xr, 236], [xr, 126]];
    for (const [x, z] of posts) C.box(M.alu, x - 2.5, x + 2.5, y0, top, z - 2.5, z + 2.5);
    C.box(M.alu, -288, xr + 3, top - 4, top + 1, zf - 3, zf + 3);
    C.box(M.alu, xr - 3, xr + 3, top - 4, top + 1, 120, zf + 3);
    for (let i = 1; i <= 8; i++) {
      const y = y0 + (i * (top - y0 - 8)) / 9;
      C.put(M.cable, new THREE.CylinderGeometry(0.28, 0.28, xr + 286, 6).rotateZ(Math.PI / 2).translate((xr - 286) / 2, y, zf));
      C.put(M.cable, new THREE.CylinderGeometry(0.28, 0.28, zf - 120, 6).rotateX(Math.PI / 2).translate(xr, y, (zf + 120) / 2));
    }
  }

  /* ---------- the office ---------- */
  {
    const { x0: xl, x1: xr, z0: zb, z1: zf, y1: ceil } = ROOM;
    C.flatXZ(M.floor, xl, xr, zb, zf, FLOOR);
    C.flatXZ(M.ceiling, xl, xr, zb, zf, ceil, true);
    C.put(M.paint, new THREE.PlaneGeometry(zf - zb, ceil - FLOOR).rotateY(Math.PI / 2).translate(xl + 0.3, (FLOOR + ceil) / 2, (zb + zf) / 2));
    // skirting boards, and a casing round the door
    C.box(M.skirting, xl, xr, FLOOR, FLOOR + 10, zb, zb + 1.5);
    C.box(M.skirting, xl, xl + 1.5, FLOOR, FLOOR + 10, zb, zf);
    C.box(M.skirting, xr - 1.5, xr, FLOOR, FLOOR + 10, zb, zf);
    C.box(M.skirting, -122, 122, FLOOR + 232, FLOOR + 240, zf - 2, zf);
    C.box(M.skirting, -122, -115, FLOOR, FLOOR + 232, zf - 2, zf); C.box(M.skirting, 115, 122, FLOOR, FLOOR + 232, zf - 2, zf);
    // the rug
    C.flatXZ(M.rug, -150, 150, -215, -5, FLOOR + 0.6);
    C.box(M.rug, -150, 150, FLOOR, FLOOR + 0.6, -215, -5);

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
    C.box(M.blackMetal, -60, 60, b.y + b.h / 2 + 10, b.y + b.h / 2 + 14, z, z + 12);
    C.box(M.blackMetal, -2, 2, b.y + b.h / 2 + 2, b.y + b.h / 2 + 12, z, z + 3);
    C.put(M.glow, new THREE.BoxGeometry(110, 0.6, 3).translate(0, b.y + b.h / 2 + 9.6, z + 9));
    const spot = new THREE.SpotLight(0xfff0dc, 1.8, 0, 0.62, 0.9, 0);
    spot.position.set(0, ceil - 6, -40);
    spot.target.position.set(0, b.y - 10, zb);
    lights.push(spot, spot.target);
    for (const [x, zz] of [[-150, -200], [150, -200], [-150, 20], [150, 20]]) {
      C.put(M.glow, new THREE.CircleGeometry(5, 20).rotateX(Math.PI / 2).translate(x, ceil - 0.2, zz));
      C.put(M.blackMetal, new THREE.RingGeometry(5, 6.2, 24).rotateX(Math.PI / 2).translate(x, ceil - 0.15, zz));
    }

    // a low oak cabinet on the right, with books and a lamp
    {
      const x0 = 140, x1 = 272, zz = zb + 1;
      C.box(M.oak, x0, x1, FLOOR + 12, FLOOR + 66, zz, zz + 42);
      for (const lx of [x0 + 4, x1 - 8]) for (const lz of [zz + 4, zz + 36]) C.box(M.blackMetal, lx, lx + 3, FLOOR, FLOOR + 12, lz, lz + 3);
      C.box(M.blackMetal, (x0 + x1) / 2 - 0.4, (x0 + x1) / 2 + 0.4, FLOOR + 14, FLOOR + 64, zz + 42, zz + 42.3);
      for (const hx of [(x0 + x1) / 2 - 8, (x0 + x1) / 2 + 5]) C.box(M.blackMetal, hx, hx + 3, FLOOR + 50, FLOOR + 52, zz + 42, zz + 44);
      const cols = [0x2f4858, 0xc8553d, 0xe0d6c3, 0x1f1f1f, 0x8a9a5b, 0xd9a441], rb = rng(5);
      let bx = x0 + 10;
      for (let i = 0; i < 6; i++) {
        const w = 3 + rb() * 2.5, hh = 20 + rb() * 8, g = new THREE.BoxGeometry(w, hh, 17).translate(bx + w / 2, FLOOR + 66 + hh / 2, zz + 14);
        const c = new THREE.Color(cols[i]), col = new Float32Array(g.attributes.position.count * 3);
        for (let k = 0; k < col.length; k += 3) col.set([c.r, c.g, c.b], k);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        C.put(M.books, g); bx += w + 0.4;
      }
      C.put(M.ceramic, new THREE.CylinderGeometry(5, 7, 26, 24).translate(x1 - 26, FLOOR + 79, zz + 20));
      C.put(M.glow, new THREE.SphereGeometry(13, 32, 20).translate(x1 - 26, FLOOR + 104, zz + 20));
      contact(x0 - 6, x1 + 6, zz - 2, zz + 50, 0.55);
    }
    // a desk along the left wall
    {
      const dx = xl + 2, dz0 = -150, dz1 = 10, top = FLOOR + 74;
      C.box(M.oak, dx, dx + 72, top - 3, top, dz0, dz1);
      for (const lz of [dz0 + 3, dz1 - 6]) { C.box(M.blackMetal, dx + 4, dx + 7, FLOOR, top - 3, lz, lz + 3); C.box(M.blackMetal, dx + 64, dx + 67, FLOOR, top - 3, lz, lz + 3); }
      C.box(M.blackMetal, dx + 20, dx + 45, top, top + 1.5, -80, -50);   // a closed notebook
      contact(dx - 4, dx + 76, dz0 - 4, dz1 + 4, 0.35);
    }
  }
  // a soft shadow on the floor under furniture, where the room's light can't reach
  function contact(x0, x1, z0, z1, k) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, FLOOR + 0.9, (z0 + z1) / 2);
    const mesh = new THREE.Mesh(g, M.contact.clone());
    mesh.material.opacity = k;
    mesh.renderOrder = 2;
    group.add(mesh);
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

  contact(-205, -95, -240, -145, 0.42);   // under the armchair and the plant, which load below
  contact(-262, -170, -290, -195, 0.4);

  /* ---------- getting it ready, off the page's thread where it can be ---------- */
  // The surfaces are painted and the sky decoded in a worker, and the furniture loads, while the visitor is still up
  // in the sky. Then it all goes on at once and `ready` compiles the shaders in the background, so nothing stalls
  // when the house first comes into view. Until then the house shows in plain colours.
  const pmrem = new THREE.PMREMGenerator(renderer), pending = new Map();
  let worker = null, seq = 0;
  try {
    worker = new Worker(URL.createObjectURL(new Blob([painterSrc], { type: "text/javascript" })));
    worker.onmessage = e => { const f = pending.get(e.data.id); pending.delete(e.data.id); if (f) f(e.data); };
  } catch (e) { worker = null; }
  const ask = msg => new Promise((res, rej) => {
    if (!worker) return rej(new Error("no worker"));
    const id = ++seq;
    pending.set(id, res);
    worker.postMessage({ ...msg, id });
  });
  const abs = f => new URL(ASSETS + f, document.baseURI).href;
  const surfaces = Promise.all(M.surfaces.map(([mat, name]) => ask({ kind: "surface", name, q }).then(t => [mat, surfaceMaps(t)], () => null)));
  const sky = ask({ kind: "hdr", url: abs("noon_grass_1k.hdr") }).then(t => {
    if (t.error) return null;
    const tex = new THREE.DataTexture(t.data, t.w, t.h, THREE.RGBAFormat, THREE.HalfFloatType);
    tex.flipY = true; tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
    return tex;
  }, () => null);
  const gltf = new GLTFLoader();
  const model = (file, x, z, s, ry) => gltf.loadAsync(abs(file)).then(res => {
    const o = res.scene;
    o.scale.setScalar(s); o.rotation.y = ry; o.position.set(x, FLOOR, z);
    return o;
  }, () => null);
  const models = Promise.all([
    model("plant.glb", -212, -238, 165, 0.4),       // a potted plant in the corner by the board
    model("chair.glb", -150, -190, 100, 0.55),       // a velvet armchair, turned to the room
  ]);
  Promise.all([surfaces, sky, models]).then(([surf, skyTex, objs]) => {
    if (worker) worker.terminate();
    const roomEnv = pmrem.fromScene(officeLight(), 0.035, 1, 3000).texture;
    for (const m of M.interior) { m.envMap = roomEnv; m.envMapIntensity = 1; m.needsUpdate = true; }
    for (const p of surf) if (p) { Object.assign(p[0], p[1], { roughness: 1 }); p[0].needsUpdate = true; }
    if (skyTex) {
      const env = pmrem.fromEquirectangular(skyTex).texture;
      skyTex.dispose();
      for (const m of M.exterior) {
        m.envMap = env;
        m.envMapIntensity = SKY_K * 0.8 * (m === M.glass ? 1.5 : m === M.deck ? 0.7 : 1);
        m.needsUpdate = true;
      }
    }
    for (const o of objs) if (o) {
      o.traverse(n => {
        if (!n.isMesh) return;
        n.castShadow = n.receiveShadow = true;
        for (const m of [].concat(n.material)) { m.envMap = roomEnv; m.envMapIntensity = 1; }
      });
      group.add(o);
    }
    ready();
  });

  return { group };
}

// a model of the office as its own walls see it: daylight through the door and windows, the sunny patch on the
// floor, and the paler room around; rendered into an environment that lights everything inside
function officeLight() {
  const s = new THREE.Scene(), { x0, x1, z0, z1, y0, y1 } = ROOM;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, H = y1 - y0, D = z1 - z0;
  const basic = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide });
  const quad = (w, h, mat, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.set(rx, ry, 0); m.position.set(x - cx, y - cy, z - cz); s.add(m);
  };
  const walls = basic(0.4, 0.39, 0.37), floor = basic(0.43, 0.39, 0.34), ceil = basic(0.38, 0.375, 0.36);
  quad(W, D, floor, cx, y0, cz, -Math.PI / 2);
  quad(W, D, ceil, cx, y1, cz, Math.PI / 2);
  quad(W, H, walls, cx, cy, z0);
  quad(W, H, walls, cx, cy, z1, 0, Math.PI);
  quad(D, H, walls, x0, cy, cz, 0, Math.PI / 2);
  quad(D, H, walls, x1, cy, cz, 0, -Math.PI / 2);
  // what the openings let in: sky above the horizon, the sunlit deck and garden below it
  const sky = basic(2.3, 2.6, 3.1), garden = basic(0.75, 0.82, 0.55), sun = basic(1.5, 1.3, 1.0);
  const opening = (x, yb, w, h, z, ry) => {
    if (yb + h > EYE) quad(w, yb + h - Math.max(yb, EYE), sky, x, (Math.max(yb, EYE) + yb + h) / 2, z, 0, ry);
    if (yb < EYE) quad(w, Math.min(EYE, yb + h) - yb, garden, x, (yb + Math.min(EYE, yb + h)) / 2, z, 0, ry);
  };
  opening(0, FLOOR, 230, 232, z1 - 1, Math.PI);
  opening(-206, 405, 92, 140, z1 - 1, Math.PI);
  opening(212, 385, 105, 182, z1 - 1, Math.PI);
  quad(150, 150, sky, x1 - 1, 480, -120, 0, -Math.PI / 2);
  quad(220, 110, sun, 110, y0 + 1, 40, -Math.PI / 2);   // the sun's patch on the floor
  return s;
}
