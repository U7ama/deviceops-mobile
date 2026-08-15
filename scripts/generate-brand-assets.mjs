import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const size = 1024;
const assets = new Map();

function color(hex, alpha = 255) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >> 16 & 255, value >> 8 & 255, value & 255, alpha];
}

function canvas(background) {
  return { pixels: Buffer.alloc(size * size * 4, 0), background };
}

function pixel(image, x, y, rgba) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  const sourceAlpha = rgba[3] / 255;
  const destinationAlpha = image.pixels[offset + 3] / 255;
  const alpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (alpha === 0) return;
  for (let channel = 0; channel < 3; channel++) {
    image.pixels[offset + channel] = Math.round((rgba[channel] * sourceAlpha + image.pixels[offset + channel] * destinationAlpha * (1 - sourceAlpha)) / alpha);
  }
  image.pixels[offset + 3] = Math.round(alpha * 255);
}

function fill(image, rgba) {
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) pixel(image, x, y, rgba);
}

function circle(image, cx, cy, radius, rgba) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) pixel(image, x, y, rgba);
    }
  }
}

function line(image, x1, y1, x2, y2, width, rgba) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let step = 0; step <= steps; step++) {
    const t = steps === 0 ? 0 : step / steps;
    circle(image, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, rgba);
  }
}

function roundedRect(image, left, top, right, bottom, radius, width, rgba, fillColor = null) {
  if (fillColor) {
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const dx = Math.max(left + radius - x, 0, x - (right - radius));
      const dy = Math.max(top + radius - y, 0, y - (bottom - radius));
      if (dx * dx + dy * dy <= radius * radius) pixel(image, x, y, fillColor);
    }
  }
  for (let i = 0; i < width; i++) {
    line(image, left + radius, top + i, right - radius, top + i, 1, rgba);
    line(image, left + radius, bottom - i, right - radius, bottom - i, 1, rgba);
    line(image, left + i, top + radius, left + i, bottom - radius, 1, rgba);
    line(image, right - i, top + radius, right - i, bottom - radius, 1, rgba);
    circle(image, left + radius, top + radius, radius - i, rgba);
    circle(image, right - radius, top + radius, radius - i, rgba);
    circle(image, left + radius, bottom - radius, radius - i, rgba);
    circle(image, right - radius, bottom - radius, radius - i, rgba);
  }
}

function mark(withBackground) {
  const image = canvas();
  if (withBackground) fill(image, color('#081525'));
  roundedRect(image, 186, 244, 838, 678, 87, 38, color('#56d7ee'), color('#0f2740'));
  line(image, 370, 768, 654, 768, 38, color('#56d7ee'));
  line(image, 512, 678, 512, 768, 38, color('#56d7ee'));
  line(image, 324, 389, 512, 389, 28, color('#9beafa'));
  line(image, 324, 477, 440, 477, 28, color('#9beafa'));
  circle(image, 714, 476, 72, color('#0f2740'));
  circle(image, 714, 476, 72, color('#4ade80', 255));
  circle(image, 714, 476, 42, color('#0f2740'));
  line(image, 681, 476, 705, 500, 25, color('#4ade80'));
  line(image, 705, 500, 748, 448, 25, color('#4ade80'));
  return image.pixels;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return output;
}

function png(pixels) {
  const rows = [];
  for (let y = 0; y < size; y++) rows.push(Buffer.concat([Buffer.from([0]), pixels.subarray(y * size * 4, (y + 1) * size * 4)]));
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
assets.set('icon.png', png(mark(true)));
assets.set('adaptive-icon.png', png(mark(false)));
assets.set('splash-icon.png', png(mark(false)));
for (const [name, data] of assets) writeFileSync(new URL(`../assets/${name}`, import.meta.url), data);
console.log(`[brand-assets] generated ${assets.size} PNG assets`);
