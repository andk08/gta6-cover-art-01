// Vice Cover Studio — cover renderer.
//
// Draws the multi-panel cover (photos + grade + caption) onto a 2d context.
// All geometry is in cover pixels; the caller picks the output resolution,
// so the preview and the exported PNG are the same drawing at other sizes.
'use strict';

var VC = window.VC || (window.VC = {});

function vcHexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// Where an image lands inside a panel: cover-fit, scaled by zoom, centred
// on the focal point (fx, fy), each 0..1 across the source image.
function vcCoverFit(img, pw, ph, fx, fy, zoom) {
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const s = base * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  return { dx: pw / 2 - fx * dw, dy: ph / 2 - fy * dh, dw: dw, dh: dh };
}

function vcDrawPanel(ctx, area, photo, index) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  const img = photo && photo.img;
  if (img && img.complete && img.naturalWidth > 0) {
    const f = vcCoverFit(img, area.w, area.h, photo.fx, photo.fy, photo.zoom);
    ctx.drawImage(img, area.x + f.dx, area.y + f.dy, f.dw, f.dh);
  } else {
    ctx.fillStyle = '#17171f';
    ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(1, area.w * 0.004);
    ctx.strokeRect(area.x + 4, area.y + 4, area.w - 8, area.h - 8);
    const size = Math.max(12, Math.min(area.w, area.h) * 0.12);
    ctx.font = size + 'px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PANEL ' + (index + 1), area.x + area.w / 2, area.y + area.h / 2);
  }
  ctx.restore();
}

// Split a title into one or two lines that fit maxWidth at the given size.
// Returns the lines, or null when even two lines do not fit at that size.
function vcFitTitle(ctx, title, maxWidth, size) {
  ctx.font = size + "px Anton, 'Arial Black', sans-serif";
  if (ctx.measureText(title).width <= maxWidth) return [title];
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (w <= maxWidth && (!best || w < best.w)) best = { lines: [a, b], w: w };
  }
  return best ? best.lines : null;
}

function vcDrawCaption(ctx, W, H, state, grade) {
  const title = (state.title || '').trim() || 'VICE CITY';
  const sub = (state.subtitle || '').trim();
  const scale = (state.titleSize || 100) / 100;
  const maxWidth = W * 0.94;
  let size = Math.round(W * 0.115 * scale);
  let lines = null;
  while (size > 10 && !(lines = vcFitTitle(ctx, title, maxWidth, size))) size -= 2;
  if (!lines) {
    lines = [title];
    size = 10;
  }
  const lineH = size * 1.04;
  const subSize = Math.max(10, Math.round(size * 0.24));
  const blockH = lines.length * lineH + (sub ? subSize * 2.1 : 0);
  const top = H - blockH - H * 0.045;

  // Bottom scrim so the caption stays readable on bright photos.
  const scrim = ctx.createLinearGradient(0, top - H * 0.12, 0, H);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top - H * 0.12, W, blockH + H * 0.12 + 1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = top;
  for (const line of lines) {
    ctx.font = size + "px Anton, 'Arial Black', sans-serif";
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = size * 0.07;
    ctx.shadowOffsetY = size * 0.045;
    ctx.strokeText(line, W / 2, y + size);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, W / 2, y + size);
    y += lineH;
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (sub) {
    ctx.font = subSize + "px Anton, 'Arial Black', sans-serif";
    ctx.letterSpacing = Math.round(subSize * 0.45) + 'px';
    ctx.fillStyle = grade.sub;
    ctx.fillText(sub, W / 2, y + subSize * 1.4);
    ctx.letterSpacing = '0px';
  }
}

function vcRenderCover(ctx, W, H, state) {
  const layout = VC.LAYOUTS[state.layout] || VC.LAYOUTS.hero;
  const grade = VC.GRADES[state.grade] || VC.GRADES.sunset;
  const areas = layout.areas(W, H);
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  ctx.filter = grade.filter;
  areas.forEach(function (a, i) {
    vcDrawPanel(ctx, a, state.panels[i], i);
  });
  ctx.filter = 'none';
  const tint = ctx.createLinearGradient(0, 0, W, H);
  tint.addColorStop(0, vcHexA(grade.tint[0], grade.tintAlpha));
  tint.addColorStop(1, vcHexA(grade.tint[1], grade.tintAlpha));
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);
  vcDrawCaption(ctx, W, H, state, grade);
  ctx.restore();
}

VC.renderCover = vcRenderCover;
VC.coverFit = vcCoverFit;
