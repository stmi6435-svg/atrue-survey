import type { Metadata } from "next";
import { createPublicPageMetadata, metadataBase, PUBLIC_PAGE_METADATA } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  ...createPublicPageMetadata(PUBLIC_PAGE_METADATA.home),
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
