import type { Metadata } from "next";
import { metadataBase, PUBLIC_PAGE_METADATA } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  title: PUBLIC_PAGE_METADATA.home.title,
  description: PUBLIC_PAGE_METADATA.home.description,
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
