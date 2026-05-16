import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained build under `.next/standalone` that includes
  // a minimal `node_modules` — used by the Docker runtime stage so the
  // final image stays small.
  output: "standalone",
};

export default nextConfig;
