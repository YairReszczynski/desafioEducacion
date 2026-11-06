import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-5-5";

export function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env.local");
  }
  return new Anthropic({ apiKey });
}

export async function askClaude(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  images?: { mediaType: string; data: string }[];
}) {
  const client = getAnthropic();
  const content: Anthropic.ContentBlockParam[] = [];

  if (opts.images?.length) {
    for (const img of opts.images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: img.data,
        },
      });
    }
  }
  content.push({ type: "text", text: opts.user });

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2500,
    system: opts.system,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la solicitud. Derivar a una persona.");
  }

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export function parseJsonLoose<T>(text: string): T {
  const match = text.match(/[\[{][\s\S]*[\]}]/);
  if (!match) throw new Error("Respuesta sin JSON válido");
  return JSON.parse(match[0]) as T;
}
