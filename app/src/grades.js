// Colour grades. A grade is a canvas filter the photos are drawn through,
// a tint gradient washed over them, and the accent colour the caption band
// and the editor borrow. Every grade is our own recipe: warm sunset, hot
// neon, hard noir and tropical palm.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    hint: 'Warm Vice City evening',
    filter: 'saturate(1.45) contrast(1.06) brightness(1.03) sepia(0.22)',
    tint: {
      from: '#ff9a3d',
      to: '#ff2e88',
      angle: 'down',
      blend: 'overlay',
      alpha: 0.5,
    },
    accent: '#ff7a18',
    vignette: 0.32,
  },
  neon: {
    label: 'Neon',
    hint: 'Magenta and cyan nights',
    filter: 'saturate(1.7) contrast(1.12) hue-rotate(-14deg)',
    tint: {
      from: '#ff2ea6',
      to: '#00e5ff',
      angle: 'diagonal',
      blend: 'soft-light',
      alpha: 0.55,
    },
    accent: '#ff2ea6',
    vignette: 0.38,
  },
  noir: {
    label: 'Noir',
    hint: 'Black and white, hard contrast',
    filter: 'grayscale(1) contrast(1.4) brightness(1.06)',
    tint: {
      from: '#ffffff',
      to: '#000000',
      angle: 'down',
      blend: 'overlay',
      alpha: 0.25,
    },
    accent: '#ffffff',
    vignette: 0.42,
  },
  palm: {
    label: 'Palm',
    hint: 'Teal water, lime light',
    filter: 'saturate(1.5) contrast(1.05) hue-rotate(16deg)',
    tint: {
      from: '#00c9a7',
      to: '#ffe259',
      angle: 'down',
      blend: 'soft-light',
      alpha: 0.5,
    },
    accent: '#2ee6a8',
    vignette: 0.3,
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'noir', 'palm'];

/** The grade for a name, falling back to sunset when the name is unknown. */
export function gradeFor(name) {
  return GRADES[name] ?? GRADES.sunset;
}
