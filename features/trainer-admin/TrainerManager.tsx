"use client";

import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { BranchSelect } from "@/features/trainer-review/components/BranchSelect";
import { BRANCH_LABELS } from "@/features/trainer-review/constants";
import type { BranchId, Trainer } from "@/features/trainer-review/types";
import { getSupabaseClient } from "@/lib/supabase";

export function TrainerManager() {
  const [branch, setBranch] = useState<BranchId>("munjeong");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [newTrainerName, setNewTrainerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadTrainers(nextBranch = branch) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("trainers")
        .select("*")
        .eq("branch", nextBranch)
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
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTrainers(branch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);

  async function handleAddTrainer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const name = newTrainerName.trim();
    if (!name) {
      setErrorMessage("추가할 트레이너 이름을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("trainers").insert({ branch, name, is_active: true });

      if (error) {
        throw error;
      }

      setNewTrainerName("");
      setSuccessMessage(`${name} 트레이너를 ${BRANCH_LABELS[branch]}에 추가했습니다.`);
      await loadTrainers(branch);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "트레이너 추가에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivateTrainer(trainer: Trainer) {
    const confirmed = window.confirm(`${trainer.name} 트레이너를 목록에서 삭제할까요? 기존 평가 데이터는 보존됩니다.`);
    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("trainers").update({ is_active: false }).eq("id", trainer.id);

      if (error) {
        throw error;
      }

      setSuccessMessage(`${trainer.name} 트레이너를 비활성화했습니다.`);
      await loadTrainers(branch);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "트레이너 삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B67854]">TRAINERS</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[#262320]">트레이너 관리</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-[#262320]/65">
          삭제는 실제 삭제가 아니라 비활성화 처리입니다. 기존 평가 데이터는 그대로 남습니다.
        </p>
      </div>

      <BranchSelect value={branch} onChange={setBranch} title="관리할 지점을 선택해 주세요." description="선택한 지점의 활성 트레이너 목록을 관리합니다." />

      <form onSubmit={handleAddTrainer} className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#262320]">새 트레이너 이름</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newTrainerName}
              onChange={(event) => setNewTrainerName(event.target.value)}
              className="h-12 flex-1 rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base font-medium text-[#262320] outline-none transition placeholder:text-[#262320]/35 focus:border-[#F6C343]"
              placeholder="예: 김트루"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#262320] px-5 text-sm font-black text-[#FFF9EF] transition hover:bg-[#6F553C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} aria-hidden />
              추가
            </button>
          </div>
        </label>
        {errorMessage ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-4 rounded-2xl bg-[#FFF4CA] px-4 py-3 text-sm font-bold text-[#6F553C]">{successMessage}</p> : null}
      </form>

      <div className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#262320]">{BRANCH_LABELS[branch]} 트레이너 목록</h2>
            <p className="mt-1 text-sm font-bold text-[#262320]/55">회원 평가 페이지에는 이 목록만 표시됩니다.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadTrainers()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-sm font-black text-[#262320] transition hover:border-[#F6C343] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} aria-hidden className={isLoading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <div className="rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 py-5 text-sm font-bold text-[#262320]/65">
              트레이너 목록을 불러오는 중입니다.
            </div>
          ) : null}
          {!isLoading && trainers.length === 0 ? (
            <div className="rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 py-5 text-sm font-bold text-[#262320]/65">
              등록된 활성 트레이너가 없습니다.
            </div>
          ) : null}
          {!isLoading
            ? trainers.map((trainer) => (
                <div key={trainer.id} className="flex flex-col gap-3 rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-lg font-black text-[#262320]">{trainer.name}</strong>
                    <p className="mt-1 text-xs font-bold text-[#262320]/48">등록일 {new Date(trainer.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeactivateTrainer(trainer)}
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={17} aria-hidden />
                    삭제
                  </button>
                </div>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
