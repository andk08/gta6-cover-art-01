// Draws the cover: the layout's panels, each holding a photo through the
// grade, then the caption band with the big title and the subtitle. Every
// size is derived from the canvas width and height, so the same code draws
// the live preview and the exported PNG at any of the three post sizes.

import { layoutFor } from './layouts.js';
import { gradeFor } from './grades.js';

const BACKDROP = '#0d0714';
const BAND = '#120a18';

/** Turns a fractional panel rect into pixels, inset by half a gutter each side. */
export function panelPixels(panel, width, height) {
  const gap = Math.max(2, Math.round(width * 0.014));
  const x = panel.x * width + gap / 2;
  const y = panel.y * height + gap / 2;
  const w = panel.w * width - gap;
  const h = panel.h * height - gap;
  return { x, y, w, h, gap };
}

/** Cover-fit draw arguments for a photo inside a panel, with zoom and pan. */
export function fitPhoto(panel, photo) {
  const img = photo.img;
  const base = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight);
  const dw = img.naturalWidth * base * photo.zoom;
  const dh = img.naturalHeight * base * photo.zoom;
  const dx = panel.x + (panel.w - dw) / 2 + photo.ox * (dw - panel.w);
  const dy = panel.y + (panel.h - dh) / 2 + photo.oy * (dh - panel.h);
  return { dx, dy, dw, dh };
}

/** A tint gradient across a rect, in the grade's direction. */
function tintGradient(ctx, rect, tint) {
  let grad;
  if (tint.angle === 'diagonal') {
    grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  } else {
    grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  }
  grad.addColorStop(0, tint.from);
  grad.addColorStop(1, tint.to);
  return grad;
}

/** Splits words into at most two lines that fit the width at this size. */
function wrapTitle(ctx, words, size, maxWidth) {
  ctx.font = `${size}px Anton, sans-serif`;
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The title lines and size that fit the band, shrinking until the whole
 * block (title lines plus subtitle, when there is one) fits inside it. */
function fitTitle(ctx, text, band, captionScale, hasSubtitle) {
  const words = text.split(/\s+/).filter(Boolean);
  const maxWidth = band.w * 0.92;
  const maxBlock = band.h * 0.94;
  const blockHeight = (lines, size) => {
    const extra = hasSubtitle ? Math.round(size * 0.22) + Math.max(12, Math.round(size * 0.26)) : 0;
    return lines.length * size * 0.98 + extra;
  };
  let size = Math.max(20, Math.floor(band.h * 0.52 * captionScale));
  let lines = wrapTitle(ctx, words, size, maxWidth);
  while (
    size > 16 &&
    (lines.length > 2 ||
      lines.some((line) => ctx.measureText(line).width > maxWidth) ||
      blockHeight(lines, size) > maxBlock)
  ) {
    size = Math.max(16, size - 4);
    lines = wrapTitle(ctx, words, size, maxWidth);
  }
  return { lines, size };
}

/** Draws the caption band (solid) or scrim (fading over the photo). */
function drawCaptionZone(ctx, width, height, layout, grade, state) {
  const band = {
    x: layout.caption.x * width,
    y: layout.caption.y * height,
    w: layout.caption.w * width,
    h: layout.caption.h * height,
  };
  if (layout.captionStyle === 'scrim') {
    const scrim = ctx.createLinearGradient(0, band.y, 0, height);
    scrim.addColorStop(0, 'rgba(13, 7, 20, 0)');
    scrim.addColorStop(1, 'rgba(13, 7, 20, 0.92)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, band.y, width, height - band.y);
  } else {
    ctx.fillStyle = BAND;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(band.x, band.y, band.w, Math.max(3, Math.round(height * 0.004)));
  }
  return band;
}

/** Draws the title and subtitle centred in the band. */
function drawCaptionText(ctx, band, grade, state) {
  const title = (state.caption || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (!title && !subtitle) return;
  const { lines, size } = fitTitle(ctx, title || ' ', band, state.captionScale || 1, Boolean(subtitle));
  const lineHeight = size * 0.98;
  const subSize = Math.max(12, Math.round(size * 0.26));
  const gap = Math.round(size * 0.22);
  const blockHeight = lines.length * lineHeight + (subtitle ? gap + subSize : 0);
  let top = band.y + (band.h - blockHeight) / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0d0512';
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.03;
  for (const line of lines) {
    ctx.strokeText(line, band.x + band.w / 2, top);
    ctx.fillText(line, band.x + band.w / 2, top);
    top += lineHeight;
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (subtitle) {
    top += gap;
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(2, Math.round(subSize * 0.32))}px`;
    } catch {
      // Older canvas builds ignore letter spacing; the text still draws.
    }
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, band.x + band.w / 2, top);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Reset is best effort only.
    }
  }
}

/**
 * Draws the whole cover onto ctx at the canvas's own size.
 * state: { layout, grade, panels: [{img, zoom, ox, oy}], caption,
 * subtitle, captionScale, highlight } — highlight is a panel index the
 * editor outlines, and is never used for an export.
 */
export function drawCover(ctx, width, height, state) {
  const layout = layoutFor(state.layout);
  const grade = gradeFor(state.grade);
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, width, height);

  layout.panels.forEach((panel, index) => {
    const rect = panelPixels(panel, width, height);
    const photo = state.panels[index];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo && photo.img) {
      ctx.filter = grade.filter;
      const draw = fitPhoto(rect, photo);
      ctx.drawImage(photo.img, draw.dx, draw.dy, draw.dw, draw.dh);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = grade.tint.blend;
      ctx.globalAlpha = grade.tint.alpha;
      ctx.fillStyle = tintGradient(ctx, rect, grade.tint);
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      empty.addColorStop(0, '#241631');
      empty.addColorStop(1, '#160d20');
      ctx.fillStyle = empty;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = `600 ${Math.max(14, Math.round(rect.h * 0.09))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = Math.max(1, Math.round(width * 0.002));
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (state.highlight === index) {
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(3, Math.round(width * 0.006));
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  const band = drawCaptionZone(ctx, width, height, layout, grade, state);
  drawCaptionText(ctx, band, grade, state);

  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.42,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, `rgba(0, 0, 0, ${grade.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
