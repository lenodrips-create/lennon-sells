// Runs in a worker, off the page's own thread, so painting the house's surfaces and decoding its sky never holds up
// scrolling or the animations: it paints colour, relief (for normal maps) and roughness for each surface, and decodes
// the HDRI into half floats. The page builds it into the bundle as text (see package.json) and starts it from a blob.
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- noise, tileable: lattice coordinates wrap at px, py ---------- */
function hash(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, s, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % px) + px) % px, y0 = ((yi % py) + py) % py, x1 = (x0 + 1) % px, y1 = (y0 + 1) % py;
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, px, py, oct = 4) {
  let v = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { v += a * noise(x, y, s + i * 17, px, py); n += a; x *= 2; y *= 2; px *= 2; py *= 2; a *= 0.5; }
  return v / n;
}

/* ---------- surfaces: colour, relief and roughness painted together from one function ---------- */
// fn(x, y, out) gets a point in centimetres (y up) and fills out = [r, g, b, height in cm, roughness]
function surface(w, h, cmW, cmH, fn) {
  const col = new Uint8Array(w * h * 4), nrm = new Uint8Array(w * h * 4), rgh = new Uint8Array(w * h * 4);
  const H = new Float32Array(w * h), out = [0, 0, 0, 0, 0.5], b = v => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    fn((x * cmW) / w, (y * cmH) / h, out);
    const i = y * w + x;
    H[i] = out[3];
    col[i * 4] = b(out[0]); col[i * 4 + 1] = b(out[1]); col[i * 4 + 2] = b(out[2]); col[i * 4 + 3] = 255;
    rgh[i * 4] = 255; rgh[i * 4 + 1] = b(out[4]); rgh[i * 4 + 2] = 255; rgh[i * 4 + 3] = 255;
  }
  const sx = (2 * cmW) / w, sy = (2 * cmH) / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = (x - 1 + w) % w, xr = (x + 1) % w, yd = (y - 1 + h) % h, yu = (y + 1) % h, i = y * w + x;
    let nx = -(H[y * w + xr] - H[y * w + xl]) / sx, ny = -(H[yu * w + x] - H[yd * w + x]) / sy, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    nrm[i * 4] = b(nx * 0.5 + 0.5); nrm[i * 4 + 1] = b(ny * 0.5 + 0.5); nrm[i * 4 + 2] = b(nz * 0.5 + 0.5); nrm[i * 4 + 3] = 255;
  }
  return { w, h, cmW, cmH, col, nrm, rgh };
}

// lap siding, painted white: boards with an 18 cm exposure, each thicker at its foot so it throws a fine shadow line
// on the board below, a faint embossed grain, and the odd butt joint
const sidingSurface = q => surface(q ? 256 : 128, q ? 1024 : 512, 240, 108, (x, y, o) => {
  const E = 18, b = Math.floor(y / E), yin = y - b * E, v = yin / E;
  const g = noise(x / 30, y * 2.5, 11, 8, 270) * 0.6 + noise(x / 12, y * 5, 23, 20, 540) * 0.4;
  const foot = smoothstep(0, 0.9, yin);             // the board's foot: its edge faces down, into shade
  let h = 0.55 * (1 - v) * foot + 0.03 * (g - 0.5);
  const seam = hash(b, 3, 5) * 240, joint = Math.abs(x - seam) < 0.4;
  if (joint) h -= 0.12;
  let c = 0.9 * (1 + (hash(b, 9, 2) - 0.5) * 0.025) * (1 + (g - 0.5) * 0.05);
  // the shadow the next board's foot throws on this one, and the shaded foot itself
  c *= (1 - 0.42 * smoothstep(0.925, 1, v)) * (0.5 + 0.5 * foot) * (joint ? 0.9 : 1);
  o[0] = c; o[1] = c * 0.995; o[2] = c * 0.982; o[3] = h; o[4] = foot < 1 ? 1 : 0.62 + 0.12 * (g - 0.5);
});
// oak floor: 20 cm planks running towards the chalkboard, with eased edges, staggered ends and a satin finish
const oakFloorSurface = q => surface(q ? 512 : 256, q ? 1024 : 512, 120, 240, (x, y, o) => {
  const col = Math.floor(x / 20), xin = x - col * 20;
  const off = hash(col, 1, 9) * 240, two = hash(col, 2, 9) < 0.5;
  const yy = (((y - off) % 240) + 240) % 240, seg = two ? Math.floor(yy / 120) : 0, yin = two ? yy % 120 : yy;
  const pid = col * 7 + seg * 3 + 1, plank = 0.82 + hash(pid, 4, 4) * 0.3;
  const g = noise(x * 0.9 + pid * 3.1, y / 22, pid, 108, 11) * 0.65 + noise(x * 2.7, y / 7, pid + 3, 324, 34) * 0.35;
  const fleck = noise(x * 0.6, y * 0.35, 77, 72, 84) > 0.86 ? 0.9 : 1;
  const edge = Math.min(xin, 20 - xin), end = Math.min(yin, (two ? 120 : 240) - yin);
  const bevel = smoothstep(0, 0.35, edge) * smoothstep(0, 0.35, end);
  const k = plank * (0.86 + 0.28 * g) * fleck * (0.72 + 0.28 * bevel);
  o[0] = 0.74 * k; o[1] = 0.56 * k; o[2] = 0.37 * k;
  o[3] = 0.12 * bevel + 0.012 * g; o[4] = 0.36 + 0.14 * (1 - g) + (1 - bevel) * 0.2;
});
// composite decking: 14.4 cm boards with 6 mm gaps, a brushed grain and a little colour variation
const deckSurface = q => surface(q ? 256 : 128, q ? 256 : 128, 120, 120, (x, y, o) => {
  const b = Math.floor(y / 15), yin = y - b * 15, gap = yin > 14.4;
  const g = noise(x / 9 + b * 5, yin * 1.6, 31 + b, 14, 24);
  const k = gap ? 0.12 : (0.8 + hash(b, 7, 7) * 0.25) * (0.85 + 0.3 * g);
  o[0] = 0.56 * k; o[1] = 0.4 * k; o[2] = 0.27 * k;
  o[3] = gap ? -0.8 : 0.03 * g + 0.15 * smoothstep(0, 0.3, Math.min(yin, 14.4 - yin)); o[4] = gap ? 1 : 0.62 + 0.2 * g;
});
// cedar, for the balcony's edge board: warm, with a strong grain
const cedarSurface = q => surface(q ? 256 : 128, q ? 128 : 64, 120, 30, (x, y, o) => {
  const g = noise(x / 14, y * 1.4, 41, 9, 42) * 0.6 + noise(x / 4, y * 3.5, 43, 30, 105) * 0.4;
  const k = 0.8 + 0.35 * g;
  o[0] = 0.62 * k; o[1] = 0.41 * k; o[2] = 0.25 * k; o[3] = 0.02 * g; o[4] = 0.55 + 0.2 * g;
});
// oak for the furniture and the chalkboard's frame
const oakSurface = q => surface(q ? 256 : 128, q ? 256 : 128, 60, 60, (x, y, o) => {
  const g = noise(x / 12, y * 0.9 + noise(x / 30, y / 10, 3, 2, 6) * 3, 51, 5, 54) * 0.65 + noise(x / 3, y * 3, 53, 20, 180) * 0.35;
  const k = 0.82 + 0.32 * g;
  o[0] = 0.7 * k; o[1] = 0.52 * k; o[2] = 0.33 * k; o[3] = 0.01 * g; o[4] = 0.45 + 0.15 * (1 - g);
});
// broom-finished concrete, weathered and mottled
const concreteSurface = q => surface(q ? 512 : 256, q ? 512 : 256, 200, 200, (x, y, o) => {
  const m = fbm(x / 40, y / 40, 61, 5, 5), broom = noise(x / 50, y * 1.8, 63, 4, 360), speck = hash(Math.floor(x * 2.56), Math.floor(y * 2.56), 65);
  const k = (0.9 + 0.24 * (m - 0.5)) * (0.96 + 0.08 * speck) * (0.98 + 0.04 * broom);
  o[0] = 0.69 * k; o[1] = 0.68 * k; o[2] = 0.65 * k; o[3] = 0.03 * broom + 0.02 * speck; o[4] = 0.82 + 0.12 * speck;
});
// a woven wool rug
const rugSurface = q => surface(q ? 256 : 128, q ? 256 : 128, 40, 40, (x, y, o) => {
  const w = Math.sin(x * 4.4) * Math.sin(y * 4.4), f = noise(x * 1.2, y * 1.2, 71, 48, 48);
  const k = 0.88 + 0.08 * w + 0.12 * (f - 0.5);
  o[0] = 0.8 * k; o[1] = 0.76 * k; o[2] = 0.69 * k; o[3] = 0.08 * w; o[4] = 0.95;
});

const SURFACES = { siding: sidingSurface, floor: oakFloorSurface, deck: deckSurface, cedar: cedarSurface, oak: oakSurface,
                   concrete: concreteSurface, rug: rugSurface };

/* ---------- the HDRI: Radiance RGBE, run-length encoded, to RGBA half floats ---------- */
const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
function toHalf(v) {
  f32[0] = v;
  const x = u32[0], e = (x >> 23) & 0xff;
  let bits = (x >> 16) & 0x8000, m = (x >> 12) & 0x07ff;
  if (e < 103) return bits;
  if (e > 142) return bits | 0x7c00;
  if (e < 113) { m |= 0x0800; return bits | ((m >> (114 - e)) + ((m >> (113 - e)) & 1)); }
  bits |= ((e - 112) << 10) | (m >> 1);
  return bits + (m & 1);
}
function decodeHDR(buf) {
  const d = new Uint8Array(buf);
  let i = 0, W = 0, H = 0;
  for (;;) {
    let j = i; while (d[j] !== 10) j++;
    const line = String.fromCharCode(...d.subarray(i, j)); i = j + 1;
    const m = /^-Y (\d+) \+X (\d+)/.exec(line);
    if (m) { H = +m[1]; W = +m[2]; break; }
  }
  const out = new Uint16Array(W * H * 4), row = new Uint8Array(W * 4);
  for (let y = 0; y < H; y++) {
    if (d[i] === 2 && d[i + 1] === 2) {
      i += 4;
      for (let c = 0; c < 4; c++) for (let x = 0; x < W;) {
        let n = d[i++];
        if (n > 128) { n -= 128; row.fill(d[i++], c * W + x, c * W + x + n); }
        else { row.set(d.subarray(i, i + n), c * W + x); i += n; }
        x += n;
      }
      for (let x = 0; x < W; x++) put(out, (y * W + x) * 4, row[x], row[W + x], row[2 * W + x], row[3 * W + x]);
    } else {
      for (let x = 0; x < W; x++, i += 4) put(out, (y * W + x) * 4, d[i], d[i + 1], d[i + 2], d[i + 3]);
    }
  }
  return { w: W, h: H, data: out };
}
function put(out, k, r, g, b, e) {
  const f = e ? Math.pow(2, e - 136) : 0;
  out[k] = toHalf(r * f); out[k + 1] = toHalf(g * f); out[k + 2] = toHalf(b * f); out[k + 3] = 0x3c00;
}

self.onmessage = async ({ data: msg }) => {
  if (msg.kind === "surface") {
    const s = SURFACES[msg.name](msg.q);
    self.postMessage({ id: msg.id, ...s }, [s.col.buffer, s.nrm.buffer, s.rgh.buffer]);
  } else if (msg.kind === "hdr") {
    try {
      const s = decodeHDR(await (await fetch(msg.url)).arrayBuffer());
      self.postMessage({ id: msg.id, ...s }, [s.data.buffer]);
    } catch (e) { self.postMessage({ id: msg.id, error: String(e) }); }
  }
};
