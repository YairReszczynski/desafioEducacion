# Puente Semanal

MVP Hackathon IA · Congreso Social UC 2026 · **Desafío 2** · Fundación Puente.

Link perpetuo del becario (como magic link de FormaCoach) + radar de coordinación + digitalizador de pautas en papel + Caja de Cristal ética. Claude Haiku 5.5.

## Arranque

```bash
cd web
cp .env.example .env.local   # pegar ANTHROPIC_API_KEY
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Rutas demo (jurado < 3 min)

| Vista | URL |
|-------|-----|
| Home | `/` |
| Link perpetuo Camila (1° año) | `/p/a1b2c3d4-e5f6-4789-a012-3456789abcde` |
| Consola 120 casos | `/dashboard` |
| Digitalizar pauta | `/dashboard/digitize` |
| Ética / Caja de Cristal | `/etica` |

## Stack

- Next.js App Router + Tailwind 4
- `@anthropic-ai/sdk` → `claude-haiku-5-5`
- ASR modular `lib/asr-parakeet.ts` (Parakeet + Web Speech / demo)
- PWA (`manifest.webmanifest` + Install prompt)
- Seed sintético de **120** becarios alineado a insights de entrevista Puente

## Marca

Colores oficiales: `#9E1127` `#D00000` `#D35C6D` `#E7CE4F` · tipografías M PLUS Rounded 1c + Lato.
