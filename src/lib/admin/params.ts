import { z } from "zod";

export const ADMIN_PAGE_SIZES = [10, 20, 50, 100] as const;

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const adminListParams = z.object({
  page: z.preprocess(first, z.coerce.number().int().min(1).max(100_000).catch(1)).default(1),
  pageSize: z
    .preprocess(first, z.coerce.number().refine((n) => (ADMIN_PAGE_SIZES as readonly number[]).includes(n)).catch(20))
    .default(20),
  q: z.preprocess(first, z.string().trim().max(200).catch("")).default(""),
  status: z.preprocess(first, z.enum(["draft", "published"]).optional().catch(undefined)),
  section: z.preprocess(first, z.coerce.number().int().positive().optional().catch(undefined)),
  type: z.preprocess(first, z.enum(["image", "pdf"]).optional().catch(undefined)),
});

export type AdminListParams = z.infer<typeof adminListParams>;

export function adminHref(base: string, p: Partial<AdminListParams>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === "" || (k === "page" && v === 1) || (k === "pageSize" && v === 20)) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
