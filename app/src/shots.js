// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone, drawn at the viewport.
// `photos` picks the samples (samples/<name>.jpg, comma separated, one per
// panel); `photo` loads one sample into every panel. `layout`, `grade`,
// `size`, `caption` and `sub` set the rest of the scene. window.__shotReady
// is set once the cover is painted with its fonts loaded.

export async function runShot(shot, query, studio) {
  const names = (query.get('photos') || query.get('photo') || 'pier')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  studio.setLayout(query.get('layout') || 'grid');
  studio.setGrade(query.get('grade') || 'sunset');
  studio.setSize(query.get('size') || '1080x1080');
  studio.setCaption(query.get('caption') ?? 'Vice City Nights');
  studio.setSubtitle(query.get('sub') ?? '');
  await studio.loadPhotos(names);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    studio.sizeStageToViewport();
  }
  await studio.ensureFonts();
  studio.draw();
  studio.draw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
