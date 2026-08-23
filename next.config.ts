import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Each photo is sent to a Server Action as a raw File (converted to a base64
    // data URI server-side); PhotoUpload caps a single upload at 5MB, so leave headroom.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
