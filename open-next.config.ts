import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Public pages render per request straight from D1 (small dataset, indexed queries),
// so no incremental cache is configured.
export default defineCloudflareConfig({});
