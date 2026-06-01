# flowfield

[![pages](https://img.shields.io/badge/live-baditaflorin.github.io%2Fflowfield-ff6b6b)](https://baditaflorin.github.io/flowfield/)
[![version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/baditaflorin/flowfield/blob/main/package.json)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> Perlin/flow-field generative art in your browser — tune it, seed it, export SVG/PNG. r/generative catnip.

**Live → https://baditaflorin.github.io/flowfield/**

Thousands of particles drift along a Perlin noise field and leave ink behind. Every artwork is fully described by its **seed + sliders**, so a piece is reproducible and shareable by link — no server, nothing leaves your device.

## What you can do

- **Seed it** — type any word; the same seed always yields the same field. 🎲 rolls a fresh one.
- **Tune it** — particle count, flow scale, turns, speed, line length, line width, ink opacity, and six palettes.
- **Share it** — every change is written to the URL hash; **🔗 Copy link** hands someone the exact piece.
- **Export it** — **⬇ PNG** for a raster, **⬇ SVG** for crisp vector art that a pen plotter or laser cutter can run.

## How it works

`noise.ts` is a seeded 2D Perlin sampler. `field.ts` turns each noise value into a flow angle and walks particles through it — the live canvas and the SVG exporter share the exact same `simulate()` so the export matches the screen. Everything is deterministic: `seed → mulberry32 → permutation → field → art`.

All logic is pure and unit-tested (`tests/core.test.ts`); the UI in `main.ts` is a thin wiring layer over it.

## Run it locally

```bash
git clone https://github.com/baditaflorin/flowfield
cd flowfield
npm install
npm run dev      # http://127.0.0.1:5173
```

## Build & deploy

GitHub Pages serves the committed `docs/` directory on `main`. No CI — a local smoke gate builds and sanity-checks the output:

```bash
npm run smoke    # vitest + vite build → docs/ + output checks
```

## Privacy

100% client-side. There is no backend, no analytics, no upload. Your seed and settings live only in the URL you choose to share.

## License

MIT — see [LICENSE](./LICENSE).
