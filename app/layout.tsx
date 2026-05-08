import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "어트루짐 PT 사전 설문",
  description: "어트루짐 PT 체험권 및 상담 사전 설문 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
