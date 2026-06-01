// Curated color palettes for the flow field. Each has a background and a set
// of stroke colors; particles pick a color by index.

export type Palette = {
  id: string;
  name: string;
  bg: string;
  colors: string[];
};

export const PALETTES: Palette[] = [
  {
    id: "ember",
    name: "Ember",
    bg: "#0b0a10",
    colors: ["#ff6b6b", "#ffa94d", "#ffd43b", "#ff8787", "#f06595"],
  },
  {
    id: "tide",
    name: "Tide",
    bg: "#06121a",
    colors: ["#4dd0e1", "#3a86ff", "#80ffdb", "#48bfe3", "#5390d9"],
  },
  {
    id: "bloom",
    name: "Bloom",
    bg: "#120a14",
    colors: ["#f72585", "#b5179e", "#7209b7", "#ff85a1", "#c77dff"],
  },
  {
    id: "moss",
    name: "Moss",
    bg: "#0a1410",
    colors: ["#80b918", "#55a630", "#aacc00", "#2b9348", "#d4d700"],
  },
  {
    id: "mono",
    name: "Mono",
    bg: "#111111",
    colors: ["#f8f9fa", "#ced4da", "#adb5bd", "#868e96", "#e9ecef"],
  },
  {
    id: "dusk",
    name: "Dusk",
    bg: "#0d0b1a",
    colors: ["#ffd60a", "#ff7b00", "#e85d04", "#9d4edd", "#3c096c"],
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

export function colorFor(palette: Palette, index: number): string {
  return palette.colors[index % palette.colors.length]!;
}
