// Vice Cover Studio — editor wiring: layout/grade/size pickers, caption
// controls, per-panel photo slots (sample or upload), drag-to-pan on the
// preview, zoom and centre per panel, PNG export at three sizes, and the
// ?shot= URL protocol the screenshots drive (shot, layout, grade, size,
// photos, caption, sub).
import { LAYOUTS, LAYOUT_IDS, layoutOf, panelRects } from './layouts.js';
import { GRADES, GRADE_IDS, gradeOf } from './grades.js';
import { drawCover, renderCover } from './cover.js';

const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
];

const EXPORT_SIZES = [
  { label: '1080 x 1080', w: 1080, h: 1080 },
  { label: '1080 x 1350', w: 1080, h: 1350 },
  { label: '1920 x 1080', w: 1920, h: 1080 },
];

const state = {
  layout: 'grid',
  grade: 'sunset',
  size: { w: 1080, h: 1080 },
  photos: [null, null, null, null],
  title: 'VICE CITY',
  subtitle: 'LEONIDA',
  titleSize: 1,
  selected: 0,
};

const canvas = document.getElementById('preview');
const imageCache = new Map();

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

async function setPanelPhoto(i, src, name) {
  const img = await loadImage(src);
  state.photos[i] = { img, name, zoom: 1, ox: 0.5, oy: 0.5 };
  state.selected = i;
  render();
}

function panelCount() {
  return layoutOf(state.layout).panels.length;
}

function render() {
  if (!canvas || canvas.width === 0) return;
  drawCover(canvas, state);
  syncPanelRows();
  syncPickers();
}

function sizePreview() {
  const long = 900;
  const { w, h } = state.size;
  if (w >= h) {
    canvas.width = long;
    canvas.height = Math.round((long * h) / w);
  } else {
    canvas.height = long;
    canvas.width = Math.round((long * w) / h);
  }
}

function sizeCoverCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ------------------------------------------------------------------ pickers

function buttonRow(el, items, current, onPick) {
  el.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (item.id === current ? ' active' : '');
    b.textContent = item.label;
    b.title = item.blurb ?? '';
    b.addEventListener('click', () => onPick(item.id));
    el.appendChild(b);
  }
}

function syncPickers() {
  buttonRow(
    document.getElementById('layoutButtons'),
    LAYOUT_IDS.map((id) => ({ id, label: LAYOUTS[id].name, blurb: LAYOUTS[id].blurb })),
    state.layout,
    (id) => {
      state.layout = id;
      state.selected = Math.min(state.selected, panelCount() - 1);
      sizePreview();
      render();
    },
  );
  buttonRow(
    document.getElementById('gradeButtons'),
    GRADE_IDS.map((id) => ({ id, label: GRADES[id].name, blurb: GRADES[id].blurb })),
    state.grade,
    (id) => {
      state.grade = id;
      document.documentElement.style.setProperty('--accent', gradeOf(id).accent);
      render();
    },
  );
  buttonRow(
    document.getElementById('sizeButtons'),
    EXPORT_SIZES.map((s, i) => ({ id: String(i), label: s.label })),
    String(EXPORT_SIZES.findIndex((s) => s.w === state.size.w && s.h === state.size.h)),
    (id) => {
      state.size = EXPORT_SIZES[Number(id)];
      sizePreview();
      render();
    },
  );
}

// ------------------------------------------------------------------ panel rows

function buildPanelRows() {
  const host = document.getElementById('panels');
  host.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.dataset.panel = String(i);

    const head = document.createElement('div');
    head.className = 'panel-head';
    const name = document.createElement('strong');
    name.textContent = `PANEL ${i + 1}`;
    const file = document.createElement('span');
    file.className = 'panel-file';
    file.textContent = 'empty';
    head.append(name, file);
    row.appendChild(head);

    const samples = document.createElement('div');
    samples.className = 'button-row';
    for (const s of SAMPLES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick small';
      b.textContent = s.label;
      b.addEventListener('click', () => setPanelPhoto(i, s.src, s.label).catch(() => {}));
      samples.appendChild(b);
    }
    const upload = document.createElement('label');
    upload.className = 'upload';
    upload.textContent = 'Upload';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      loadImage(url)
        .then((img) => {
          state.photos[i] = { img, name: f.name, zoom: 1, ox: 0.5, oy: 0.5 };
          state.selected = i;
          render();
        })
        .catch(() => {});
      input.value = '';
    });
    upload.appendChild(input);
    samples.appendChild(upload);
    row.appendChild(samples);

    const zoomRow = document.createElement('div');
    zoomRow.className = 'zoom-row';
    const zoomLabel = document.createElement('span');
    zoomLabel.textContent = 'Zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = '1';
    zoom.setAttribute('aria-label', `Zoom panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      const photo = state.photos[i];
      if (!photo) return;
      photo.zoom = Number(zoom.value);
      render();
    });
    const centre = document.createElement('button');
    centre.type = 'button';
    centre.className = 'pick small';
    centre.textContent = 'Centre';
    centre.addEventListener('click', () => {
      const photo = state.photos[i];
      if (!photo) return;
      photo.ox = 0.5;
      photo.oy = 0.5;
      render();
    });
    zoomRow.append(zoomLabel, zoom, centre);
    row.appendChild(zoomRow);

    row.addEventListener('click', (event) => {
      if (event.target.closest('button, label, input, select')) return;
      state.selected = i;
      render();
    });
    host.appendChild(row);
  }
}

function syncPanelRows() {
  const host = document.getElementById('panels');
  const count = panelCount();
  for (const row of host.children) {
    const i = Number(row.dataset.panel);
    const photo = state.photos[i];
    row.classList.toggle('off', i >= count);
    row.classList.toggle('selected', state.selected === i && i < count);
    row.querySelector('.panel-file').textContent = photo ? photo.name : 'empty';
    const zoom = row.querySelector('input[type="range"]');
    zoom.disabled = !photo;
    if (photo) zoom.value = String(photo.zoom);
  }
}

// ------------------------------------------------------------------ drag to pan

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function panelAt(x, y) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const i = panelAt(p.x, p.y);
  if (i === -1) return;
  state.selected = i;
  const photo = state.photos[i];
  if (!photo) {
    render();
    return;
  }
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  drag = { i, x: p.x, y: p.y, w: rects[i].w, h: rects[i].h };
  canvas.setPointerCapture(event.pointerId);
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const photo = state.photos[drag.i];
  if (!photo) return;
  photo.ox = Math.min(1, Math.max(0, photo.ox + (p.x - drag.x) / drag.w));
  photo.oy = Math.min(1, Math.max(0, photo.oy + (p.y - drag.y) / drag.h));
  drag.x = p.x;
  drag.y = p.y;
  render();
});

function endDrag() {
  drag = null;
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// ------------------------------------------------------------------ export

function exportPng(w, h) {
  const out = renderCover(w, h, state);
  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function buildExports() {
  const host = document.getElementById('exportButtons');
  for (const s of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.textContent = `PNG ${s.label}`;
    b.addEventListener('click', () => exportPng(s.w, s.h));
    host.appendChild(b);
  }
}

// ------------------------------------------------------------------ shot protocol

function applyShotParams() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot') || 'editor';
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  const size = q.get('size');
  if (size) {
    const m = /^(\d+)x(\d+)$/.exec(size);
    if (m) state.size = { w: Number(m[1]), h: Number(m[2]) };
  }
  if (q.get('caption') !== null) state.title = q.get('caption');
  if (q.get('sub') !== null) state.subtitle = q.get('sub');
  const photos = (q.get('photos') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { shot, photos };
}

// ------------------------------------------------------------------ init

async function init() {
  buildPanelRows();
  buildExports();
  const { shot, photos } = applyShotParams();
  document.documentElement.style.setProperty('--accent', gradeOf(state.grade).accent);

  const titleInput = document.getElementById('titleInput');
  const subtitleInput = document.getElementById('subtitleInput');
  const titleSize = document.getElementById('titleSize');
  const titleSizeValue = document.getElementById('titleSizeValue');
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value;
    render();
  });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value;
    render();
  });
  titleSize.addEventListener('input', () => {
    state.titleSize = Number(titleSize.value);
    titleSizeValue.textContent = `${Math.round(state.titleSize * 100)}%`;
    render();
  });

  const fillSample = document.getElementById('fillSample');
  document.getElementById('fillAll').addEventListener('click', async () => {
    const sample = SAMPLES.find((s) => s.id === fillSample.value) ?? SAMPLES[0];
    for (let i = 0; i < panelCount(); i++) {
      try {
        await setPanelPhoto(i, sample.src, sample.label);
      } catch {
        // a missing sample leaves that panel empty
      }
    }
  });

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.selected = -1;
    sizeCoverCanvas();
  } else {
    sizePreview();
  }

  for (let i = 0; i < photos.length; i++) {
    const sample = SAMPLES.find((s) => s.id === photos[i]);
    if (!sample) continue;
    try {
      await setPanelPhoto(i, sample.src, sample.label);
    } catch {
      // leave the panel empty when its sample cannot load
    }
  }
  state.selected = shot === 'cover' ? -1 : 0;

  try {
    await document.fonts.load('32px Anton');
  } catch {
    // the caption falls back to Arial Narrow when Anton cannot load
  }
  await document.fonts.ready;
  render();
  document.documentElement.dataset.viceReady = '1';

  window.addEventListener('resize', () => {
    if (shot === 'cover') sizeCoverCanvas();
    else sizePreview();
    render();
  });
}

init();
