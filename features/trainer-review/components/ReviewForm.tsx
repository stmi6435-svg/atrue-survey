"use client";

import { CheckCircle2, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BRANCH_LABELS, REVIEW_METRICS } from "../constants";
import type { BranchId, ReviewScores, Trainer } from "../types";
import { getSupabaseClient } from "@/lib/supabase";
import { BranchSelect } from "./BranchSelect";
import { StarRating } from "./StarRating";
import { TrainerSelect } from "./TrainerSelect";

const INITIAL_SCORES: ReviewScores = {
  routine_delivery_score: 0,
  session_log_score: 0,
  kindness_score: 0,
};

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function ReviewForm() {
  const [branch, setBranch] = useState<BranchId | "">("");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [scores, setScores] = useState<ReviewScores>(INITIAL_SCORES);
  const [memberName, setMemberName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [ptSessionCount, setPtSessionCount] = useState("");
  const [improvementFeedback, setImprovementFeedback] = useState("");
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const selectedTrainer = useMemo(
    () => trainers.find((trainer) => trainer.id === selectedTrainerId) ?? null,
    [selectedTrainerId, trainers],
  );

  const allScoresSelected = REVIEW_METRICS.every((metric) => scores[metric.key] > 0);
  const canSubmit = Boolean(branch && selectedTrainer && allScoresSelected && !isSubmitting);

  useEffect(() => {
    if (!branch) {
      setTrainers([]);
      return;
    }

    const selectedBranch = branch;

    async function loadTrainers() {
      setIsLoadingTrainers(true);
      setErrorMessage("");
      setSelectedTrainerId("");
      setScores(INITIAL_SCORES);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("trainers")
          .select("*")
          .eq("branch", selectedBranch)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        setTrainers(data ?? []);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "트레이너 목록을 불러오지 못했습니다.");
        setTrainers([]);
      } finally {
        setIsLoadingTrainers(false);
      }
    }

    void loadTrainers();
  }, [branch]);

  function updateScore(key: keyof ReviewScores, value: number) {
    setScores((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!branch) {
      setErrorMessage("먼저 지점을 선택해 주세요.");
      return;
    }

    if (!selectedTrainer) {
      setErrorMessage("평가할 트레이너를 선택해 주세요.");
      return;
    }

    if (!allScoresSelected) {
      setErrorMessage("별점 3개 항목을 모두 선택해 주세요.");
      return;
    }

    const parsedPtSessionCount = ptSessionCount.trim() ? Number(ptSessionCount) : null;
    if (parsedPtSessionCount !== null && (!Number.isInteger(parsedPtSessionCount) || parsedPtSessionCount < 0)) {
      setErrorMessage("PT 회차는 0 이상의 숫자로 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("trainer_reviews").insert({
        branch,
        trainer_id: selectedTrainer.id,
        trainer_name: selectedTrainer.name,
        member_name: optionalText(memberName),
        phone_last4: optionalText(phoneLast4),
        pt_session_count: parsedPtSessionCount,
        routine_delivery_score: scores.routine_delivery_score,
        session_log_score: scores.session_log_score,
        kindness_score: scores.kindness_score,
        improvement_feedback: optionalText(improvementFeedback),
      });

      if (error) {
        throw error;
      }

      setIsComplete(true);
      setSelectedTrainerId("");
      setScores(INITIAL_SCORES);
      setMemberName("");
      setPhoneLast4("");
      setPtSessionCount("");
      setImprovementFeedback("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "평가 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <section className="rounded-[2rem] border border-[#EFE0CD] bg-white p-6 text-center shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF4CA] text-[#6F553C]">
          <CheckCircle2 size={34} aria-hidden />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#262320]">소중한 평가 감사합니다.</h2>
        <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-[#262320]/68">
          더 좋은 수업을 위해 반영하겠습니다.
        </p>
        <button
          type="button"
          onClick={() => setIsComplete(false)}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-[#262320] px-5 text-sm font-black text-[#FFF9EF] transition hover:bg-[#6F553C]"
        >
          다른 평가 작성하기
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <BranchSelect value={branch} onChange={setBranch} />

      {branch ? (
        <div className="rounded-2xl border border-[#EFE0CD] bg-white/70 px-4 py-3 text-sm font-bold text-[#6F553C]">
          선택 지점: {BRANCH_LABELS[branch]}
        </div>
      ) : null}

      {branch ? (
        <TrainerSelect
          trainers={trainers}
          value={selectedTrainerId}
          onChange={setSelectedTrainerId}
          isLoading={isLoadingTrainers}
          disabled={isSubmitting}
        />
      ) : null}

      {selectedTrainer ? (
        <section className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B67854]">STEP 3</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#262320]">
            {selectedTrainer.name} 선생님의 수업은 어떠셨나요?
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#262320]/65">
            부담 없이 느끼신 그대로 선택해 주세요. 별점은 1점부터 5점까지 가능합니다.
          </p>

          <div className="mt-5 grid gap-4">
            {REVIEW_METRICS.map((metric) => (
              <StarRating
                key={metric.key}
                label={metric.label}
                helper={metric.helper}
                value={scores[metric.key]}
                onChange={(value) => updateScore(metric.key, value)}
                disabled={isSubmitting}
              />
            ))}

            <label className="block rounded-3xl border border-[#EFE0CD] bg-white p-4 sm:p-5">
              <span className="block text-base font-black text-[#262320]">선생님이 더 발전되었으면 하는 부분</span>
              <span className="mt-1 block text-sm font-medium leading-6 text-[#262320]/60">
                칭찬, 아쉬웠던 점, 바라는 점을 자유롭게 적어 주세요.
              </span>
              <textarea
                value={improvementFeedback}
                onChange={(event) => setImprovementFeedback(event.target.value)}
                className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 py-3 text-base font-medium text-[#262320] outline-none transition placeholder:text-[#262320]/35 focus:border-[#F6C343]"
                placeholder="예: 운동 루틴 설명이 더 자세하면 좋겠어요."
                disabled={isSubmitting}
              />
            </label>
          </div>
        </section>
      ) : null}

      {selectedTrainer ? (
        <section className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B67854]">선택 입력</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#262320]">확인을 위한 정보</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#262320]/65">입력하지 않아도 제출할 수 있습니다.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#262320]">회원 이름</span>
              <input
                value={memberName}
                onChange={(event) => setMemberName(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base font-medium text-[#262320] outline-none transition placeholder:text-[#262320]/35 focus:border-[#F6C343]"
                placeholder="선택 입력"
                disabled={isSubmitting}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#262320]">연락처 뒤 4자리</span>
              <input
                value={phoneLast4}
                onChange={(event) => setPhoneLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base font-medium text-[#262320] outline-none transition placeholder:text-[#262320]/35 focus:border-[#F6C343]"
                placeholder="0000"
                disabled={isSubmitting}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#262320]">PT 회차</span>
              <input
                type="number"
                min={0}
                value={ptSessionCount}
                onChange={(event) => setPtSessionCount(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base font-medium text-[#262320] outline-none transition placeholder:text-[#262320]/35 focus:border-[#F6C343]"
                placeholder="예: 12"
                disabled={isSubmitting}
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#262320] px-5 text-base font-black text-[#FFF9EF] transition hover:bg-[#6F553C] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Send size={20} aria-hidden />
            {isSubmitting ? "제출 중..." : "평가 제출하기"}
          </button>
        </section>
      ) : null}

      {!selectedTrainer && errorMessage ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{errorMessage}</p>
      ) : null}
    </form>
  );
}
