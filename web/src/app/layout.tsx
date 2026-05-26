import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "호반/삼성 판촉물 ERP",
  description: "젬스톤 판촉물 발주·입고·재고 관리",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
