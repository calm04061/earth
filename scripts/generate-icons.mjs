import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crcData = Buffer.concat([t, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, t, data, crcVal]);
}

function createPNG(w, h, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  ihdr[9] = 6;  ihdr[10] = 0;  ihdr[11] = 0;  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 4));
  const pixBuf = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    pixBuf.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const compressed = deflateSync(raw);
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

function makeIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);
      const i = (y * size + x) * 4;
      if (dist <= r) {
        const t = y / size;
        pixels[i] = Math.round(20 + 60 * (1 - t));
        pixels[i + 1] = Math.round(100 + 155 * t);
        pixels[i + 2] = Math.round(180 + 75 * (1 - t));
        pixels[i + 3] = 255;
        if (Math.abs(dx) < 1.5 || Math.abs(dy) < 1.5 || Math.abs(dx - dy) < 1.5) {
          pixels[i] = Math.min(255, pixels[i] + 60);
          pixels[i + 1] = Math.min(255, pixels[i + 1] + 60);
          pixels[i + 2] = Math.min(255, pixels[i + 2] + 60);
        }
      } else {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        pixels[i + 3] = 0;
      }
    }
  }
  return createPNG(size, size, pixels);
}

[16, 48, 128].forEach(sz => {
  writeFileSync(new URL(`../public/icon-${sz}.png`, import.meta.url), makeIcon(sz));
  console.log(`Generated icon-${sz}.png`);
});
