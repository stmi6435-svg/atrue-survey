import type { Metadata } from "next";

export const SITE_NAME = "어트루짐";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadataBase = new URL(SITE_URL);

type PublicPageMetadata = {
  description: string;
  path: string;
  title: string;
};

export const PUBLIC_PAGE_METADATA = {
  home: {
    path: "/",
    title: "어트루짐 PT 사전 설문",
    description: "PT 상담 전 회원님의 운동 목적과 건강 상태를 미리 확인하기 위한 설문입니다.",
  },
  satisfaction: {
    path: "/satisfaction",
    title: "어트루짐 회원 만족도 조사",
    description: "더 나은 운동 환경과 서비스를 위해 회원님의 소중한 의견을 남겨주세요.",
  },
  trainerReview: {
    path: "/trainer-review",
    title: "어트루짐 트레이너 평가",
    description: "PT 수업 만족도와 트레이너 피드백을 남겨주세요.",
  },
} satisfies Record<string, PublicPageMetadata>;

export function createPublicPageMetadata(page: PublicPageMetadata): Metadata {
  const url = new URL(page.path, metadataBase);

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: page.title,
      description: page.description,
    },
  };
}
