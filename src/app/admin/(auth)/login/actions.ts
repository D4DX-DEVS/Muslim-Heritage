"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { verifyPassword } from "@/lib/auth/password";
import { clearFailures, lockedFor, recordFailure } from "@/lib/auth/rate-limit";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { loginSchema } from "@/lib/validation/admin";

export interface LoginState {
  error?: string;
}

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function login(input: unknown): Promise<LoginState> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter your username and password." };
  const { username, password } = parsed.data;

  const env = getEnv();
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    console.error("admin login: ADMIN_USERNAME / ADMIN_PASSWORD_HASH / SESSION_SECRET not configured");
    return { error: "Sign-in is not configured on this server." };
  }

  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`ip:${ip}`, `user:${username.toLowerCase()}`];
  const waits = await Promise.all(keys.map(lockedFor));
  const wait = Math.max(...waits);
  if (wait > 0) {
    return { error: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute(s).` };
  }

  // Always run the hash so timing doesn't reveal whether the username exists.
  const passwordOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  const userOk = constantTimeEqual(username, env.ADMIN_USERNAME);
  if (!passwordOk || !userOk) {
    await Promise.all(keys.map(recordFailure));
    await logActivity(username.slice(0, 100), "login_failed", "session", null, `ip ${ip}`);
    return { error: "Incorrect username or password." };
  }

  await Promise.all(keys.map(clearFailures));
  await createSession(env.ADMIN_USERNAME);
  await logActivity(env.ADMIN_USERNAME, "login", "session", null, `ip ${ip}`);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  await destroySession();
  if (session) await logActivity(session.username, "logout", "session", null);
  redirect("/admin/login");
}
