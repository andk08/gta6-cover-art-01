// Vice Cover Studio — cover layouts as fractions of the cover.
// A panel is { x, y, w, h } in 0..1 of the cover, so one layout works at
// every export size. The gaps between panels are gutters that show the
// grade's dark background.
export const LAYOUTS = {
  grid: {
    name: 'Vice Grid',
    blurb: '2 x 2 equal panels',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  hero: {
    name: 'Hero Strip',
    blurb: 'One hero panel, three below',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
    ],
  },
  triple: {
    name: 'Triple Split',
    blurb: 'Three vertical columns',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  solo: {
    name: 'Solo Shot',
    blurb: 'One full-bleed photo',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

export function layoutOf(id) {
  return LAYOUTS[id] ?? LAYOUTS.grid;
}

/** Panel rectangles in pixels for a cover of W x H, each inset by a gutter. */
export function panelRects(layoutId, W, H) {
  const layout = layoutOf(layoutId);
  const gutter = Math.max(2, Math.round(Math.min(W, H) * 0.012));
  const half = gutter / 2;
  return layout.panels.map((p) => ({
    x: Math.round(p.x * W) + half,
    y: Math.round(p.y * H) + half,
    w: Math.round(p.w * W) - gutter,
    h: Math.round(p.h * H) - gutter,
  }));
}
