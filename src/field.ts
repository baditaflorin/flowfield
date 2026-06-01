// Pure flow-field math + a deterministic polyline simulator. No canvas, no DOM
// — the live renderer and the SVG exporter both build on these functions so
// what you see is exactly what you export.

import type { Noise2D } from "./noise";

export type Vec = { x: number; y: number };

export type FieldOpts = {
  width: number;
  height: number;
  /** Spatial frequency of the noise — smaller = smoother, larger = busier. */
  noiseScale: number;
  /** How many half-turns of angle the [-1,1] noise maps onto. */
  turns: number;
  /** Pixels advanced per step. */
  speed: number;
  /** Steps walked per particle. */
  steps: number;
  /** Number of particles. */
  particles: number;
};

/** Map the noise value at (x, y) to a flow angle in radians. */
export function flowAngle(
  noise: Noise2D,
  x: number,
  y: number,
  scale: number,
  turns: number,
): number {
  return noise(x * scale, y * scale) * Math.PI * turns;
}

/** Advance a point one step along `angle`. */
export function nextPoint(x: number, y: number, angle: number, speed: number): Vec {
  return { x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed };
}

export function inBounds(p: Vec, w: number, h: number): boolean {
  return p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h;
}

export type Polyline = { ci: number; points: Vec[] };

/**
 * Walk `opts.particles` particles through the field for `opts.steps` steps
 * each, returning one polyline per particle (broken where a particle leaves
 * the canvas). Deterministic given (noise, rnd, opts).
 */
export function simulate(noise: Noise2D, rnd: () => number, opts: FieldOpts): Polyline[] {
  const out: Polyline[] = [];
  for (let i = 0; i < opts.particles; i++) {
    let x = rnd() * opts.width;
    let y = rnd() * opts.height;
    const points: Vec[] = [{ x, y }];
    for (let s = 0; s < opts.steps; s++) {
      const a = flowAngle(noise, x, y, opts.noiseScale, opts.turns);
      const np = nextPoint(x, y, a, opts.speed);
      x = np.x;
      y = np.y;
      if (!inBounds(np, opts.width, opts.height)) break;
      points.push(np);
    }
    if (points.length > 1) out.push({ ci: i, points });
  }
  return out;
}
