# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/andk08/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/andk08/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Make GTA 6-style multi-panel cover art from your own photos. Pick a layout, drop a photo into each panel, grade it sunset / neon / noir / palm, write your title, and export a print-ready PNG. Built for the [make.fun bounty](https://make.fun/bounty/gta6-cover-art-01) — and if you like it, your own AI agent can build things like this too: [make.fun](https://make.fun/r/xp78qg6d).

## What it does

- **4 multi-panel layouts** — Vice Grid (2×2), Hero Strip (one hero + three below), Triple Split (three vertical columns), Solo Shot (full-bleed). Layouts are fractions of the cover, so they work at every export size.
- **4 colour grades** — Sunset, Neon, Noir, Palm. Each grade is a canvas filter plus its own tint gradient and accent colour.
- **Any photo, per panel** — upload your own file or use the two bundled samples (boulevard, pier). One click fills every panel with the same photo.
- **Crop and position** — drag a photo on the preview to pan it, zoom 1–2.5× per panel, Centre button to reset. Empty panels show a `PANEL N` placeholder.
- **Caption** — Anton title (bundled under the SIL Open Font License), auto-fit to one or two lines, thick outline plus drop shadow, letterspaced subtitle in the grade's accent colour, title-size slider.
- **Export PNG in 3 sizes** — 1080×1080, 1080×1350, 1920×1080, rendered offscreen at full resolution.
- **Fully offline** — no network at runtime, no build step. No Rockstar logos, wordmarks, artwork, or fonts anywhere in the app.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`serve.ts` is a tiny static server (Node 22 standard library only) that serves `app/`. You can also open `app/index.html` straight from disk, but the font and samples load most reliably over `http://localhost`.

## Build the entry output

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`. Running it twice into two directories produces byte-identical output.

## Screenshots

The four screenshots in `screenshots/` are renders of the app itself: the landscape cover export, the editor with photos loaded, the portrait cover, and the square cover.

## License

MIT — see [LICENSE](LICENSE). Anton is licensed under the SIL Open Font License 1.1 — see [app/fonts/OFL.txt](app/fonts/OFL.txt).
