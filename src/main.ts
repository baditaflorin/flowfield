import { makeNoise2D } from "./noise";
import { flowAngle, nextPoint, simulate, type FieldOpts, type Vec } from "./field";
import { hashSeed, mulberry32, randomSeedToken } from "./rng";
import { PALETTES, paletteById, colorFor } from "./palettes";
import { DEFAULTS, LIMITS, decodeSettings, encodeSettings, type Settings } from "./settings";
import { polylinesToSvg } from "./svg";

// ---- DOM helpers ----------------------------------------------------------
function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
}

const canvas = el<HTMLCanvasElement>("canvas");
const ctx = canvas.getContext("2d")!;

let settings: Settings = decodeSettings(location.hash);
let raf = 0;

// ---- live state for the incremental draw ----------------------------------
type Particle = { x: number; y: number; ci: number; alive: boolean; left: number };
let particles: Particle[] = [];
let noise = makeNoise2D(hashSeed(settings.seed));
let dpr = Math.min(2, window.devicePixelRatio || 1);

function cssSize(): { w: number; h: number } {
  const stage = el<HTMLElement>("canvas").parentElement!;
  const r = stage.getBoundingClientRect();
  return { w: Math.max(320, Math.floor(r.width)), h: Math.max(320, Math.floor(r.height)) };
}

function resetCanvas(): void {
  const { w, h } = cssSize();
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pal = paletteById(settings.palette);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);
}

function spawn(): void {
  const { w, h } = cssSize();
  const rnd = mulberry32(hashSeed(settings.seed) ^ 0x9e3779b9);
  particles = [];
  for (let i = 0; i < settings.particles; i++) {
    particles.push({ x: rnd() * w, y: rnd() * h, ci: i, alive: true, left: settings.steps });
  }
}

function render(): void {
  cancelAnimationFrame(raf);
  noise = makeNoise2D(hashSeed(settings.seed));
  resetCanvas();
  spawn();
  const pal = paletteById(settings.palette);
  const { w, h } = cssSize();
  ctx.lineWidth = settings.lineWidth;
  ctx.lineCap = "round";
  ctx.globalAlpha = settings.alpha;

  const stepsPerFrame = 4;
  const tick = (): void => {
    let anyAlive = false;
    for (let f = 0; f < stepsPerFrame; f++) {
      for (const p of particles) {
        if (!p.alive) continue;
        anyAlive = true;
        const a = flowAngle(noise, p.x, p.y, settings.noiseScale, settings.turns);
        const np: Vec = nextPoint(p.x, p.y, a, settings.speed);
        ctx.strokeStyle = colorFor(pal, p.ci);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(np.x, np.y);
        ctx.stroke();
        p.x = np.x;
        p.y = np.y;
        p.left -= 1;
        if (p.left <= 0 || np.x < 0 || np.x > w || np.y < 0 || np.y > h) p.alive = false;
      }
    }
    if (anyAlive) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

// ---- controls wiring ------------------------------------------------------
function fmtVal(key: keyof Settings, v: number): string {
  if (key === "noiseScale") return v.toFixed(4);
  if (key === "turns" || key === "lineWidth" || key === "alpha" || key === "speed")
    return v.toFixed(1);
  return String(v);
}

const RANGE_KEYS: Array<keyof typeof LIMITS> = [
  "particles",
  "noiseScale",
  "turns",
  "speed",
  "steps",
  "lineWidth",
  "alpha",
];

function syncControlsFromSettings(): void {
  el<HTMLInputElement>("seed").value = settings.seed;
  const sel = el<HTMLSelectElement>("palette");
  sel.value = settings.palette;
  for (const key of RANGE_KEYS) {
    const input = el<HTMLInputElement>(key);
    const lim = LIMITS[key];
    input.min = String(lim.min);
    input.max = String(lim.max);
    input.step = String(lim.step);
    input.value = String(settings[key]);
    el<HTMLOutputElement>(`${key}-out`).textContent = fmtVal(key, settings[key] as number);
  }
}

function updateHash(): void {
  history.replaceState(null, "", `#${encodeSettings(settings)}`);
}

function toast(msg: string): void {
  const t = el<HTMLElement>("toast");
  t.textContent = msg;
  t.classList.add("show");
  window.setTimeout(() => t.classList.remove("show"), 1600);
}

function download(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function wire(): void {
  // Populate palette dropdown.
  const sel = el<HTMLSelectElement>("palette");
  for (const p of PALETTES) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  }

  syncControlsFromSettings();

  el<HTMLInputElement>("seed").addEventListener("change", (e) => {
    settings.seed = (e.target as HTMLInputElement).value || DEFAULTS.seed;
    updateHash();
    render();
  });
  sel.addEventListener("change", (e) => {
    settings.palette = (e.target as HTMLSelectElement).value;
    updateHash();
    render();
  });
  for (const key of RANGE_KEYS) {
    el<HTMLInputElement>(key).addEventListener("input", (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      (settings[key] as number) = v;
      el<HTMLOutputElement>(`${key}-out`).textContent = fmtVal(key, v);
      updateHash();
      render();
    });
  }

  el("random").addEventListener("click", () => {
    settings.seed = randomSeedToken();
    syncControlsFromSettings();
    updateHash();
    render();
  });
  el("replay").addEventListener("click", () => render());

  el("png").addEventListener("click", () => {
    canvas.toBlob((blob) => {
      if (blob) download(`flowfield-${settings.seed}.png`, blob);
    }, "image/png");
  });

  el("svg").addEventListener("click", () => {
    const { w, h } = cssSize();
    const opts: FieldOpts = {
      width: w,
      height: h,
      noiseScale: settings.noiseScale,
      turns: settings.turns,
      speed: settings.speed,
      steps: settings.steps,
      particles: Math.min(settings.particles, 1200),
    };
    const lines = simulate(
      makeNoise2D(hashSeed(settings.seed)),
      mulberry32(hashSeed(settings.seed) ^ 0x9e3779b9),
      opts,
    );
    const svg = polylinesToSvg(lines, paletteById(settings.palette), {
      width: w,
      height: h,
      lineWidth: settings.lineWidth,
      alpha: settings.alpha,
    });
    download(`flowfield-${settings.seed}.svg`, new Blob([svg], { type: "image/svg+xml" }));
  });

  el("share").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#${encodeSettings(settings)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied — same art, anywhere");
    } catch {
      toast(url);
    }
  });

  // Panel show/hide (mobile).
  el("toggle-panel").addEventListener("click", () => el("panel").classList.add("hidden"));
  el("show-panel").addEventListener("click", () => el("panel").classList.remove("hidden"));

  el<HTMLElement>("version").textContent = `v${__APP_VERSION__} · ${__GIT_COMMIT__}`;

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(render, 200);
  });
}

wire();
updateHash();
render();
