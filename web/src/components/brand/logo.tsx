import { cn } from "@/lib/utils";
import Image from "next/image";

type Variant = "color" | "light" | "mark";

const SRC: Record<Exclude<Variant, "mark">, string> = {
  color: "/brand/logo-color.png",
  light: "/brand/logo-on-white.png",
};

export function PuenteLogo({
  variant = "light",
  className,
  priority = false,
}: {
  variant?: Variant;
  className?: string;
  priority?: boolean;
}) {
  if (variant === "mark") {
    return (
      <Image
        src="/brand/logo-color.png"
        alt="Fundación Puente — la educación supera la pobreza"
        width={152}
        height={86}
        priority={priority}
        className={cn("h-12 w-auto object-contain", className)}
      />
    );
  }

  return (
    <Image
      src={SRC[variant]}
      alt="Fundación Puente — la educación supera la pobreza"
      width={variant === "color" ? 220 : 200}
      height={variant === "color" ? 124 : 112}
      priority={priority}
      className={cn(
        "h-auto w-auto object-contain",
        variant === "color" ? "h-14 sm:h-16" : "h-12 sm:h-14",
        className
      )}
    />
  );
}

/** Compat: mark compacto para headers densos */
export function PuenteMark({ className }: { className?: string }) {
  return <PuenteLogo variant="mark" className={className} />;
}

export function PuenteWordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <PuenteLogo variant={inverted ? "color" : "light"} className="h-11 sm:h-12" />
  );
}
