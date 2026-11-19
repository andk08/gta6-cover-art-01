// Vice Cover Studio — draws a finished cover on any canvas: layout panels
// with per-photo zoom and pan, the grade's filter and tint, and the Anton
// caption (title auto-fit to one or two lines, subtitle letterspaced).
import { panelRects } from './layouts.js';
import { gradeOf } from './grades.js';

export const FONT_FAMILY = "'Anton', 'Arial Narrow', sans-serif";

/** Draw `img` into rect (x, y, w, h) as cover-fit, scaled by zoom and panned by ox/oy (0..1, 0.5 centred). */
function drawPhoto(ctx, img, x, y, w, h, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih);
  const scale = base * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const spanX = Math.max(0, (dw - w) / 2);
  const spanY = Math.max(0, (dh - h) / 2);
  const cx = x + w / 2 + (ox - 0.5) * 2 * spanX;
  const cy = y + h / 2 + (oy - 0.5) * 2 * spanY;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

/** An empty panel: dark fill, faint diagonal stripes, a centred label. */
function drawPlaceholder(ctx, rect, index) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = '#171226';
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let d = -h; d < w; d += 26) {
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
  }
  ctx.stroke();
  ctx.restore();
  const px = Math.max(14, Math.min(w, h) * 0.09);
  ctx.font = `${px}px ${FONT_FAMILY}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, x + w / 2, y + h / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Greedy word wrap of `words` into lines no wider than maxWidth. */
function wrapLines(ctx, words, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || line === '') {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrink the title until it fits in at most two lines at maxWidth. */
function fitTitle(ctx, text, maxWidth, basePx) {
  const words = text.split(/\s+/).filter(Boolean);
  let px = basePx;
  while (px > basePx * 0.4) {
    ctx.font = `${px}px ${FONT_FAMILY}`;
    const lines = wrapLines(ctx, words, maxWidth);
    if (lines.length <= 2) return { lines, px };
    px = Math.round(px * 0.92);
  }
  ctx.font = `${px}px ${FONT_FAMILY}`;
  return { lines: wrapLines(ctx, words, maxWidth).slice(0, 2), px };
}

/** The caption: a bottom scrim, the title with a thick outline and a drop shadow, the subtitle below it. */
function drawCaption(ctx, W, H, grade, state) {
  const title = (state.title || '').trim();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;

  const scrim = ctx.createLinearGradient(0, H * 0.55, 0, H);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  const padX = Math.round(W * 0.045);
  const padBottom = Math.round(H * 0.045);
  const maxW = W - padX * 2;

  let subPx = 0;
  let subH = 0;
  if (subtitle) {
    subPx = Math.max(12, Math.round(W * 0.026));
    subH = subPx * 1.9;
  }
  const titleBase = Math.round(W * 0.085 * (state.titleSize ?? 1));
  const { lines, px } = title
    ? fitTitle(ctx, title.toUpperCase(), maxW, titleBase)
    : { lines: [], px: titleBase };
  const lineH = px * 1.02;
  const lastBaseline = H - padBottom - subH;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${px}px ${FONT_FAMILY}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(5, 5, 10, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(px * 0.16));
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(px * 0.14);
  ctx.shadowOffsetY = Math.round(px * 0.05);
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, idx) => {
    const baseline = lastBaseline - (lines.length - 1 - idx) * lineH;
    ctx.strokeText(line, padX, baseline);
    ctx.fillText(line, padX, baseline);
  });
  if (subtitle) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = Math.round(subPx * 0.2);
    ctx.shadowOffsetY = Math.round(subPx * 0.08);
    ctx.font = `600 ${subPx}px Arial, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(subPx * 0.32)}px`;
    } catch {
      // letterSpacing is newer canvas API; the subtitle still draws without it.
    }
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle.toUpperCase(), padX, H - padBottom);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // ignore
    }
  }
  ctx.restore();
}

/** Draw the whole cover for `state` on `canvas` (its width/height are the export size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeOf(state.grade);
  const rects = panelRects(state.layout, W, H);

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grade.dark;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const photo = state.photos[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    if (photo && photo.img) {
      ctx.filter = grade.filter;
      drawPhoto(ctx, photo.img, r.x, r.y, r.w, r.h, photo.zoom, photo.ox, photo.oy);
      ctx.filter = 'none';
      const tint = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      tint.addColorStop(0, grade.tint[0]);
      tint.addColorStop(1, grade.tint[1]);
      ctx.fillStyle = tint;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else {
      drawPlaceholder(ctx, r, i);
    }
    ctx.restore();
    if (state.selected === i) {
      ctx.save();
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.006));
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.restore();
    }
  }

  drawCaption(ctx, W, H, grade, state);
  ctx.restore();
}

/** Render the cover at W x H on a fresh canvas and return it (used for exports). */
export function renderCover(W, H, state) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas, { ...state, selected: -1 });
  return canvas;
}
