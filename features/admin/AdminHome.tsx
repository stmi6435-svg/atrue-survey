"use client";

import { ArrowRight, BarChart3, ClipboardList, LogOut, Sparkles, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BRANCH_LABELS, BRANCH_OPTIONS, REVIEW_METRICS } from "@/features/trainer-review/constants";
import type { BranchId, TrainerReview } from "@/features/trainer-review/types";
import { getSupabaseClient } from "@/lib/supabase";

type BranchSummary = {
  branch: BranchId;
  label: string;
  reviewCount: number;
  averageRating: number | null;
  goalProgressPointAverage: number | null;
};

type RankingItem = BranchSummary & {
  rankValue: number;
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function toGoalProgressPoint(value: number) {
  return Math.round(value * 20);
}

function formatRating(value: number | null) {
  return value === null ? "데이터 없음" : `${value.toFixed(1)}점`;
}

function formatPoint(value: number | null) {
  return value === null ? "데이터 없음" : `${value}점`;
}

function buildBranchSummaries(reviews: TrainerReview[]): BranchSummary[] {
  return BRANCH_OPTIONS.map((branchOption) => {
    const branchReviews = reviews.filter((review) => review.branch === branchOption.id);
    const metricAverages = REVIEW_METRICS.map((metric) => average(branchReviews.map((review) => review[metric.key])));
    const validMetricAverages = metricAverages.filter((value): value is number => value !== null);
    const averageRating = average(validMetricAverages);
    const goalProgressAverage = average(branchReviews.map((review) => review.goal_progress_score));

    return {
      branch: branchOption.id,
      label: BRANCH_LABELS[branchOption.id],
      reviewCount: branchReviews.length,
      averageRating,
      goalProgressPointAverage: goalProgressAverage === null ? null : toGoalProgressPoint(goalProgressAverage),
    };
  });
}

function buildRanking(summaries: BranchSummary[], key: "averageRating" | "goalProgressPointAverage"): RankingItem[] {
  return summaries
    .filter((summary) => summary[key] !== null)
    .map((summary) => ({ ...summary, rankValue: summary[key] as number }))
    .sort((a, b) => b.rankValue - a.rankValue || b.reviewCount - a.reviewCount)
    .slice(0, 3);
}

function buildSummarySentences(starRanking: RankingItem[], goalRanking: RankingItem[]) {
  if (starRanking.length === 0 && goalRanking.length === 0) {
    return ["평가 데이터가 아직 없습니다. 데이터가 쌓이면 지점별 경향을 자동으로 요약합니다."];
  }

  const sentences: string[] = [];
  const topStar = starRanking[0];
  const topGoal = goalRanking[0];
  const lowStar = starRanking.length > 1 ? starRanking[starRanking.length - 1] : null;

  if (topStar) {
    sentences.push(`현재 전체 지점 중 ${topStar.label}의 트레이너 평균 별점이 가장 높습니다.`);
  }

  if (topGoal) {
    sentences.push(`운동 목표 달성 체감 점수는 ${topGoal.label}이 가장 높게 나타났습니다.`);
  }

  if (lowStar && lowStar.branch !== topStar?.branch) {
    sentences.push(`${lowStar.label}은 다른 지점 대비 평균 별점이 낮아 회원 피드백 확인이 필요합니다.`);
  }

  return sentences;
}

async function fetchTrainerReviews() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("trainer_reviews").select("*").order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function AdminHome() {
  const router = useRouter();
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadReviews() {
      try {
        setReviews(await fetchTrainerReviews());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "트레이너 평가 데이터를 불러오지 못했습니다.");
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReviews();
  }, []);

  const branchSummaries = useMemo(() => buildBranchSummaries(reviews), [reviews]);
  const starRanking = useMemo(() => buildRanking(branchSummaries, "averageRating"), [branchSummaries]);
  const goalRanking = useMemo(() => buildRanking(branchSummaries, "goalProgressPointAverage"), [branchSummaries]);
  const summarySentences = useMemo(() => buildSummarySentences(starRanking, goalRanking), [starRanking, goalRanking]);

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#FFF9EF] px-4 py-5 text-[#262320] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B67854]">ATRUEGYM ADMIN</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-[#262320] sm:text-4xl">어트루짐 통합 관리자</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#262320]/65">
                PT 사전 설문지와 트레이너 평가 관리 화면으로 빠르게 이동하고, 평가 데이터를 기준으로 지점별 흐름을 확인합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#262320] px-5 text-sm font-bold text-[#FFF9EF] shadow-sm transition hover:bg-[#6F553C] lg:self-start"
            >
              <LogOut size={16} aria-hidden />
              로그아웃
            </button>
          </div>

          <nav className="mt-7 grid gap-4 md:grid-cols-2" aria-label="관리자 메뉴">
            <AdminLinkCard
              href="/admin/surveys"
              icon={<ClipboardList size={24} />}
              title="PT 사전 설문지 관리자"
              description="지점별 사전 설문 제출 현황과 상담 진행 상태를 관리합니다."
            />
            <AdminLinkCard
              href="/admin/trainer-reviews"
              icon={<Star size={24} />}
              title="트레이너 평가 관리자"
              description="회원 평가를 트레이너별로 집계하고 상세 피드백을 확인합니다."
            />
          </nav>
        </header>

        <section className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B67854]">
                <Sparkles size={15} aria-hidden />
                AI SUMMARY REPORT
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#262320]">트레이너 평가 AI 분석 리포트</h2>
              <p className="mt-2 text-sm leading-6 text-[#262320]/65">
                OpenAI API 연결 없이 저장된 트레이너 평가 데이터를 조건문 기반으로 자동 요약합니다.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-[#FFF4CA] px-4 py-2 text-sm font-bold text-[#6F553C]">
              총 {reviews.length}건 기준
            </span>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {branchSummaries.map((summary) => (
              <BranchSummaryCard key={summary.branch} summary={summary} isLoading={isLoading} />
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <RankingCard
              icon={<Trophy size={20} />}
              title="평균 별점 순위"
              items={starRanking}
              emptyMessage="평가 데이터가 아직 없습니다."
              formatter={(value) => `${value.toFixed(1)}점`}
            />
            <RankingCard
              icon={<BarChart3 size={20} />}
              title="운동 목표 달성 점수 순위"
              items={goalRanking}
              emptyMessage="평가 데이터가 아직 없습니다."
              formatter={(value) => `${value}점`}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-[#F6C343] bg-[#FFF9EF] p-5">
            <h3 className="text-lg font-bold text-[#262320]">자동 요약</h3>
            <div className="mt-3 grid gap-2">
              {summarySentences.map((sentence) => (
                <p key={sentence} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#262320]/75 shadow-sm">
                  {sentence}
                </p>
              ))}
            </div>
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
      className="group flex min-h-[160px] flex-col justify-between rounded-3xl border border-[#EFE0CD] bg-[#FFF9EF] p-5 shadow-sm transition hover:border-[#F6C343] hover:bg-[#FFF4CA]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#262320] text-[#FFF9EF]">{icon}</span>
      <span>
        <strong className="block text-xl font-bold text-[#262320]">{title}</strong>
        <span className="mt-2 block text-sm leading-6 text-[#262320]/62">{description}</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#6F553C]">
        이동하기
        <ArrowRight size={16} aria-hidden className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function BranchSummaryCard({ summary, isLoading }: { summary: BranchSummary; isLoading: boolean }) {
  return (
    <article className="rounded-3xl border border-[#EFE0CD] bg-[#FFFCF7] p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B67854]">BRANCH</p>
      <h3 className="mt-2 text-2xl font-bold text-[#262320]">{summary.label}</h3>
      <dl className="mt-5 grid gap-3">
        <MetricRow label="평균 별점" value={isLoading ? "불러오는 중" : formatRating(summary.averageRating)} />
        <MetricRow label="운동 목표 달성 평균 점수" value={isLoading ? "불러오는 중" : formatPoint(summary.goalProgressPointAverage)} />
        <MetricRow label="평가 건수" value={isLoading ? "불러오는 중" : `${summary.reviewCount}건`} />
      </dl>
    </article>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
      <dt className="text-sm font-bold text-[#6F553C]">{label}</dt>
      <dd className="text-right text-sm font-bold text-[#262320]">{value}</dd>
    </div>
  );
}

function RankingCard({
  icon,
  title,
  items,
  emptyMessage,
  formatter,
}: {
  icon: React.ReactNode;
  title: string;
  items: RankingItem[];
  emptyMessage: string;
  formatter: (value: number) => string;
}) {
  return (
    <section className="rounded-3xl border border-[#EFE0CD] bg-[#FFFCF7] p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-bold text-[#262320]">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF4CA] text-[#6F553C]">{icon}</span>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-[#262320]/55">{emptyMessage}</p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {items.map((item, index) => (
            <li key={item.branch} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
              <span className="text-sm font-bold text-[#262320]">
                {index + 1}위 {item.label}
              </span>
              <span className="shrink-0 text-sm font-bold text-[#6F553C]">{formatter(item.rankValue)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
