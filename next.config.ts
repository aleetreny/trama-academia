import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output:'export',
  trailingSlash:true,
  basePath:process.env.NEXT_PUBLIC_BASE_PATH??'/trama-academia',
  env:{NEXT_PUBLIC_BASE_PATH:process.env.NEXT_PUBLIC_BASE_PATH??'/trama-academia'},
  images:{unoptimized:true},
  experimental:{cpus:4},
};

export default nextConfig;
