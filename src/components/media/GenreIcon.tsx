import {
  Cloud,
  Coffee,
  Disc3,
  Drum,
  Film,
  Flame,
  Globe,
  Guitar,
  Headphones,
  Heart,
  Leaf,
  type LucideIcon,
  Mic2,
  Moon,
  Mountain,
  Music,
  PartyPopper,
  Piano,
  Radio,
  Skull,
  Sparkles,
  Sun,
  Waves,
  Zap,
} from "lucide-react";
import type { GenreDef } from "@/lib/genres";

const ICONS: Record<GenreDef["icon"], LucideIcon> = {
  guitar: Guitar,
  piano: Piano,
  headphones: Headphones,
  mic: Mic2,
  flame: Flame,
  moon: Moon,
  waves: Waves,
  radio: Radio,
  disc: Disc3,
  zap: Zap,
  coffee: Coffee,
  heart: Heart,
  leaf: Leaf,
  globe: Globe,
  skull: Skull,
  party: PartyPopper,
  sun: Sun,
  music: Music,
  film: Film,
  sparkles: Sparkles,
  drum: Drum,
  mountain: Mountain,
  cloud: Cloud,
};

export function GenreIcon({ icon, className, strokeWidth = 1.5 }: { icon: GenreDef["icon"]; className?: string; strokeWidth?: number }) {
  const Icon = ICONS[icon] ?? Music;
  return <Icon aria-hidden className={className} strokeWidth={strokeWidth} />;
}

export const genreGradient = (hue: number) =>
  `linear-gradient(135deg, hsl(${hue} 70% 46%) 0%, hsl(${(hue + 28) % 360} 62% 30%) 100%)`;
