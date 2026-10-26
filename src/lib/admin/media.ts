import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { UPLOAD_LIMIT_BYTES, UPLOAD_TYPES } from "@/lib/validation/admin";

type UploadMime = keyof typeof UPLOAD_TYPES;

/** Trust the bytes, not the browser-supplied type. */
export function sniffMime(head: Uint8Array): UploadMime | null {
  const starts = (...sig: number[]) => sig.every((b, i) => head[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "image/webp";
  if (starts(0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  return null;
}

export function imageSize(b: Uint8Array, mime: UploadMime): { width: number | null; height: number | null } {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (mime === "image/png") return { width: view.getUint32(16), height: view.getUint32(20) };
    if (mime === "image/gif") return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
    if (mime === "image/jpeg") {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = b[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
        }
        i += 2 + view.getUint16(i + 2);
      }
    }
  } catch {
    // Truncated header: dimensions stay unknown.
  }
  return { width: null, height: null };
}

/** ASCII slug of the original name; never contains path separators. */
export function safeFilename(name: string): string {
  const base = name.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (base || "file").slice(0, 60).toLowerCase();
}

export class UploadError extends Error {}

export async function storeUpload(file: File): Promise<typeof schema.media.$inferSelect> {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > UPLOAD_LIMIT_BYTES) throw new UploadError(`Files must be ${UPLOAD_LIMIT_BYTES / 1024 / 1024} MB or smaller.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes.subarray(0, 16));
  if (!mime) throw new UploadError("Only JPEG, PNG, WebP, GIF images and PDF documents can be uploaded.");

  const now = new Date();
  const random = crypto.getRandomValues(new Uint8Array(6));
  const suffix = [...random].map((b) => b.toString(16).padStart(2, "0")).join("");
  const filename = `${safeFilename(file.name)}-${suffix}.${UPLOAD_TYPES[mime]}`;
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${filename}`;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const sha256 = [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");

  await getEnv().MEDIA.put(key, bytes, {
    httpMetadata: { contentType: mime, cacheControl: "public, max-age=31536000, immutable", contentDisposition: mime === "application/pdf" ? "inline" : undefined },
    customMetadata: { sha256, originalName: file.name.slice(0, 200) },
  });
  const { width, height } = mime === "application/pdf" ? { width: null, height: null } : imageSize(bytes, mime);
  try {
    const [row] = await getDb()
      .insert(schema.media)
      .values({ key, filename, mime, bytes: bytes.byteLength, width, height, sha256, alt: "" })
      .returning();
    return row;
  } catch (e) {
    // Keep R2 and D1 consistent if the row could not be written.
    await getEnv().MEDIA.delete(key);
    throw e;
  }
}

export async function deleteMediaObject(id: number): Promise<boolean> {
  const db = getDb();
  const [row] = await db.select().from(schema.media).where(eq(schema.media.id, id));
  if (!row) return false;
  await db.delete(schema.media).where(eq(schema.media.id, id));
  await getEnv().MEDIA.delete(row.key);
  return true;
}
