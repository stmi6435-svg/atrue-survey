"use client";

import { ArrowRight, ClipboardList, LogOut, MessageSquareText, Star, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BRANCH_LABELS, BRANCH_OPTIONS, REVIEW_METRICS } from "@/features/trainer-review/constants";
import type { BranchId, TrainerReview } from "@/features/trainer-review/types";
import type { SatisfactionAnswer, SatisfactionResponse, SatisfactionSurvey } from "@/features/satisfaction/types";
import { getSupabaseClient } from "@/lib/supabase";

type TrainerBranchSummary = {
  branch: BranchId;
  label: string;
  reviewCount: number;
  averageRating: number | null;
};

type SatisfactionSummary = {
  totalResponses: number;
  averageRating: number | null;
  needsReviewCount: number;
  activeSurveyTitle: string | null;
};

function average(values: number[]) {
  const safeValues = values.filter((value) => Number.isFinite(value));
  if (safeValues.length === 0) {
    return null;
  }

  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function formatAverage(value: number | null) {
  return value === null ? "데이터 없음" : `${value.toFixed(1)}점`;
}

function buildTrainerBranchSummaries(reviews: TrainerReview[]): TrainerBranchSummary[] {
  return BRANCH_OPTIONS.map((branchOption) => {
    const branchReviews = reviews.filter((review) => review.branch === branchOption.id);
    const metricValues = branchReviews.flatMap((review) => REVIEW_METRICS.map((metric) => review[metric.key]));

    return {
      branch: branchOption.id,
      label: BRANCH_LABELS[branchOption.id],
      reviewCount: branchReviews.length,
      averageRating: average(metricValues),
    };
  });
}

async function fetchTrainerReviews() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("trainer_reviews").select("*").order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchSatisfactionSummary(): Promise<SatisfactionSummary> {
  const supabase = getSupabaseClient();
  const [{ data: surveys, error: surveyError }, { data: responses, error: responseError }, { data: answers, error: answerError }] =
    await Promise.all([
      supabase.from("satisfaction_surveys").select("*").order("start_date", { ascending: false }),
      supabase.from("satisfaction_responses").select("*").order("submitted_at", { ascending: false }),
      supabase.from("satisfaction_answers").select("*"),
    ]);

  if (surveyError) {
    throw surveyError;
  }

  if (responseError) {
    throw responseError;
  }

  if (answerError) {
    throw answerError;
  }

  const typedSurveys = (surveys ?? []) as SatisfactionSurvey[];
  const typedResponses = (responses ?? []) as SatisfactionResponse[];
  const typedAnswers = (answers ?? []) as SatisfactionAnswer[];
  const activeSurvey = typedSurveys.find((survey) => survey.status === "active") ?? null;
  const ratingValues = typedAnswers
    .map((answer) => answer.rating_value)
    .filter((value): value is number => typeof value === "number");

  return {
    totalResponses: typedResponses.length,
    averageRating: average(ratingValues),
    needsReviewCount: typedResponses.filter((response) => response.status === "needs_review" || response.status === "in_progress").length,
    activeSurveyTitle: activeSurvey?.title ?? null,
  };
}

export function AdminHome() {
  const router = useRouter();
  const [trainerReviews, setTrainerReviews] = useState<TrainerReview[]>([]);
  const [satisfactionSummary, setSatisfactionSummary] = useState<SatisfactionSummary>({
    totalResponses: 0,
    averageRating: null,
    needsReviewCount: 0,
    activeSurveyTitle: null,
  });
  const [trainerError, setTrainerError] = useState("");
  const [satisfactionError, setSatisfactionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setIsLoading(true);

      const [satisfactionResult, trainerResult] = await Promise.allSettled([fetchSatisfactionSummary(), fetchTrainerReviews()]);

      if (satisfactionResult.status === "fulfilled") {
        setSatisfactionSummary(satisfactionResult.value);
        setSatisfactionError("");
      } else {
        setSatisfactionError(satisfactionResult.reason instanceof Error ? satisfactionResult.reason.message : "회원 만족도 데이터를 불러오지 못했습니다.");
      }

      if (trainerResult.status === "fulfilled") {
        setTrainerReviews(trainerResult.value);
        setTrainerError("");
      } else {
        setTrainerError(trainerResult.reason instanceof Error ? trainerResult.reason.message : "PT 평가 데이터를 불러오지 못했습니다.");
      }

      setIsLoading(false);
    }

    void loadHomeData();
  }, []);

  const trainerBranchSummaries = useMemo(() => buildTrainerBranchSummaries(trainerReviews), [trainerReviews]);
  const trainerAverage = useMemo(
    () => average(trainerBranchSummaries.map((summary) => summary.averageRating).filter((value): value is number => value !== null)),
    [trainerBranchSummaries],
  );

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-ivory px-4 py-5 text-charcoal sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">ATRUEGYM ADMIN</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">통합 관리자 홈</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/65">
                회원 만족도 조사, PT 평가, 트레이너, 기존 설문 관리를 한 곳에서 확인하고 이동합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-charcoal px-5 text-sm font-bold text-ivory shadow-sm transition hover:bg-cocoa lg:self-start"
            >
              <LogOut size={16} aria-hidden />
              로그아웃
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="관리 메뉴">
          <AdminLinkCard
            href="/admin/satisfaction"
            icon={<MessageSquareText size={24} />}
            title="회원 만족도 관리"
            description="회원 만족도 대시보드, 응답 내역, 질문, 설문 회차, 직원을 관리합니다."
          />
          <AdminLinkCard
            href="/admin/trainer-reviews"
            icon={<Star size={24} />}
            title="PT 평가 관리"
            description="트레이너별 회원 평가와 개선 피드백을 확인합니다."
          />
          <AdminLinkCard
            href="/admin/trainers"
            icon={<UsersRound size={24} />}
            title="트레이너 관리"
            description="PT 평가에 노출되는 트레이너 정보를 관리합니다."
          />
          <AdminLinkCard
            href="/admin/surveys"
            icon={<ClipboardList size={24} />}
            title="기존 설문 관리"
            description="PT 사전 설문 제출 현황과 상담 진행 상태를 관리합니다."
          />
        </section>

        <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">SATISFACTION SUMMARY</p>
              <h2 className="mt-2 text-2xl font-bold">회원 만족도 조사 요약</h2>
            </div>
            <Link href="/admin/satisfaction" className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-charcoal px-4 text-sm font-bold text-ivory transition hover:bg-cocoa">
              상세 보기
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          {satisfactionError ? <ErrorBanner message={satisfactionError} /> : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="총 응답 수" value={isLoading ? "불러오는 중" : `${satisfactionSummary.totalResponses}건`} />
            <MetricCard label="전체 평균" value={isLoading ? "불러오는 중" : formatAverage(satisfactionSummary.averageRating)} />
            <MetricCard label="처리 필요" value={isLoading ? "불러오는 중" : `${satisfactionSummary.needsReviewCount}건`} />
            <MetricCard label="진행 중 설문" value={isLoading ? "불러오는 중" : satisfactionSummary.activeSurveyTitle ?? "없음"} />
          </div>
        </section>

        <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">PT REVIEW SUMMARY</p>
              <h2 className="mt-2 text-2xl font-bold">PT 평가 요약</h2>
            </div>
            <Link href="/admin/trainer-reviews" className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-charcoal px-4 text-sm font-bold text-ivory transition hover:bg-cocoa">
              평가 관리
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          {trainerError ? <ErrorBanner message={trainerError} /> : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="총 평가 수" value={isLoading ? "불러오는 중" : `${trainerReviews.length}건`} />
            <MetricCard label="전체 평균" value={isLoading ? "불러오는 중" : formatAverage(trainerAverage)} />
            {trainerBranchSummaries.map((summary) => (
              <MetricCard key={summary.branch} label={`${summary.label} 평균`} value={isLoading ? "불러오는 중" : formatAverage(summary.averageRating)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminLinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-44 flex-col justify-between rounded-3xl border border-oatmeal bg-white p-5 shadow-soft transition hover:border-sand hover:bg-[#FFFCF7]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal text-ivory">{icon}</span>
      <span>
        <strong className="block text-xl font-bold">{title}</strong>
        <span className="mt-2 block text-sm leading-6 text-charcoal/62">{description}</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cocoa">
        이동하기
        <ArrowRight size={16} aria-hidden className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-oatmeal bg-ivory px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-charcoal">{value}</p>
    </article>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>;
}
