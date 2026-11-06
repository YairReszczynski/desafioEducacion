import type { AlertLevel, GlassBoxSummary, Student } from "@/lib/types";

const KEY = "puente-checkin-history";

/** Registro histórico de un check-in (cada grabación / sesión compartida). */
export type HistoryEntry = {
  id: string;
  token: string;
  at: string;
  studentName: string;
  firstName: string;
  career: string;
  transcript: string;
  alertLevel: AlertLevel;
  pillars: Student["pillars"];
  minutes?: number;
  energy?: number;
  requestedSupport?: string | null;
  victory?: string;
  headache?: string;
  tutorBrief: string;
  proposedShare: string;
  source: "checkin" | "papel";
};

function loadAll(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveAll(list: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

function bump() {
  try {
    window.dispatchEvent(new CustomEvent("puente-history"));
  } catch {
    /* ignore */
  }
}

/** Agrega un registro al historial (no reemplaza: acumula semanas). */
export function appendHistoryEntry(
  input: {
    token: string;
    student: Student;
    transcript: string;
    glass: GlassBoxSummary;
    pillars: Student["pillars"];
    minutes?: number;
    energy?: number;
    requestedSupport?: string | null;
    source?: "checkin" | "papel";
  },
  opts?: { id?: string }
): HistoryEntry {
  const entry: HistoryEntry = {
    id: opts?.id || `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    token: input.token,
    at: new Date().toISOString(),
    studentName: input.student.name,
    firstName: input.student.firstName,
    career: input.student.career,
    transcript: input.transcript.trim(),
    alertLevel: input.glass.alertLevel,
    pillars: input.pillars,
    minutes: input.minutes,
    energy: input.energy,
    requestedSupport: input.requestedSupport ?? null,
    victory: input.glass.victory,
    headache: input.glass.headache,
    tutorBrief: input.glass.tutorBrief,
    proposedShare: input.glass.proposedShare,
    source: input.source || "checkin",
  };
  saveAll([entry, ...loadAll()]);
  bump();
  return entry;
}

/** Actualiza el pedido de apoyo en el registro más reciente de ese token. */
export function patchLatestHistorySupport(
  token: string,
  requestedSupport: string
): void {
  const list = loadAll();
  const idx = list.findIndex((e) => e.token === token);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx]!,
    requestedSupport,
  };
  saveAll(list);
  bump();
}

export function getHistoryForToken(token: string): HistoryEntry[] {
  return loadAll()
    .filter((e) => e.token === token)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export function loadHistory(): HistoryEntry[] {
  return loadAll().sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

/** Agrupa por alumno (token) con el último check-in primero. */
export function loadHistoryByStudent(): {
  token: string;
  studentName: string;
  career: string;
  count: number;
  latest: HistoryEntry;
  entries: HistoryEntry[];
}[] {
  const map = new Map<string, HistoryEntry[]>();
  for (const e of loadAll()) {
    const arr = map.get(e.token) || [];
    arr.push(e);
    map.set(e.token, arr);
  }
  return Array.from(map.entries())
    .map(([token, entries]) => {
      const sorted = entries.sort((a, b) => +new Date(b.at) - +new Date(a.at));
      const latest = sorted[0]!;
      return {
        token,
        studentName: latest.studentName,
        career: latest.career,
        count: sorted.length,
        latest,
        entries: sorted,
      };
    })
    .sort((a, b) => +new Date(b.latest.at) - +new Date(a.latest.at));
}

export function clearHistory(): void {
  saveAll([]);
  bump();
}
