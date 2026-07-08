import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp 含原生二进制，构建时需作为外部依赖，避免被打包进 serverless
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
