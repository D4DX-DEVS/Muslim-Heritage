import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SITE } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-heritage-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/images/logo.png" alt={SITE.name} width={372} height={89} priority className="h-12 w-auto" />
        </div>
        <div className="rounded-xl bg-paper p-6 shadow-2xl sm:p-8">
          <h1 className="font-heading text-xl font-bold text-heritage-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Content management for muslimheritage.in</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
