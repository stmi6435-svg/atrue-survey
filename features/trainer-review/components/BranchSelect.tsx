"use client";

import { BRANCH_OPTIONS } from "../constants";
import type { BranchId } from "../types";

type BranchSelectProps = {
  value: BranchId | "";
  onChange: (branch: BranchId) => void;
  title?: string;
  description?: string;
};

export function BranchSelect({
  value,
  onChange,
  title = "어느 지점에서 수업을 받고 계신가요?",
  description = "선택한 지점에 등록된 트레이너만 보여드릴게요.",
}: BranchSelectProps) {
  return (
    <section className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B67854]">STEP 1</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-[#262320]">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-[#262320]/65">{description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {BRANCH_OPTIONS.map((branch) => {
          const isSelected = value === branch.id;

          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onChange(branch.id)}
              className={`min-h-16 rounded-2xl border px-4 py-3 text-left text-base font-black transition ${
                isSelected
                  ? "border-[#F6C343] bg-[#FFF4CA] text-[#262320] shadow-[0_10px_24px_rgba(246,195,67,0.22)]"
                  : "border-[#EFE0CD] bg-[#FFF9EF] text-[#262320]/75 hover:border-[#F6C343]"
              }`}
            >
              {branch.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
