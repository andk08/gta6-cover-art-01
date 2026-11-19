// Panel layouts for the cover. A layout names its panels as fractions of the
// cover (x, y, width, height) plus the zone where the caption lives, so one
// layout works at every export size: square, portrait and landscape. The
// caption zone is either a solid band under the panels or a scrim fading up
// over the bottom of the photo. Gutters are added when the cover is drawn,
// not stored here, so the fractions stay clean.

export const LAYOUTS = {
  grid: {
    label: 'Vice Grid',
    hint: 'Four panels, two by two',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0, w: 0.5, h: 0.38 },
      { x: 0, y: 0.38, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0.38, w: 0.5, h: 0.38 },
    ],
    caption: { x: 0, y: 0.76, w: 1, h: 0.24 },
    captionStyle: 'band',
  },
  hero: {
    label: 'Hero Strip',
    hint: 'One big hero, three strips below',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 1 / 3, h: 0.2 },
      { x: 1 / 3, y: 0.58, w: 1 / 3, h: 0.2 },
      { x: 2 / 3, y: 0.58, w: 1 / 3, h: 0.2 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
    captionStyle: 'band',
  },
  triple: {
    label: 'Triple Split',
    hint: 'Three tall panels side by side',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 0.78 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.78 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.78 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
    captionStyle: 'band',
  },
  solo: {
    label: 'Solo Shot',
    hint: 'One full-bleed photo',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    caption: { x: 0, y: 0.68, w: 1, h: 0.32 },
    captionStyle: 'scrim',
  },
};

export const LAYOUT_ORDER = ['grid', 'hero', 'triple', 'solo'];

/** The layout for a name, falling back to the grid when the name is unknown. */
export function layoutFor(name) {
  return LAYOUTS[name] ?? LAYOUTS.grid;
}

/** How many photo slots a layout uses. */
export function panelCount(name) {
  return layoutFor(name).panels.length;
}
