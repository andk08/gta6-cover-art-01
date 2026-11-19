// Vice Cover Studio — editor + cover renderer wiring.
// State lives here; drawing lives in cover.js; layouts/grades/shots are data.
import { LAYOUTS } from './layouts.js';
import { GRADES } from './grades.js';
import { drawCover } from './cover.js';
import { parseShot, loadShotPhotos, SHOT_SIZES, SAMPLES } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');

const shot = parseShot(location.search);
const state = {
  layout: shot.layout,
  grade: shot.grade,
  title: shot.title,
  sub: shot.sub,
  titleSize: shot.titleSize,
  panels: [0, 1, 2, 3].map(() => ({ img: null, zoom: 1, ox: 0, oy: 0 })),
};
let selected = 0;
let exportSize = shot.size;
let readyMarked = false;

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

function sizeCanvas() {
  if (shot.mode === 'cover') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return;
  }
  const size = SHOT_SIZES[exportSize];
  const scale = 960 / Math.max(size.w, size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
}

function draw() {
  drawCover(ctx, state, canvas.width, canvas.height);
  if (!readyMarked) {
    readyMarked = true;
    document.documentElement.setAttribute('data-vice-ready', '1');
  }
}

function panelRect(i) {
  const f = LAYOUTS[state.layout].panels[i];
  return {
    x: f.x * canvas.width,
    y: f.y * canvas.height,
    w: f.w * canvas.width,
    h: f.h * canvas.height,
  };
}

function hitPanel(mx, my) {
  for (let i = panelCount() - 1; i >= 0; i--) {
    const r = panelRect(i);
    if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) return i;
  }
  return -1;
}

// ---- photo loading -------------------------------------------------------
function loadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function loadSample(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = SAMPLES[name];
  });
}

// ---- editor UI -----------------------------------------------------------
const layoutRow = document.getElementById('layoutRow');
const gradeRow = document.getElementById('gradeRow');
const panelList = document.getElementById('panelList');

function buildButtons() {
  layoutRow.innerHTML = '';
  for (const id of Object.keys(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = LAYOUTS[id].name;
    if (id === state.layout) b.classList.add('active');
    b.addEventListener('click', () => {
      state.layout = id;
      if (selected >= panelCount()) selected = 0;
      buildButtons();
      buildPanelList();
      draw();
    });
    layoutRow.appendChild(b);
  }
  gradeRow.innerHTML = '';
  for (const id of Object.keys(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = GRADES[id].name;
    if (id === state.grade) b.classList.add('active');
    b.addEventListener('click', () => {
      state.grade = id;
      document.documentElement.style.setProperty('--accent', GRADES[id].accent);
      buildButtons();
      draw();
    });
    gradeRow.appendChild(b);
  }
}

function buildPanelList() {
  panelList.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const panel = state.panels[i];
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === selected ? ' selected' : '');
    row.addEventListener('click', () => {
      selected = i;
      buildPanelList();
    });

    const head = document.createElement('div');
    head.className = 'head';
    head.textContent = 'Panel ' + (i + 1) + (panel.img ? '' : ' — empty');
    const centre = document.createElement('button');
    centre.type = 'button';
    centre.textContent = 'Centre';
    centre.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.ox = 0;
      panel.oy = 0;
      panel.zoom = 1;
      buildPanelList();
      draw();
    });
    head.appendChild(centre);
    row.appendChild(head);

    const zoomWrap = document.createElement('div');
    zoomWrap.className = 'zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom);
    zoom.setAttribute('aria-label', 'Zoom panel ' + (i + 1));
    const zoomVal = document.createElement('span');
    zoomVal.textContent = panel.zoom.toFixed(2) + '×';
    zoom.addEventListener('input', () => {
      panel.zoom = Number(zoom.value);
      zoomVal.textContent = panel.zoom.toFixed(2) + '×';
      draw();
    });
    zoomWrap.append(zoom, zoomVal);
    row.appendChild(zoomWrap);

    const sample = document.createElement('select');
    sample.setAttribute('aria-label', 'Sample photo for panel ' + (i + 1));
    const opts = [['', 'Sample photo…'], ['boulevard', 'Boulevard'], ['pier', 'Pier'], ['none', 'Empty']];
    for (const [value, label] of opts) {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      sample.appendChild(o);
    }
    sample.addEventListener('change', async () => {
      const v = sample.value;
      if (!v) return;
      panel.img = v === 'none' ? null : await loadSample(v);
      panel.ox = 0;
      panel.oy = 0;
      panel.zoom = 1;
      buildPanelList();
      draw();
    });
    row.appendChild(sample);

    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.setAttribute('aria-label', 'Upload a photo for panel ' + (i + 1));
    file.addEventListener('change', async () => {
      if (!file.files || !file.files[0]) return;
      const img = await loadFile(file.files[0]);
      if (img) {
        panel.img = img;
        panel.ox = 0;
        panel.oy = 0;
        panel.zoom = 1;
        buildPanelList();
        draw();
      }
    });
    row.appendChild(file);
    panelList.appendChild(row);
  }
}

// ---- canvas interaction: click to select, drag to pan, wheel to zoom -----
let drag = null;

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = canvasPos(e);
  const i = hitPanel(x, y);
  if (i < 0) return;
  selected = i;
  buildPanelList();
  drag = { x, y };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { x, y } = canvasPos(e);
  const panel = state.panels[selected];
  const r = panelRect(selected);
  panel.ox += (x - drag.x) / r.w;
  panel.oy += (y - drag.y) / r.h;
  drag = { x, y };
  draw();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { x, y } = canvasPos(e);
  const i = hitPanel(x, y);
  if (i < 0) return;
  selected = i;
  const panel = state.panels[i];
  panel.zoom = Math.min(2.5, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
  buildPanelList();
  draw();
}, { passive: false });

// ---- caption + export controls -------------------------------------------
document.getElementById('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value;
  draw();
});
document.getElementById('subInput').addEventListener('input', (e) => {
  state.sub = e.target.value;
  draw();
});
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleSize = Number(e.target.value);
  document.getElementById('titleSizeVal').textContent = Math.round(state.titleSize * 100) + '%';
  draw();
});
document.getElementById('exportSize').addEventListener('change', (e) => {
  exportSize = e.target.value;
  sizeCanvas();
  draw();
});
document.getElementById('fillAll').addEventListener('click', () => {
  const src = state.panels[0].img;
  if (!src) return;
  for (let i = 1; i < panelCount(); i++) {
    state.panels[i].img = src;
    state.panels[i].ox = 0;
    state.panels[i].oy = 0;
    state.panels[i].zoom = 1;
  }
  buildPanelList();
  draw();
});
document.getElementById('exportBtn').addEventListener('click', () => {
  const size = SHOT_SIZES[exportSize];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), state, size.w, size.h);
  const status = document.getElementById('status');
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — please try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${exportSize}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Exported ${size.label} PNG.`;
  }, 'image/png');
});

// ---- boot -----------------------------------------------------------------
async function boot() {
  sizeCanvas();
  if (shot.mode === 'cover') {
    document.body.classList.add('cover-mode');
    const imgs = await loadShotPhotos(shot.photos);
    imgs.forEach((img, i) => {
      if (i < state.panels.length) state.panels[i].img = img;
    });
  } else {
    buildButtons();
    buildPanelList();
    const imgs = await loadShotPhotos(shot.photos.length ? shot.photos : ['boulevard', 'pier', 'boulevard', 'pier']);
    imgs.forEach((img, i) => {
      if (i < state.panels.length) state.panels[i].img = img;
    });
    document.getElementById('exportSize').value = exportSize;
  }
  try {
    await document.fonts.load('80px Anton');
  } catch {
    // Anton falls back to Arial Narrow; the cover still renders.
  }
  draw();
  document.fonts.ready.then(draw).catch(() => {});
}

boot();
