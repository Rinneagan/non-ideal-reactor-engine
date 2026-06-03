/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Optional: Disable image optimization if you ever add images, 
  // as the Next.js image server doesn't run on static exports.
  images: { unoptimized: true } 
};

export default nextConfig;