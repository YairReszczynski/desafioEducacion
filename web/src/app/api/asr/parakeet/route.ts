import { DEMO_TRANSCRIPTS, transcribeWithParakeet } from "@/lib/asr-parakeet";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      audioBase64?: string;
      mimeType?: string;
      demoCase?: keyof typeof DEMO_TRANSCRIPTS;
    };

    if (body.demoCase && DEMO_TRANSCRIPTS[body.demoCase]) {
      return NextResponse.json({
        text: DEMO_TRANSCRIPTS[body.demoCase],
        provider: "mock",
      });
    }

    if (!body.audioBase64) {
      return NextResponse.json(
        { error: "Falta audioBase64 o demoCase" },
        { status: 400 }
      );
    }

    const result = await transcribeWithParakeet(
      body.audioBase64,
      body.mimeType
    );

    if (!result) {
      return NextResponse.json({
        text: DEMO_TRANSCRIPTS.camila,
        provider: "mock",
        note: "Parakeet no configurado · fallback demo (en cliente usar Web Speech)",
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error ASR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
