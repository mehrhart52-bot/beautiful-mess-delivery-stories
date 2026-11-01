import type { NextConfig } from "next";

// Only this Codespace's forwarded port is trusted, and only in development.
const developmentOrigins = process.env.NODE_ENV === "development" && process.env.CODESPACE_NAME
  ? [`${process.env.CODESPACE_NAME}-3000.app.github.dev`]
  : [];

const config: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: developmentOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: developmentOrigins,
      bodySizeLimit: "64kb",
    },
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "same-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      ]
    }];
  }
};

export default config;
