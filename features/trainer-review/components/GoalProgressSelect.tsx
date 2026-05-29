"use client";

import { GOAL_PROGRESS_OPTIONS, GOAL_PROGRESS_QUESTION } from "../constants";

type GoalProgressSelectProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function GoalProgressSelect({ value, onChange, disabled = false }: GoalProgressSelectProps) {
  return (
    <fieldset className="rounded-3xl border border-[#EFE0CD] bg-white p-4 sm:p-5">
      <legend className="px-1 text-base font-black text-[#262320]">목표 달성 체감 점수</legend>
      <p className="mt-1 text-sm font-medium leading-6 text-[#262320]/60">{GOAL_PROGRESS_QUESTION}</p>

      <div className="mt-4 grid gap-2">
        {GOAL_PROGRESS_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-[#F6C343] bg-[#FFF4CA] shadow-[0_10px_24px_rgba(246,195,67,0.18)]"
                  : "border-[#EFE0CD] bg-[#FFF9EF] hover:border-[#F6C343]"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${isSelected ? "bg-[#262320] text-[#F6C343]" : "bg-white text-[#6F553C]"}`}>
                {option.value}
              </span>
              <span className="text-sm font-black leading-6 text-[#262320] sm:text-base">{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
