"use client";

import { CalendarDays, ClipboardList, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSurveySubmissions, updateSurveyStatus } from "@/lib/storage/surveyRepository";
import { STATUS_OPTIONS, SURVEY_LABELS } from "@/features/survey/constants";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

export function AdminDashboard() {
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const saved = await getSurveySubmissions();
        setSubmissions(saved);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "설문 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSubmissions();
  }, []);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      trial: submissions.filter((submission) => submission.surveyType === "trial").length,
      consultation: submissions.filter((submission) => submission.surveyType === "consultation").length,
      newCount: submissions.filter((submission) => submission.status === "신규").length,
    };
  }, [submissions]);

  async function updateStatus(id: string, status: SubmissionStatus) {
    const previous = submissions;
    const next = submissions.map((submission) => (submission.id === id ? { ...submission, status } : submission));
    setSubmissions(next);
    setErrorMessage("");

    try {
      await updateSurveyStatus(id, status);
    } catch (error) {
      setSubmissions(previous);
      setErrorMessage(error instanceof Error ? error.message : "상태 변경에 실패했습니다.");
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[28px] border border-oatmeal bg-ivory/95 p-5 shadow-soft sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">ATRUEGYM ADMIN</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-charcoal">사전 설문 관리자</h1>
              <p className="mt-2 text-sm leading-6 text-charcoal/60">
                Supabase의 pt_survey_submissions 테이블에서 제출 목록을 불러오고 상태값을 관리합니다.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-charcoal px-5 text-sm font-bold text-ivory transition hover:bg-cocoa"
            >
              설문 화면
            </Link>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<ClipboardList size={18} />} label="전체" value={stats.total} />
          <StatCard icon={<UserRound size={18} />} label="체험권" value={stats.trial} />
          <StatCard icon={<Phone size={18} />} label="상담" value={stats.consultation} />
          <StatCard icon={<CalendarDays size={18} />} label="신규" value={stats.newCount} />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-oatmeal bg-white/90 shadow-soft">
          <div className="border-b border-oatmeal px-5 py-4">
            <h2 className="text-lg font-bold text-charcoal">제출된 설문 목록</h2>
            {errorMessage ? <p className="mt-2 text-sm font-semibold text-clay">{errorMessage}</p> : null}
          </div>

          {isLoading ? (
            <EmptyState message="설문 목록을 불러오는 중입니다." />
          ) : submissions.length === 0 ? (
            <EmptyState message="아직 제출된 설문이 없습니다." />
          ) : (
            <>
              <DesktopTable submissions={submissions} onStatusChange={updateStatus} />
              <MobileCards submissions={submissions} onStatusChange={updateStatus} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function DesktopTable({
  submissions,
  onStatusChange,
}: {
  submissions: SurveySubmission[];
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1100px] border-collapse text-left">
        <thead className="bg-ivory text-xs font-bold text-cocoa">
          <tr>
            <th className="px-4 py-3">설문 유형</th>
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">연락처</th>
            <th className="px-4 py-3">운동 목적</th>
            <th className="px-4 py-3">건강주의사항</th>
            <th className="px-4 py-3">희망 시간대</th>
            <th className="px-4 py-3">제출일</th>
            <th className="px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-oatmeal">
          {submissions.map((submission) => (
            <tr key={submission.id} className="align-top text-sm text-charcoal/75">
              <td className="px-4 py-4 font-bold text-charcoal">{SURVEY_LABELS[submission.surveyType]}</td>
              <td className="px-4 py-4">{submission.basicInfo.name}</td>
              <td className="px-4 py-4">{submission.basicInfo.phone}</td>
              <td className="px-4 py-4">{submission.goals.join(", ")}</td>
              <td className="px-4 py-4">{healthCautions(submission)}</td>
              <td className="px-4 py-4">{preferredTimes(submission)}</td>
              <td className="px-4 py-4">{formatDate(submission.submittedAt)}</td>
              <td className="px-4 py-4">
                <StatusSelect value={submission.status} onChange={(status) => onStatusChange(submission.id, status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({
  submissions,
  onStatusChange,
}: {
  submissions: SurveySubmission[];
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}) {
  return (
    <div className="grid gap-3 p-4 lg:hidden">
      {submissions.map((submission) => (
        <article key={submission.id} className="rounded-3xl border border-oatmeal bg-ivory p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-clay">{SURVEY_LABELS[submission.surveyType]}</p>
              <h3 className="mt-1 text-lg font-bold text-charcoal">{submission.basicInfo.name}</h3>
              <p className="mt-1 text-sm text-charcoal/60">{submission.basicInfo.phone}</p>
            </div>
            <StatusSelect value={submission.status} onChange={(status) => onStatusChange(submission.id, status)} />
          </div>
          <InfoLine label="운동 목적" value={submission.goals.join(", ")} />
          <InfoLine label="건강주의사항" value={healthCautions(submission)} />
          <InfoLine label="희망 시간대" value={preferredTimes(submission)} />
          <InfoLine label="제출일" value={formatDate(submission.submittedAt)} />
        </article>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-12 text-center text-sm font-semibold text-charcoal/60">{message}</div>;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-oatmeal bg-white/90 p-4 shadow-soft">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-charcoal text-ivory">{icon}</div>
      <p className="text-xs font-bold text-cocoa">{label}</p>
      <p className="mt-1 text-2xl font-bold text-charcoal">{value}</p>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: SubmissionStatus;
  onChange: (status: SubmissionStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SubmissionStatus)}
      className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold text-charcoal outline-none focus:border-charcoal"
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-oatmeal py-3">
      <p className="text-xs font-bold text-cocoa">{label}</p>
      <p className="mt-1 text-sm leading-6 text-charcoal/75">{value}</p>
    </div>
  );
}

function healthCautions(submission: SurveySubmission) {
  const injuries = submission.health.injuries.join(", ");
  const diseases = submission.health.diseases.join(", ");
  const restriction =
    submission.health.hasMedicalRestriction === "예" ? `운동 제한: ${submission.health.medicalRestrictionDetail}` : "운동 제한 없음";

  return `통증: ${injuries} / 질환: ${diseases} / ${restriction}`;
}

function preferredTimes(submission: SurveySubmission) {
  return `${submission.lifestyle.preferredWorkoutTime}, 1순위 ${submission.lifestyle.firstChoiceTime}, 2순위 ${submission.lifestyle.secondChoiceTime}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
