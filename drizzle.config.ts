import { defineConfig } from "drizzle-kit";

// Generates SQL into ./drizzle; migrations are applied with `wrangler d1 migrations apply`.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});
