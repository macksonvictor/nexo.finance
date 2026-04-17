import {
  BriefcaseBusiness,
  House,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Caixa } from "@/types/finance";

interface CategoryIconProps {
  category: Caixa["category"];
  className?: string;
  strokeWidth?: number;
}

const CATEGORY_ICON_MAP = {
  essencial: House,
  investimento: TrendingUp,
  lazer: Sparkles,
  reserva: Shield,
  outro: BriefcaseBusiness,
} satisfies Record<Caixa["category"], React.ComponentType<{ className?: string; strokeWidth?: number }>>;

export function CategoryIcon({
  category,
  className,
  strokeWidth = 1.9,
}: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[category];

  return <Icon className={cn("h-4 w-4", className)} strokeWidth={strokeWidth} />;
}
