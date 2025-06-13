import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Make Next.js handle PDF files
    config.module.rules.push({
      test: /\.pdf$/,
      type: 'asset/resource',
    });
    return config;
  },
  // Ensure proper file serving
  async headers() {
    return [
      {
        source: '/resumes/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/pdf',
          },
          {
            key: 'Content-Disposition',
            value: 'inline',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
