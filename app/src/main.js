// Wires the studio: the photo slots, layout and grade pickers, the caption,
// drag-to-pan on the preview, and the PNG exports. A `?shot=` query sets up
// a fixed scene for a screenshot instead (./shots.js).

import { drawCover, panelPixels } from './cover.js';
import { LAYOUT_ORDER, LAYOUTS, layoutFor, panelCount } from './layouts.js';
import { GRADE_ORDER, GRADES, gradeFor } from './grades.js';
import { runShot } from './shots.js';

export const EXPORT_SIZES = {
  '1080x1080': { label: '1080 × 1080', w: 1080, h: 1080 },
  '1080x1350': { label: '1080 × 1350', w: 1080, h: 1350 },
  '1920x1080': { label: '1920 × 1080', w: 1920, h: 1080 },
};
export const SIZE_ORDER = ['1080x1080', '1080x1350', '1920x1080'];

const SAMPLES = ['boulevard', 'pier'];
const PREVIEW_LONG_SIDE = 720;

const stage = document.getElementById('stage');
const statusLine = document.getElementById('status');
const slotsList = document.getElementById('slots');
const layoutsList = document.getElementById('layouts');
const gradesList = document.getElementById('grades');
const exportsList = document.getElementById('exports');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const sizeInput = document.getElementById('captionSize');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');
const selectedLabel = document.getElementById('selectedLabel');
const fillAllButton = document.getElementById('fillAll');
const zoomResetButton = document.getElementById('zoomReset');
const fileInput = document.getElementById('file');

const state = {
  layout: 'grid',
  grade: 'sunset',
  size: '1080x1080',
  caption: 'Vice City Nights',
  subtitle: 'My agent paid the bounty',
  captionScale: 1,
  selected: 0,
  panels: [0, 1, 2, 3].map(() => ({ img: null, zoom: 1, ox: 0, oy: 0 })),
};

let fontReady = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Loads the Anton caption font; the cover falls back to sans-serif until then. */
function ensureFonts() {
  if (!fontReady) {
    fontReady = document.fonts.load('100px Anton').catch(() => {});
  }
  return fontReady;
}

/** Preview canvas size for the current export aspect, long side 720. */
function previewSize() {
  const size = EXPORT_SIZES[state.size];
  const scale = PREVIEW_LONG_SIDE / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

/** Draws the current state onto the preview canvas. */
function draw() {
  const shotCover = document.body.classList.contains('shot-cover');
  const { w, h } = shotCover
    ? { w: stage.width, h: stage.height }
    : previewSize();
  if (stage.width !== w || stage.height !== h) {
    stage.width = w;
    stage.height = h;
  }
  const ctx = stage.getContext('2d');
  drawCover(ctx, w, h, {
    layout: state.layout,
    grade: state.grade,
    panels: state.panels,
    caption: state.caption,
    subtitle: state.subtitle,
    captionScale: state.captionScale,
    highlight: shotCover ? undefined : state.selected,
  });
  selectedLabel.textContent = `Panel ${state.selected + 1} of ${panelCount(state.layout)} selected`;
}

/** Rebuilds the photo slot rows for the current layout. */
function buildSlots() {
  slotsList.replaceChildren();
  const count = panelCount(state.layout);
  for (let index = 0; index < count; index += 1) {
    const row = document.createElement('div');
    row.className = 'slot';
    if (index === state.selected) row.classList.add('selected');
    const label = document.createElement('span');
    label.className = 'slot-label';
    label.textContent = `Panel ${index + 1}`;
    row.appendChild(label);
    const choose = document.createElement('button');
    choose.type = 'button';
    choose.className = 'mini';
    choose.textContent = state.panels[index].img ? 'Change photo' : 'Add photo';
    choose.addEventListener('click', () => {
      state.selected = index;
      fileInput.click();
    });
    row.appendChild(choose);
    for (const sample of SAMPLES) {
      const sampleButton = document.createElement('button');
      sampleButton.type = 'button';
      sampleButton.className = 'mini ghost';
      sampleButton.textContent = sample === 'boulevard' ? 'Boulevard' : 'Pier';
      sampleButton.addEventListener('click', async () => {
        state.selected = index;
        state.panels[index] = await slotFromSample(index, sample);
        buildSlots();
        draw();
      });
      row.appendChild(sampleButton);
    }
    row.addEventListener('click', (event) => {
      if (event.target === row || event.target === label) {
        state.selected = index;
        syncZoom();
        buildSlots();
        draw();
      }
    });
    slotsList.appendChild(row);
  }
}

/** A fresh slot holding one sample photo. */
async function slotFromSample(index, sample) {
  const img = await loadImage(`samples/${sample}.jpg`);
  const old = state.panels[index];
  return { img, zoom: old.zoom, ox: 0, oy: 0 };
}

/** Rebuilds the layout picker buttons. */
function buildLayouts() {
  layoutsList.replaceChildren();
  for (const name of LAYOUT_ORDER) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick';
    if (name === state.layout) button.classList.add('active');
    const strong = document.createElement('strong');
    strong.textContent = LAYOUTS[name].label;
    const small = document.createElement('small');
    small.textContent = LAYOUTS[name].hint;
    button.append(strong, small);
    button.addEventListener('click', () => {
      state.layout = name;
      state.selected = 0;
      syncZoom();
      buildSlots();
      buildLayouts();
      draw();
    });
    layoutsList.appendChild(button);
  }
}

/** Rebuilds the grade picker buttons. */
function buildGrades() {
  gradesList.replaceChildren();
  for (const name of GRADE_ORDER) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick swatch';
    if (name === state.grade) button.classList.add('active');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = `linear-gradient(135deg, ${GRADES[name].tint.from}, ${GRADES[name].tint.to})`;
    const strong = document.createElement('strong');
    strong.textContent = GRADES[name].label;
    const small = document.createElement('small');
    small.textContent = GRADES[name].hint;
    button.append(dot, strong, small);
    button.addEventListener('click', () => {
      state.grade = name;
      buildGrades();
      draw();
    });
    gradesList.appendChild(button);
  }
}

/** Rebuilds the export size buttons. */
function buildExports() {
  exportsList.replaceChildren();
  for (const key of SIZE_ORDER) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'export';
    button.textContent = `PNG ${EXPORT_SIZES[key].label}`;
    button.addEventListener('click', () => exportPng(key));
    exportsList.appendChild(button);
  }
}

/** Keeps the zoom slider and label in step with the selected panel. */
function syncZoom() {
  const panel = state.panels[state.selected];
  zoomInput.value = String(panel.zoom);
  zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
}

/** Renders the cover at an export size and downloads it as a PNG. */
function exportPng(key) {
  const size = EXPORT_SIZES[key];
  const offscreen = document.createElement('canvas');
  offscreen.width = size.w;
  offscreen.height = size.h;
  const ctx = offscreen.getContext('2d');
  drawCover(ctx, size.w, size.h, {
    layout: state.layout,
    grade: state.grade,
    panels: state.panels,
    caption: state.caption,
    subtitle: state.subtitle,
    captionScale: state.captionScale,
  });
  offscreen.toBlob((blob) => {
    if (!blob) {
      statusLine.textContent = 'Export failed — the canvas was empty.';
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cover-${key}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    statusLine.textContent = `Saved cover-${key}.png`;
  }, 'image/png');
}

/** Finds which panel a preview point falls in, or -1 for the caption band. */
function panelAt(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * stage.width;
  const y = ((clientY - rect.top) / rect.height) * stage.height;
  const layout = layoutFor(state.layout);
  for (let index = 0; index < layout.panels.length; index += 1) {
    const panel = panelPixels(layout.panels[index], stage.width, stage.height);
    if (x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h) {
      return { index, x, y, panel };
    }
  }
  return null;
}

let drag = null;

stage.addEventListener('pointerdown', (event) => {
  const hit = panelAt(event.clientX, event.clientY);
  if (!hit || !state.panels[hit.index].img) return;
  state.selected = hit.index;
  syncZoom();
  buildSlots();
  draw();
  drag = { index: hit.index, x: hit.x, y: hit.y, panel: hit.panel, photo: { ...state.panels[hit.index] } };
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * stage.width;
  const y = ((event.clientY - rect.top) / rect.height) * stage.height;
  const photo = state.panels[drag.index];
  const base = Math.max(drag.panel.w / photo.img.naturalWidth, drag.panel.h / photo.img.naturalHeight);
  const dw = photo.img.naturalWidth * base * photo.zoom;
  const dh = photo.img.naturalHeight * base * photo.zoom;
  const spanX = Math.max(1, dw - drag.panel.w);
  const spanY = Math.max(1, dh - drag.panel.h);
  photo.ox = Math.max(-0.5, Math.min(0.5, drag.photo.ox + (x - drag.x) / spanX));
  photo.oy = Math.max(-0.5, Math.min(0.5, drag.photo.oy + (y - drag.y) / spanY));
  draw();
});

stage.addEventListener('pointerup', () => {
  drag = null;
});

stage.addEventListener('pointercancel', () => {
  drag = null;
});

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  const old = state.panels[state.selected];
  state.panels[state.selected] = { img, zoom: old.zoom, ox: 0, oy: 0 };
  statusLine.textContent = `Loaded ${file.name} into panel ${state.selected + 1}`;
  buildSlots();
  draw();
  fileInput.value = '';
});

fillAllButton.addEventListener('click', () => {
  const source = state.panels[state.selected].img ?? state.panels.find((slot) => slot.img)?.img;
  if (!source) {
    statusLine.textContent = 'Load a photo first, then fill all panels with it.';
    return;
  }
  const count = panelCount(state.layout);
  for (let index = 0; index < count; index += 1) {
    const old = state.panels[index];
    state.panels[index] = { img: source, zoom: old.zoom, ox: old.ox, oy: old.oy };
  }
  statusLine.textContent = `Filled ${count} panels with one photo`;
  buildSlots();
  draw();
});

zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  panel.zoom = Number(zoomInput.value);
  zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
  draw();
});

zoomResetButton.addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
  syncZoom();
  draw();
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  draw();
});

subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  draw();
});

sizeInput.addEventListener('input', () => {
  state.captionScale = Number(sizeInput.value);
  draw();
});

/** The controller the screenshot scenes drive. */
const studio = {
  setLayout(name) {
    state.layout = name in LAYOUTS ? name : 'grid';
    state.selected = 0;
  },
  setGrade(name) {
    state.grade = name in GRADES ? name : 'sunset';
  },
  setSize(key) {
    state.size = key in EXPORT_SIZES ? key : '1080x1080';
  },
  setCaption(text) {
    state.caption = text;
    captionInput.value = text;
  },
  setSubtitle(text) {
    state.subtitle = text;
    subtitleInput.value = text;
  },
  async loadPhotos(names) {
    const count = panelCount(state.layout);
    for (let index = 0; index < count; index += 1) {
      const img = await loadImage(`samples/${names[index % names.length]}.jpg`);
      state.panels[index] = { img, zoom: 1, ox: 0, oy: 0 };
    }
  },
  sizeStageToViewport() {
    stage.width = window.innerWidth;
    stage.height = window.innerHeight;
  },
  ensureFonts,
  draw() {
    buildSlots();
    buildLayouts();
    buildGrades();
    draw();
  },
};

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, studio).catch((error) => {
    statusLine.textContent = `Shot failed: ${error.message}`;
  });
} else {
  buildSlots();
  buildLayouts();
  buildGrades();
  buildExports();
  ensureFonts().then(draw);
  draw();
}
