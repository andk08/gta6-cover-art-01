// Colour grades. Each grade is a canvas filter applied to the photos, a
// diagonal two-stop tint washed over every panel, and one accent colour
// used by the subtitle and the UI.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'sepia(0.35) saturate(1.6) contrast(1.05) brightness(1.02)',
    tint: ['rgba(255,122,26,0.26)', 'rgba(255,45,149,0.30)'],
    accent: '#ffb347',
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.9) contrast(1.25) brightness(1.06) hue-rotate(-12deg)',
    tint: ['rgba(0,229,255,0.20)', 'rgba(255,0,229,0.28)'],
    accent: '#00e5ff',
  },
  noir: {
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.35) brightness(0.95)',
    tint: ['rgba(0,0,0,0.28)', 'rgba(130,130,140,0.16)'],
    accent: '#f2f2f2',
  },
  palm: {
    name: 'Palm',
    filter: 'sepia(0.25) saturate(1.5) hue-rotate(55deg) contrast(1.05)',
    tint: ['rgba(0,200,160,0.20)', 'rgba(180,255,90,0.22)'],
    accent: '#8dff5a',
  },
};

export const GRADE_IDS = Object.keys(GRADES);
