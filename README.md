# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/andk08/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/andk08/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns your photo and a caption into GTA-style cover art: the multi-panel poster look, bold caption lettering and a Vice City sunset or neon colour grade — exported as a PNG to share. Built for the [make.fun](https://make.fun/r/xp78qg6d) bounty **Make GTA 6 Cover Art**.

## What it does

- **Any photo** — load your own photos from your machine (or try the two built-in samples). Each panel gets its own photo, and you can crop and position each one by dragging it and with the zoom slider.
- **Four layouts** — Vice Grid (four panels), Hero Strip (one big hero, three strips), Triple Split (three tall panels) and Solo Shot (one full-bleed photo). One photo can fill every panel, or each panel can hold a different one.
- **Four grades** — Sunset, Neon, Noir and Palm. Each grade is a colour filter plus a tint wash and a matching accent colour.
- **Words** — a big title in Anton with a subtitle underneath, both editable, with a title-size slider. The title auto-fits to one or two lines.
- **Fast export** — one click exports a PNG in the common post sizes: **1080 × 1080**, **1080 × 1350** or **1920 × 1080**.

## Run it

No build step, no network. Serve `app/` with any static server and open it in desktop Chrome:

```sh
node serve.ts
# app/ is on http://localhost:8080
```

Or serve the folder with Python, `npx serve`, or any static host — `app/index.html` is the page.

## How it works

- `app/index.html` — the editor page.
- `app/style.css` — the dark neon editor styling.
- `app/src/main.js` — the studio wiring: slots, pickers, drag-to-pan, exports.
- `app/src/cover.js` — the cover renderer: panels, grades, caption band, vignette.
- `app/src/layouts.js` — the four panel layouts as fractions of the cover.
- `app/src/grades.js` — the four colour grades.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover` / `?shot=editor`).
- `app/fonts/Anton-Regular.ttf` — the caption font (SIL Open Font License, see `app/fonts/OFL.txt`).
- `app/samples/` — two sample photos made for make.fun with an image model, free to use.

Everything runs offline: every script, font and sample is a file under `app/`, and your photos are read on your own machine, never uploaded.

## Hand in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Credits

- Caption font Anton by Vernon Adams, under the SIL Open Font License 1.1 (`app/fonts/OFL.txt`).
- Sample photos were made for make.fun with an image model and are free to use.
- Everything else here is original work: no Rockstar Games logo, wordmark, artwork, character or font is used anywhere in this entry.
