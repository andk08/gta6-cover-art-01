// Vice Cover Studio — colour grades. Each grade is a canvas filter applied
// to the photos, a diagonal tint laid over them, an accent colour used for
// the subtitle and the selection ring, and the dark background behind the
// panel gutters.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    blurb: 'Warm orange-magenta dusk',
    filter: 'saturate(1.35) contrast(1.08) sepia(0.28) hue-rotate(-10deg)',
    tint: ['rgba(255, 94, 0, 0.30)', 'rgba(255, 0, 128, 0.24)'],
    accent: '#ff5e3a',
    dark: '#160a24',
  },
  neon: {
    name: 'Neon',
    blurb: 'Electric cyan-magenta night',
    filter: 'saturate(1.7) contrast(1.12) brightness(1.06)',
    tint: ['rgba(0, 255, 255, 0.20)', 'rgba(255, 0, 255, 0.22)'],
    accent: '#00e5ff',
    dark: '#0a0618',
  },
  noir: {
    name: 'Noir',
    blurb: 'Black-and-white contrast',
    filter: 'grayscale(1) contrast(1.28) brightness(0.92)',
    tint: ['rgba(0, 0, 0, 0.28)', 'rgba(255, 255, 255, 0.08)'],
    accent: '#e8e8e8',
    dark: '#000000',
  },
  palm: {
    name: 'Palm',
    blurb: 'Tropical green-gold day',
    filter: 'saturate(1.25) contrast(1.05) hue-rotate(-16deg) brightness(1.07)',
    tint: ['rgba(0, 200, 120, 0.22)', 'rgba(255, 214, 0, 0.16)'],
    accent: '#7dff5e',
    dark: '#06231a',
  },
};

export const GRADE_IDS = Object.keys(GRADES);

export function gradeOf(id) {
  return GRADES[id] ?? GRADES.sunset;
}
