import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Amplify Hosting은 표준 Next.js 빌드(.next 전체)를 SSR로 자동 감지함.
  // standalone 모드는 self-hosting용이라 Amplify에선 오히려 SSR 인식 방해.
};

export default nextConfig;
