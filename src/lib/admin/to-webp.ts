// Runs in the admin browser before upload. Cloudflare Workers cannot run sharp (a native
// library), so new JPEG/PNG uploads are re-encoded to WebP here; existing media were
// converted with sharp by scripts/media/to-webp.mts using the same settings.

export const WEBP_MAX_WIDTH = 1920;
export const WEBP_QUALITY = 0.8;

const CONVERTIBLE = new Set(["image/jpeg", "image/png"]);

/** Returns a WebP copy of a JPEG/PNG (downscaled to WEBP_MAX_WIDTH), or the original file when conversion isn't possible or not smaller. */
export async function toWebp(file: File): Promise<File> {
  if (!CONVERTIBLE.has(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, WEBP_MAX_WIDTH / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
    // Browsers without a WebP encoder silently return PNG; keep the original then.
    if (!blob || blob.type !== "image/webp" || (blob.size >= file.size && scale === 1)) return file;
    return new File([blob], file.name.replace(/\.[^.]*$/, "") + ".webp", { type: "image/webp", lastModified: file.lastModified });
  } catch {
    return file;
  }
}
