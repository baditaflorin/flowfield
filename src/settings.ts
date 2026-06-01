// The full set of knobs that define an artwork, plus URL-hash (de)serialization
// so a piece can be shared by link and reproduced exactly.

export type Settings = {
  seed: string;
  palette: string;
  particles: number;
  noiseScale: number;
  turns: number;
  speed: number;
  steps: number;
  lineWidth: number;
  alpha: number;
};

export const DEFAULTS: Settings = {
  seed: "flowfield",
  palette: "ember",
  particles: 700,
  noiseScale: 0.0016,
  turns: 3,
  speed: 2,
  steps: 220,
  lineWidth: 1.2,
  alpha: 0.5,
};

export const LIMITS = {
  particles: { min: 50, max: 3000, step: 50 },
  noiseScale: { min: 0.0004, max: 0.006, step: 0.0002 },
  turns: { min: 1, max: 8, step: 0.5 },
  speed: { min: 0.5, max: 6, step: 0.5 },
  steps: { min: 40, max: 600, step: 20 },
  lineWidth: { min: 0.3, max: 4, step: 0.1 },
  alpha: { min: 0.1, max: 1, step: 0.05 },
} as const;

const NUMERIC: Array<keyof Settings> = [
  "particles",
  "noiseScale",
  "turns",
  "speed",
  "steps",
  "lineWidth",
  "alpha",
];

/** Serialize settings into a compact `#k=v&…` URL hash fragment. */
export function encodeSettings(s: Settings): string {
  const p = new URLSearchParams();
  p.set("seed", s.seed);
  p.set("pal", s.palette);
  p.set("n", String(s.particles));
  p.set("sc", String(s.noiseScale));
  p.set("t", String(s.turns));
  p.set("sp", String(s.speed));
  p.set("st", String(s.steps));
  p.set("lw", String(s.lineWidth));
  p.set("a", String(s.alpha));
  return p.toString();
}

const KEY_MAP: Record<string, keyof Settings> = {
  n: "particles",
  sc: "noiseScale",
  t: "turns",
  sp: "speed",
  st: "steps",
  lw: "lineWidth",
  a: "alpha",
};

/** Parse a URL hash fragment back into settings, falling back to DEFAULTS. */
export function decodeSettings(hash: string): Settings {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const p = new URLSearchParams(clean);
  const out: Settings = { ...DEFAULTS };
  if (p.has("seed")) out.seed = p.get("seed")!.slice(0, 64);
  if (p.has("pal")) out.palette = p.get("pal")!.slice(0, 32);
  for (const [short, key] of Object.entries(KEY_MAP)) {
    const raw = p.get(short);
    if (raw === null) continue;
    const num = Number(raw);
    if (Number.isFinite(num) && NUMERIC.includes(key)) {
      (out[key] as number) = num;
    }
  }
  return out;
}
