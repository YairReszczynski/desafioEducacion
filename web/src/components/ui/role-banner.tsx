import { cn } from "@/lib/utils";

export function RoleBanner({
  role,
  title,
  subtitle,
}: {
  role: "alumno" | "equipo";
  title: string;
  subtitle: string;
}) {
  const isAlumno = role === "alumno";
  return (
    <div
      className={cn(
        "mb-4 border px-3 py-2",
        isAlumno
          ? "border-coral/40 bg-[#fdf2f4]"
          : "border-puente/40 bg-[#f8ecee]"
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.16em]",
          isAlumno ? "text-coral" : "text-puente"
        )}
      >
        {isAlumno ? "Vista alumno" : "Vista equipo Fundación Puente"}
      </p>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-xs text-muted">{subtitle}</p>
    </div>
  );
}
