"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

function getSafeNextPath() {
  if (typeof window === "undefined") {
    return "/admin";
  }

  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  return next;
}

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/admin");

  useEffect(() => {
    const supabase = getSupabaseClient();
    const target = getSafeNextPath();
    setRedirectTarget(target);

    async function redirectIfLoggedIn() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace(target);
      }
    }

    void redirectIfLoggedIn();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.replace(redirectTarget);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9EF] px-5 py-10 text-[#262320]">
      <section className="w-full max-w-md rounded-3xl border border-[#EFE0CD] bg-white p-6 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#262320] text-[#FFF9EF]">
          <LockKeyhole size={26} aria-hidden />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B67854]">ATRUEGYM ADMIN</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#262320]">관리자 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-[#262320]/65">
          어트루짐 설문 관리자 화면은 로그인 후 이용할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#262320]">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base text-[#262320] outline-none transition placeholder:text-[#262320]/40 focus:border-[#262320]"
              placeholder="admin@example.com"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#262320]">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base text-[#262320] outline-none transition placeholder:text-[#262320]/40 focus:border-[#262320]"
              placeholder="비밀번호 입력"
              required
            />
          </label>

          {errorMessage ? <p className="text-sm font-semibold text-[#B67854]">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-[#262320] px-5 text-sm font-bold text-[#FFF9EF] transition hover:bg-[#6F553C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>

          <Link
            href="/admin/forgot-password"
            className="justify-self-center text-sm font-bold text-[#6F553C] underline-offset-4 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </form>

        <Link href="/" className="mt-6 inline-flex text-sm font-bold text-[#6F553C] underline-offset-4 hover:underline">
          설문 페이지로 돌아가기
        </Link>
      </section>
    </main>
  );
}
