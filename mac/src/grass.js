// A sunny lawn for the MacBook to lie on, in centimetres like the laptop: a painted ground of grass, tens of
// thousands of 3D blades that sway a little, and a scatter of daisies. Nothing grows under the laptop itself.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const GROUND_Y = -0.3;            // the laptop rests on the grass, a few millimetres above the soil

// seeded random, so the lawn is the same on every visit
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- the ground: a tileable painting of grass seen from above ---------- */
function groundTexture(rand, size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  x.fillStyle = "#2c561a";
  x.fillRect(0, 0, size, size);
  // soft patches of lighter and darker growth
  for (let i = 0; i < 160; i++) {
    const px = rand() * size, py = rand() * size, r = size * (0.03 + rand() * 0.08);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    const light = rand() < 0.5;
    g.addColorStop(0, light ? "rgba(120,160,60,0.18)" : "rgba(20,45,10,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  // blades seen from above: short strokes, darker ones first and the sunlit ones on top; each one is also drawn
  // shifted by the tile size where it crosses an edge, so the tile repeats without a seam
  x.lineCap = "round";
  const s = size / 2048;
  for (let pass = 0; pass < 3; pass++) {
    const n = [26000, 22000, 9000][pass];
    for (let i = 0; i < n; i++) {
      const px = rand() * size, py = rand() * size;
      const len = (8 + rand() * (pass === 2 ? 22 : 30)) * s, a = rand() * Math.PI * 2;
      const h = 74 + rand() * 30, sat = 45 + rand() * 30, l = [20, 31, 44][pass] + rand() * 12;
      x.strokeStyle = `hsl(${h},${sat}%,${l}%)`;
      x.lineWidth = (1.2 + rand() * 1.8) * s;
      const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
      for (const ox of [0, -size, size]) for (const oy of [0, -size, size]) {
        if ((ox && Math.abs(px + ox - size / 2) > size / 2 + len) || (oy && Math.abs(py + oy - size / 2) > size / 2 + len)) continue;
        x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + dx, py + oy + dy); x.stroke();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function ground(rand, quality) {
  const SIZE = 5200, SEG = 220, TILE = 48;   // wide enough to fill the view from high above, and round the house
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  // large, slow variation in colour across the lawn, so the repeating tile doesn't show
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const waves = Array.from({ length: 6 }, () => [rand() * 0.06 + 0.01, rand() * 0.06 + 0.01, rand() * 6.3, rand() * 0.05 + 0.03]);
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i), pz = pos.getZ(i);
    let v = 0.93;
    for (const [fx, fz, ph, amp] of waves) v += Math.sin(px * fx + pz * fz + ph) * amp;
    col[i * 3] = v * 0.98; col[i * 3 + 1] = v; col[i * 3 + 2] = v * 0.9;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const map = groundTexture(rand, quality === "high" ? 2048 : 1024);
  map.repeat.set(SIZE / TILE, SIZE / TILE);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.18 }));
  m.position.y = GROUND_Y;
  m.receiveShadow = true;
  return m;
}

/* ---------- blades: one instanced mesh, swaying in the shader ---------- */
function bladeGeometry() {
  // a tapered strip one unit tall, curving forward towards its tip; the instance scales it to size
  const LV = 4, pos = [], col = [], nor = [], idx = [];
  for (let i = 0; i <= LV; i++) {
    const h = i / LV, half = 0.5 * Math.pow(1 - h, 0.85), z = 0.32 * h * h;
    const shade = 0.38 + 0.62 * h;
    if (i < LV) {
      pos.push(-half, h, z, half, h, z);
      col.push(shade, shade, shade, shade, shade, shade);
      nor.push(0, 1, 0.25, 0, 1, 0.25);
    } else {
      pos.push(0, h, z); col.push(1, 1, 1); nor.push(0, 1, 0.25);
    }
  }
  for (let i = 0; i < LV - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const t = (LV - 1) * 2; idx.push(t, t + 1, t + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));   // lit like the ground, so no blade goes black
  g.setIndex(idx);
  return g;
}

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// is a point under the laptop (with a margin)?
const under = (x, z, w, d, m) => Math.abs(x) < w / 2 + m && Math.abs(z) < d / 2 + m;

function blades(rand, count, foot) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.82, metalness: 0, envMapIntensity: 0.18 });
  const uTime = { value: 0 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <project_vertex>", `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        float ph = dot( instanceMatrix[3].xz, vec2( 0.13, 0.09 ) );
      #else
        float ph = 0.0;
      #endif
      float bend = position.y * position.y;
      mvPosition.x += sin( uTime * 1.25 + ph ) * 0.32 * bend;
      mvPosition.z += sin( uTime * 0.9 + ph * 1.7 ) * 0.18 * bend;
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
  };
  const mesh = new THREE.InstancedMesh(bladeGeometry(), mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const c = new THREE.Color();
  let n = 0;
  while (n < count) {
    // most of the blades go where the camera looks: in front of and around the laptop, thinning out and getting
    // shorter towards the edge of the patch, so it melts into the painted lawn when seen from further off
    const x = (rand() * 2 - 1) * 125, z = -105 + rand() * 225;
    const edge = Math.hypot(x / 125, (z - 7.5) / 112.5);
    if (edge > 1 || rand() > 1 - smoothstep(0.62, 1, edge)) continue;
    if (under(x, z, foot.w, foot.d, 0.2)) continue;
    const near = under(x, z, foot.w, foot.d, 2.2);            // pressed down at the laptop's edges
    const h = (near ? 0.7 + rand() * 0.9 : 1.4 + rand() * 2.0) * (1 - 0.55 * smoothstep(0.55, 1, edge));   // a mown lawn
    e.set((rand() - 0.5) * 0.5, rand() * Math.PI * 2, (rand() - 0.5) * 0.5);
    q.setFromEuler(e);
    p.set(x, GROUND_Y - 0.1, z);
    s.set(0.14 + rand() * 0.14, h, 0.14 + rand() * 0.14);
    m.compose(p, q, s);
    mesh.setMatrixAt(n, m);
    if (rand() < 0.03) c.setHSL(0.13 + rand() * 0.03, 0.35, 0.45 + rand() * 0.1);          // a dry blade
    else c.setHSL(0.2 + rand() * 0.08, 0.5 + rand() * 0.3, 0.27 + rand() * 0.22);
    mesh.setColorAt(n, c);
    n++;
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return { mesh, uTime };
}

/* ---------- daisies ---------- */
function daisies(rand, count, foot) {
  const petals = [];
  const N = 15;
  for (let i = 0; i < N; i++) {
    const g = new THREE.CircleGeometry(0.5, 10);
    g.scale(0.32, 1, 1);             // a long, narrow petal
    g.translate(0, 0.62, 0);
    g.rotateX(-Math.PI / 2 + 0.18);  // flat, cupped a little upwards
    g.rotateY((i / N) * Math.PI * 2 + (rand() - 0.5) * 0.15);
    petals.push(g);
  }
  const petalGeo = mergeGeometries(petals);
  const centreGeo = new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  centreGeo.scale(1, 0.55, 1);
  const pm = new THREE.InstancedMesh(petalGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, side: THREE.DoubleSide }), count);
  const cm = new THREE.InstancedMesh(centreGeo, new THREE.MeshStandardMaterial({ color: 0xf0b20c, roughness: 0.8 }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let n = 0;
  while (n < count) {
    const x = (rand() * 2 - 1) * 85, z = -60 + rand() * 140;
    if (under(x, z, foot.w, foot.d, 4)) continue;
    e.set((rand() - 0.5) * 0.6, rand() * 6.3, (rand() - 0.5) * 0.6);
    q.setFromEuler(e);
    p.set(x, GROUND_Y + 1.6 + rand() * 1.2, z);
    const k = 0.8 + rand() * 0.4;
    s.set(k, k, k);
    m.compose(p, q, s);
    pm.setMatrixAt(n, m); cm.setMatrixAt(n, m);
    n++;
  }
  for (const im of [pm, cm]) { im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; }
  return [pm, cm];
}

/* ---------- the sky the aluminium reflects ---------- */
export function outdoorEnvironment(sunDir) {
  const s = new THREE.Scene();
  const geo = new THREE.SphereGeometry(200, 48, 24), pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const zenith = new THREE.Color(0.7, 0.73, 0.8).multiplyScalar(1.5), horizon = new THREE.Color(1, 1, 0.97).multiplyScalar(1.7);
  const grass = new THREE.Color(0.12, 0.2, 0.06), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 200;
    if (y >= 0) c.copy(horizon).lerp(zenith, Math.pow(y, 0.6));
    else c.copy(horizon).lerp(grass, Math.min(1, -y * 8));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.95, 0.85).multiplyScalar(40) }));
  sun.position.copy(sunDir).normalize().multiplyScalar(180);
  s.add(sun);
  return s;
}

export function makeLawn(scene, foot, quality) {
  const rand = rng(20261010);
  scene.add(ground(rand, quality));
  // the fields beyond, out to the horizon, where the haze takes them
  const far = new THREE.Mesh(new THREE.PlaneGeometry(200000, 200000).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3b6322, roughness: 1, metalness: 0, envMapIntensity: 0.18 }));
  far.position.y = GROUND_Y - 1;
  far.receiveShadow = true;
  scene.add(far);
  const b = blades(rand, quality === "high" ? 80000 : 40000, foot);
  scene.add(b.mesh);
  const flowers = daisies(rand, quality === "high" ? 34 : 22, foot);
  for (const d of flowers) scene.add(d);
  return {
    update: t => { b.uTime.value = t; },
    // the blades and daisies only matter round the laptop: away from it, they're skipped
    near: on => { b.mesh.visible = on; for (const d of flowers) d.visible = on; },
  };
}
