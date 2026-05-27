"use client";

type StarRatingProps = {
  label: string;
  helper?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const SCORES = [1, 2, 3, 4, 5];

export function StarRating({ label, helper, value, onChange, disabled = false }: StarRatingProps) {
  return (
    <fieldset className="rounded-3xl border border-[#EFE0CD] bg-white p-4 sm:p-5">
      <legend className="px-1 text-base font-black text-[#262320]">{label}</legend>
      {helper ? <p className="mt-1 text-sm font-medium leading-6 text-[#262320]/60">{helper}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {SCORES.map((score) => {
          const isSelected = score <= value;

          return (
            <button
              key={score}
              type="button"
              aria-label={`${label} ${score}점`}
              aria-pressed={value === score}
              disabled={disabled}
              onClick={() => onChange(score)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-4xl leading-none transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#F6C343] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-14 sm:text-5xl"
            >
              <span className={isSelected ? "text-[#F6C343] drop-shadow-sm" : "text-[#D8CABA]"}>★</span>
            </button>
          );
        })}
        <span className="ml-1 rounded-full bg-[#FFF9EF] px-3 py-1 text-sm font-black text-[#6F553C]">
          {value ? `${value}점` : "미선택"}
        </span>
      </div>
    </fieldset>
  );
}
