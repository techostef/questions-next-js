/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Other configuration options
  reactStrictMode: true,
  
  // Configure allowed image domains for next/image
  images: {
    domains: [
      'oaidalleapiprodscus.blob.core.windows.net',
      'cdn.openai.com'
    ],
  },
};

module.exports = nextConfig;
