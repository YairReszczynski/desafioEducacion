const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normaliza magic token de la URL (como FormaCoach /workout/[token]). */
export function normalizeMagicToken(raw: string): string | null {
  try {
    const trimmed = decodeURIComponent(raw.trim());
    const token = trimmed.split(/[?#]/)[0]?.trim() ?? "";
    if (!UUID_RE.test(token)) return null;
    return token.toLowerCase();
  } catch {
    return null;
  }
}

export function isValidMagicToken(raw: string): boolean {
  return normalizeMagicToken(raw) !== null;
}

/** Demo token fijo para pitch ante el jurado */
export const DEMO_STUDENT_TOKEN = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
