import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: "/vocab",
        destination: "/practice/vocabulary",
        permanent: false,
      },
      {
        source: "/vocab/:path*",
        destination: "/practice/vocabulary/:path*",
        permanent: false,
      },
      {
        source: "/luyentu",
        destination: "/practice/vocabulary",
        permanent: false,
      },
      {
        source: "/luyentu/:path*",
        destination: "/practice/vocabulary/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
