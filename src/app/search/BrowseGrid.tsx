import Link from "next/link";
import { GenreIcon, genreGradient } from "@/components/media/GenreIcon";
import { GENRES } from "@/lib/genres";

export function BrowseGrid() {
  return (
    <section aria-labelledby="browse-all">
      <h2 id="browse-all" className="mb-4 text-2xl font-bold tracking-tight">
        Browse all
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
        {GENRES.map((g) => (
          <Link
            key={g.slug}
            href={`/genre/${g.slug}`}
            style={{ backgroundImage: genreGradient(g.hue) }}
            className="group relative aspect-[16/9] overflow-hidden rounded-xl p-4 text-lg font-bold tracking-tight text-white outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[16/10] sm:text-xl"
          >
            <span className="relative z-10 line-clamp-2 break-words drop-shadow-sm">{g.name}</span>
            <GenreIcon
              icon={g.icon}
              strokeWidth={1.25}
              className="pointer-events-none absolute -right-3 -bottom-4 size-24 rotate-[22deg] text-white/30 mix-blend-overlay transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[14deg] sm:size-28"
            />
            <GenreIcon
              icon={g.icon}
              strokeWidth={2}
              className="pointer-events-none absolute -right-2 -bottom-3 size-24 rotate-[22deg] text-white/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[14deg] sm:size-28"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 -left-8 size-28 rounded-full bg-white/10 blur-2xl"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
