import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { storeUpload, UploadError } from "@/lib/admin/media";
import { adminListParams } from "@/lib/admin/params";
import { getSession } from "@/lib/auth/session";
import { listMedia } from "@/lib/queries/admin";

const unauthorized = () => NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });

/** Media picker listing. */
export async function GET(request: Request): Promise<Response> {
  if (!(await getSession())) return unauthorized();
  const url = new URL(request.url);
  const p = adminListParams.parse(Object.fromEntries(url.searchParams));
  const { rows, meta } = await listMedia({ q: p.q, type: p.type, page: p.page, pageSize: Math.min(p.pageSize, 50) });
  return NextResponse.json(
    { ok: true, data: rows.map((m) => ({ id: m.id, url: `/${m.key}`, filename: m.filename, mime: m.mime, alt: m.alt, width: m.width, height: m.height })), meta },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Multipart upload of a single file (field "file"). */
export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  // Same-origin only: cookies are SameSite=Strict, this is defence in depth.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ ok: false, error: "Cross-origin upload rejected" }, { status: 403 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 11 * 1024 * 1024) return NextResponse.json({ ok: false, error: "File too large (max 10 MB)." }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });

  try {
    const row = await storeUpload(file);
    await logActivity(session.username, "uploaded", "media", row.id, row.filename);
    return NextResponse.json({ ok: true, data: { id: row.id, url: `/${row.key}`, filename: row.filename, mime: row.mime, alt: row.alt, width: row.width, height: row.height } });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ ok: false, error: e.message }, { status: 422 });
    console.error("upload failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Upload failed. Please try again." }, { status: 500 });
  }
}
