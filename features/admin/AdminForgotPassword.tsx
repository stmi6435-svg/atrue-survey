"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const SUCCESS_MESSAGE = "비밀번호 재설정 메일을 발송했습니다. 이메일을 확인해주세요.";
const RATE_LIMIT_MESSAGE = "비밀번호 재설정 메일 발송 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.";
const DEFAULT_ERROR_MESSAGE = "비밀번호 재설정 메일 발송에 실패했습니다.";

function getResetPasswordErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return DEFAULT_ERROR_MESSAGE;
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("email rate limit exceeded") ||
    (normalizedMessage.includes("rate limit") && normalizedMessage.includes("email"))
  ) {
    return RATE_LIMIT_MESSAGE;
  }

  return error.message;
}

export function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("관리자 이메일을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage(SUCCESS_MESSAGE);
    } catch (error) {
      setErrorMessage(getResetPasswordErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9EF] px-5 py-10 text-[#262320]">
      <section className="w-full max-w-md rounded-3xl border border-[#EFE0CD] bg-white p-6 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4CA] text-[#6F553C]">
          <MailCheck size={28} aria-hidden />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B67854]">ATRUEGYM ADMIN</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#262320]">관리자 비밀번호 찾기</h1>
        <p className="mt-3 text-sm leading-6 text-[#262320]/65">
          관리자 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#262320]">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base text-[#262320] outline-none transition placeholder:text-[#262320]/40 focus:border-[#F6C343]"
              placeholder="admin@example.com"
              disabled={isSubmitting}
              required
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{errorMessage}</p>
          ) : null}
          {message ? <p className="rounded-2xl bg-[#FFF4CA] px-4 py-3 text-sm font-bold leading-6 text-[#6F553C]">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-[#262320] px-5 text-sm font-bold text-[#FFF9EF] transition hover:bg-[#6F553C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "메일 발송 중..." : "재설정 메일 보내기"}
          </button>
        </form>

        <Link
          href="/admin/login"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#EFE0CD] bg-white px-5 text-sm font-bold text-[#6F553C] transition hover:border-[#F6C343] sm:w-auto"
        >
          관리자 로그인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
