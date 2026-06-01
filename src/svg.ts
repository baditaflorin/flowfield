// Render simulated polylines to a standalone SVG document string. Pure — takes
// the same polylines the canvas draws and emits print/plotter-ready vector art.

import type { Polyline } from "./field";
import { colorFor, type Palette } from "./palettes";

function fmt(n: number): string {
  return Math.round(n * 100) / 100 + "";
}

export type SvgOpts = {
  width: number;
  height: number;
  lineWidth: number;
  alpha: number;
};

export function polylinesToSvg(lines: Polyline[], palette: Palette, opts: SvgOpts): string {
  const paths: string[] = [];
  for (const line of lines) {
    if (line.points.length < 2) continue;
    const d =
      "M" + line.points.map((p, i) => `${i === 0 ? "" : "L"}${fmt(p.x)} ${fmt(p.y)}`).join(" ");
    const color = colorFor(palette, line.ci);
    paths.push(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${fmt(
        opts.lineWidth,
      )}" stroke-opacity="${fmt(opts.alpha)}" stroke-linecap="round"/>`,
    );
  }
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}" viewBox="0 0 ${opts.width} ${opts.height}">`,
    `<rect width="100%" height="100%" fill="${palette.bg}"/>`,
    ...paths,
    `</svg>`,
  ].join("\n");
}
