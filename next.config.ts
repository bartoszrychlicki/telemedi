import type { NextConfig } from "next";

const canonicalProductionUrl = "https://telemedi-br-cto.vercel.app";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "telemedi-(?!br-cto\\.vercel\\.app$).*\\.vercel\\.app",
          },
        ],
        destination: `${canonicalProductionUrl}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
