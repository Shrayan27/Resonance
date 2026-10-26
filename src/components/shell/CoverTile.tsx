import { Heart, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CoverTile({
  src,
  images,
  kind = "playlist",
  className,
}: {
  src?: string;
  images?: string[];
  kind?: "playlist" | "liked";
  className?: string;
}) {
  if (kind === "liked") {
    return (
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-md bg-linear-to-br from-violet-600 via-indigo-500 to-sky-300 text-white",
          className,
        )}
      >
        <Heart className="size-1/2 fill-current" />
      </div>
    );
  }

  // 4-grid mosaic if 4 or more distinct images are available
  const distinctImages = images ? Array.from(new Set(images.filter(Boolean))).slice(0, 4) : [];
  if (distinctImages.length >= 4) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 grid-rows-2 size-12 shrink-0 overflow-hidden rounded-md bg-neutral-800",
          className,
        )}
      >
        {distinctImages.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ))}
      </div>
    );
  }

  const singleSrc = src || distinctImages[0];
  if (singleSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={singleSrc}
        alt=""
        loading="lazy"
        className={cn("size-12 shrink-0 rounded-md bg-elevated object-cover", className)}
      />
    );
  }
  return (
    <div className={cn("grid size-12 shrink-0 place-items-center rounded-md bg-elevated text-subtle", className)}>
      <Music2 className="size-1/2" />
    </div>
  );
}
