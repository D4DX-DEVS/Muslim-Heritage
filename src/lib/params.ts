import { z } from "zod";

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

const pageSchema = z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)).default(1);
const querySchema = z.preprocess(first, z.string().trim().max(200).catch("")).default("");

export const listingParams = z.object({
  page: pageSchema,
  q: querySchema,
  section: z.preprocess(first, z.coerce.number().int().positive().optional().catch(undefined)),
  sort: z.preprocess(first, z.enum(["default", "title", "recent"]).catch("default")).default("default"),
});

export type ListingParams = z.infer<typeof listingParams>;

export function parseListing(searchParams: Record<string, string | string[] | undefined>): ListingParams {
  return listingParams.parse(searchParams);
}

/** Route ids like /innermore/12 — anything else is a 404. */
export function parseId(value: string): number | null {
  return /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null;
}

/** Builds a listing URL keeping only non-default params. */
export function listingHref(base: string, params: Partial<ListingParams>): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.section) sp.set("section", String(params.section));
  if (params.sort && params.sort !== "default") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
