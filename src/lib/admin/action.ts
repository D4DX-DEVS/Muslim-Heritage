import "server-only";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { requireAdmin, UnauthorizedError, type AdminSession } from "@/lib/auth/session";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Wraps every admin server action: re-checks the session (never trust the UI),
 * validates input with the shared schema and hides internal errors. A successful write clears
 * the client router cache (next.config staleTimes), so no page is shown from before the change.
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
      const result = await handler(parsed.data, session);
      if (result.ok) revalidatePath("/", "layout");
      return result;
    } catch (e) {
      console.error("admin action failed", e instanceof Error ? e.message : e);
      return { ok: false, error: "Something went wrong while saving. Please try again." };
    }
  };
}
