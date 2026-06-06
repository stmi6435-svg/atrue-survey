"use client";

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

  return (
    <div className="text-charcoal">
      <div className="flex w-full flex-col gap-6">
        <header className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">DASHBOARD PREVIEW</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">관리자 대시보드</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/65">
              분기별 설문조사와 트레이너 평가의 핵심 지표만 간단히 확인하는 요약 화면입니다.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">SATISFACTION SUMMARY</p>
            <h2 className="mt-2 text-2xl font-bold">분기별 설문조사 간단 데이터</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/60">상세 응답과 설문 설정 관리는 좌측 메뉴의 분기별 설문조사에서 진행합니다.</p>
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
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">PT REVIEW SUMMARY</p>
            <h2 className="mt-2 text-2xl font-bold">트레이너 평가 간단 데이터</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/60">평가 상세와 트레이너별 응답 관리는 좌측 메뉴의 트레이너 평가에서 진행합니다.</p>
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
    </div>
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
