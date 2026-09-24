import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // react-pageflip mutates the DOM; double-mount breaks it
  images: { unoptimized: true },
};

export default nextConfig;
