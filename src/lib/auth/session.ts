import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { hmacHex, toBase64Url } from "./password";

const COOKIE = "mh_admin";
const SESSION_SECONDS = 8 * 60 * 60;

export interface AdminSession {
  username: string;
  expiresAt: number;
}

function secret(): string {
  const s = getEnv().SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters)");
  return s;
}

export async function createSession(username: string): Promise<void> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const db = getDb();
  // Opportunistic cleanup keeps the table small without a cron.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, Math.floor(Date.now() / 1000)));
  await db.insert(schema.sessions).values({ id: await hmacHex(secret(), token), username, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const id = await hmacHex(secret(), token);
  const [row] = await getDb().select().from(schema.sessions).where(eq(schema.sessions.id, id));
  if (!row || row.expiresAt < Math.floor(Date.now() / 1000)) return null;
  // Credentials rotated: sessions for a different username are no longer valid.
  if (row.username !== getEnv().ADMIN_USERNAME) return null;
  return { username: row.username, expiresAt: row.expiresAt };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await getDb().delete(schema.sessions).where(eq(schema.sessions.id, await hmacHex(secret(), token)));
  }
  jar.delete(COOKIE);
}

/** Pages: redirect to login. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/** Server actions and route handlers: throw, never trust the UI. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
