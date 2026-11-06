/**
 * Servicio modular ASR (NVIDIA Parakeet-1.1b) con fallbacks.
 * En demo: si no hay endpoint NIM configurado, devolvemos null
 * para que el cliente use Web Speech API / texto.
 */

export type AsrResult = {
  text: string;
  provider: "parakeet" | "whisper-fallback" | "mock";
  confidence?: number;
};

export async function transcribeWithParakeet(
  audioBase64: string,
  mimeType = "audio/webm"
): Promise<AsrResult | null> {
  const endpoint = process.env.NVIDIA_PARKEET_URL?.trim();
  const apiKey = process.env.NVIDIA_API_KEY?.trim();

  if (!endpoint || !apiKey) {
    return null;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/parakeet-1.1b",
      audio: audioBase64,
      mime_type: mimeType,
      language: "es",
    }),
  });

  if (!res.ok) {
    throw new Error(`Parakeet error ${res.status}`);
  }

  const data = (await res.json()) as { text?: string; transcript?: string };
  const text = (data.text || data.transcript || "").trim();
  if (!text) return null;

  return { text, provider: "parakeet", confidence: 0.9 };
}

/** Casos de demo para el pitch sin micrófono */
export const DEMO_TRANSCRIPTS: Record<string, string> = {
  camila:
    "Hola, esta semana me cambiaron los turnos en el trabajo. Solo tengo unos 25 minutos en el trayecto de ida y una hora el jueves por la noche. Tengo dos entregas y siento que se me acumula todo como una bola de nieve. Quiero seguir, pero necesito acomodar el estudio a esos ratos libres.",
  diego:
    "La verdad es que esta semana estoy mal de dinero. Estoy pensando en congelar porque no me alcanza el pasaje y además me atraso en cálculo. No quiero perder la beca, pero no sé cómo pedir ayuda sin que me juzguen.",
  ambar:
    "Mi victoria fue terminar el informe. Mi dolor de cabeza es que estoy cuidando a mi hermano y duermo poco. Estoy sobrepasada con Taller y la casa. ¿Pueden marcar esto para que mi tutora me llame el lunes?",
  ok: "Esta semana me fue bien. Aprobé el certamen y pude ir a la reunión de la fundación. Todo tranquilo por ahora.",
};
