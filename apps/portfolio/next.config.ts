import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared modules ship TypeScript source rather than a built dist/, so Next
  // compiles them as part of the app.
  transpilePackages: ["@intromax/ui", "@intromax/common"],
};

export default nextConfig;
