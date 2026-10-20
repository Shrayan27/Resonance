import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Resonance mark: a glowing core with three sound rings radiating from it,
 * set on a rounded gradient tile. Colors follow the active accent theme.
 */
export function LogoMark({ className, tile = true }: { className?: string; tile?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn("size-9 shrink-0", className)} fill="none">
      <defs>
        <linearGradient id={`${id}-bg`} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-strong, #52f2bb)" />
          <stop offset="0.55" stopColor="var(--brand, #2ee6a6)" />
          <stop offset="1" stopColor="var(--brand-2, #1fb6d6)" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="0.35" cy="0.3" r="0.9">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.82" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {tile && <rect width="48" height="48" rx="13" fill={`url(#${id}-bg)`} />}
      {tile && <path d="M0 14C0 6.3 6.3 0 14 0h20c7.7 0 14 6.3 14 14v2C34 13 14 22 0 18V14Z" fill="#fff" opacity="0.16" />}
      <circle cx="17" cy="24" r="9" fill={`url(#${id}-glow)`} />
      <circle cx="17" cy="24" r="4.6" fill={`url(#${id}-core)`} />
      <path d="M24.2 17.2a9.6 9.6 0 0 1 0 13.6" stroke={tile ? "#fff" : `url(#${id}-bg)`} strokeWidth="3" strokeLinecap="round" />
      <path d="M29.8 12.4a17 17 0 0 1 0 23.2" stroke={tile ? "#fff" : `url(#${id}-bg)`} strokeWidth="3" strokeLinecap="round" opacity="0.72" />
      <path d="M35.6 7.8a24.4 24.4 0 0 1 0 32.4" stroke={tile ? "#fff" : `url(#${id}-bg)`} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="bg-linear-to-r from-white via-white to-brand-strong bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
          Resonance
        </span>
      )}
    </span>
  );
}
