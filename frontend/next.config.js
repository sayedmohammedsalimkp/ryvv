/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
};

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(nextConfig, {
  // Disable source-map upload until SENTRY_AUTH_TOKEN is set in CI.
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: false,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
