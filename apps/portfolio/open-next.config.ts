import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every route is prerendered and nothing revalidates, so the read-only cache
// served from the Worker's static assets is enough: no R2 or KV needed.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
