/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // หน้าแรกคือแอปใน public/index.html · เบราว์เซอร์เรียก /api ที่พอร์ต 3000 เดียว แล้วส่งต่อไปยัง backend ที่พอร์ต 4000
  async rewrites() {
    return [
      { source: "/", destination: "/index.html" },
      { source: "/api/:path*", destination: "http://localhost:4000/api/:path*" },
    ];
  },
};

export default nextConfig;
