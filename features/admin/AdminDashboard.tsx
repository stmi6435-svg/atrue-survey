"use client";

import { CalendarDays, ClipboardList, Phone, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { deleteSurveySubmission, getSurveySubmissions, updateSurveyStatus } from "@/lib/storage/surveyRepository";
import { BRANCH_LABELS, BRANCH_OPTIONS, STATUS_OPTIONS, SURVEY_LABELS } from "@/features/survey/constants";
import type { BranchId, SubmissionStatus, SurveySubmission } from "@/features/survey/types";
import { cn } from "@/lib/utils";

type BranchFilter = "all" | BranchId;
type ChartDatum = { name: string; value: number };

const CHART_COLORS = ["#262320", "#B67854", "#D7B98D", "#6F553C", "#EFE0CD", "#8D6E52"];

export function AdminDashboard() {
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchFilter>("all");
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

  const filteredSubmissions = useMemo(() => {
    if (selectedBranch === "all") {
      return submissions;
    }

    return submissions.filter((submission) => submission.branch === selectedBranch);
  }, [selectedBranch, submissions]);

  const stats = useMemo(() => {
    return {
      total: filteredSubmissions.length,
      trial: filteredSubmissions.filter((submission) => submission.surveyType === "trial").length,
      consultation: filteredSubmissions.filter((submission) => submission.surveyType === "consultation").length,
      newCount: filteredSubmissions.filter((submission) => submission.status === "신규").length,
    };
  }, [filteredSubmissions]);

  const charts = useMemo(() => {
    return {
      sources: countSingle(filteredSubmissions, (submission) => submission.source),
      genders: countSingle(filteredSubmissions, (submission) => submission.bodyInfo.gender),
      experiences: countSingle(filteredSubmissions, (submission) => submission.fitnessExperience),
      goals: countMultiple(filteredSubmissions, (submission) => submission.goals),
    };
  }, [filteredSubmissions]);

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

  async function deleteSubmission(id: string) {
    if (!confirm("정말 이 설문을 삭제하시겠습니까?")) {
      return;
    }

    const previous = submissions;
    setSubmissions((current) => current.filter((submission) => submission.id !== id));
    setErrorMessage("");

    try {
      await deleteSurveySubmission(id);
    } catch (error) {
      setSubmissions(previous);
      setErrorMessage(error instanceof Error ? error.message : "설문 삭제에 실패했습니다.");
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[28px] border border-oatmeal bg-ivory/95 p-5 shadow-soft sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">ATRUEGYM ADMIN</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-charcoal">지점별 설문 대시보드</h1>
              <p className="mt-2 text-sm leading-6 text-charcoal/60">
                지점별 설문 현황과 주요 응답 분포를 확인하고 상태를 관리합니다.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-charcoal px-5 text-sm font-bold text-ivory transition hover:bg-cocoa"
            >
              설문 화면
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <BranchButton active={selectedBranch === "all"} label="전체" onClick={() => setSelectedBranch("all")} />
            {BRANCH_OPTIONS.map((branch) => (
              <BranchButton
                key={branch.id}
                active={selectedBranch === branch.id}
                label={branch.label}
                onClick={() => setSelectedBranch(branch.id)}
              />
            ))}
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<ClipboardList size={18} />} label="전체" value={stats.total} />
          <StatCard icon={<UserRound size={18} />} label="체험권" value={stats.trial} />
          <StatCard icon={<Phone size={18} />} label="상담" value={stats.consultation} />
          <StatCard icon={<CalendarDays size={18} />} label="신규" value={stats.newCount} />
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PieCard title="유입경로" data={charts.sources} />
          <PieCard title="성별" data={charts.genders} />
          <PieCard title="헬스경험" data={charts.experiences} />
          <PieCard title="운동 목적" data={charts.goals} />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-oatmeal bg-white/90 shadow-soft">
          <div className="border-b border-oatmeal px-5 py-4">
            <h2 className="text-lg font-bold text-charcoal">
              {selectedBranch === "all" ? "전체" : BRANCH_LABELS[selectedBranch]} 설문 목록
            </h2>
            {errorMessage ? <p className="mt-2 text-sm font-semibold text-clay">{errorMessage}</p> : null}
          </div>

          {isLoading ? (
            <EmptyState message="설문 목록을 불러오는 중입니다." />
          ) : filteredSubmissions.length === 0 ? (
            <EmptyState message="해당 지점에 제출된 설문이 없습니다." />
          ) : (
            <>
              <DesktopTable
                submissions={filteredSubmissions}
                onDelete={deleteSubmission}
                onStatusChange={updateStatus}
              />
              <MobileCards
                submissions={filteredSubmissions}
                onDelete={deleteSubmission}
                onStatusChange={updateStatus}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function BranchButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-2 text-sm font-bold transition",
        active ? "border-charcoal bg-charcoal text-ivory" : "border-oatmeal bg-white text-charcoal hover:border-cocoa",
      )}
    >
      {label}
    </button>
  );
}

function DesktopTable({
  submissions,
  onDelete,
  onStatusChange,
}: {
  submissions: SurveySubmission[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1180px] border-collapse text-left">
        <thead className="bg-ivory text-xs font-bold text-cocoa">
          <tr>
            <th className="px-4 py-3">지점</th>
            <th className="px-4 py-3">설문 유형</th>
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">연락처</th>
            <th className="px-4 py-3">운동 목적</th>
            <th className="px-4 py-3">건강주의사항</th>
            <th className="px-4 py-3">희망 시간대</th>
            <th className="px-4 py-3">제출일</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">삭제</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-oatmeal">
          {submissions.map((submission) => (
            <tr key={submission.id} className="align-top text-sm text-charcoal/75">
              <td className="px-4 py-4 font-bold text-charcoal">{BRANCH_LABELS[submission.branch]}</td>
              <td className="px-4 py-4 font-bold text-charcoal">{SURVEY_LABELS[submission.surveyType]}</td>
              <td className="px-4 py-4">
                <Link className="font-bold text-cocoa underline-offset-4 hover:underline" href={`/admin/submissions/${submission.id}`}>
                  {submission.basicInfo.name}
                </Link>
              </td>
              <td className="px-4 py-4">{submission.basicInfo.phone}</td>
              <td className="px-4 py-4">{submission.goals.join(", ")}</td>
              <td className="px-4 py-4">{healthCautions(submission)}</td>
              <td className="px-4 py-4">{preferredTimes(submission)}</td>
              <td className="px-4 py-4">{formatDate(submission.submittedAt)}</td>
              <td className="px-4 py-4">
                <StatusSelect value={submission.status} onChange={(status) => onStatusChange(submission.id, status)} />
              </td>
              <td className="px-4 py-4">
                <DeleteButton onClick={() => onDelete(submission.id)} />
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
  onDelete,
  onStatusChange,
}: {
  submissions: SurveySubmission[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}) {
  return (
    <div className="grid gap-3 p-4 lg:hidden">
      {submissions.map((submission) => (
        <article key={submission.id} className="rounded-3xl border border-oatmeal bg-ivory p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-clay">
                {BRANCH_LABELS[submission.branch]} · {SURVEY_LABELS[submission.surveyType]}
              </p>
              <Link className="mt-1 block text-lg font-bold text-charcoal" href={`/admin/submissions/${submission.id}`}>
                {submission.basicInfo.name}
              </Link>
              <p className="mt-1 text-sm text-charcoal/60">{submission.basicInfo.phone}</p>
            </div>
            <StatusSelect value={submission.status} onChange={(status) => onStatusChange(submission.id, status)} />
          </div>
          <InfoLine label="운동 목적" value={submission.goals.join(", ")} />
          <InfoLine label="건강주의사항" value={healthCautions(submission)} />
          <InfoLine label="희망 시간대" value={preferredTimes(submission)} />
          <InfoLine label="제출일" value={formatDate(submission.submittedAt)} />
          <button
            type="button"
            onClick={() => onDelete(submission.id)}
            className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-clay px-4 text-sm font-bold text-clay"
          >
            <Trash2 size={16} aria-hidden />
            삭제
          </button>
        </article>
      ))}
    </div>
  );
}

function PieCard({ title, data }: { title: string; data: ChartDatum[] }) {
  return (
    <div className="rounded-3xl border border-oatmeal bg-white/90 p-4 shadow-soft">
      <h3 className="text-sm font-bold text-charcoal">{title}</h3>
      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-sm font-semibold text-charcoal/50">데이터 없음</div>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={36} outerRadius={68} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}건`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 grid gap-1 text-xs text-charcoal/70">
        {data.slice(0, 4).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-bold">{item.value}</span>
          </div>
        ))}
      </div>
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

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-clay text-clay transition hover:bg-clay hover:text-white"
      aria-label="설문 삭제"
      title="설문 삭제"
    >
      <Trash2 size={16} aria-hidden />
    </button>
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

function countSingle(items: SurveySubmission[], selector: (submission: SurveySubmission) => string): ChartDatum[] {
  return sortChartData(
    items.reduce<Record<string, number>>((acc, submission) => {
      const key = selector(submission) || "미입력";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  );
}

function countMultiple(items: SurveySubmission[], selector: (submission: SurveySubmission) => string[]): ChartDatum[] {
  return sortChartData(
    items.reduce<Record<string, number>>((acc, submission) => {
      const values = selector(submission);
      if (values.length === 0) {
        acc["미입력"] = (acc["미입력"] || 0) + 1;
      }
      values.forEach((value) => {
        acc[value] = (acc[value] || 0) + 1;
      });
      return acc;
    }, {}),
  );
}

function sortChartData(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
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
