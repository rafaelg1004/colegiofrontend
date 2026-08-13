import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  generateBuildId: async () => {
    return "colegio-build-v1";
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
