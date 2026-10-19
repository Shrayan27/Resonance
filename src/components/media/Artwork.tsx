"use client";

import { useState } from "react";
import { Music2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtworkProps {
  src?: string;
  alt?: string;
  round?: boolean;
  fallback?: "track" | "artist";
  className?: string;
  priority?: boolean;
}

/** Remote artwork with a neutral placeholder and a graceful fallback on load errors. */
export function Artwork({ src, alt = "", round, fallback = "track", className, priority }: ArtworkProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const broken = !src || failed === src;
  const Icon = fallback === "artist" ? User : Music2;

  return (
    <div
      className={cn(
        "relative aspect-square shrink-0 overflow-hidden bg-neutral-800",
        round ? "rounded-full" : "rounded-md",
        className,
      )}
    >
      {broken ? (
        <div className="absolute inset-0 grid place-items-center text-neutral-500">
          <Icon className="size-1/3" aria-hidden />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote catalog hosts vary; next/image would need an allow-list
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}
