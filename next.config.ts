import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Attachment photos are sent to Server Actions as base64 data URIs (~4/3 the
    // original file size); PhotoUpload caps uploads at 5MB, so leave headroom above ~6.7MB.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
