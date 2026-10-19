import Link from "next/link";

const CATEGORIES: { name: string; hue: number }[] = [
  { name: "Hip-Hop/Rap", hue: 28 },
  { name: "Electronic", hue: 262 },
  { name: "Lo-Fi", hue: 172 },
  { name: "Chill", hue: 198 },
  { name: "Ambient", hue: 215 },
  { name: "Pop", hue: 330 },
  { name: "Rock", hue: 8 },
  { name: "Jazz", hue: 42 },
  { name: "R&B", hue: 290 },
  { name: "Dance", hue: 310 },
  { name: "House", hue: 240 },
  { name: "Drum & Bass", hue: 150 },
  { name: "Acoustic", hue: 95 },
  { name: "Metal", hue: 0 },
  { name: "Latin", hue: 18 },
  { name: "Reggae", hue: 120 },
  { name: "Focus", hue: 185 },
  { name: "Workout", hue: 350 },
  { name: "Party", hue: 50 },
  { name: "Sleep", hue: 230 },
];

export function BrowseGrid() {
  return (
    <section aria-labelledby="browse-all">
      <h2 id="browse-all" className="mb-4 text-2xl font-bold tracking-tight">
        Browse all
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
        {CATEGORIES.map(({ name, hue }) => (
          <Link
            key={name}
            href={`/search?q=${encodeURIComponent(name)}`}
            style={{ backgroundColor: `hsl(${hue} 55% 34%)` }}
            className="group relative aspect-[16/9] overflow-hidden rounded-lg p-4 text-lg font-bold tracking-tight outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[16/10] sm:text-xl"
          >
            <span className="relative z-10 line-clamp-2 break-words">{name}</span>
            <span
              aria-hidden
              style={{ backgroundColor: `hsl(${hue} 60% 46%)` }}
              className="absolute -right-4 -bottom-3 size-20 rotate-[25deg] rounded-md shadow-xl shadow-black/40 transition-transform group-hover:rotate-[20deg] group-hover:scale-105 sm:size-24"
            />
            <span
              aria-hidden
              style={{ backgroundColor: `hsl(${hue} 45% 26%)` }}
              className="absolute right-6 -bottom-8 size-14 rotate-[-12deg] rounded-full opacity-70"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
