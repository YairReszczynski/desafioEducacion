import type { Student, YearLevel } from "@/lib/types";

const KEY = "puente-invited-students";

export type InviteDraft = {
  firstName: string;
  lastName: string;
  career: string;
  institution: string;
  year: YearLevel;
  works: boolean;
  jornada: "diurna" | "vespertina";
};

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function loadInvited(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Student[];
  } catch {
    return [];
  }
}

export function saveInvited(list: Student[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)));
}

export function createInvitedStudent(draft: InviteDraft): Student {
  const token = uuid();
  const student: Student = {
    id: `inv-${token.slice(0, 8)}`,
    token,
    name: `${draft.firstName} ${draft.lastName}`.trim(),
    firstName: draft.firstName.trim(),
    career: draft.career,
    institution: draft.institution,
    year: draft.year,
    yearInPuente: Math.min(draft.year, 1),
    jornada: draft.jornada,
    works: draft.works,
    tutor: "Matías · Trabajo Social",
    city: "Santiago",
    alertLevel: "baja",
    signals: [],
    pillars: { academico: 5, psicologico: 5, trabajo: 5 },
    lastCheckInDaysAgo: null,
    missedMeetings: 0,
    unansweredMessages: 0,
    quote: "Nuevo link perpetuo · aún sin check-in",
    suggestedAction: "Esperar primer check-in semanal con consentimiento",
    midYearRisk: draft.year <= 2,
  };
  const list = [student, ...loadInvited()];
  saveInvited(list);
  return student;
}

export function findInvitedByToken(token: string): Student | undefined {
  return loadInvited().find((s) => s.token === token);
}

export function deleteInvitedByToken(token: string): Student[] {
  const next = loadInvited().filter((s) => s.token !== token);
  saveInvited(next);
  return next;
}

export function clearAllInvited(): void {
  saveInvited([]);
}

export function perpetualUrl(token: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base}/p/${token}`;
}
