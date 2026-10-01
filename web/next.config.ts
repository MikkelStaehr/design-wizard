import type { NextConfig } from "next";

// Local-only static app: `next build` writes out/, and any server-only feature fails the build.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // The dev badge sits over the rail's shortcut legend and would show up in run-web screenshots.
  devIndicators: false,
};

export default nextConfig;
