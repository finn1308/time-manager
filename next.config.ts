import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: "/vocab",
        destination: "/practice",
        permanent: false,
      },
      {
        source: "/vocab/:path*",
        destination: "/practice",
        permanent: false,
      },
      {
        source: "/luyentu",
        destination: "/practice",
        permanent: false,
      },
      {
        source: "/luyentu/:path*",
        destination: "/practice",
        permanent: false,
      },
      {
        source: "/practice/vocabulary",
        destination: "/practice",
        permanent: false,
      },
      {
        source: "/practice/vocabulary/:path*",
        destination: "/practice",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
