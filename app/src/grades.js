// Vice Cover Studio — colour grades.
//
// A grade is a canvas filter applied to every photo, a diagonal tint washed
// over the whole cover, and the accent colours the caption is drawn in.
'use strict';

var VC = window.VC || (window.VC = {});

const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.45) contrast(1.08) sepia(0.28) brightness(1.04)',
    tint: ['#ff7a18', '#ff2d78'],
    tintAlpha: 0.22,
    accent: '#ffb347',
    sub: '#ffd166',
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.9) contrast(1.18) brightness(1.02)',
    tint: ['#7c3aed', '#06b6d4'],
    tintAlpha: 0.26,
    accent: '#22d3ee',
    sub: '#67e8f9',
  },
  noir: {
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.3) brightness(0.92)',
    tint: ['#111111', '#555555'],
    tintAlpha: 0.18,
    accent: '#f5f5f5',
    sub: '#d4d4d4',
  },
  palm: {
    name: 'Palm',
    filter: 'saturate(1.3) contrast(1.06) brightness(1.07) hue-rotate(-6deg)',
    tint: ['#0d9488', '#a3e635'],
    tintAlpha: 0.2,
    accent: '#bef264',
    sub: '#a3e635',
  },
};

const GRADE_ORDER = ['sunset', 'neon', 'noir', 'palm'];

VC.GRADES = GRADES;
VC.GRADE_ORDER = GRADE_ORDER;
