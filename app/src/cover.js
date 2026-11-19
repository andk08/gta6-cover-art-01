// Renders one finished cover onto a 2d context.
// state: { layout, grade, panels, title, sub, titleSize }
//   panels[i] = { img: HTMLImageElement | null, zoom: number, ox: number, oy: number }
//   ox / oy are pan offsets as a fraction of the panel's own width / height.
// W, H: the pixel size of the canvas (any export size works).
import { LAYOUTS } from './layouts.js';
import { GRADES } from './grades.js';

const GUTTER = 0.006; // black gap between panels, as a fraction of cover width

function clampPan(panel, img, pw, ph) {
  if (!img) return { ox: 0, oy: 0 };
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const maxOx = Math.max(0, (dw - pw) / 2 / pw);
  const maxOy = Math.max(0, (dh - ph) / 2 / ph);
  return {
    ox: Math.max(-maxOx, Math.min(maxOx, panel.ox)),
    oy: Math.max(-maxOy, Math.min(maxOy, panel.oy)),
  };
}

function drawPhoto(ctx, panel, img, rect, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const { ox, oy } = clampPan(panel, img, w, h);
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * panel.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = grade.filter;
    ctx.drawImage(img, x + (w - dw) / 2 + ox * w, y + (h - dh) / 2 + oy * h, dw, dh);
    ctx.filter = 'none';
  } else {
    // Empty panel: dark checker placeholder with its number.
    ctx.fillStyle = '#16121f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#241d33';
    const s = Math.min(w, h) / 4;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if ((r + c) % 2 === 0) ctx.fillRect(x + c * s, y + r * s, s, s);
      }
    }
  }
  const tint = ctx.createLinearGradient(x, y, x + w, y + h);
  tint.addColorStop(0, grade.tint[0]);
  tint.addColorStop(1, grade.tint[1]);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  if (!img) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.max(14, h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PANEL ' + (panel.index + 1), x + w / 2, y + h / 2);
    ctx.restore();
  }
}

// Greedy word wrap, at most two lines; returns the lines.
function wrapTitle(ctx, title, maxWidth) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === 2) break;
    }
  }
  if (lines.length < 2 && line) lines.push(line);
  return lines.slice(0, 2);
}

function drawSpaced(ctx, text, cx, y, spacing) {
  // Manual letter-spacing (deterministic across browsers): draw char by char.
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let px = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, px, y);
    px += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

export function drawCover(ctx, state, W, H) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.grid;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gutter = Math.max(2, W * GUTTER);

  ctx.save();
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((frac, i) => {
    const rect = {
      x: frac.x * W + (frac.x > 0 ? gutter / 2 : 0),
      y: frac.y * H + (frac.y > 0 ? gutter / 2 : 0),
      w: frac.w * W - (frac.x > 0 ? gutter / 2 : 0) - (frac.x + frac.w < 1 ? gutter / 2 : 0),
      h: frac.h * H - (frac.y > 0 ? gutter / 2 : 0) - (frac.y + frac.h < 1 ? gutter / 2 : 0),
    };
    const panel = { ...(state.panels[i] ?? { img: null, zoom: 1, ox: 0, oy: 0 }), index: i };
    drawPhoto(ctx, panel, panel.img, rect, grade);
  });

  // Caption: big Anton title, auto-fit to at most two lines.
  const title = (state.title ?? '').trim();
  if (title) {
    const maxWidth = W * 0.92;
    let size = H * 0.16 * (state.titleSize ?? 1);
    let lines = [];
    while (size > H * 0.05) {
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
      lines = wrapTitle(ctx, title, maxWidth);
      if (lines.length <= 2) break;
      size *= 0.9;
    }
    const lineHeight = size * 1.02;
    const blockH = lines.length * lineHeight;
    let baseline = H * 0.80 - blockH / 2 + size * 0.82;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
    lines.forEach((line) => {
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = '#0b0614';
      ctx.strokeText(line, W / 2, baseline);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, W / 2, baseline);
      baseline += lineHeight;
    });
    ctx.restore();

    // Subtitle: letterspaced accent text under the title.
    const sub = (state.sub ?? '').trim();
    if (sub) {
      const subSize = Math.max(12, H * 0.032);
      ctx.save();
      ctx.font = `700 ${subSize}px system-ui, sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = subSize * 0.3;
      drawSpaced(ctx, sub.toUpperCase(), W / 2, H * 0.80 + blockH / 2 + subSize * 1.1, subSize * 0.32);
      ctx.restore();
    }
  }
  ctx.restore();
}
