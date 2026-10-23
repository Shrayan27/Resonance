import type { ReactNode } from "react";
import { Artwork } from "./Artwork";
import { cn } from "@/lib/utils";

function hueOf(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

interface PageHeaderProps {
  type: string;
  title: ReactNode;
  /** Used to derive the banner color; defaults to `title` when it is a string. */
  seed?: string;
  image?: string;
  /** Circular artwork (artists). */
  round?: boolean;
  /** Use the artwork as a blurred full-bleed banner backdrop. */
  backdrop?: boolean;
  description?: string;
  meta?: ReactNode;
  /** Replaces the artwork with a custom visual (e.g. liked-songs gradient). */
  cover?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  type,
  title,
  seed,
  image,
  round,
  backdrop,
  description,
  meta,
  cover,
  children,
  className,
}: PageHeaderProps) {
  const hue = hueOf(seed ?? (typeof title === "string" ? title : type));
  return (
    <header className={cn("relative isolate overflow-hidden rounded-xl", className)}>
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(180deg, hsl(${hue} 48% 30%) 0%, hsl(${hue} 30% 14%) 70%, hsl(${hue} 20% 9%) 100%)`,
        }}
      />
      {backdrop && image && (
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative remote backdrop */}
          <img src={image} alt="" referrerPolicy="no-referrer" className="size-full scale-110 object-cover opacity-50 blur-2xl" />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/30 to-black/70" />
        </div>
      )}
      <div className="flex flex-col items-center gap-4 px-4 pt-6 pb-4 sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:pt-12 sm:pb-6">
        {cover ?? (
          <Artwork
            src={image}
            alt=""
            round={round}
            fallback={round ? "artist" : "track"}
            priority
            className={cn(
              "w-32 shadow-2xl shadow-black/60 sm:w-48 lg:w-56 shrink-0",
              round ? "rounded-full" : "rounded-lg",
            )}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <span className="text-[11px] font-semibold tracking-wider uppercase sm:text-xs">{type}</span>
          <h1 className="max-w-full text-2xl font-black leading-tight tracking-tight text-balance break-words sm:text-4xl md:text-5xl lg:text-7xl">
            {title}
          </h1>
          {description && (
            <p className="line-clamp-2 max-w-2xl text-xs text-white/70 sm:text-sm">{description}</p>
          )}
          {meta && <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-xs text-white/80 sm:justify-start sm:text-sm">{meta}</div>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3 bg-black/20 px-4 py-3 sm:gap-4 sm:px-8 sm:py-4">{children}</div>}
    </header>
  );
}
