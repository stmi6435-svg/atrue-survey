"use client";

import { ArrowLeft, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteSurveySubmission, getSurveySubmissionById, updateSurveyStatus } from "@/lib/storage/surveyRepository";
import { getSupabaseClient } from "@/lib/supabase";
import { BRANCH_LABELS, STATUS_OPTIONS, SURVEY_LABELS } from "@/features/survey/constants";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

export function SubmissionDetail({ id }: { id: string }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<SurveySubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSubmission() {
      try {
        setSubmission(await getSurveySubmissionById(id));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "설문 상세 내용을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSubmission();
  }, [id]);

  async function handleStatusChange(status: SubmissionStatus) {
    if (!submission) {
      return;
    }

    const previous = submission;
    setSubmission({ ...submission, status });
    setErrorMessage("");

    try {
      await updateSurveyStatus(submission.id, status);
    } catch (error) {
      setSubmission(previous);
      setErrorMessage(error instanceof Error ? error.message : "상태 변경에 실패했습니다.");
    }
  }

  async function handleDelete() {
    if (!submission || !confirm("정말 이 설문을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteSurveySubmission(submission.id);
      router.push("/admin/surveys");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "설문 삭제에 실패했습니다.");
    }
  }

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-[28px] border border-oatmeal bg-ivory/95 p-5 shadow-soft sm:p-7">
          <Link href="/admin/surveys" className="inline-flex items-center gap-2 text-sm font-bold text-cocoa">
            <ArrowLeft size={16} aria-hidden />
            관리자 목록
          </Link>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">SURVEY DETAIL</p>
              <h1 className="mt-2 text-3xl font-bold text-charcoal">
                {submission ? `${submission.basicInfo.name} 회원 설문` : "설문 상세"}
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {submission ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-clay px-5 text-sm font-bold text-clay transition hover:bg-clay hover:text-white"
                >
                  <Trash2 size={16} aria-hidden />
                  삭제
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-charcoal px-5 text-sm font-bold text-ivory transition hover:bg-cocoa"
              >
                <LogOut size={16} aria-hidden />
                로그아웃
              </button>
            </div>
          </div>
          {errorMessage ? <p className="mt-4 text-sm font-semibold text-clay">{errorMessage}</p> : null}
        </header>

        {isLoading ? (
          <DetailEmpty message="설문 상세 내용을 불러오는 중입니다." />
        ) : !submission ? (
          <DetailEmpty message="설문을 찾을 수 없습니다." />
        ) : (
          <div className="grid gap-5">
            <section className="rounded-[28px] border border-oatmeal bg-white/90 p-5 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryItem label="설문 유형" value={SURVEY_LABELS[submission.surveyType]} />
                <SummaryItem label="신청 지점" value={BRANCH_LABELS[submission.branch]} />
                <SummaryItem label="제출일" value={formatDate(submission.submittedAt)} />
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-cocoa">현재 상태</span>
                  <select
                    value={submission.status}
                    onChange={(event) => handleStatusChange(event.target.value as SubmissionStatus)}
                    className="h-11 w-full rounded-2xl border border-oatmeal bg-ivory px-3 text-sm font-bold text-charcoal outline-none focus:border-charcoal"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <DetailSection title="기본 신청 정보">
              <DetailRow label="신청 지점" value={BRANCH_LABELS[submission.branch]} />
              <DetailRow label="유입 경로" value={safeText(submission.source)} />
              <DetailRow label="성함" value={safeText(submission.basicInfo?.name)} />
              <DetailRow label="연락처" value={safeText(submission.basicInfo?.phone)} />
              <DetailRow label="나이" value={safeText(submission.basicInfo?.age)} />
              <DetailRow label="직업" value={safeText(submission.basicInfo?.job)} />
              <DetailRow label="취미" value={safeText(submission.basicInfo?.hobby)} />
            </DetailSection>

            <DetailSection title="신체정보와 운동 경험">
              <DetailRow label="성별" value={safeText(submission.bodyInfo?.gender)} />
              <DetailRow label="키" value={withUnit(submission.bodyInfo?.height, "cm")} />
              <DetailRow label="몸무게" value={withUnit(submission.bodyInfo?.weight, "kg")} />
              <DetailRow label="헬스 경험" value={safeText(submission.fitnessExperience)} />
              <DetailRow label="운동 목적" value={joinOrFallback(submission.goals)} />
            </DetailSection>

            <DetailSection title="건강 상태">
              <DetailRow label="부상 및 통증 부위" value={joinOrFallback(submission.health?.injuries)} />
              <DetailRow label="질환 및 질병" value={joinOrFallback(submission.health?.diseases)} />
              <DetailRow label="운동 제한 여부" value={safeText(submission.health?.hasMedicalRestriction)} />
              <DetailRow label="운동 제한 상세" value={safeText(submission.health?.medicalRestrictionDetail, "없음")} />
            </DetailSection>

            <DetailSection title="라이프스타일">
              <DetailRow label="평소 활동량" value={safeText(submission.lifestyle?.activityLevel)} />
              <DetailRow label="평균 수면시간" value={safeText(submission.lifestyle?.sleepHours)} />
              <DetailRow label="스트레스 수준" value={safeText(submission.lifestyle?.stressLevel)} />
              <DetailRow label="식사 규칙성" value={safeText(submission.lifestyle?.mealRegularity)} />
              <DetailRow label="주 운동 가능 횟수" value={safeText(submission.lifestyle?.weeklyWorkoutCount)} />
              <DetailRow label="선호 운동 시간대" value={safeText(submission.lifestyle?.preferredWorkoutTime)} />
              <DetailRow label="1순위 희망 시간" value={safeText(submission.lifestyle?.firstChoiceTime)} />
              <DetailRow label="2순위 희망 시간" value={safeText(submission.lifestyle?.secondChoiceTime)} />
            </DetailSection>

            <DetailSection title="상담 참고 내용">
              <DetailRow label="배워보고 싶은 운동" value={safeText(submission.desiredExercises)} />
              <DetailRow label="상담자에게 바라는 점" value={safeText(submission.requestToCoach)} />
              <DetailRow label="개인정보 동의 여부" value={submission.privacyConsent ? "동의" : "미동의"} />
            </DetailSection>
          </div>
        )}
      </div>
    </main>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-oatmeal bg-white/90 p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-bold text-charcoal">{title}</h2>
      <dl className="divide-y divide-oatmeal">{children}</dl>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs font-bold text-cocoa">{label}</dt>
      <dd className="text-sm leading-6 text-charcoal/80">{value}</dd>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-cocoa">{label}</p>
      <p className="mt-2 text-base font-bold text-charcoal">{value}</p>
    </div>
  );
}

function DetailEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-oatmeal bg-white/90 px-5 py-12 text-center text-sm font-semibold text-charcoal/60 shadow-soft">
      {message}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "미입력";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown, fallback = "미입력") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function joinOrFallback(value: unknown) {
  const items = safeArray(value).map((item) => safeText(item)).filter((item) => item !== "미입력");
  return items.length > 0 ? items.join(", ") : "미입력";
}

function withUnit(value: unknown, unit: string) {
  const text = safeText(value);
  return text === "미입력" ? text : `${text}${unit}`;
}
