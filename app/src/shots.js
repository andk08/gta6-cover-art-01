// The ?shot= protocol: screenshots (and the shot manifest shots.json) drive
// the app through URL parameters, so every screenshot is reproducible.
//   ?shot=cover|editor   cover hides the editor chrome, editor shows it
//   &layout=grid|hero|triple|solo
//   &grade=sunset|neon|noir|palm
//   &size=square|portrait|landscape   (the cover aspect)
//   &photos=boulevard,pier,...        (sample names, one per panel; "none" = empty)
//   &title=... &sub=...               (caption text)
//   &titlesize=0.5..1.5
import { LAYOUT_IDS } from './layouts.js';
import { GRADE_IDS } from './grades.js';

export const SHOT_SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  landscape: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const SAMPLES = { boulevard: 'samples/boulevard.jpg', pier: 'samples/pier.jpg' };

export function parseShot(search) {
  const p = new URLSearchParams(search);
  const layout = LAYOUT_IDS.includes(p.get('layout')) ? p.get('layout') : 'hero';
  const grade = GRADE_IDS.includes(p.get('grade')) ? p.get('grade') : 'neon';
  const size = p.get('size') in SHOT_SIZES ? p.get('size') : 'square';
  const mode = p.get('shot') === 'cover' ? 'cover' : 'editor';
  const titleSize = Math.min(1.5, Math.max(0.5, Number(p.get('titlesize')) || 1));
  return {
    mode,
    layout,
    grade,
    size,
    title: p.get('title') ?? 'VICE CITY NIGHTS',
    sub: p.get('sub') ?? 'MY AGENT PAID THE BOUNTY',
    titleSize,
    photos: (p.get('photos') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Loads the sample photos named in the shot, in panel order.
export async function loadShotPhotos(names) {
  const out = [];
  for (const name of names) {
    const src = SAMPLES[name];
    out.push(src ? await loadImage(src) : null);
  }
  return out;
}
