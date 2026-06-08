import type { Metadata } from "next";
import { RootPage } from "@/features/RootPage";
import { createPublicPageMetadata, PUBLIC_PAGE_METADATA } from "@/lib/metadata";

export const metadata: Metadata = createPublicPageMetadata(PUBLIC_PAGE_METADATA.home);

export default function Home() {
  return <RootPage />;
}
