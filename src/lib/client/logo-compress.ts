/** Compress a logo file to a JPEG data URL suitable for PDF embed. */
const MAX_LOGO_BYTES = 350_000;

export async function fileToCompressedLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a PNG, JPEG, or WebP image");
  }
  if (file.size > 5_000_000) {
    throw new Error("Logo file is too large (max 5MB before compress)");
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 320;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.9;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_LOGO_BYTES && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_LOGO_BYTES) {
    throw new Error("Logo is still too large — try a simpler square logo");
  }
  return dataUrl;
}
