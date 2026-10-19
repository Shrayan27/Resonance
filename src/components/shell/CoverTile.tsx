import { Heart, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CoverTile({
  src,
  kind = "playlist",
  className,
}: {
  src?: string;
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
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
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
