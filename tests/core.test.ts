import { describe, expect, it } from "vitest";
import { mulberry32, hashSeed, clamp, randomSeedToken } from "../src/rng";
import { makeNoise2D } from "../src/noise";
import { flowAngle, nextPoint, inBounds, simulate, type FieldOpts } from "../src/field";
import { decodeSettings, encodeSettings, DEFAULTS } from "../src/settings";
import { polylinesToSvg } from "../src/svg";
import { paletteById, PALETTES, colorFor } from "../src/palettes";

describe("rng", () => {
  it("mulberry32 is deterministic and in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("hashSeed is stable and distinguishes strings", () => {
    expect(hashSeed("flowfield")).toBe(hashSeed("flowfield"));
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });

  it("clamp bounds values", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it("randomSeedToken is 6 lowercase-alnum chars", () => {
    const rnd = mulberry32(1);
    expect(randomSeedToken(rnd)).toMatch(/^[a-z0-9]{6}$/);
  });
});

describe("noise", () => {
  it("is deterministic for a seed", () => {
    const n1 = makeNoise2D(7);
    const n2 = makeNoise2D(7);
    expect(n1(1.5, 2.5)).toBe(n2(1.5, 2.5));
  });

  it("differs across seeds", () => {
    expect(makeNoise2D(1)(3.3, 4.4)).not.toBe(makeNoise2D(2)(3.3, 4.4));
  });

  it("stays within the Perlin range", () => {
    const n = makeNoise2D(99);
    for (let i = 0; i < 500; i++) {
      const v = n(i * 0.37, i * 0.91);
      expect(Math.abs(v)).toBeLessThanOrEqual(1.2);
    }
  });
});

describe("field", () => {
  it("flowAngle maps noise deterministically", () => {
    const n = makeNoise2D(5);
    expect(flowAngle(n, 10, 20, 0.01, 3)).toBe(flowAngle(n, 10, 20, 0.01, 3));
  });

  it("nextPoint moves along the angle", () => {
    const p = nextPoint(0, 0, 0, 2);
    expect(p.x).toBeCloseTo(2);
    expect(p.y).toBeCloseTo(0);
    const q = nextPoint(0, 0, Math.PI / 2, 2);
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(2);
  });

  it("inBounds detects edges", () => {
    expect(inBounds({ x: 5, y: 5 }, 10, 10)).toBe(true);
    expect(inBounds({ x: -1, y: 5 }, 10, 10)).toBe(false);
    expect(inBounds({ x: 5, y: 11 }, 10, 10)).toBe(false);
  });

  it("simulate is deterministic and bounded by particle count", () => {
    const opts: FieldOpts = {
      width: 200,
      height: 200,
      noiseScale: 0.01,
      turns: 3,
      speed: 2,
      steps: 50,
      particles: 30,
    };
    const run = () => simulate(makeNoise2D(3), mulberry32(3), opts);
    const a = run();
    const b = run();
    expect(a.length).toBe(b.length);
    expect(a.length).toBeLessThanOrEqual(30);
    expect(a.length).toBeGreaterThan(0);
    for (const line of a) expect(line.points.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("settings", () => {
  it("round-trips through encode/decode", () => {
    const s = { ...DEFAULTS, seed: "abc", particles: 1234, turns: 4.5 };
    const decoded = decodeSettings("#" + encodeSettings(s));
    expect(decoded.seed).toBe("abc");
    expect(decoded.particles).toBe(1234);
    expect(decoded.turns).toBe(4.5);
  });

  it("falls back to defaults on garbage", () => {
    const d = decodeSettings("#total=garbage&n=notanumber");
    expect(d.seed).toBe(DEFAULTS.seed);
    expect(d.particles).toBe(DEFAULTS.particles);
  });

  it("ignores empty hash", () => {
    expect(decodeSettings("").seed).toBe(DEFAULTS.seed);
  });
});

describe("svg export", () => {
  it("emits an svg with a background and paths", () => {
    const opts: FieldOpts = {
      width: 100,
      height: 100,
      noiseScale: 0.02,
      turns: 2,
      speed: 2,
      steps: 30,
      particles: 10,
    };
    const lines = simulate(makeNoise2D(11), mulberry32(11), opts);
    const svg = polylinesToSvg(lines, paletteById("ember"), {
      width: 100,
      height: 100,
      lineWidth: 1,
      alpha: 0.5,
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
    expect(svg).toContain("<path");
    expect(svg).toContain("stroke=");
  });
});

describe("palettes", () => {
  it("resolves by id and falls back", () => {
    expect(paletteById("tide").id).toBe("tide");
    expect(paletteById("nope").id).toBe(PALETTES[0]!.id);
  });
  it("cycles colors by index", () => {
    const p = paletteById("ember");
    expect(colorFor(p, 0)).toBe(colorFor(p, p.colors.length));
  });
});
