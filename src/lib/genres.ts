export interface GenreDef {
  /** Exact genre name understood by the catalog API. */
  name: string;
  slug: string;
  hue: number;
  icon:
    | "guitar"
    | "piano"
    | "headphones"
    | "mic"
    | "flame"
    | "moon"
    | "waves"
    | "radio"
    | "disc"
    | "zap"
    | "coffee"
    | "heart"
    | "leaf"
    | "globe"
    | "skull"
    | "party"
    | "sun"
    | "music"
    | "film"
    | "sparkles"
    | "drum"
    | "mountain"
    | "cloud";
}

export const GENRES: GenreDef[] = [
  { name: "Electronic", slug: "electronic", hue: 262, icon: "zap" },
  { name: "Hip-Hop/Rap", slug: "hip-hop", hue: 28, icon: "mic" },
  { name: "Lo-Fi", slug: "lo-fi", hue: 172, icon: "coffee" },
  { name: "Pop", slug: "pop", hue: 330, icon: "sparkles" },
  { name: "Rock", slug: "rock", hue: 8, icon: "guitar" },
  { name: "Jazz", slug: "jazz", hue: 42, icon: "piano" },
  { name: "Ambient", slug: "ambient", hue: 205, icon: "cloud" },
  { name: "R&B/Soul", slug: "rnb-soul", hue: 290, icon: "heart" },
  { name: "Classical", slug: "classical", hue: 225, icon: "piano" },
  { name: "House", slug: "house", hue: 240, icon: "disc" },
  { name: "Techno", slug: "techno", hue: 195, icon: "radio" },
  { name: "Drum & Bass", slug: "drum-and-bass", hue: 150, icon: "drum" },
  { name: "Trap", slug: "trap", hue: 350, icon: "flame" },
  { name: "Dubstep", slug: "dubstep", hue: 280, icon: "waves" },
  { name: "Trance", slug: "trance", hue: 255, icon: "sparkles" },
  { name: "Disco", slug: "disco", hue: 312, icon: "party" },
  { name: "Funk", slug: "funk", hue: 36, icon: "headphones" },
  { name: "Blues", slug: "blues", hue: 218, icon: "guitar" },
  { name: "Country", slug: "country", hue: 24, icon: "sun" },
  { name: "Folk", slug: "folk", hue: 95, icon: "leaf" },
  { name: "Acoustic", slug: "acoustic", hue: 80, icon: "guitar" },
  { name: "Alternative", slug: "alternative", hue: 180, icon: "headphones" },
  { name: "Punk", slug: "punk", hue: 0, icon: "zap" },
  { name: "Metal", slug: "metal", hue: 350, icon: "skull" },
  { name: "Latin", slug: "latin", hue: 18, icon: "party" },
  { name: "Reggae", slug: "reggae", hue: 125, icon: "sun" },
  { name: "World", slug: "world", hue: 160, icon: "globe" },
  { name: "Soundtrack", slug: "soundtrack", hue: 210, icon: "film" },
  { name: "Experimental", slug: "experimental", hue: 300, icon: "mountain" },
  { name: "Hyperpop", slug: "hyperpop", hue: 320, icon: "sparkles" },
];

export const HOME_GENRES = GENRES.slice(0, 14);

export const genreBySlug = (slug: string) => GENRES.find((g) => g.slug === slug);
export const genreHref = (name: string) => {
  const g = GENRES.find((x) => x.name === name);
  return g ? `/genre/${g.slug}` : `/search?q=${encodeURIComponent(name)}`;
};
