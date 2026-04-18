import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export function BrandLogo({ className, alt = BRAND_NAME }: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={alt}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}
