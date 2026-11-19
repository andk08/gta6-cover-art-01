// Vice Cover Studio — cover layouts.
//
// A layout maps a cover of size W x H to the panel rectangles it is made of.
// Every rectangle is in cover pixels; the black gap between panels scales
// with the cover so a thumbnail and a 1920px export look the same.
'use strict';

var VC = window.VC || (window.VC = {});

function vcRect(x, y, w, h) {
  return { x: x, y: y, w: w, h: h };
}

const LAYOUTS = {
  grid: {
    name: 'Vice Grid',
    panels: 4,
    areas: function (W, H) {
      const g = Math.max(3, Math.round(W * 0.008));
      const hw = (W - g) / 2;
      const hh = (H - g) / 2;
      return [
        vcRect(0, 0, hw, hh),
        vcRect(hw + g, 0, hw, hh),
        vcRect(0, hh + g, hw, hh),
        vcRect(hw + g, hh + g, hw, hh),
      ];
    },
  },
  hero: {
    name: 'Hero Strip',
    panels: 4,
    areas: function (W, H) {
      const g = Math.max(3, Math.round(W * 0.008));
      const heroH = H * 0.62;
      const stripH = H - heroH - g;
      const sw = (W - 2 * g) / 3;
      return [
        vcRect(0, 0, W, heroH),
        vcRect(0, heroH + g, sw, stripH),
        vcRect(sw + g, heroH + g, sw, stripH),
        vcRect(2 * (sw + g), heroH + g, sw, stripH),
      ];
    },
  },
  triple: {
    name: 'Triple Split',
    panels: 3,
    areas: function (W, H) {
      const g = Math.max(3, Math.round(W * 0.008));
      const cw = (W - 2 * g) / 3;
      return [
        vcRect(0, 0, cw, H),
        vcRect(cw + g, 0, cw, H),
        vcRect(2 * (cw + g), 0, cw, H),
      ];
    },
  },
  solo: {
    name: 'Solo Shot',
    panels: 1,
    areas: function (W, H) {
      return [vcRect(0, 0, W, H)];
    },
  },
};

const LAYOUT_ORDER = ['grid', 'hero', 'triple', 'solo'];

VC.LAYOUTS = LAYOUTS;
VC.LAYOUT_ORDER = LAYOUT_ORDER;
