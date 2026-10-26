"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center", background: "#faf6ec", color: "#1d211c" }}>
        <h1>Something went wrong</h1>
        <p>The site is temporarily unavailable. Please try again.</p>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 1.25rem", marginTop: 16 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
