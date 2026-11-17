/**
 * CIEDE2000 色差计算，按 ISO/CIE 标准公式实现，供色值建议工具（theme-lint / dev/palette）使用。
 */

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function rgbToXyz(hex: string): [number, number, number] {
  const r = srgbToLinear(Number.parseInt(hex.slice(1, 3), 16) / 255);
  const g = srgbToLinear(Number.parseInt(hex.slice(3, 5), 16) / 255);
  const b = srgbToLinear(Number.parseInt(hex.slice(5, 7), 16) / 255);
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047,
    r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883,
  ];
}

function xyzToLab([x, y, z]: [number, number, number]): [number, number, number] {
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labOf(hex: string): [number, number, number] {
  return xyzToLab(rgbToXyz(hex));
}

const DEG = 180 / Math.PI;

function hueDeg(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const deg = Math.atan2(b, a) * DEG;
  return deg >= 0 ? deg : deg + 360;
}

function deltaHue(h1: number, h2: number, c1: number, c2: number): number {
  if (c1 * c2 === 0) return 0;
  const diff = h2 - h1;
  if (Math.abs(diff) <= 180) return diff;
  return diff > 180 ? diff - 360 : diff + 360;
}

function meanHue(h1: number, h2: number, c1: number, c2: number): number {
  if (c1 * c2 === 0) return h1 + h2;
  if (Math.abs(h1 - h2) <= 180) return (h1 + h2) / 2;
  return h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
}

/** 两色 CIEDE2000 色差（ΔE00），相同颜色返回 0；入参经 normalizeHex 展开短写，无法解析返回 NaN */
export function deltaE(hexA: string, hexB: string): number {
  const a = normalizeHex(hexA);
  const b = normalizeHex(hexB);
  if (!a || !b) return NaN;
  const [l1, a1, b1] = labOf(a);
  const [l2, a2, b2] = labOf(b);

  const c1 = Math.sqrt(a1 * a1 + b1 * b1);
  const c2 = Math.sqrt(a2 * a2 + b2 * b2);
  const cBar = (c1 + c2) / 2;
  const cBar7 = cBar ** 7;
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const h1p = hueDeg(a1p, b1);
  const h2p = hueDeg(a2p, b2);

  const dLp = l2 - l1;
  const dCp = c2p - c1p;
  const dhp = deltaHue(h1p, h2p, c1p, c2p);
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(dhp / (2 * DEG));

  const lBar = (l1 + l2) / 2;
  const cBarP = (c1p + c2p) / 2;
  const hBarP = meanHue(h1p, h2p, c1p, c2p);

  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) / DEG) +
    0.24 * Math.cos((2 * hBarP) / DEG) +
    0.32 * Math.cos((3 * hBarP + 6) / DEG) -
    0.2 * Math.cos((4 * hBarP - 63) / DEG);
  const dTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const cBarP7 = cBarP ** 7;
  const rc = 2 * Math.sqrt(cBarP7 / (cBarP7 + 25 ** 7));
  const sl = 1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin((2 * dTheta) / DEG) * rc;

  return Math.sqrt(
    (dLp / sl) ** 2 +
      (dCp / sc) ** 2 +
      (dHp / sh) ** 2 +
      rt * (dCp / sc) * (dHp / sh),
  );
}

function toHex(channels: number[]): string {
  return `#${channels
    .map(channel => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function hslToRgb(h: number, s: number, l: number): number[] {
  const sat = Math.min(1, Math.max(0, s));
  const lig = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  const sector = Math.floor(((h % 360) + 360) % 360 / 60);
  const table = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  return table[sector].map(channel => (channel + m) * 255);
}

/** alpha 合成到白底：阴影只靠 alpha 区分，截断 alpha 会让色差恒为 0 */
function flattenAlpha(hex6: string, alpha: number): string {
  if (!(alpha >= 0 && alpha < 1)) return hex6;
  const channels = [0, 1, 2].map(index => {
    const channel = Number.parseInt(hex6.slice(1 + index * 2, 3 + index * 2), 16);
    return channel * alpha + 255 * (1 - alpha);
  });
  return toHex(channels);
}

function parseAlpha(part: string | undefined): number {
  if (!part) return 1;
  const value = Number.parseFloat(part);
  if (!Number.isFinite(value)) return 1;
  return part.endsWith('%') ? value / 100 : value;
}

/** 归一化输入：hex / rgb() / rgba() / hsl() / hsla() → 大写 6 位 hex（带 alpha 的合成到白底）；无法识别返回 null */
export function normalizeHex(input: string): null | string {
  const value = input.trim();
  const hex = /^#?([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.exec(value)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.replace(/./g, char => char + char) : hex;
    const rgb = `#${full.slice(0, 6).toUpperCase()}`;
    return full.length === 8 ? flattenAlpha(rgb, Number.parseInt(full.slice(6, 8), 16) / 255) : rgb;
  }
  const parts = value
    .replace(/^(rgb|rgba|hsl|hsla)\(/i, '')
    .replace(/\)$/, '')
    .split(/[,/\s]+/)
    .filter(Boolean);
  if (!/^(rgba?|hsla?)\([^)]+\)$/i.test(value) || (parts.length !== 3 && parts.length !== 4)) {
    return null;
  }
  if (/^hsla?\(/i.test(value)) {
    const h = Number.parseFloat(parts[0]);
    const s = Number.parseFloat(parts[1]);
    const l = Number.parseFloat(parts[2]);
    if (![h, s, l].every(Number.isFinite)) return null;
    return flattenAlpha(
      toHex(hslToRgb(h, Number.parseFloat(s) / 100, Number.parseFloat(l) / 100)),
      parseAlpha(parts[3]),
    );
  }
  const channels = parts.slice(0, 3).map(part => {
    const num = part.endsWith('%') ? (Number.parseFloat(part) / 100) * 255 : Number(part);
    return Number.isFinite(num) ? Math.round(Math.min(255, Math.max(0, num))) : NaN;
  });
  if (channels.some(Number.isNaN)) return null;
  return flattenAlpha(toHex(channels), parseAlpha(parts[3]));
}
