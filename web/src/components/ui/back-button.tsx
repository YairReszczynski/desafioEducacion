"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({
  label = "Atrás",
  href,
  onClick,
}: {
  label?: string;
  href?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="btn btn-ghost !min-h-11 gap-2 border-ink/20 bg-white px-4 shadow-sm"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        if (href) {
          router.push(href);
          return;
        }
        router.back();
      }}
    >
      <ArrowLeft size={18} strokeWidth={2.5} />
      <span className="font-bold">{label}</span>
    </button>
  );
}
