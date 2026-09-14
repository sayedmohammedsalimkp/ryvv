"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

type BrandLogoProps = {
  href?: string;
  className?: string;
  priority?: boolean;
  linked?: boolean;
  force?: "light" | "dark";
  /** light = white on dark surfaces. default = blue #0866FF on light, white on dark */
  tone?: "default" | "light" | "dark";
};

export function BrandLogo({
  href = "/",
  className,
  priority,
  linked = true,
  force,
  tone = "default",
}: BrandLogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = (force ?? theme) === "dark";
  const useWhite = tone === "light" || (tone === "default" && isDark);
  // blue logo for light surfaces; white for dark surfaces
  const src = useWhite ? "/brand/ryvv-white.png" : "/brand/ryvv-blue.png";

  const img = (
    <Image
      src={src}
      alt="RYVV"
      width={200}
      height={56}
      priority={priority}
      className={cn("h-8 w-auto object-contain object-left md:h-10", className)}
    />
  );

  if (!linked) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="RYVV home">
      {img}
    </Link>
  );
}
