// Stylized, seamless, tileable procedural sandstone textures.
//
// Technique stack (all periodic / torus-wrapped so the 1024 tile is seamless):
//   - tileable value-noise fBm (lattice hash wrapped mod period; period *= freq per octave)
//   - optional domain warp (warp field is itself tileable fBm, so periodicity is preserved)
//   - tileable Worley/Voronoi on a torus (neighbour cells wrapped mod period for the hash,
//     real positions kept for distance) with iq two-pass distance-to-edge for clean crack lines
//   - posterized tonal banding for the illustrated, non-photoreal look
//
// Pure Node: computes RGB pixels and encodes PNG via zlib. No browser, no native deps.

import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = dirname(fileURLToPath(import.meta.url));
const SIZE = 1024;

// ---------------------------------------------------------------------------
// PNG encoder (RGB, 8-bit)
// ---------------------------------------------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgb, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  // rest zero
  const stride = w * 3;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Hash / noise primitives
// ---------------------------------------------------------------------------
function hash2i(x, y) {
  // integer hash -> [0,1)
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
// 2D unit vector from cell for a jittered feature point offset in [0,1)^2
function hash2v(x, y) {
  const a = hash2i(x, y);
  const b = hash2i(x + 101, y - 57);
  return [a, b];
}
function pmod(n, m) {
  return ((n % m) + m) % m;
}
function smooth(t) {
  return t * t * t * (t * (t * 6 - 15) + 10); // quintic
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Tileable value noise. Coordinates in "cells"; wraps at `period` cells.
function valueNoise(x, y, period) {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = x - ix,
    fy = y - iy;
  const x0 = pmod(ix, period),
    y0 = pmod(iy, period);
  const x1 = pmod(ix + 1, period),
    y1 = pmod(iy + 1, period);
  const v00 = hash2i(x0, y0),
    v10 = hash2i(x1, y0);
  const v01 = hash2i(x0, y1),
    v11 = hash2i(x1, y1);
  const ux = smooth(fx),
    uy = smooth(fy);
  return lerp(lerp(v00, v10, ux), lerp(v01, v11, ux), uy);
}

// Tileable fBm. `period` = base cells across the tile at octave 0.
function fbm(x, y, period, octaves, gain, lacunarity) {
  let amp = 1,
    freq = 1,
    sum = 0,
    norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, period * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // [0,1]
}

// Ridged fBm variant for veined / weathered tone.
function ridged(x, y, period, octaves, gain, lacunarity) {
  let amp = 1,
    freq = 1,
    sum = 0,
    norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(x * freq, y * freq, period * freq);
    const r = 1 - Math.abs(n * 2 - 1);
    sum += amp * r * r;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

// Tileable Voronoi on a torus. Returns { f1, edge, cellId, cellRnd }.
// coord space: `period` cells across the whole tile. p in [0,period).
function voronoi(px, py, period, jitter) {
  const ix = Math.floor(px),
    iy = Math.floor(py);
  let f1 = 1e9,
    mrx = 0,
    mry = 0,
    mbx = 0,
    mby = 0;
  // pass 1: closest feature point
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx,
        cy = iy + dy;
      const [ox, oy] = hash2v(pmod(cx, period), pmod(cy, period));
      const fpx = cx + 0.5 + (ox - 0.5) * jitter;
      const fpy = cy + 0.5 + (oy - 0.5) * jitter;
      const rx = fpx - px,
        ry = fpy - py;
      const d = rx * rx + ry * ry;
      if (d < f1) {
        f1 = d;
        mrx = rx;
        mry = ry;
        mbx = cx;
        mby = cy;
      }
    }
  // pass 2: distance to the perpendicular bisector (cell edge) — iq method
  let edge = 1e9;
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      const cx = mbx + dx,
        cy = mby + dy;
      const [ox, oy] = hash2v(pmod(cx, period), pmod(cy, period));
      const fpx = cx + 0.5 + (ox - 0.5) * jitter;
      const fpy = cy + 0.5 + (oy - 0.5) * jitter;
      const rx = fpx - px,
        ry = fpy - py;
      const diffx = rx - mrx,
        diffy = ry - mry;
      const len2 = diffx * diffx + diffy * diffy;
      if (len2 > 1e-5) {
        const midx = 0.5 * (mrx + rx),
          midy = 0.5 * (mry + ry);
        const invl = 1 / Math.sqrt(len2);
        const d = midx * diffx * invl + midy * diffy * invl;
        if (d < edge) edge = d;
      }
    }
  const cx = pmod(mbx, period),
    cy = pmod(mby, period);
  return {
    f1: Math.sqrt(f1),
    edge,
    cellRnd: hash2i(cx + 7, cy + 3),
  };
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}
function mix(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
// sample a ramp of color stops at position t in [0,1]
function rampSample(stops, t) {
  t = Math.max(0, Math.min(1, t));
  const n = stops.length - 1;
  const f = t * n;
  const i = Math.min(n - 1, Math.floor(f));
  return mix(stops[i], stops[i + 1], f - i);
}
function clamp8(v) {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

// ---------------------------------------------------------------------------
// Variant renderer
// ---------------------------------------------------------------------------
function render(p) {
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  const ramp = p.ramp.map(hex);
  const crackCol = hex(p.crackColor);
  const chipDark = hex(p.chipDark);
  const chipLight = hex(p.chipLight);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // normalized [0,1) tile coords
      const u = x / SIZE,
        v = y / SIZE;

      // --- base tone: domain-warped fBm, low frequency, calm ---
      let bx = u * p.baseFreq,
        by = v * p.baseFreq;
      if (p.warp > 0) {
        const wx = fbm(bx + 3.1, by + 1.7, p.baseFreq, 2, 0.5, 2);
        const wy = fbm(bx - 2.3, by + 5.9, p.baseFreq, 2, 0.5, 2);
        bx += (wx - 0.5) * 2 * p.warp;
        by += (wy - 0.5) * 2 * p.warp;
      }
      let tone = p.ridged
        ? ridged(bx, by, p.baseFreq, p.octaves, 0.55, 2)
        : fbm(bx, by, p.baseFreq, p.octaves, 0.5, 2);
      // contrast around midpoint
      tone = 0.5 + (tone - 0.5) * p.contrast;
      tone = Math.max(0, Math.min(1, tone));

      // posterize into bands for the illustrated look
      let bandT = tone;
      if (p.bands > 0) {
        const b = Math.round(tone * (p.bands - 1)) / (p.bands - 1);
        bandT = lerp(tone, b, p.posterize); // blend hard bands with smooth
      }
      let col = rampSample(ramp, bandT);

      // --- Voronoi: cracks + chipped cells ---
      const vor = voronoi(u * p.vorFreq, v * p.vorFreq, p.vorFreq, p.jitter);

      // chipped cells: some whole cells recessed darker or raised lighter
      if (vor.cellRnd < p.chipDarkChance) {
        col = mix(col, chipDark, p.chipStrength);
      } else if (vor.cellRnd > 1 - p.chipLightChance) {
        col = mix(col, chipLight, p.chipStrength * 0.8);
      }

      // thin crack lines along cell edges (distance-to-edge threshold)
      const crack = 1 - Math.min(1, vor.edge / p.crackWidth);
      if (crack > 0) {
        col = mix(col, crackCol, Math.pow(crack, p.crackSharp) * p.crackStrength);
      }

      // faint fine grain to break flat bands (very low amplitude)
      if (p.grain > 0) {
        const g = valueNoise(u * 220.0, v * 220.0, 220) - 0.5;
        col = [col[0] + g * p.grain, col[1] + g * p.grain, col[2] + g * p.grain];
      }

      const o = (y * SIZE + x) * 3;
      buf[o] = clamp8(col[0]);
      buf[o + 1] = clamp8(col[1]);
      buf[o + 2] = clamp8(col[2]);
    }
  }
  return buf;
}

// downsample RGB buffer (box) from src size to dst size
function downsample(src, sw, dw) {
  const out = Buffer.alloc(dw * dw * 3);
  const step = sw / dw;
  for (let y = 0; y < dw; y++)
    for (let x = 0; x < dw; x++) {
      const sx = Math.floor(x * step),
        sy = Math.floor(y * step);
      const so = (sy * sw + sx) * 3,
        o = (y * dw + x) * 3;
      out[o] = src[so];
      out[o + 1] = src[so + 1];
      out[o + 2] = src[so + 2];
    }
  return out;
}

// build a 2x2 tiled preview (each tile downsampled to half) => same SIZE canvas
function tiled2x2(src) {
  const half = SIZE / 2;
  const small = downsample(src, SIZE, half);
  const out = Buffer.alloc(SIZE * SIZE * 3);
  for (let ty = 0; ty < 2; ty++)
    for (let tx = 0; tx < 2; tx++)
      for (let y = 0; y < half; y++) {
        const dstY = ty * half + y;
        const srcRow = y * half * 3;
        const dstRow = (dstY * SIZE + tx * half) * 3;
        small.copy(out, dstRow, srcRow, srcRow + half * 3);
      }
  return out;
}

// seam metric: mean abs diff across the wrap seam vs mean interior neighbour diff.
// For a truly periodic tile these should be comparable (ratio ~1).
function seamMetric(src) {
  let seam = 0,
    interior = 0;
  const n = SIZE;
  // horizontal wrap: col n-1 -> col 0
  for (let y = 0; y < n; y++) {
    for (let c = 0; c < 3; c++) {
      const a = src[(y * n + (n - 1)) * 3 + c];
      const b = src[(y * n + 0) * 3 + c];
      seam += Math.abs(a - b);
      const p1 = src[(y * n + (n >> 1)) * 3 + c];
      const p2 = src[(y * n + (n >> 1) - 1) * 3 + c];
      interior += Math.abs(p1 - p2);
    }
  }
  // vertical wrap: row n-1 -> row 0
  for (let x = 0; x < n; x++) {
    for (let c = 0; c < 3; c++) {
      const a = src[((n - 1) * n + x) * 3 + c];
      const b = src[(0 * n + x) * 3 + c];
      seam += Math.abs(a - b);
    }
  }
  return {
    seamMean: seam / (n * 6),
    interiorMean: interior / (n * 3),
  };
}

// ---------------------------------------------------------------------------
// 5 variants
// ---------------------------------------------------------------------------
const base = {
  baseFreq: 4, // low-frequency, calm tonal field
  octaves: 3,
  contrast: 1.0,
  ridged: false,
  bands: 5,
  posterize: 0.75,
  warp: 0.35,
  vorFreq: 9,
  jitter: 0.9,
  crackWidth: 0.05,
  crackSharp: 1.0,
  crackStrength: 0.85,
  crackColor: "#7a6038",
  chipDarkChance: 0.06,
  chipLightChance: 0.08,
  chipStrength: 0.28,
  chipDark: "#8a744c",
  chipLight: "#e7d8b4",
  grain: 6,
  ramp: ["#7a6038", "#a8895a", "#c8b184", "#d4bf94", "#e7d8b4"],
};

const variants = [
  // 1: minimal, calm, few faint cracks
  {
    ...base,
    baseFreq: 3,
    vorFreq: 7,
    bands: 4,
    contrast: 0.85,
    crackWidth: 0.03,
    crackStrength: 0.5,
    chipDarkChance: 0.03,
    chipLightChance: 0.05,
    chipStrength: 0.18,
    grain: 4,
  },
  // 2: more visible Voronoi cell structure
  {
    ...base,
    vorFreq: 11,
    jitter: 1.0,
    crackWidth: 0.06,
    crackStrength: 0.9,
    crackSharp: 0.8,
    bands: 5,
    chipDarkChance: 0.05,
    chipLightChance: 0.06,
  },
  // 3: chunkier chips / pitting
  {
    ...base,
    vorFreq: 7,
    jitter: 0.95,
    bands: 6,
    crackWidth: 0.055,
    crackStrength: 0.8,
    chipDarkChance: 0.16,
    chipLightChance: 0.14,
    chipStrength: 0.42,
    chipDark: "#6f5a38",
    contrast: 1.1,
  },
  // 4: cooler / greyer palette
  {
    ...base,
    baseFreq: 4,
    vorFreq: 9,
    bands: 5,
    contrast: 0.95,
    crackColor: "#5b5340",
    chipDark: "#6d6552",
    chipLight: "#d8cfb8",
    chipDarkChance: 0.09,
    chipLightChance: 0.09,
    ramp: ["#6b6450", "#948a6f", "#b3a888", "#c3b998", "#dad0b6"],
  },
  // 5: warmer / higher-contrast
  {
    ...base,
    baseFreq: 4,
    vorFreq: 8,
    ridged: false,
    bands: 5,
    posterize: 0.9,
    contrast: 1.2,
    warp: 0.3,
    crackColor: "#6a4d28",
    crackWidth: 0.05,
    crackStrength: 0.9,
    chipDark: "#96682f",
    chipLight: "#f0e0b8",
    chipDarkChance: 0.06,
    chipLightChance: 0.09,
    chipStrength: 0.3,
    grain: 5,
    ramp: ["#8a6330", "#a67c40", "#cda868", "#dcc088", "#f0e2b4"],
  },
];

for (let i = 0; i < variants.length; i++) {
  const p = variants[i];
  const t0 = Date.now();
  const img = render(p);
  const tileFile = join(OUT, `stone-${i + 1}.png`);
  writeFileSync(tileFile, encodePNG(img, SIZE, SIZE));
  const preview = tiled2x2(img);
  writeFileSync(join(OUT, `stone-${i + 1}-tiled.png`), encodePNG(preview, SIZE, SIZE));
  const m = seamMetric(img);
  console.log(
    `stone-${i + 1}: ${((Date.now() - t0) / 1000).toFixed(1)}s  ` +
      `seamMean=${m.seamMean.toFixed(3)} interiorMean=${m.interiorMean.toFixed(3)} ` +
      `ratio=${(m.seamMean / Math.max(0.001, m.interiorMean)).toFixed(2)}`
  );
}
console.log("done");
