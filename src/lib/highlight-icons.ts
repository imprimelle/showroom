import {
  Award,
  BadgeCheck,
  Clock,
  Droplets,
  Factory,
  Flame,
  Heart,
  Layers,
  Leaf,
  Lightbulb,
  Palette,
  Recycle,
  Ruler,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Définition d'une icône de point fort (clé + libellé FR + composant). */
export interface HighlightIconDef {
  key: string;
  label: string;
  Icon: LucideIcon;
}

/** Catalogue des icônes sélectionnables pour les points forts (admin). */
export const HIGHLIGHT_ICONS: HighlightIconDef[] = [
  { key: "zap", label: "Éclairage / LED", Icon: Zap },
  { key: "sun", label: "Lumière", Icon: Sun },
  { key: "palette", label: "Couleur / design", Icon: Palette },
  { key: "sparkles", label: "Esthétique", Icon: Sparkles },
  { key: "layers", label: "Matériaux / structure", Icon: Layers },
  { key: "ruler", label: "Sur-mesure", Icon: Ruler },
  { key: "shield", label: "Garantie", Icon: Shield },
  { key: "shield-check", label: "Qualité certifiée", Icon: ShieldCheck },
  { key: "droplets", label: "Étanche", Icon: Droplets },
  { key: "leaf", label: "Éco-responsable", Icon: Leaf },
  { key: "factory", label: "Fabrication locale", Icon: Factory },
  { key: "wrench", label: "Service / installation", Icon: Wrench },
  { key: "truck", label: "Livraison", Icon: Truck },
  { key: "clock", label: "Délai rapide", Icon: Clock },
  { key: "heart", label: "Confort", Icon: Heart },
  { key: "star", label: "Qualité", Icon: Star },
  { key: "flame", label: "Résistance", Icon: Flame },
  { key: "badge-check", label: "Certifié", Icon: BadgeCheck },
  { key: "award", label: "Récompense", Icon: Award },
  { key: "lightbulb", label: "Innovation", Icon: Lightbulb },
  { key: "recycle", label: "Recyclable", Icon: Recycle },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  HIGHLIGHT_ICONS.map((d) => [d.key, d.Icon])
);

/** Résout la clé d'icône vers le composant lucide (repli sur `Sparkles`). */
export function getHighlightIcon(key?: string): LucideIcon {
  return (key && ICON_MAP[key]) || Sparkles;
}
