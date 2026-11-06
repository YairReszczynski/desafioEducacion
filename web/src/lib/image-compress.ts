/** Detecta HEIC/HEIF (iPhone). */
export function isHeicFile(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  const n = file.name.toLowerCase();
  return (
    t.includes("heic") ||
    t.includes("heif") ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  );
}

/** Convierte un File (incl. HEIC) a data URL JPEG listo para Claude Vision. */
export async function fileToJpegDataUrl(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<{ dataUrl: string; mediaType: string }> {
  let working: Blob = file;

  if (isHeicFile(file)) {
    try {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.88,
      });
      working = Array.isArray(converted) ? converted[0]! : converted;
    } catch {
      throw new Error(
        "No se pudo convertir la foto HEIC. En el iPhone: Ajustes → Cámara → Formatos → Más compatible, o exporta como JPG."
      );
    }
  }

  const raw = await blobToDataUrl(working);
  return compressDataUrl(raw, opts);
}

/** Comprime una foto de pauta para Claude Vision (rápido + bajo peso). */
export async function compressDataUrl(
  dataUrl: string,
  opts?: { maxWidth?: number; quality?: number }
): Promise<{ dataUrl: string; mediaType: string }> {
  const maxWidth = opts?.maxWidth ?? 1600;
  const quality = opts?.quality ?? 0.72;

  try {
    const img = await loadImage(dataUrl);
    if (!img.width || !img.height) {
      return { dataUrl, mediaType: guessMediaType(dataUrl) };
    }
    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataUrl, mediaType: guessMediaType(dataUrl) };
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const out = canvas.toDataURL("image/jpeg", quality);
    return { dataUrl: out, mediaType: "image/jpeg" };
  } catch {
    return { dataUrl, mediaType: guessMediaType(dataUrl) };
  }
}

function guessMediaType(dataUrl: string): string {
  const m = dataUrl.match(/^data:([^;]+);/);
  return m?.[1] || "image/jpeg";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(blob);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return blobToDataUrl(file);
}
