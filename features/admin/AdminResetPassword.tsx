"use client";

import { CheckCircle2, KeyRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const EXPIRED_LINK_MESSAGE =
  "비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다. 다시 비밀번호 재설정 메일을 요청해주세요.";

type SessionState = "checking" | "ready" | "missing";

async function resolveRecoverySession() {
  const supabase = getSupabaseClient();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const code = queryParams.get("code");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    window.history.replaceState(null, "", window.location.pathname);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    window.history.replaceState(null, "", window.location.pathname);
  }

  return supabase.auth.getSession();
}

export function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSuccess = Boolean(message);

  useEffect(() => {
    async function checkRecoverySession() {
      try {
        const { data, error } = await resolveRecoverySession();

        if (error) {
          throw error;
        }

        if (!data.session) {
          setSessionState("missing");
          setErrorMessage(EXPIRED_LINK_MESSAGE);
          return;
        }

        setSessionState("ready");
      } catch {
        setSessionState("missing");
        setErrorMessage(EXPIRED_LINK_MESSAGE);
      }
    }

    void checkRecoverySession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    if (sessionState !== "ready") {
      setErrorMessage(EXPIRED_LINK_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setSessionState("missing");
        setErrorMessage(EXPIRED_LINK_MESSAGE);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setPassword("");
      setPasswordConfirm("");
      setMessage("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
    } catch (error) {
      const nextMessage = error instanceof Error && error.message ? error.message : EXPIRED_LINK_MESSAGE;
      setErrorMessage(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9EF] px-5 py-10 text-[#262320]">
      <section className="w-full max-w-md rounded-3xl border border-[#EFE0CD] bg-white p-6 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4CA] text-[#6F553C]">
          {isSuccess ? <CheckCircle2 size={28} aria-hidden /> : <KeyRound size={28} aria-hidden />}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B67854]">ATRUEGYM ADMIN</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#262320]">관리자 비밀번호 재설정</h1>
        <p className="mt-3 text-sm leading-6 text-[#262320]/65">새로 사용할 관리자 비밀번호를 입력해주세요.</p>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#262320]">새 비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base text-[#262320] outline-none transition placeholder:text-[#262320]/40 focus:border-[#F6C343]"
              placeholder="8자 이상 입력"
              disabled={isSubmitting || sessionState !== "ready" || isSuccess}
              minLength={8}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#262320]">새 비밀번호 확인</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#EFE0CD] bg-[#FFF9EF] px-4 text-base text-[#262320] outline-none transition placeholder:text-[#262320]/40 focus:border-[#F6C343]"
              placeholder="비밀번호 다시 입력"
              disabled={isSubmitting || sessionState !== "ready" || isSuccess}
              minLength={8}
              required
            />
          </label>

          {sessionState === "checking" ? (
            <p className="rounded-2xl bg-[#FFF9EF] px-4 py-3 text-sm font-bold leading-6 text-[#262320]/60">
              비밀번호 재설정 링크를 확인하고 있습니다.
            </p>
          ) : null}
          {errorMessage ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{errorMessage}</p>
          ) : null}
          {message ? <p className="rounded-2xl bg-[#FFF4CA] px-4 py-3 text-sm font-bold leading-6 text-[#6F553C]">{message}</p> : null}

          {!isSuccess ? (
            <button
              type="submit"
              disabled={isSubmitting || sessionState !== "ready"}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-[#262320] px-5 text-sm font-bold text-[#FFF9EF] transition hover:bg-[#6F553C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "변경 중..." : "비밀번호 변경"}
            </button>
          ) : null}
        </form>

        <Link
          href="/admin/login"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#EFE0CD] bg-white px-5 text-sm font-bold text-[#6F553C] transition hover:border-[#F6C343] sm:w-auto"
        >
          관리자 로그인으로 이동
        </Link>
      </section>
    </main>
  );
}
