"use client";

import { UserRoundCheck } from "lucide-react";
import type { Trainer } from "../types";

type TrainerSelectProps = {
  trainers: Trainer[];
  value: string;
  onChange: (trainerId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export function TrainerSelect({ trainers, value, onChange, isLoading = false, disabled = false }: TrainerSelectProps) {
  return (
    <section className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B67854]">STEP 2</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-[#262320]">평가할 트레이너를 선택해 주세요.</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {isLoading ? (
          <div className="rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 py-5 text-sm font-bold text-[#262320]/65">
            트레이너 목록을 불러오는 중입니다.
          </div>
        ) : null}
        {!isLoading && trainers.length === 0 ? (
          <div className="rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 py-5 text-sm font-bold text-[#262320]/65">
            이 지점에 등록된 활성 트레이너가 아직 없습니다.
          </div>
        ) : null}
        {!isLoading
          ? trainers.map((trainer) => {
              const isSelected = value === trainer.id;

              return (
                <button
                  key={trainer.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(trainer.id)}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? "border-[#F6C343] bg-[#FFF4CA] shadow-[0_10px_24px_rgba(246,195,67,0.22)]"
                      : "border-[#EFE0CD] bg-[#FFF9EF] hover:border-[#F6C343]"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isSelected ? "bg-[#262320] text-[#F6C343]" : "bg-white text-[#6F553C]"}`}>
                    <UserRoundCheck size={20} aria-hidden />
                  </span>
                  <span className="text-base font-black text-[#262320]">{trainer.name}</span>
                </button>
              );
            })
          : null}
      </div>
    </section>
  );
}
