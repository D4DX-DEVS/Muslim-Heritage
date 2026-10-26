"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validation/admin";
import { login } from "./actions";

export function LoginForm() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(undefined);
    startTransition(async () => {
      const result = await login(values);
      // On success the action redirects; anything returned is an error.
      if (result?.error) {
        setError(result.error);
        form.setValue("password", "");
        form.setFocus("password");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="h-11"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...form.register("username")}
        />
        {errors.username && (
          <p id="username-error" className="text-sm text-destructive">
            {errors.username.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            className="h-11 pr-11"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-0 top-0 inline-flex size-11 items-center justify-center text-muted-foreground hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
