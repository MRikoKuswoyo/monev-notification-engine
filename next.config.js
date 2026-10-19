/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["pg"]   // pg dijalankan apa adanya di server, tidak di-bundle
  }
};
