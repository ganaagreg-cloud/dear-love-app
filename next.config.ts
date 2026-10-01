import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // react-pageflip mutates the DOM; double-mount breaks it
  images: { unoptimized: true },
  // link-preview images read these fonts at runtime; make sure Vercel ships them with the function
  outputFileTracingIncludes: { '/*': ['./src/assets/og/**/*'] },
};

export default nextConfig;
