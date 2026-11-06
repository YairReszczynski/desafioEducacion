/** Cookie / storage: modo equipo (pitch, diapos, radar completo). */
export const EQUIPO_COOKIE = "puente_equipo";
export const EQUIPO_STORAGE = "puente-equipo";

/** PIN simple para desbloquear herramientas del equipo en el evento. */
export const EQUIPO_PIN =
  process.env.NEXT_PUBLIC_EQUIPO_PIN?.trim() || "puente2026";

/** Rutas solo para el equipo (jurado no debería verlas). */
export const EQUIPO_ONLY_PATHS = [
  "/slides",
  "/pitch",
  "/etica",
  "/invitar",
  "/dashboard",
  "/qr",
] as const;

export function isEquipoOnlyPath(pathname: string): boolean {
  return EQUIPO_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function readEquipoFromDocument(): boolean {
  if (typeof document === "undefined") return false;
  try {
    if (localStorage.getItem(EQUIPO_STORAGE) === "1") return true;
  } catch {
    /* ignore */
  }
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${EQUIPO_COOKIE}=1`));
}

export function unlockEquipoClient(): void {
  const maxAge = 60 * 60 * 24 * 7; // 7 días
  document.cookie = `${EQUIPO_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  try {
    localStorage.setItem(EQUIPO_STORAGE, "1");
  } catch {
    /* ignore */
  }
}

export function lockEquipoClient(): void {
  document.cookie = `${EQUIPO_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  try {
    localStorage.removeItem(EQUIPO_STORAGE);
  } catch {
    /* ignore */
  }
}
