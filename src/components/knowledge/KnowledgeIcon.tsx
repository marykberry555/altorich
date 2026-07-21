import {
  Compass,
  HelpCircle,
  Megaphone,
  PiggyBank,
  Rocket,
  Scale,
  Shield,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Rocket,
  Compass,
  TrendingUp,
  PiggyBank,
  Shield,
  HelpCircle,
  Megaphone,
  Scale
};

export function KnowledgeIcon({ name, className, size = 24 }: { name: string; className?: string; size?: number }) {
  const Icon = ICONS[name] ?? HelpCircle;
  return <Icon className={className} size={size} aria-hidden />;
}
