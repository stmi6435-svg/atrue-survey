import type { Metadata } from "next";
import { SatisfactionForm } from "@/features/satisfaction/components/SatisfactionForm";
import { createPublicPageMetadata, PUBLIC_PAGE_METADATA, SITE_NAME, SITE_URL } from "@/lib/metadata";

export const metadata: Metadata = {
  ...createPublicPageMetadata(PUBLIC_PAGE_METADATA.satisfaction),
  openGraph: {
    title: PUBLIC_PAGE_METADATA.satisfaction.title,
    description: PUBLIC_PAGE_METADATA.satisfaction.description,
    url: `${SITE_URL}/satisfaction`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PUBLIC_PAGE_METADATA.satisfaction.title,
    description: PUBLIC_PAGE_METADATA.satisfaction.description,
  },
};

export default function SatisfactionPage() {
  return (
    <main className="min-h-screen px-5 py-6 text-charcoal sm:py-10">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 rounded-3xl border border-oatmeal bg-white/90 p-5 shadow-soft sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-clay">ATRUEGYM SATISFACTION</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">회원 만족도 조사</h1>
          <p className="mt-4 text-base font-medium leading-7 text-charcoal/70">
            센터 이용 경험을 들려주세요. 청결, 친절, 시설, 이용 의향에 대한 의견을 바탕으로 더 나은 운동 환경을 만들겠습니다.
          </p>
        </div>

        <SatisfactionForm />
      </section>
    </main>
  );
}
