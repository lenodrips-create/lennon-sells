// A modern two-storey house on the lawn, in centimetres like the laptop: white lap siding, black flat roofs with
// deep fascias, black-framed windows, a glass garage door and a balcony with a cable railing over it. Behind the
// balcony's open door is the office, with a whiteboard in the middle of its back wall, the services written on it.
//
// It's built to look real: the siding, decking, oak floor and concrete are painted with relief (normal maps) and
// varied roughness; the house reflects a real sky (a Poly Haven HDRI, noon_grass, CC0) in its glass and metal;
// corners, the ground and the undersides of the overhangs are shaded the way bounced light leaves them; the glass is
// see-through, with curtained rooms behind it; and the office is lit by a model of the daylight coming in through
// its door and windows. Its plant and armchair are models with photographed materials, from the Khronos glTF samples.
//
// The house's own axes: +z is the front. The office's door, the balcony and the board all sit on x = 0, so
// the camera flies straight in along that line. The laptop lies on the same line, out on the lawn in front.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import painterSrc from "./paint.worker.txt";   // paint.js, built as text (see package.json)
import { makeBoard, boardSize, MENU_SIZE, screenSize } from "./board.js";
import { makePrints, printSize } from "./reviews.js";

const T = 15;                         // wall thickness
const FLOOR = 335.5;                  // the office floor, on top of the ground floor's roof
const EYE = FLOOR + 150;              // standing eye height in the office
const ROOM = { x0: -290, x1: 290 - T, z0: -330 + T, z1: 120 - T, y0: FLOOR, y1: 628 };
// the kitchen: upstairs on the left, through a doorway in the office's left wall
const KIT = { x0: -630 + T, x1: -290 - T, z0: -330 + T, z1: 330 - T, y0: FLOOR, y1: 605 };
const KDOOR = { z0: -7.5, z1: 87.5, h: 215 };   // the doorway between them, centred on the menu board
// the living room: downstairs, in through the front door, beside the garage
const LIV = { x0: -630 + T, x1: -39, z0: -330 + T, z1: 330 - T, y0: 14, y1: 290 };
const LX = -382;                                  // the front door's middle, and the line the sofa and the reviews sit on
export const OFFICE = {
  eye: EYE,
  door: 120,                          // the office's front wall (outer face), where the balcony door is
  board: { y: EYE, z: -314.7 + 1.6, w: 252, h: 132 },   // the whiteboard's face, on the back wall (sized in makeHouse)
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

// soft shadow shapes: a blurred square or disc (drawn as the shadow of one off the canvas), or a fade from top to bottom
function blurTex(kind) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  if (kind === "fade") {   // dark at the top, fading down, and soft at both ends
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.3, "rgba(0,0,0,0.4)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const h = x.createLinearGradient(0, 0, 128, 0);
    h.addColorStop(0, "rgba(0,0,0,0)"); h.addColorStop(0.12, "rgba(0,0,0,1)"); h.addColorStop(0.88, "rgba(0,0,0,1)"); h.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in"; x.fillStyle = h; x.fillRect(0, 0, 128, 128);
  } else {
    x.shadowColor = "#000"; x.shadowBlur = 16; x.shadowOffsetX = 256;
    x.beginPath();
    if (kind === "round") x.arc(64 - 256, 64, 40, 0, Math.PI * 2); else x.rect(26 - 256, 26, 76, 76);
    x.fill();
  }
  return new THREE.CanvasTexture(c);
}

/* ---------- light that bounces: soft shading where surfaces meet, worked out from where the point is ---------- */
// Each material gets a little GLSL that dims its bounced (ambient) light near corners, the ground and under the
// overhangs; direct sunlight and its shadows are left to the shadow map.
const AO_LIB = `
  float aoPlane(float d, float r, float k) { return 1.0 - k * exp(-max(d, 0.0) / r) * smoothstep(0.4, 2.5, d); }
  float aoBox(vec3 p, float x0, float x1, float z0, float z1, float y0, float y1) {
    return aoPlane(p.x - x0, 42.0, 0.34) * aoPlane(x1 - p.x, 42.0, 0.34) * aoPlane(p.z - z0, 42.0, 0.34)
         * aoPlane(z1 - p.z, 42.0, 0.34) * aoPlane(p.y - y0, 36.0, 0.32) * aoPlane(y1 - p.y, 48.0, 0.3);
  }
  // downstairs the living room; upstairs the office, or (left of the wall between them) the kitchen
  float aoRoom(vec3 p) {
    if (p.y < 310.0) return aoBox(p, ${[LIV.x0, LIV.x1, LIV.z0, LIV.z1, LIV.y0, LIV.y1].map(v => v.toFixed(1)).join(", ")});
    return p.x > -297.5
      ? aoBox(p, ${[ROOM.x0, ROOM.x1, ROOM.z0, ROOM.z1, ROOM.y0, ROOM.y1].map(v => v.toFixed(1)).join(", ")})
      : aoBox(p, ${[KIT.x0, KIT.x1, KIT.z0, KIT.z1, KIT.y0, KIT.y1].map(v => v.toFixed(1)).join(", ")});
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
    glassClear: std({ color: 0xdfe8ea, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.25, depthWrite: false }),
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
    boardFrame: std({ color: 0xc5c8cc, roughness: 0.32, metalness: 0.85 }),   // brushed aluminium
    felt: std({ color: 0x3a3d42, roughness: 1 }),
    ceramic: std({ color: 0xf2f0ec, roughness: 0.3, side: THREE.DoubleSide }),   // double-sided: bowls are open
    blackMetal: std({ color: 0x141416, roughness: 0.4, metalness: 0.7 }),
    books: std({ vertexColors: true, roughness: 0.8 }),
  };
  // the kitchen's own: lit by its own daylight (see kitchenLight); the shaded keys match the office's, so they share
  // its shaders
  Object.assign(M, {
    kPaint: shaded(std({ color: 0xf1ede6, roughness: 0.9 }), "paint", "aoRoom(p)"),
    kCeiling: shaded(std({ color: 0xf6f4ef, roughness: 0.95 }), "ceiling", "aoRoom(p)"),
    kSkirting: shaded(std({ color: 0xf4f2ee, roughness: 0.5 }), "skirting", "aoRoom(p)"),
    tile: shaded(std({ roughness: 1 }), "tile", "aoRoom(p)"),
    subway: shaded(std({ roughness: 1 }), "subway", "aoRoom(p)"),
    marble: shaded(std({ roughness: 1 }), "marble", "aoRoom(p)"),
    cab: shaded(std({ color: 0x4b6553, roughness: 0.55 }), "cab", "aoRoom(p)"),          // sage green, satin
    plinth: std({ color: 0x1e2421, roughness: 0.8 }),
    appliance: std({ color: 0xd0d2d4, roughness: 0.26, metalness: 0.92 }),               // brushed stainless
    basin: std({ color: 0x9a9da0, roughness: 0.35, metalness: 0.9 }),
    blackGlass: std({ color: 0x0b0b0d, roughness: 0.06, metalness: 0.2 }),
    brass: std({ color: 0xb8955c, roughness: 0.3, metalness: 1 }),
    fruit: std({ vertexColors: true, roughness: 0.45 }),
    terracotta: std({ color: 0xb0623f, roughness: 0.85 }),
    herb: std({ color: 0x4d7a35, roughness: 0.7 }),
  });
  // the living room's own, lit by its own daylight
  Object.assign(M, {
    lPaint: shaded(std({ color: 0xefeae2, roughness: 0.9 }), "paint", "aoRoom(p)"),
    lCeiling: shaded(std({ color: 0xf6f4ef, roughness: 0.95 }), "ceiling", "aoRoom(p)"),
    lSkirting: shaded(std({ color: 0xf4f2ee, roughness: 0.5 }), "skirting", "aoRoom(p)"),
    lFloor: shaded(std({ roughness: 1 }), "floor", "aoRoom(p)"),
    lRug: shaded(std({ roughness: 1 }), "rug", "aoRoom(p)"),
    lOak: shaded(std({ roughness: 1 }), "oak", "aoRoom(p)"),
    lMetal: std({ color: 0x141416, roughness: 0.4, metalness: 0.7 }),
    lCeramic: std({ color: 0xece6dc, roughness: 0.35 }),
    frame: std({ color: 0x18181a, roughness: 0.45, metalness: 0.2 }),
  });
  M.living = [M.lPaint, M.lCeiling, M.lSkirting, M.lFloor, M.lRug, M.lOak, M.lMetal, M.lCeramic, M.frame];
  // soft shadows that sit on a surface: square (under things with corners), round, and fading down a wall (under a
  // shelf); their strength rides in each one's vertex colour, so they all merge into three draw calls
  const decal = map => new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  Object.assign(M, { shadeSq: decal(blurTex("square")), shadeRound: decal(blurTex("round")), shadeFade: decal(blurTex("fade")) });
  M.kitchen = [M.kPaint, M.kCeiling, M.kSkirting, M.tile, M.subway, M.marble, M.cab, M.plinth, M.appliance, M.basin, M.blackGlass, M.brass,
               M.fruit, M.terracotta, M.herb];
  M.exterior = [M.siding, M.corner, M.found, M.alu, M.fascia, M.soffit, M.deck, M.cedar, M.concrete, M.cable, M.steel, M.glass, M.frosted];
  M.interior = [M.paint, M.ceiling, M.skirting, M.floor, M.rug, M.oak, M.boardFrame, M.felt, M.ceramic, M.blackMetal, M.books];
  // the painted surfaces, and what paint.js calls them
  M.surfaces = [[M.siding, "siding"], [M.floor, "floor"], [M.deck, "deck"], [M.cedar, "cedar"], [M.oak, "oak"], [M.concrete, "concrete"], [M.rug, "rug"],
                [M.tile, "tile"], [M.subway, "subway"], [M.marble, "marble"]];
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
      if (mat.transparent) mesh.renderOrder = mat.vertexColors && mat.isMeshBasicMaterial ? 2 : 1;
      group.add(mesh);
    }
  };
  // an upright surface facing +x (at x = c, from z a0 to a1) or +z (at z = c, from x a0 to a1), texture in centimetres
  const wallQuad = (mat, face, a0, a1, y0, y1, c) => {
    const g = new THREE.PlaneGeometry(a1 - a0, y1 - y0);
    if (face === "x") g.rotateY(Math.PI / 2).translate(c, (y0 + y1) / 2, (a0 + a1) / 2);
    else g.translate((a0 + a1) / 2, (y0 + y1) / 2, c);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, face === "x" ? -p.getZ(i) : p.getX(i), p.getY(i));
    put(mat, g);
  };
  return { put, box, boxGeo, flatXZ, wallQuad, build };
}
const std0 = o => new THREE.MeshStandardMaterial(o);
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
export function makeHouse(quality, renderer, ready = () => {}, portrait = false) {
  const q = quality === "high", M = mats(q), C = collector(), group = new THREE.Group(), wallQuad = C.wallQuad;
  // shadows: lying on a level surface at height y, or on a wall facing +x (at x) or +z (at z), strength k
  const tint = (g, k) => g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 4).map((_, i) => (i % 4 === 3 ? k : 0)), 4));
  const shadeH = (mat, x0, x1, z0, z1, y, k) => C.put(mat, tint(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2), k));
  const shadeX = (mat, x, z0, z1, y0, y1, k) => C.put(mat, tint(new THREE.PlaneGeometry(z1 - z0, y1 - y0).rotateY(Math.PI / 2).translate(x, (y0 + y1) / 2, (z0 + z1) / 2), k));
  const shadeZ = (mat, z, x0, x1, y0, y1, k) => C.put(mat, tint(new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z), k));
  // the whiteboard: upright on a phone held upright, wide otherwise; its frame is 6 cm all round
  const board = makeBoard("services", portrait), bs = boardSize(portrait), menuBoard = makeBoard("menu", portrait);
  OFFICE.board.w = bs.w + 12; OFFICE.board.h = bs.h + 12;
  M.board = board.writeOn(shaded(std0({ map: board.base, roughness: 0.3 }), "board", "aoRoom(p)"));
  M.interior.push(M.board);
  const about = {};
  // the office monitor's screen: unlit, it glows on its own
  const aboutBoard = makeBoard("about", portrait);
  M.screen = aboutBoard.writeOn(new THREE.MeshBasicMaterial({ map: aboutBoard.base, toneMapped: false }));
  M.menu = menuBoard.writeOn(shaded(std0({ map: menuBoard.base, roughness: 0.85 }), "menu", "aoRoom(p)"));
  M.kitchen.push(M.menu);
  const lights = [];
  const r = rng(909);

  // a wall: from (x0, z0) along its own x, facing outwards along its own z (ry turns it), its outer face on that
  // line; T thick inwards. `top` is the underside of the overhang above it, for the shading. Windows get frames,
  // sills and glass; `inside` lines it with paint for the office.
  function wall({ x0, z0, ry, y0, len, h, top, doors = [], windows = [], inside = false, lining = M.paint }) {
    const m = mat4(x0, y0, z0, ry);
    const g = new THREE.ExtrudeGeometry(wallShape(len, h, doors, windows, false), { depth: T, bevelEnabled: false });
    g.translate(0, 0, -T);
    C.put(M.siding, withTop(g, top), m);
    if (inside) {
      const l = new THREE.ShapeGeometry(wallShape(len, h, doors, windows, true));
      l.rotateY(Math.PI); l.translate(len, 0, -T - 0.3);
      C.put(lining, l, m);
    }
    for (const [x, y, w, wh, kind = "room", bars = []] of windows) windowUnit(m, x, y, w, wh, kind, bars, inside, lining === M.kPaint ? M.kSkirting : lining === M.lPaint ? M.lSkirting : M.skirting);
    for (const [x, w, dh] of doors) {   // the door's black frame
      C.box(M.alu, x - 5, x, 0, dh + 5, -T - 1, 2, m); C.box(M.alu, x + w, x + w + 5, 0, dh + 5, -T - 1, 2, m);
      C.box(M.alu, x - 5, x + w + 5, dh, dh + 5, -T - 1, 2, m);
    }
    return m;
  }
  // a window: a black aluminium frame through the wall's depth, a sash set back in it, the glass, a sill, and
  // (on the ground floor and the closed upstairs room) a curtained room behind
  function windowUnit(m, x, y, w, wh, kind, bars, inside, trim = M.skirting) {
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
      C.box(trim, x - 7, x + w + 7, y + wh, y + wh + 7, zc - 2, zc, m);
      C.box(trim, x - 7, x, y - 3, y + wh, zc - 2, zc, m); C.box(trim, x + w, x + w + 7, y - 3, y + wh, zc - 2, zc, m);
      C.box(trim, x - 9, x + w + 9, y - 3, y, zc - 4, zc + T - 3, m);
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
  const L = { inside: true, lining: M.lPaint };
  wall({ x0: -630, z0: 330, ry: 0, y0: G0, len: 920, h: 300 - G0, top: 300, doors: [[200, 96, 215 - G0], [606, 292, 235 - G0]], ...L });
  wall({ x0: -630, z0: -315, ry: -Math.PI / 2, y0: G0, len: 630, h: 300 - G0, top: 300, windows: [[250, 120 - G0, 110, 126, "office", [55]]], ...L });
  wall({ x0: 290, z0: 315, ry: Math.PI / 2, y0: G0, len: 630, h: 300 - G0, top: 300, windows: [[200, 136 - G0, 150, 110, "room"]] });
  wall({ x0: 290, z0: -330, ry: Math.PI, y0: G0, len: 920, h: 300 - G0, top: 300, ...L });
  // the foundation, a little proud of the siding, with a concrete step at the front door
  C.box(M.found, -631, 291, -6, G0, -331, 316);
  for (const [a, b] of [[-631, -430], [-334, -24], [268, 291]]) C.box(M.found, a, b, -6, G0, 316, 331);
  C.box(M.concrete, -452, -312, -5, G0 - 1, 331, 376);
  for (const [cx, cz, sx, sz] of [[-630, 330, -1, 1], [290, 330, 1, 1], [-630, -330, -1, -1], [290, -330, 1, -1]]) corner(cx, cz, sx, sz, G0, 300, 300);

  // the front door: black aluminium with a full-height frosted glass light and a long steel pull
  // (a leaf of its own, hinged on the left, so it can swing open into the living room as the camera comes in)
  const door = new THREE.Group();
  {
    const w = 96, z0 = 330 - T + 4, part = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = !mat.transparent; m.receiveShadow = !mat.transparent; door.add(m); };
    const bx = (x0, x1, y0, y1, z0b, z1b, mat = M.alu) => part(C.boxGeo(x1 - x0, y1 - y0, z1b - z0b).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0b + z1b) / 2), mat);
    bx(0, 9, G0, 215, 0, 4); bx(w - 9, w, G0, 215, 0, 4); bx(0, w, 215 - 9, 215, 0, 4); bx(0, w, G0, G0 + 12, 0, 4);
    part(new THREE.PlaneGeometry(w - 18, 215 - G0 - 21).translate(w / 2, (G0 + 12 + 206) / 2, 2), M.frosted);
    part(new THREE.PlaneGeometry(w - 18, 215 - G0 - 21).translate(w / 2, (G0 + 12 + 206) / 2, 2.3), M.glass);
    part(new THREE.CylinderGeometry(1.3, 1.3, 90, 12).translate(w - 16, 120, 9), M.steel);
    for (const yy of [80, 160]) part(new THREE.CylinderGeometry(0.9, 0.9, 5, 10).rotateX(Math.PI / 2).translate(w - 16, yy, 6), M.steel);
    part(new THREE.CylinderGeometry(1.3, 1.3, 30, 12).translate(w - 16, 120, -5), M.steel);   // and a pull on the inside
    door.position.set(-430, 0, z0);
    group.add(door);
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

  /* upstairs, left: the kitchen, flush with the front; a window at the front, and a wide one over the sink on the
     sunny side */
  const K = { inside: true, lining: M.kPaint };
  wall({ x0: -630, z0: 330, ry: 0, y0: 335, len: 340, h: 275, top: 610, windows: [[105, 85, 85, 130, "office"]], ...K });
  wall({ x0: -630, z0: -315, ry: -Math.PI / 2, y0: 335, len: 630, h: 275, top: 610, windows: [[70, 110, 150, 110, "office", [75]]], ...K });
  wall({ x0: -290, z0: -330, ry: Math.PI, y0: 335, len: 340, h: 275, top: 610, ...K });
  // its right-hand wall runs the full depth: on the balcony outside, the office's left wall inside, with the doorway
  // through to the kitchen
  wall({ x0: -290, z0: 330 - T, ry: Math.PI / 2, y0: 335, len: 660 - 2 * T, h: 295, top: 630,
         doors: [[315 - KDOOR.z1, KDOOR.z1 - KDOOR.z0, KDOOR.h]], ...K });
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
    // the left wall, round the doorway through to the kitchen
    const leftWall = (z0, z1, y0, y1) => C.put(M.paint, new THREE.PlaneGeometry(z1 - z0, y1 - y0).rotateY(Math.PI / 2).translate(xl + 0.3, (y0 + y1) / 2, (z0 + z1) / 2));
    leftWall(zb, KDOOR.z0, FLOOR, ceil); leftWall(KDOOR.z1, zf, FLOOR, ceil); leftWall(KDOOR.z0, KDOOR.z1, FLOOR + KDOOR.h - 0.5, ceil);
    // skirting boards, and a casing round the door
    C.box(M.skirting, xl, xr, FLOOR, FLOOR + 10, zb, zb + 1.5);
    C.box(M.skirting, xl, xl + 1.5, FLOOR, FLOOR + 10, zb, KDOOR.z0 - 5); C.box(M.skirting, xl, xl + 1.5, FLOOR, FLOOR + 10, KDOOR.z1 + 5, zf);
    C.box(M.skirting, xr - 1.5, xr, FLOOR, FLOOR + 10, zb, zf);
    C.box(M.skirting, -122, 122, FLOOR + 232, FLOOR + 240, zf - 2, zf);
    C.box(M.skirting, -122, -115, FLOOR, FLOOR + 232, zf - 2, zf); C.box(M.skirting, 115, 122, FLOOR, FLOOR + 232, zf - 2, zf);
    // the rug
    C.flatXZ(M.rug, -150, 150, -215, -5, FLOOR + 0.6);
    C.box(M.rug, -150, 150, FLOOR, FLOOR + 0.6, -215, -5);

    // the whiteboard: a white board in a brushed aluminium frame with grey corner caps, and a tray underneath with
    // three markers and an eraser
    const b = OFFICE.board, bw = b.w - 12, bh = b.h - 12, z = zb + 0.3;
    C.put(M.board, new THREE.PlaneGeometry(bw, bh).translate(0, b.y, z + 1.3));
    C.box(M.paint, -bw / 2, bw / 2, b.y - bh / 2, b.y + bh / 2, z, z + 1.2);
    C.box(M.boardFrame, -b.w / 2, b.w / 2, b.y + bh / 2, b.y + b.h / 2, z, z + 2.6);
    C.box(M.boardFrame, -b.w / 2, b.w / 2, b.y - b.h / 2, b.y - bh / 2, z, z + 2.6);
    C.box(M.boardFrame, -b.w / 2, -bw / 2, b.y - bh / 2, b.y + bh / 2, z, z + 2.6);
    C.box(M.boardFrame, bw / 2, b.w / 2, b.y - bh / 2, b.y + bh / 2, z, z + 2.6);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const cx = sx * (b.w / 2 - 3), cy = b.y + sy * (b.h / 2 - 3);
      C.box(M.felt, cx - 3.6, cx + 3.6, cy - 3.6, cy + 3.6, z, z + 3.2);
    }
    const ly = b.y - b.h / 2, tw = Math.min(110, bw * 0.7);
    C.box(M.boardFrame, -tw / 2, tw / 2, ly - 2.4, ly - 1.4, z, z + 8);
    C.box(M.boardFrame, -tw / 2, tw / 2, ly - 2.4, ly + 0.6, z + 7, z + 8);
    const marker = (x, rot, cap) => {
      const body = new THREE.CylinderGeometry(0.85, 0.85, 11.5, 14).rotateZ(Math.PI / 2).rotateY(rot);
      C.put(M.ceramic, body.translate(x, ly - 0.55, z + 4));
      const c = new THREE.CylinderGeometry(0.95, 0.95, 3.4, 14).rotateZ(Math.PI / 2).translate(-6.6, 0, 0).rotateY(rot).translate(x, ly - 0.5, z + 4);
      const col = new Float32Array(c.attributes.position.count * 3), cc = new THREE.Color(cap);
      for (let k = 0; k < col.length; k += 3) col.set([cc.r, cc.g, cc.b], k);
      c.setAttribute("color", new THREE.BufferAttribute(col, 3));
      C.put(M.books, c);
    };
    marker(-tw / 2 + 12, 0.04, 0x1d1e22); marker(-tw / 2 + 26, -0.06, 0x1f47b5); marker(-tw / 2 + 40, 0.1, 0xc42a2a);
    C.box(M.felt, tw / 2 - 22, tw / 2 - 8, ly - 1.4, ly + 0.4, z + 1.8, z + 6.4);
    C.box(M.blackMetal, tw / 2 - 22, tw / 2 - 8, ly + 0.4, ly + 3, z + 1.8, z + 6.4);

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
    // a desk along the left wall, set up for coding: a big monitor on a stand (turned upright on a phone held
    // upright), a keyboard and mouse, a mug and a desk lamp. The monitor types out the about page.
    {
      const dx = xl + 2, dz0 = -200, dz1 = -45, top = FLOOR + 74, zc = -122.5;
      C.box(M.oak, dx, dx + 72, top - 3, top, dz0, dz1);
      for (const lz of [dz0 + 3, dz1 - 6]) { C.box(M.blackMetal, dx + 4, dx + 7, FLOOR, top - 3, lz, lz + 3); C.box(M.blackMetal, dx + 64, dx + 67, FLOOR, top - 3, lz, lz + 3); }
      contact(dx - 4, dx + 76, dz0 - 4, dz1 + 4, 0.35);
      const sc = screenSize(portrait), pw = sc.w + 2, ph = sc.h + 2, cy = top + (portrait ? 10 : 14) + ph / 2, fx = dx + 16;
      C.box(M.blackMetal, fx - 2.4, fx, cy - ph / 2, cy + ph / 2, zc - pw / 2, zc + pw / 2);            // the panel
      C.put(M.screen, new THREE.PlaneGeometry(sc.w, sc.h).rotateY(Math.PI / 2).translate(fx + 0.05, cy, zc));
      C.box(M.blackMetal, fx - 7, fx - 3, top, cy, zc - 2.5, zc + 2.5);                                  // the stand
      C.box(M.blackMetal, fx - 14, fx + 2, top, top + 1, zc - 11, zc + 11);
      shadeH(M.shadeSq, fx - 17, fx + 5, zc - 14, zc + 14, top + 0.12, 0.45);
      // keyboard, mouse, mug
      C.box(M.felt, fx + 20, fx + 33, top, top + 1.4, zc - 22, zc + 22);
      C.box(M.blackMetal, fx + 20.5, fx + 32.5, top + 1.4, top + 1.9, zc - 21.5, zc + 21.5);
      shadeH(M.shadeSq, fx + 18, fx + 35, zc - 24, zc + 24, top + 0.12, 0.4);
      C.put(M.blackMetal, new THREE.SphereGeometry(1, 20, 12).scale(3, 1.6, 2).translate(fx + 27, top + 1, zc + 34));
      shadeH(M.shadeRound, fx + 22, fx + 32, zc + 29, zc + 39, top + 0.12, 0.4);
      C.put(M.ceramic, new THREE.CylinderGeometry(4.2, 4, 9.5, 28).translate(fx + 22, top + 4.75, dz0 + 26));
      C.put(M.ceramic, new THREE.TorusGeometry(2.6, 0.6, 8, 16).translate(fx + 22, top + 5, dz0 + 26 + 4.6));
      shadeH(M.shadeRound, fx + 15, fx + 29, dz0 + 19, dz0 + 33, top + 0.12, 0.45);
      // a black desk lamp at the far end, arm up and head angled down at the keyboard
      const lx = dx + 10, lz = dz1 - 12;
      C.put(M.blackMetal, new THREE.CylinderGeometry(7, 7.5, 1.6, 28).translate(lx, top + 0.8, lz));
      C.put(M.blackMetal, new THREE.CylinderGeometry(0.8, 0.8, 42, 10).translate(0, 21, 0).rotateZ(-0.25).translate(lx, top + 1.6, lz));
      C.put(M.blackMetal, new THREE.CylinderGeometry(0.7, 0.7, 30, 10).translate(0, 15, 0).rotateZ(-1.9).translate(lx + 10.2, top + 42, lz));
      const hx = lx + 10.2 + 28.4, hy = top + 42 - 9.7;
      C.put(M.blackMetal, new THREE.CylinderGeometry(3, 7, 11, 24, 1, true).rotateZ(0.4).translate(hx, hy - 3, lz));
      C.put(M.glow, new THREE.CircleGeometry(6.4, 24).rotateX(Math.PI / 2).rotateZ(0.4).translate(hx + 2.2, hy - 8.2, lz));
      shadeH(M.shadeRound, lx - 10, lx + 10, lz - 10, lz + 10, top + 0.12, 0.45);
      about.center = new THREE.Vector3(fx + 0.05, cy, zc);
      about.normal = new THREE.Vector3(1, 0, 0);
      about.size = { w: pw, h: ph };
    }
  }

  /* ---------- the kitchen ---------- */
  // An L of sage-green cabinets with white quartz worktops along the far (sunny) wall and the back wall, a subway-tile
  // splashback, a range under a steel hood, a fridge, open oak shelves, and an island with a waterfall top, stools and
  // two glass pendants. The menu board leans on the worktop opposite the doorway.
  const kitchen = {};
  {
    const { x0: kx0, x1: kx1, z0: kz0, z1: kz1, y1: kc } = KIT;
    const top = FLOOR + 91, carc = top - 3, toe = FLOOR + 10;   // worktop, carcass top, plinth
    C.flatXZ(M.tile, kx0, kx1, kz0, kz1, FLOOR);
    C.flatXZ(M.kCeiling, kx0, kx1, kz0, kz1, kc, true);
    C.flatXZ(M.floor, kx1, ROOM.x0, KDOOR.z0, KDOOR.z1, FLOOR);   // the threshold, in the office's oak
    // skirting along the walls without cabinets
    C.box(M.kSkirting, kx1 - 1.5, kx1, FLOOR, FLOOR + 10, kz0 + 62, KDOOR.z0 - 5); C.box(M.kSkirting, kx1 - 1.5, kx1, FLOOR, FLOOR + 10, KDOOR.z1 + 5, kz1);
    C.box(M.kSkirting, kx0 + 70, kx1, FLOOR, FLOOR + 10, kz1 - 1.5, kz1);
    C.box(M.kSkirting, kx1 - 7, kx1 - 2, FLOOR, FLOOR + KDOOR.h + 7, KDOOR.z0 - 7, KDOOR.z0);   // casing round the doorway
    C.box(M.kSkirting, kx1 - 7, kx1 - 2, FLOOR, FLOOR + KDOOR.h + 7, KDOOR.z1, KDOOR.z1 + 7);
    C.box(M.kSkirting, kx1 - 7, kx1 - 2, FLOOR + KDOOR.h, FLOOR + KDOOR.h + 7, KDOOR.z0, KDOOR.z1);

    // a run of base cabinets facing +x (along the far wall) or +z (along the back wall), split into doors at `cuts`
    const seam = (a, b, y0, y1, face, at) => face === "x" ? C.box(M.plinth, at, at + 0.15, y0, y1, a - 0.25, b + 0.25) : C.box(M.plinth, a - 0.25, b + 0.25, y0, y1, at, at + 0.15);
    const handle = (c, y, face, at) => face === "x" ? C.box(M.brass, at, at + 2.2, y - 0.7, y + 0.7, c - 9, c + 9) : C.box(M.brass, c - 9, c + 9, y - 0.7, y + 0.7, at, at + 2.2);
    function run(face, a0, a1, cuts) {
      if (face === "x") {
        C.box(M.cab, kx0, kx0 + 58, toe, carc, a0, a1);
        C.box(M.plinth, kx0, kx0 + 52, FLOOR, toe, a0, a1);
        C.box(M.marble, kx0, kx0 + 62, carc, top, a0 - 1, a1 + 1);
      } else {
        C.box(M.cab, a0, a1, toe, carc, kz0, kz0 + 58);
        C.box(M.plinth, a0, a1, FLOOR, toe, kz0, kz0 + 52);
        C.box(M.marble, a0 - 1, a1 + 1, carc, top, kz0, kz0 + 62);
      }
      const at = face === "x" ? kx0 + 58 : kz0 + 58, edges = [a0, ...cuts, a1];
      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i], b = edges[i + 1];
        seam(a, a, toe, carc, face, at);
        seam(a, b, carc - 17, carc - 16.7, face, at);                // a drawer over each door
        handle((a + b) / 2, carc - 8.5, face, at);
        handle((a + b) / 2, carc - 26, face, at);
      }
    }
    run("x", kz0, 190, [-255, -195, -125, -65, -5, 55, 115]);
    run("z", kx0 + 62, -540, []);
    run("z", -464, -392, []);
    // the sink under the window: a steel basin set into the worktop, and a black gooseneck tap
    C.box(M.basin, kx0 + 8, kx0 + 52, top - 0.6, top + 0.05, -198, -142);
    C.box(M.blackGlass, kx0 + 12, kx0 + 48, top - 0.55, top + 0.07, -194, -146);
    C.put(M.blackMetal, new THREE.CylinderGeometry(1.4, 1.8, 30, 16).translate(kx0 + 6, top + 15, -170));
    C.put(M.blackMetal, new THREE.TorusGeometry(9, 1.2, 10, 24, Math.PI).rotateY(Math.PI / 2).translate(kx0 + 6, top + 30, -161 - 0));
    C.put(M.blackMetal, new THREE.CylinderGeometry(1.1, 1.1, 8, 12).translate(kx0 + 6, top + 26, -152));
    // the range: steel, a black glass hob and oven door, and a chimney hood over it
    {
      const x0 = -540, x1 = -464;
      C.box(M.appliance, x0, x1, FLOOR, top - 1, kz0, kz0 + 62);
      C.box(M.blackGlass, x0 + 1, x1 - 1, top - 1, top, kz0 + 2, kz0 + 60);
      C.box(M.blackGlass, x0 + 6, x1 - 6, FLOOR + 14, FLOOR + 66, kz0 + 62, kz0 + 62.4);
      C.put(M.appliance, new THREE.CylinderGeometry(1, 1, x1 - x0 - 16, 12).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, FLOOR + 72, kz0 + 66));
      for (let i = 0; i < 5; i++) C.put(M.blackMetal, new THREE.CylinderGeometry(1.8, 1.8, 2.5, 16).rotateX(Math.PI / 2).translate(x0 + 12 + i * 13, FLOOR + 82, kz0 + 63.5));
      for (const [hx, hz, hr] of [[x0 + 19, kz0 + 18, 9], [x1 - 19, kz0 + 18, 9], [x0 + 19, kz0 + 44, 7], [x1 - 19, kz0 + 44, 7]])
        C.put(M.basin, new THREE.RingGeometry(hr - 0.6, hr, 32).rotateX(-Math.PI / 2).translate(hx, top + 0.05, hz));
      C.box(M.appliance, x0 - 6, x1 + 6, 528, 540, kz0, kz0 + 52);
      C.box(M.appliance, (x0 + x1) / 2 - 17, (x0 + x1) / 2 + 17, 540, kc, kz0, kz0 + 26);
    }
    // the fridge, with a cabinet over it and a tall pantry beside it
    {
      const z0 = 195, z1 = 288, f = kx0 + 66;
      C.box(M.appliance, kx0, f, FLOOR, FLOOR + 186, z0, z1);
      seam(z0, z1, FLOOR + 70, FLOOR + 70.4, "x", f); seam((z0 + z1) / 2, (z0 + z1) / 2, FLOOR + 70, FLOOR + 186, "x", f);
      for (const hz of [(z0 + z1) / 2 - 5, (z0 + z1) / 2 + 5]) C.put(M.appliance, new THREE.CylinderGeometry(1, 1, 60, 12).translate(f + 4, FLOOR + 120, hz));
      C.put(M.appliance, new THREE.CylinderGeometry(1, 1, 50, 12).rotateX(Math.PI / 2).translate(f + 4, FLOOR + 62, (z0 + z1) / 2));
      C.box(M.cab, kx0, kx0 + 62, FLOOR + 188, kc, z0, z1);
      C.box(M.cab, kx0, kx0 + 62, FLOOR, kc, z1, kz1);
      handle((z1 + kz1) / 2, FLOOR + 120, "x", kx0 + 62);
    }
    // the splashback: subway tiles, up round the window and behind the hob to the hood
    const splashX = (z0, z1, y0, y1) => wallQuad(M.subway, "x", z0, z1, y0, y1, kx0 + 0.4);
    splashX(kz0, -252, top, top + 58); splashX(-88, 195, top, top + 58); splashX(-252, -88, top, 445 - 3);
    const splashZ = (x0, x1, y0, y1) => wallQuad(M.subway, "z", x0, x1, y0, y1, kz0 + 0.4);
    splashZ(kx0 + 62, -546, top, top + 58); splashZ(-546, -458, top, 528); splashZ(-458, -392, top, top + 58);
    // open oak shelves, with plates, bowls and jars
    const shelf = (z0, z1, y) => {
      C.box(M.oak, kx0, kx0 + 26, y - 4, y, z0, z1);
      for (let z = z0 + 10; z < z1 - 10; z += 24) {
        for (let k = 0; k < 6; k++) C.put(M.ceramic, new THREE.CylinderGeometry(11, 9, 0.9, 28).translate(kx0 + 13, y + 0.45 + k * 1.1, z));
      }
    };
    shelf(-82, -18, 512); shelf(-82, -18, 552); shelf(100, 186, 512); shelf(100, 186, 552);
    for (const [z, y] of [[-40, 552], [118, 512], [170, 552]]) C.put(M.ceramic, new THREE.SphereGeometry(8, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2.4).translate(kx0 + 13, y + 7.8, z));
    for (const [z, y, c] of [[150, 512, 0xd9a441], [165, 512, 0x8a9a5b], [-60, 552, 0xc8553d]]) {
      C.put(M.glassClear, new THREE.CylinderGeometry(4, 4, 14, 20).translate(kx0 + 13, y + 7, z));
      const g = new THREE.CylinderGeometry(3.6, 3.6, 9, 16).translate(kx0 + 13, y + 4.6, z), col = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c);
      for (let i = 0; i < col.length; i += 3) col.set([cc.r, cc.g, cc.b], i);
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      C.put(M.fruit, g);
    }
    // the island: green, with a quartz top that runs down both ends
    {
      const x0 = -530, x1 = -450, z0 = -50, z1 = 140, xo = -425;
      C.box(M.cab, x0, x1, toe, carc, z0, z1);
      C.box(M.plinth, x0 + 5, x1 - 5, FLOOR, toe, z0 + 5, z1 - 5);
      C.box(M.marble, x0 - 2, xo, carc, top, z0 - 3, z1 + 3);
      C.box(M.marble, x0 - 2, xo, FLOOR, carc, z0 - 3, z0); C.box(M.marble, x0 - 2, xo, FLOOR, carc, z1, z1 + 3);
      for (const c of [-2, 45, 92]) { seam(c, c, toe, carc, "x", x0 - 0.2); handle(c + 23.5, carc - 8.5, "x", x0 - 2.2); }
      // a bowl of fruit
      C.put(M.ceramic, new THREE.SphereGeometry(16, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2.6).translate(-478, top + 11, 60));
      const fr = rng(55), fruitParts = [];
      for (let i = 0; i < 9; i++) {
        const a = fr() * 6.3, d = fr() * 8, rad = 4 + fr() * 1.5, g = new THREE.SphereGeometry(rad, 18, 12).translate(-478 + Math.cos(a) * d, top + 5 + rad + (i > 5 ? 4 : 0), 60 + Math.sin(a) * d);
        const cc = new THREE.Color([0xf0a020, 0xf6d23a, 0x8fbf3a][i % 3]).multiplyScalar(0.85 + fr() * 0.2), col = new Float32Array(g.attributes.position.count * 3);
        for (let k = 0; k < col.length; k += 3) col.set([cc.r, cc.g, cc.b], k);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        fruitParts.push(g);
      }
      for (const g of fruitParts) C.put(M.fruit, g);
      // stools on the near side
      for (const z of [-5, 45, 95]) {
        C.put(M.oak, new THREE.CylinderGeometry(18, 17, 4, 32).translate(-400, FLOOR + 64, z));
        for (const a of [0.8, 2.4, 3.9, 5.5]) C.put(M.blackMetal, new THREE.CylinderGeometry(1, 1.2, 64, 8).translate(0, -32, 0).rotateZ(Math.cos(a) * 0.12).rotateX(-Math.sin(a) * 0.12).translate(-400 + Math.cos(a) * 11, FLOOR + 63, z + Math.sin(a) * 11));
        C.put(M.blackMetal, new THREE.TorusGeometry(14, 0.8, 8, 32).rotateX(Math.PI / 2).translate(-400, FLOOR + 24, z));
      }
      contact(x0 - 6, xo + 4, z0 - 8, z1 + 8, 0.4);
      // two black dome pendants, hung high and out of the way of the board
      for (const z of [-28, 118]) {
        C.put(M.blackMetal, new THREE.CylinderGeometry(0.3, 0.3, kc - 582, 6).translate(-479, (kc + 582) / 2, z));
        C.put(M.blackMetal, new THREE.SphereGeometry(13, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(-479, 568, z));
        C.put(M.glow, new THREE.CircleGeometry(12.6, 32).rotateX(Math.PI / 2).translate(-479, 568.2, z));
      }
    }
    // a kettle, a coffee machine, a chopping board, and herbs on the window sill
    C.put(M.appliance, new THREE.CylinderGeometry(7, 9, 20, 28).translate(kx0 + 22, top + 10, -45));
    C.put(M.blackMetal, new THREE.TorusGeometry(6, 1, 8, 20, Math.PI).rotateY(Math.PI / 2).translate(kx0 + 15, top + 19, -45));
    // a crock of wooden spoons
    C.put(M.ceramic, new THREE.CylinderGeometry(6.5, 6, 17, 28).translate(kx0 + 20, top + 8.5, 140));
    for (const [a, l] of [[0.15, 30], [-0.2, 27], [0.05, 33], [-0.05, 25]]) C.put(M.oak, new THREE.CylinderGeometry(0.7, 0.7, l, 8).translate(0, l / 2, 0).rotateZ(a).rotateX(a * 0.8).translate(kx0 + 20, top + 6, 140));
    C.put(M.oak, new THREE.BoxGeometry(2, 42, 30).rotateZ(0.12).translate(kx0 + 6, top + 21, -78));
    for (const z of [-240, -226, -128]) {
      C.put(M.terracotta, new THREE.CylinderGeometry(6, 4.6, 11, 20).translate(kx0 + 12, top + 5.5, z));
      for (let k = 0; k < 5; k++) C.put(M.herb, new THREE.SphereGeometry(3.4, 12, 8).scale(1, 1.3, 1).translate(kx0 + 12 + Math.cos(k * 1.3) * 3, top + 14 + (k % 2) * 3, z + Math.sin(k * 1.3) * 3));
      shadeH(M.shadeRound, kx0 + 3, kx0 + 21, z - 9, z + 9, top + 0.12, 0.45);
    }
    // soft shadows: along the foot of the cabinets, under the stools, round everything on the worktops, under the
    // shelves, and behind the menu board
    shadeH(M.shadeSq, kx0 + 44, kx0 + 76, kz0 + 56, 192, FLOOR + 0.3, 0.42);
    shadeH(M.shadeSq, kx0 + 62, -390, kz0 + 44, kz0 + 76, FLOOR + 0.3, 0.42);
    shadeH(M.shadeSq, kx0 + 56, kx0 + 84, 192, kz1, FLOOR + 0.3, 0.32);
    for (const z of [-5, 45, 95]) shadeH(M.shadeRound, -428, -372, z - 28, z + 28, FLOOR + 0.3, 0.38);
    shadeH(M.shadeRound, kx0 + 6, kx0 + 38, -61, -29, top + 0.12, 0.5);
    shadeH(M.shadeRound, kx0 + 6, kx0 + 34, 126, 154, top + 0.12, 0.45);
    shadeH(M.shadeSq, kx0 + 0, kx0 + 16, -98, -58, top + 0.12, 0.4);
    shadeH(M.shadeSq, kx0 + 2, kx0 + 24, KDOOR.z0 - 14, KDOOR.z1 + 14, top + 0.12, 0.5);
    shadeH(M.shadeRound, -506, -450, 32, 88, top + 0.12, 0.45);
    for (const [z0, z1, y] of [[-82, -18, 512], [-82, -18, 552], [100, 186, 512], [100, 186, 552]]) shadeX(M.shadeFade, kx0 + 0.55, z0 - 3, z1 + 3, y - 15, y - 4, 0.26);
    shadeX(M.shadeSq, kx0 + 0.55, KDOOR.z0 - 18, KDOOR.z1 + 18, top - 4, top + MENU_SIZE.h + 22, 0.55);
    shadeZ(M.shadeFade, kz0 + 0.55, -548, -456, 500, 528, 0.4);

    // the menu board: a chalkboard in an oak frame, leaning back a little against the splashback
    {
      const mb = MENU_SIZE, fw = mb.w + 12, fh = mb.h + 12, tilt = THREE.MathUtils.degToRad(5);
      const m = new THREE.Matrix4().makeTranslation(kx0 + 12.5, top, (KDOOR.z0 + KDOOR.z1) / 2)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)).multiply(new THREE.Matrix4().makeRotationX(-tilt));
      C.put(M.menu, new THREE.PlaneGeometry(mb.w, mb.h).translate(0, fh / 2, 2.2), m);
      C.box(M.plinth, -fw / 2, fw / 2, 0, fh, 0, 1.8, m);
      C.box(M.oak, -fw / 2, fw / 2, 0, 6, 0, 2.8, m); C.box(M.oak, -fw / 2, fw / 2, fh - 6, fh, 0, 2.8, m);
      C.box(M.oak, -fw / 2, -fw / 2 + 6, 6, fh - 6, 0, 2.8, m); C.box(M.oak, fw / 2 - 6, fw / 2, 6, fh - 6, 0, 2.8, m);
      kitchen.center = new THREE.Vector3(0, fh / 2, 2.2).applyMatrix4(m);
      kitchen.normal = new THREE.Vector3(Math.cos(tilt), Math.sin(tilt), 0);
      kitchen.size = { w: fw, h: fh };
    }
  }

  /* ---------- the living room ---------- */
  // In through the front door: an oak floor, a velvet sofa against the back wall with three framed reviews over it, a
  // coffee table on a rug, side tables with a lamp, a plant, and the sun coming in at the side window.
  const prints = makePrints(portrait), ps = printSize(portrait), living = {};
  {
    const { x0, x1, z0, z1, y0, y1 } = LIV, F = y0 + 0.2;
    C.flatXZ(M.lFloor, x0, x1, z0, z1, F);
    C.flatXZ(M.lCeiling, x0, x1, z0, z1, y1, true);
    C.box(M.lPaint, x1, -24, G0, 300, -315, 315);                          // the wall to the garage
    C.box(M.lSkirting, x0, x1, F, F + 10, z0, z0 + 1.5);
    C.box(M.lSkirting, x0, x0 + 1.5, F, F + 10, z0, z1);
    C.box(M.lSkirting, x1 - 1.5, x1, F, F + 10, z0, z1);
    C.box(M.lSkirting, x0, -437, F, F + 10, z1 - 1.5, z1); C.box(M.lSkirting, -327, x1, F, F + 10, z1 - 1.5, z1);
    C.box(M.lSkirting, -437, -430, F, 222, z1 - 2, z1); C.box(M.lSkirting, -334, -327, F, 222, z1 - 2, z1);   // the door's casing
    C.box(M.lSkirting, -437, -327, 215, 222, z1 - 2, z1);
    for (const [x, z] of [[-480, -150], [-280, -150], [-480, 120], [-280, 120], [-140, -100], [-140, 160]]) {
      C.put(M.glow, new THREE.CircleGeometry(5, 20).rotateX(Math.PI / 2).translate(x, y1 - 0.2, z));
      C.put(M.lMetal, new THREE.RingGeometry(5, 6.2, 24).rotateX(Math.PI / 2).translate(x, y1 - 0.15, z));
    }
    // the rug and the coffee table
    C.flatXZ(M.lRug, LX - 160, LX + 160, -238, -18, F + 0.6);
    C.box(M.lRug, LX - 160, LX + 160, F, F + 0.6, -238, -18);
    C.box(M.lOak, LX - 62, LX + 62, F + 37, F + 41, -168, -104);
    C.box(M.lOak, LX - 58, LX + 58, F + 12, F + 14, -164, -108);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.box(M.lMetal, LX + sx * 56 - 1.5, LX + sx * 56 + 1.5, F + 0.6, F + 37, -136 + sz * 26 - 1.5, -136 + sz * 26 + 1.5);
    C.put(M.lCeramic, new THREE.CylinderGeometry(9, 7, 12, 28).translate(LX + 30, F + 47, -140));       // a vase
    C.box(M.lMetal, LX - 40, LX - 12, F + 41, F + 44, -150, -128);                                     // a book
    shadeH(M.shadeSq, LX - 70, LX + 70, -176, -96, F + 0.9, 0.42);
    // side tables either end of the sofa, a lamp on one
    for (const sx of [-1, 1]) {
      const x = LX + sx * 145, z = -280;
      C.put(M.lOak, new THREE.CylinderGeometry(24, 24, 3, 40).translate(x, F + 55, z));
      C.put(M.lMetal, new THREE.CylinderGeometry(1.6, 1.6, 52, 12).translate(x, F + 27, z));
      C.put(M.lMetal, new THREE.CylinderGeometry(14, 15, 1.5, 32).translate(x, F + 0.8, z));
      shadeH(M.shadeRound, x - 30, x + 30, z - 30, z + 30, F + 0.3, 0.4);
    }
    C.put(M.lCeramic, new THREE.CylinderGeometry(6, 8, 30, 24).translate(LX - 145, F + 71.5, -280));
    C.put(M.glow, new THREE.CylinderGeometry(15, 19, 24, 32, 1, true).translate(LX - 145, F + 96, -280));
    shadeH(M.shadeRound, LX - 160, LX - 130, -295, -265, F + 56.6, 0.4);
    shadeH(M.shadeSq, LX - 120, LX + 120, -318, -190, F + 0.3, 0.5);   // under the sofa, which loads below
    // the reviews: three framed prints on the wall over the sofa, side by side, or stacked on a phone held upright
    const fw = ps.w + 4, fh = ps.h + 4, zf = z0 + 0.3, cy = portrait ? 188 : 180;
    prints.textures.forEach((tex, i) => {
      const cx = portrait ? LX : LX + (i - 1) * (fw + 12), y = portrait ? cy + (1 - i) * (fh + 8) : cy;
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 });
      M.living.push(mat);
      C.put(mat, new THREE.PlaneGeometry(ps.w, ps.h).translate(cx, y, zf + 1.6));
      C.box(M.frame, cx - fw / 2, cx + fw / 2, y + ps.h / 2, y + fh / 2, zf, zf + 3);
      C.box(M.frame, cx - fw / 2, cx + fw / 2, y - fh / 2, y - ps.h / 2, zf, zf + 3);
      C.box(M.frame, cx - fw / 2, cx - ps.w / 2, y - ps.h / 2, y + ps.h / 2, zf, zf + 3);
      C.box(M.frame, cx + ps.w / 2, cx + fw / 2, y - ps.h / 2, y + ps.h / 2, zf, zf + 3);
      C.box(M.lPaint, cx - ps.w / 2, cx + ps.w / 2, y - ps.h / 2, y + ps.h / 2, zf, zf + 1.4);
      shadeZ(M.shadeFade, zf + 0.25, cx - fw / 2, cx + fw / 2, y - fh / 2 - 4, y - fh / 2 + 0.5, 0.2);
    });
    const span = portrait ? { w: fw, h: 3 * fh + 16 } : { w: 3 * fw + 24, h: fh };
    living.center = new THREE.Vector3(LX, cy, zf + 1.6);
    living.size = span;
  }

  // a soft shadow on the floor under furniture, where the room's light can't reach
  function contact(x0, x1, z0, z1, k, y = FLOOR) { shadeH(M.shadeSq, x0, x1, z0, z1, y + 0.3, k); }

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

  contact(-205, -95, -240, -145, 0.42);   // under the armchair and the plant, which load below
  contact(-262, -170, -290, -195, 0.4);
  C.build(group);
  for (const l of lights) group.add(l);


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
    model("sofa.glb", LX, -249, 100, 0).then(o => { if (o) o.position.y = LIV.y0 + 0.2; return o; }),   // the living room's sofa
  ]);
  Promise.all([surfaces, sky, models, board.ready, menuBoard.ready, aboutBoard.ready, prints.ready]).then(([surf, skyTex, objs]) => {
    if (worker) worker.terminate();
    const roomEnv = pmrem.fromScene(officeLight(), 0.035, 1, 3000).texture;
    for (const m of M.interior) { m.envMap = roomEnv; m.envMapIntensity = 1; m.needsUpdate = true; }
    const kitchenEnv = pmrem.fromScene(kitchenLight(), 0.035, 1, 3000).texture;
    for (const m of [...M.kitchen, M.glassClear]) { m.envMap = kitchenEnv; m.envMapIntensity = 1; m.needsUpdate = true; }
    for (const p of surf) if (p) { Object.assign(p[0], p[1], { roughness: 1 }); p[0].needsUpdate = true; }
    // the living room shares the office's oak and wool
    for (const [to, from] of [[M.lFloor, M.floor], [M.lRug, M.rug], [M.lOak, M.oak]])
      if (from.map) { Object.assign(to, { map: from.map, normalMap: from.normalMap, roughnessMap: from.roughnessMap }); to.needsUpdate = true; }
    const livingEnv = pmrem.fromScene(livingLight(), 0.035, 1, 3000).texture;
    for (const m of M.living) { m.envMap = livingEnv; m.envMapIntensity = 1; m.needsUpdate = true; }
    if (skyTex) {
      const env = pmrem.fromEquirectangular(skyTex).texture;
      skyTex.dispose();
      for (const m of M.exterior) {
        m.envMap = env;
        m.envMapIntensity = SKY_K * 0.8 * (m === M.glass ? 1.5 : m === M.deck ? 0.7 : 1);
        m.needsUpdate = true;
      }
    }
    if (objs[0]) {   // the plant again, in the kitchen's front corner, and in the living room by the sofa
      const o = objs[0].clone();
      o.position.set(KIT.x1 - 34, FLOOR, KIT.z1 - 40); o.rotation.y = 2.2;
      objs.push(o);
      const l = objs[0].clone();
      l.position.set(LX + 215, LIV.y0 + 0.2, -262); l.rotation.y = 1.1;
      objs.push(l);
    }
    for (const o of objs) if (o) {
      const env = o === objs[2] ? livingEnv : roomEnv;   // the sofa; the plants all share the office plant's materials
      o.traverse(n => {
        if (!n.isMesh) return;
        n.castShadow = n.receiveShadow = true;
        for (const m of [].concat(n.material)) { m.envMap = env; m.envMapIntensity = 1; }
      });
      group.add(o);
    }
    ready();
  });

  return { group, board: { reveal: board.reveal }, menu: { reveal: menuBoard.reveal }, screen: { reveal: aboutBoard.reveal }, about, kitchen, living,
           door: { open: a => { door.rotation.y = a; } } };
}

// the living room's daylight: the side window faces the sun, the open front door lets in the garden
function livingLight() {
  const s = new THREE.Scene(), { x0, x1, z0, z1, y0, y1 } = LIV;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, H = y1 - y0, D = z1 - z0;
  const basic = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide });
  const quad = (w, h, mat, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.set(rx, ry, 0); m.position.set(x - cx, y - cy, z - cz); s.add(m);
  };
  const walls = basic(0.56, 0.545, 0.52), floor = basic(0.5, 0.43, 0.34), ceil = basic(0.5, 0.495, 0.48);
  quad(W, D, floor, cx, y0, cz, -Math.PI / 2);
  quad(W, D, ceil, cx, y1, cz, Math.PI / 2);
  quad(W, H, walls, cx, cy, z0); quad(W, H, walls, cx, cy, z1, 0, Math.PI);
  quad(D, H, walls, x0, cy, cz, 0, Math.PI / 2); quad(D, H, walls, x1, cy, cz, 0, -Math.PI / 2);
  quad(110, 126, basic(4.0, 4.0, 3.8), x0 + 1, 183, -10, 0, Math.PI / 2);     // the sunny window
  quad(96, 200, basic(2.4, 2.6, 2.9), LX, 114, z1 - 1, 0, Math.PI);           // the open front door
  quad(170, 110, basic(1.5, 1.3, 1.0), -540, y0 + 1, -20, -Math.PI / 2);       // sun on the floor
  return s;
}

// the kitchen's daylight, the same way: the big window over the sink faces the sun, so it's bright and throws a
// sunny patch across the floor and the island; the front window and the doorway to the office add a little more
function kitchenLight() {
  const s = new THREE.Scene(), { x0, x1, z0, z1, y0, y1 } = KIT;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, H = y1 - y0, D = z1 - z0;
  const basic = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide });
  const quad = (w, h, mat, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.set(rx, ry, 0); m.position.set(x - cx, y - cy, z - cz); s.add(m);
  };
  const walls = basic(0.47, 0.455, 0.43), floor = basic(0.52, 0.49, 0.45), ceil = basic(0.44, 0.435, 0.42), cabs = basic(0.12, 0.15, 0.13);
  quad(W, D, floor, cx, y0, cz, -Math.PI / 2);
  quad(W, D, ceil, cx, y1, cz, Math.PI / 2);
  quad(W, H, walls, cx, cy, z0); quad(W, H, walls, cx, cy, z1, 0, Math.PI);
  quad(D, H, walls, x0, cy, cz, 0, Math.PI / 2); quad(D, H, walls, x1, cy, cz, 0, -Math.PI / 2);
  quad(D * 0.8, 90, cabs, x0 + 1, y0 + 45, z0 + D * 0.4, 0, Math.PI / 2);
  quad(150, 110, basic(3.4, 3.4, 3.2), x0 + 1, 500, -170, 0, Math.PI / 2);     // the sunny window
  quad(85, 130, basic(2.3, 2.6, 3.1), -482, 485, z1 - 1, 0, Math.PI);          // the front window
  quad(95, KDOOR.h, basic(0.6, 0.58, 0.55), x1 - 1, y0 + KDOOR.h / 2, 40, 0, -Math.PI / 2);   // the office
  quad(150, 160, basic(1.6, 1.4, 1.1), -520, y0 + 1, -150, -Math.PI / 2);      // sun on the floor
  return s;
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
