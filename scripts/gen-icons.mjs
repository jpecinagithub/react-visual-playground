// Generates PWA icons (192/512 + maskable + apple-touch) with a pure-JS PNG
// encoder — no native deps. Design: dark rounded square, vertical gradient,
// three orbit ellipses + nucleus (original, React-inspired but not the logo).
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const outDir = new URL('../public/icons/', import.meta.url);
mkdirSync(outDir, { recursive: true });

function makePng(size, draw) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };
  draw(set, size);
  const raw = Buffer.alloc((size * size * 4 + 1) * 1 + size);
  // Build scanlines (filter byte 0 + RGBA rows)
  const stride = size * 4;
  const withFilter = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    withFilter[y * (stride + 1)] = 0;
    px.copy(withFilter, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(withFilter);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([td, data]));
    const cb = Buffer.alloc(4);
    cb.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, td, data, cb]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

// CRC32 (IEEE)
const table = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function drawIcon(set, size, { pad = 0 } = {}) {
  const cx = size / 2, cy = size / 2;
  const radius = size * (pad > 0 ? 0.5 : 0.22);
  // background: vertical gradient #0b1220 -> #16233d, rounded rect
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = true;
      if (pad === 0) {
        // rounded corners
        const r = radius;
        const corners = [
          [r, r], [size - r, r], [r, size - r], [size - r, size - r],
        ];
        inside = x >= 0 && x < size && y >= 0 && y < size;
        if (inside) {
          for (const [ccx, ccy] of corners) {
            const dx = x - ccx, dy = y - ccy;
            if ((ccx < size / 2 ? x < ccx : x > ccx) && (ccy < size / 2 ? y < ccy : y > ccy)) {
              if (dx * dx + dy * dy > r * r) { inside = false; break; }
            }
          }
        }
      }
      if (!inside) continue;
      const t = y / size;
      set(x, y, lerp(11, 26, t), lerp(18, 38, t), lerp(32, 66, t));
    }
  }
  const atom = (col, rotDeg, lw) => {
    const rot = (rotDeg * Math.PI) / 180;
    const rx = size * 0.34, ry = size * 0.135;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const steps = Math.max(220, size);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      for (let w = -lw; w <= lw; w++) {
        const ex = Math.cos(a) * rx + (w * -Math.sin(a) * ry) / ry;
        const ey = Math.sin(a) * ry + (w * Math.cos(a) * rx) / rx;
        const x = Math.round(cx + ex * cos - ey * sin);
        const y = Math.round(cy + ex * sin + ey * cos);
        set(x, y, col[0], col[1], col[2]);
      }
    }
  };
  const lw = Math.max(2, Math.round(size / 128));
  atom([34, 211, 238], 0, lw);    // cyan
  atom([167, 139, 250], 60, lw);  // violet
  atom([52, 211, 153], 120, lw);  // emerald
  // nucleus
  const nr = size * 0.055;
  for (let y = -nr; y <= nr; y++) {
    for (let x = -nr; x <= nr; x++) {
      if (x * x + y * y <= nr * nr) set(Math.round(cx + x), Math.round(cy + y), 34, 211, 238);
    }
  }
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`icon-${size}.png`, outDir), makePng(size, (s, z) => drawIcon(s, z)));
  console.log('wrote icon-' + size + '.png');
}
writeFileSync(new URL('maskable-512.png', outDir), makePng(512, (s, z) => drawIcon(s, z, { pad: 1 })));
console.log('wrote maskable-512.png');
writeFileSync(new URL('../apple-touch-icon.png', outDir), makePng(180, (s, z) => drawIcon(s, z)));
console.log('wrote apple-touch-icon.png');
