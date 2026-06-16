import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@finance-radar/domain"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
};

export default nextConfig;
