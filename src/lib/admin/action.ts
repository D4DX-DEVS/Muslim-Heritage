import "server-only";
import type { z } from "zod";
import { requireAdmin, UnauthorizedError, type AdminSession } from "@/lib/auth/session";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Wraps every admin server action: re-checks the session (never trust the UI),
 * validates input with the shared schema and hides internal errors.
 */
export function adminAction<S extends z.ZodType, T = undefined>(
  schema: S,
  handler: (input: z.infer<S>, session: AdminSession) => Promise<ActionResult<T>>,
) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    let session: AdminSession;
    try {
      session = await requireAdmin();
    } catch (e) {
      if (e instanceof UnauthorizedError) return { ok: false, error: "Your session has expired. Please sign in again." };
      throw e;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        fieldErrors[key] ??= issue.message;
      }
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }
    try {
      return await handler(parsed.data, session);
    } catch (e) {
      console.error("admin action failed", e instanceof Error ? e.message : e);
      return { ok: false, error: "Something went wrong while saving. Please try again." };
    }
  };
}
