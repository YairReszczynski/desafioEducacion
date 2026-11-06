export type YearLevel = 1 | 2 | 3 | 4 | 5;
export type AlertLevel = "baja" | "media" | "alta" | "crisis";
export type Pillar = "academico" | "psicologico" | "trabajo";

export type SilentSignal =
  | "sin_whatsapp"
  | "falta_reunion"
  | "sobrecarga_laboral"
  | "sobrecarga_academica"
  | "nucleo_familiar"
  | "checkin_atrasado";

export interface Student {
  id: string;
  token: string;
  name: string;
  firstName: string;
  career: string;
  institution: string;
  year: YearLevel;
  yearInPuente: number;
  jornada: "diurna" | "vespertina";
  works: boolean;
  tutor: string;
  city: string;
  alertLevel: AlertLevel;
  signals: SilentSignal[];
  pillars: {
    academico: number;
    psicologico: number;
    trabajo: number;
  };
  lastCheckInDaysAgo: number | null;
  missedMeetings: number;
  unansweredMessages: number;
  quote?: string;
  suggestedAction?: string;
  midYearRisk: boolean;
}

export interface CheckInPayload {
  token: string;
  transcript: string;
  pillars: {
    academico: number;
    psicologico: number;
    trabajo: number;
  };
  availableMinutes?: number;
  energy?: number;
}

export interface GlassBoxSummary {
  summaryForStudent: string;
  victory?: string;
  headache?: string;
  pillarsTouched: Pillar[];
  proposedShare: string;
  askConsentQuestion: string;
  suggestedActions: string[];
  alertLevel: AlertLevel;
  silentSignals: SilentSignal[];
  tutorBrief: string;
  ethicalNote: string;
}

export interface SurvivalCapsule {
  title: string;
  minutes: number;
  when: string;
  content: string;
  type: "lectura" | "ejercicio" | "repaso";
}

export interface SurvivalPlan {
  headline: string;
  capsules: SurvivalCapsule[];
  tutorNoteDraft: string;
  industryVolunteer?: string;
}

export interface DigitizeResult {
  studentNameGuess?: string;
  academico: string;
  familiaRedes: string;
  saludBienestar: string;
  economicoFamiliar: string;
  habitabilidad: string;
  fortalezas: string;
  oportunidades: string;
  acuerdos: string;
  alertLevel: AlertLevel;
  pillars: {
    academico: number;
    psicologico: number;
    trabajo: number;
  };
  sensitiveRedacted: string[];
  tutorSummary: string;
}
