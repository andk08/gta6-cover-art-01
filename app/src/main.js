// Vice Cover Studio — editor wiring.
//
// Owns the page state, the controls around the preview canvas, drag-to-pan
// cropping, PNG export, and the ?shot= protocol the screenshots use:
//
//   ?shot=cover&layout=hero&grade=neon&size=landscape
//     &photos=boulevard,pier&caption=VICE%20CITY%20NIGHTS&sub=MY%20AGENT%20PAID%20THE%20BOUNTY
//   ?shot=editor&layout=grid&grade=sunset&size=landscape&photos=boulevard,pier
//
// shot=cover renders the cover alone, full-viewport; shot=editor renders the
// whole workbench with the named sample photos loaded. Either way the page
// sets data-vice-ready="1" on <html> once fonts and photos are in and the
// first frame is drawn.
'use strict';

var VC = window.VC || (window.VC = {});

const VC_EXPORT_SIZES = {
  landscape: { w: 1920, h: 1080, label: '1920 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
};

function vcNewPanel() {
  return { img: null, name: '', fx: 0.5, fy: 0.5, zoom: 1 };
}

const vcState = {
  layout: 'hero',
  grade: 'neon',
  title: 'VICE CITY NIGHTS',
  subtitle: 'MY AGENT PAID THE BOUNTY',
  titleSize: 100,
  exportSize: 'landscape',
  panels: [vcNewPanel(), vcNewPanel(), vcNewPanel(), vcNewPanel()],
};

let vcCoverMode = false;
const vcPreview = document.getElementById('preview');
const vcCtx = vcPreview.getContext('2d');

function vcClamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function vcPanelCount() {
  return (VC.LAYOUTS[vcState.layout] || VC.LAYOUTS.hero).panels;
}

function vcPreviewSize() {
  const s = VC_EXPORT_SIZES[vcState.exportSize];
  const scale = Math.min(1, 1100 / Math.max(s.w, s.h));
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function vcRender() {
  let w;
  let h;
  if (vcCoverMode) {
    w = window.innerWidth;
    h = window.innerHeight;
  } else {
    const ps = vcPreviewSize();
    w = ps.w;
    h = ps.h;
  }
  if (vcPreview.width !== w || vcPreview.height !== h) {
    vcPreview.width = w;
    vcPreview.height = h;
  }
  VC.renderCover(vcCtx, w, h, vcState);
}

function vcLoadImage(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = function () {
      reject(new Error('cannot load ' + src));
    };
    img.src = src;
  });
}

async function vcSetPanelPhoto(i, src, name) {
  try {
    const img = await vcLoadImage(src);
    vcState.panels[i] = { img: img, name: name, fx: 0.5, fy: 0.5, zoom: 1 };
    vcRender();
    vcBuildPanelList();
  } catch (e) {
    console.warn(e.message);
  }
}

// --- toolbar ---------------------------------------------------------------

function vcBuildToolbar() {
  const lg = document.getElementById('layoutGroup');
  lg.innerHTML = '';
  VC.LAYOUT_ORDER.forEach(function (key) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (vcState.layout === key ? ' active' : '');
    b.textContent = VC.LAYOUTS[key].name;
    b.addEventListener('click', function () {
      vcState.layout = key;
      vcBuildToolbar();
      vcBuildPanelList();
      vcRender();
    });
    lg.appendChild(b);
  });
  const gg = document.getElementById('gradeGroup');
  gg.innerHTML = '';
  VC.GRADE_ORDER.forEach(function (key) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (vcState.grade === key ? ' active' : '');
    b.textContent = VC.GRADES[key].name;
    b.addEventListener('click', function () {
      vcState.grade = key;
      vcBuildToolbar();
      vcRender();
    });
    gg.appendChild(b);
  });
}

// --- per-panel cards -------------------------------------------------------

function vcBuildPanelList() {
  const list = document.getElementById('panelList');
  list.innerHTML = '';
  const n = vcPanelCount();
  for (let i = 0; i < n; i++) {
    const p = vcState.panels[i];
    const card = document.createElement('div');
    card.className = 'panel-card';
    const head = document.createElement('div');
    head.className = 'panel-head';
    const num = document.createElement('span');
    num.textContent = 'Panel ' + (i + 1);
    const nm = document.createElement('span');
    nm.className = 'panel-name';
    nm.textContent = p.name || 'empty';
    head.appendChild(num);
    head.appendChild(nm);
    card.appendChild(head);

    const btns = document.createElement('div');
    btns.className = 'panel-btns';
    const upLabel = document.createElement('label');
    upLabel.className = 'btn small';
    upLabel.textContent = 'Upload ';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.hidden = true;
    file.addEventListener('change', function () {
      const f = file.files && file.files[0];
      if (!f) return;
      vcSetPanelPhoto(i, URL.createObjectURL(f), f.name);
    });
    upLabel.appendChild(file);
    btns.appendChild(upLabel);
    ['boulevard', 'pier'].forEach(function (sample) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn small';
      b.textContent = sample === 'boulevard' ? 'Boulevard' : 'Pier';
      b.addEventListener('click', function () {
        vcSetPanelPhoto(i, 'samples/' + sample + '.jpg', sample);
      });
      btns.appendChild(b);
    });
    card.appendChild(btns);

    const zoomRow = document.createElement('div');
    zoomRow.className = 'panel-zoom';
    const zLabel = document.createElement('label');
    zLabel.textContent = 'Zoom ';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '2.5';
    slider.step = '0.05';
    slider.value = String(p.zoom);
    slider.addEventListener('input', function () {
      vcState.panels[i].zoom = Number(slider.value);
      vcRender();
    });
    zLabel.appendChild(slider);
    zoomRow.appendChild(zLabel);
    const centre = document.createElement('button');
    centre.type = 'button';
    centre.className = 'btn small';
    centre.textContent = 'Centre';
    centre.addEventListener('click', function () {
      vcState.panels[i].fx = 0.5;
      vcState.panels[i].fy = 0.5;
      vcState.panels[i].zoom = 1;
      slider.value = '1';
      vcRender();
    });
    zoomRow.appendChild(centre);
    card.appendChild(zoomRow);

    list.appendChild(card);
  }
}

// --- drag-to-pan -----------------------------------------------------------

let vcDrag = null;

function vcPointerPos(e) {
  const r = vcPreview.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (vcPreview.width / r.width),
    y: (e.clientY - r.top) * (vcPreview.height / r.height),
  };
}

vcPreview.addEventListener('pointerdown', function (e) {
  const pos = vcPointerPos(e);
  const areas = VC.LAYOUTS[vcState.layout].areas(vcPreview.width, vcPreview.height);
  const idx = areas.findIndex(function (a) {
    return pos.x >= a.x && pos.x < a.x + a.w && pos.y >= a.y && pos.y < a.y + a.h;
  });
  if (idx < 0) return;
  const p = vcState.panels[idx];
  if (!p.img) return;
  vcDrag = { idx: idx, lastX: pos.x, lastY: pos.y };
  vcPreview.setPointerCapture(e.pointerId);
});

vcPreview.addEventListener('pointermove', function (e) {
  if (!vcDrag) return;
  const pos = vcPointerPos(e);
  const p = vcState.panels[vcDrag.idx];
  const areas = VC.LAYOUTS[vcState.layout].areas(vcPreview.width, vcPreview.height);
  const a = areas[vcDrag.idx];
  const f = VC.coverFit(p.img, a.w, a.h, p.fx, p.fy, p.zoom);
  // Keep the photo covering its panel: the focal point may only move as far
  // as the zoomed image still covers the panel on every side.
  const fxLo = a.w / 2 / f.dw;
  const fxHi = 1 - fxLo;
  const fyLo = a.h / 2 / f.dh;
  const fyHi = 1 - fyLo;
  p.fx = vcClamp(p.fx - (pos.x - vcDrag.lastX) / f.dw, fxLo, fxHi);
  p.fy = vcClamp(p.fy - (pos.y - vcDrag.lastY) / f.dh, fyLo, fyHi);
  vcDrag.lastX = pos.x;
  vcDrag.lastY = pos.y;
  vcRender();
});

function vcEndDrag() {
  vcDrag = null;
}
vcPreview.addEventListener('pointerup', vcEndDrag);
vcPreview.addEventListener('pointercancel', vcEndDrag);

// --- export ----------------------------------------------------------------

async function vcExport() {
  const s = VC_EXPORT_SIZES[vcState.exportSize];
  try {
    await document.fonts.load('16px Anton');
  } catch (e) {
    /* fall back to whatever font is available */
  }
  const off = document.createElement('canvas');
  off.width = s.w;
  off.height = s.h;
  VC.renderCover(off.getContext('2d'), s.w, s.h, vcState);
  off.toBlob(function (blob) {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-cover-' + s.w + 'x' + s.h + '.png';
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 5000);
  }, 'image/png');
}

// --- ?shot= protocol ---------------------------------------------------------

function vcApplyShot() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return { mode: 'editor', photos: [] };
  if (q.get('layout') && VC.LAYOUTS[q.get('layout')]) vcState.layout = q.get('layout');
  if (q.get('grade') && VC.GRADES[q.get('grade')]) vcState.grade = q.get('grade');
  if (q.get('size') && VC_EXPORT_SIZES[q.get('size')]) vcState.exportSize = q.get('size');
  if (q.get('caption')) vcState.title = q.get('caption');
  if (q.get('sub') !== null) vcState.subtitle = q.get('sub') || '';
  if (q.get('titleSize')) vcState.titleSize = Number(q.get('titleSize')) || 100;
  const photos = (q.get('photos') || '')
    .split(',')
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  return { mode: shot, photos: photos };
}

// --- init --------------------------------------------------------------------

async function vcInit() {
  const shot = vcApplyShot();
  vcCoverMode = shot.mode === 'cover';
  if (vcCoverMode) document.body.classList.add('cover-mode');
  vcBuildToolbar();
  vcBuildPanelList();

  const titleInput = document.getElementById('titleInput');
  const subInput = document.getElementById('subInput');
  const sizeInput = document.getElementById('titleSize');
  const sizeVal = document.getElementById('titleSizeVal');
  titleInput.value = vcState.title;
  subInput.value = vcState.subtitle;
  sizeInput.value = String(vcState.titleSize);
  sizeVal.textContent = vcState.titleSize + '%';
  titleInput.addEventListener('input', function () {
    vcState.title = titleInput.value;
    vcRender();
  });
  subInput.addEventListener('input', function () {
    vcState.subtitle = subInput.value;
    vcRender();
  });
  sizeInput.addEventListener('input', function () {
    vcState.titleSize = Number(sizeInput.value);
    sizeVal.textContent = vcState.titleSize + '%';
    vcRender();
  });
  const sizeSelect = document.getElementById('exportSize');
  sizeSelect.value = vcState.exportSize;
  sizeSelect.addEventListener('change', function () {
    vcState.exportSize = sizeSelect.value;
    vcRender();
  });
  document.getElementById('exportBtn').addEventListener('click', vcExport);
  document.getElementById('fillAllBtn').addEventListener('click', async function () {
    let src = vcState.panels.find(function (p) {
      return p.img;
    });
    if (!src) {
      try {
        const img = await vcLoadImage('samples/boulevard.jpg');
        src = { img: img, name: 'boulevard' };
        vcState.panels[0] = { img: img, name: 'boulevard', fx: 0.5, fy: 0.5, zoom: 1 };
      } catch (e) {
        console.warn(e.message);
        return;
      }
    }
    for (let i = 0; i < vcPanelCount(); i++) {
      vcState.panels[i] = { img: src.img, name: src.name, fx: 0.5, fy: 0.5, zoom: 1 };
    }
    vcRender();
    vcBuildPanelList();
  });

  // Load the shot's sample photos into the panels, cycling the list.
  for (let i = 0; i < vcPanelCount(); i++) {
    const name = shot.photos[i % shot.photos.length];
    if (!name) break;
    try {
      const img = await vcLoadImage('samples/' + name + '.jpg');
      vcState.panels[i] = { img: img, name: name, fx: 0.5, fy: 0.5, zoom: 1 };
    } catch (e) {
      console.warn(e.message);
    }
  }
  vcBuildPanelList();
  try {
    await document.fonts.load('16px Anton');
  } catch (e) {
    /* fall back to whatever font is available */
  }
  await document.fonts.ready;
  vcRender();
  document.documentElement.dataset.viceReady = '1';
}

window.addEventListener('resize', function () {
  if (vcCoverMode) vcRender();
});

vcInit();
