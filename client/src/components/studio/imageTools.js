// Client-side image helpers for the studio: resize uploads before they hit the API,
// and pull a brand palette out of an uploaded logo.

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/** Resize to fit `max` px on the long edge; JPEG/WebP data URL small enough for a JSON body. */
export async function downscaleImage(file, { max = 1600, quality = 0.8, square = false } = {}) {
  const im = await loadImage(await readFile(file));
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (square) {
    const s = Math.min(im.width, im.height);
    c.width = max;
    c.height = max;
    ctx.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, max, max);
    return c.toDataURL('image/webp', quality);
  }
  const k = Math.min(1, max / Math.max(im.width, im.height));
  c.width = Math.round(im.width * k);
  c.height = Math.round(im.height * k);
  ctx.drawImage(im, 0, 0, c.width, c.height);
  const webp = c.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', quality);
}

const toHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

/** Dominant saturated color of an image -> { primary, soft, accent } */
export async function extractBrandColors(src) {
  try {
    const im = await loadImage(src);
    const size = 48;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(im, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
      if (l > 0.92 || l < 0.08) continue; // skip paper-white and pure black
      const key = `${Math.round(h / 15)}-${Math.round(s * 4)}-${Math.round(l * 4)}`;
      const b = buckets.get(key) || { n: 0, r: 0, g: 0, bl: 0, s };
      b.n += 1 + s * 2; // favour saturated colors
      b.r += data[i]; b.g += data[i + 1]; b.bl += data[i + 2];
      buckets.set(key, b);
    }
    const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
    if (!best) return { primary: '#111827', soft: '#f3f4f6', accent: '#f97316' };
    const cnt = best.n / (1 + best.s * 2);
    let [h, s, l] = rgbToHsl(best.r / cnt, best.g / cnt, best.bl / cnt);
    l = Math.min(0.5, Math.max(0.28, l)); // a usable brand tone
    return { primary: hslToHex(h, Math.max(s, 0.35), l), soft: hslToHex(h, Math.min(0.9, s + 0.2), 0.96), accent: hslToHex((h + 150) % 360, 0.85, 0.55) };
  } catch {
    return null;
  }
}
