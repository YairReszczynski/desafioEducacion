/** Comprime una foto de pauta para Claude Vision (rápido + bajo peso). */
export async function compressDataUrl(
  dataUrl: string,
  opts?: { maxWidth?: number; quality?: number }
): Promise<{ dataUrl: string; mediaType: string }> {
  const maxWidth = opts?.maxWidth ?? 1600;
  const quality = opts?.quality ?? 0.72;

  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl, mediaType: "image/jpeg" };
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl: out, mediaType: "image/jpeg" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}
