import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
      fill="none"
    >
      <defs>
        <linearGradient id="resonance-logo-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#52f2bb" />
          <stop offset="1" stopColor="#1fb6d6" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="16" r="3" fill="url(#resonance-logo-g)" />
      <path d="M14.5 10.5a7.6 7.6 0 0 1 0 11" stroke="url(#resonance-logo-g)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19.5 7a12.6 12.6 0 0 1 0 18" stroke="url(#resonance-logo-g)" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
      <path d="M24.5 3.6a17.4 17.4 0 0 1 0 24.8" stroke="url(#resonance-logo-g)" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showWordmark && <span className="text-lg font-bold tracking-tight text-white">Resonance</span>}
    </span>
  );
}
