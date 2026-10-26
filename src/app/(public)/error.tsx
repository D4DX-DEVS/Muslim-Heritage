"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/states";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("public page error", error.digest);
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load this page. Please try again in a moment."
        action={
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground">
            Try again
          </button>
        }
      />
    </div>
  );
}
