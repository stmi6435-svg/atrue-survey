"use client";

import { ChevronDown, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ADMIN_ALL_BRANCH_VALUE, BRANCH_LABELS, BRANCH_OPTIONS, REVIEW_METRICS } from "@/features/trainer-review/constants";
import type { BranchId, ReviewMetric, TrainerReview } from "@/features/trainer-review/types";
import { getSupabaseClient } from "@/lib/supabase";

type BranchFilter = BranchId | typeof ADMIN_ALL_BRANCH_VALUE;

type ReviewGroup = {
  key: string;
  branch: BranchId;
  trainerName: string;
  reviews: TrainerReview[];
  averages: Record<ReviewMetric, number>;
  totalAverage: number;
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function formatAverage(value: number) {
  return value.toFixed(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildGroups(reviews: TrainerReview[]): ReviewGroup[] {
  const grouped = new Map<string, Omit<ReviewGroup, "averages" | "totalAverage">>();

  reviews.forEach((review) => {
    const key = `${review.branch}:${review.trainer_id ?? review.trainer_name}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.reviews.push(review);
      return;
    }

    grouped.set(key, {
      key,
      branch: review.branch,
      trainerName: review.trainer_name,
      reviews: [review],
    });
  });

  return Array.from(grouped.values())
    .map((group) => {
      const averages = REVIEW_METRICS.reduce(
        (acc, metric) => ({
          ...acc,
          [metric.key]: average(group.reviews.map((review) => review[metric.key])),
        }),
        {} as Record<ReviewMetric, number>,
      );

      return {
        ...group,
        averages,
        totalAverage: average(REVIEW_METRICS.map((metric) => averages[metric.key])),
      };
    })
    .sort((a, b) => b.totalAverage - a.totalAverage || b.reviews.length - a.reviews.length);
}

export function AdminReviewTable() {
  const [branchFilter, setBranchFilter] = useState<BranchFilter>(ADMIN_ALL_BRANCH_VALUE);
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const groups = useMemo(() => buildGroups(reviews), [reviews]);

  async function loadReviews(nextBranchFilter = branchFilter) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      let query = supabase.from("trainer_reviews").select("*").order("created_at", { ascending: false });

      if (nextBranchFilter !== ADMIN_ALL_BRANCH_VALUE) {
        query = query.eq("branch", nextBranchFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setReviews(data ?? []);
      setExpandedKey(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "평가 데이터를 불러오지 못했습니다.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews(branchFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter]);

  async function handleDeleteReview(reviewId: string) {
    const confirmed = window.confirm("이 평가를 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }

    setDeletingReviewId(reviewId);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("trainer_reviews").delete().eq("id", reviewId);

      if (error) {
        throw error;
      }

      setReviews((currentReviews) => currentReviews.filter((review) => review.id !== reviewId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "평가 삭제에 실패했습니다.");
    } finally {
      setDeletingReviewId(null);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B67854]">REVIEWS</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[#262320]">트레이너 평가 집계</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-[#262320]/65">
              트레이너 이름을 누르면 항목별 평균과 주관식 평가가 펼쳐집니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadReviews()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-sm font-black text-[#262320] transition hover:border-[#F6C343] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} aria-hidden className={isLoading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>
        <label className="mt-5 block max-w-sm">
          <span className="mb-2 block text-sm font-black text-[#262320]">지점 필터</span>
          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value as BranchFilter)}
            className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base font-bold text-[#262320] outline-none transition focus:border-[#F6C343]"
          >
            <option value={ADMIN_ALL_BRANCH_VALUE}>전체 지점</option>
            {BRANCH_OPTIONS.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {errorMessage ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</p> : null}
      {isLoading ? (
        <div className="rounded-3xl border border-[#EFE0CD] bg-white px-5 py-7 text-sm font-bold text-[#262320]/65 shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
          평가 데이터를 불러오고 있습니다.
        </div>
      ) : null}
      {!isLoading && groups.length === 0 ? (
        <div className="rounded-3xl border border-[#EFE0CD] bg-white px-5 py-7 text-sm font-bold text-[#262320]/65 shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
          아직 제출된 평가가 없습니다.
        </div>
      ) : null}

      <div className="grid gap-4">
        {groups.map((group) => {
          const isExpanded = expandedKey === group.key;

          return (
            <article key={group.key} className="overflow-hidden rounded-3xl border border-[#EFE0CD] bg-white shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
              <button
                type="button"
                onClick={() => setExpandedKey(isExpanded ? null : group.key)}
                className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-[#FFF9EF] sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div>
                  <span className="inline-flex rounded-full bg-[#FFF9EF] px-3 py-1 text-xs font-black text-[#6F553C]">
                    {BRANCH_LABELS[group.branch]}
                  </span>
                  <h2 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-black text-[#262320]">
                    {group.trainerName}
                    <span className="rounded-full bg-[#FFF4CA] px-3 py-1 text-base text-[#B67824]">
                      평균 {formatAverage(group.totalAverage)}
                    </span>
                  </h2>
                  <p className="mt-2 text-sm font-bold text-[#262320]/60">평가 {group.reviews.length}개</p>
                </div>
                <ChevronDown size={24} aria-hidden className={`shrink-0 text-[#6F553C] transition ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {isExpanded ? (
                <div className="border-t border-[#EFE0CD] bg-[#FFFCF7] p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {REVIEW_METRICS.map((metric) => (
                      <div key={metric.key} className="rounded-2xl border border-[#EFE0CD] bg-white p-4">
                        <p className="text-xs font-black text-[#262320]/55">{metric.label}</p>
                        <strong className="mt-2 block text-2xl font-black text-[#262320]">{formatAverage(group.averages[metric.key])}</strong>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-[#F6C343] bg-[#FFF4CA] p-4">
                      <p className="text-xs font-black text-[#6F553C]">전체 평균</p>
                      <strong className="mt-2 block text-2xl font-black text-[#262320]">{formatAverage(group.totalAverage)}</strong>
                    </div>
                  </div>
                  <h3 className="mt-6 text-lg font-black text-[#262320]">주관식 평가 목록</h3>
                  <div className="mt-3 grid gap-3">
                    {group.reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-[#EFE0CD] bg-white p-4">
                        <p className="text-sm font-medium leading-6 text-[#262320]/76">
                          {review.improvement_feedback?.trim() || "작성된 의견이 없습니다."}
                        </p>
                        <dl className="mt-4 grid gap-2 text-sm font-bold text-[#262320]/62 sm:grid-cols-4">
                          <div>
                            <dt className="text-xs text-[#262320]/42">제출일</dt>
                            <dd className="mt-1">{formatDate(review.created_at)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#262320]/42">회원 이름</dt>
                            <dd className="mt-1">{review.member_name || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#262320]/42">연락처 뒤 4자리</dt>
                            <dd className="mt-1">{review.phone_last4 || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#262320]/42">PT 회차</dt>
                            <dd className="mt-1">{review.pt_session_count ?? "-"}</dd>
                          </div>
                        </dl>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleDeleteReview(review.id)}
                            disabled={deletingReviewId === review.id}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          >
                            <Trash2 size={16} aria-hidden />
                            {deletingReviewId === review.id ? "삭제 중..." : "평가 삭제"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
