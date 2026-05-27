"use client";

import { LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const STORAGE_KEY = "atruegym_trainer_review_admin_unlocked";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

export function TrainerAdminGuard({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsUnlocked(window.localStorage.getItem(STORAGE_KEY) === "true");
    setIsChecking(false);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!ADMIN_PASSWORD) {
      setErrorMessage(".env.local에 NEXT_PUBLIC_ADMIN_PASSWORD를 설정해 주세요.");
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setErrorMessage("관리자 비밀번호를 다시 확인해 주세요.");
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, "true");
    setIsUnlocked(true);
  }

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9EF] px-5 text-[#262320]">
        <div className="rounded-3xl border border-[#EFE0CD] bg-white px-6 py-5 text-sm font-bold shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
          관리자 화면을 준비하고 있습니다.
        </div>
      </main>
    );
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9EF] px-5 py-10 text-[#262320]">
        <section className="w-full max-w-md rounded-3xl border border-[#EFE0CD] bg-white p-6 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#262320] text-[#FFF9EF]">
            <LockKeyhole size={26} aria-hidden />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B67854]">TRAINER REVIEW ADMIN</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">관리자 확인</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-[#262320]/65">
            트레이너 평가 관리 화면에 접근하려면 관리자 비밀번호를 입력해 주세요.
          </p>
          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base text-[#262320] outline-none transition placeholder:text-[#262320]/40 focus:border-[#F6C343]"
                placeholder="NEXT_PUBLIC_ADMIN_PASSWORD"
                required
              />
            </label>
            {errorMessage ? <p className="text-sm font-bold text-red-700">{errorMessage}</p> : null}
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#262320] px-5 text-sm font-black text-[#FFF9EF] transition hover:bg-[#6F553C]"
            >
              확인
            </button>
          </form>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
