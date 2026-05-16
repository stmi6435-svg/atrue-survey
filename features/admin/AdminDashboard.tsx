"use client";

import { ClipboardList, LogOut, Phone, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { deleteSurveySubmission, getSurveySubmissions, updateSurveyStatus } from "@/lib/storage/surveyRepository";
import { getSupabaseClient } from "@/lib/supabase";
import { BRANCH_LABELS, BRANCH_OPTIONS, STATUS_OPTIONS, SURVEY_LABELS } from "@/features/survey/constants";
import type { BranchId, SubmissionStatus, SurveySubmission } from "@/features/survey/types";

type BranchFilter = "all" | BranchId;
type ChartDatum = { name: string; value: number };

const chartColors = ["#262320", "#B67854", "#D7B98D", "#6F553C", "#EFE0CD", "#8D6E52"];

export function AdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setSubmissions(await getSurveySubmissions());
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

  const stats = useMemo(
    () => ({
      total: filteredSubmissions.length,
      trial: filteredSubmissions.filter((submission) => submission.surveyType === "trial").length,
      consultation: filteredSubmissions.filter((submission) => submission.surveyType === "consultation").length,
    }),
    [filteredSubmissions],
  );

  const charts = useMemo(
    () => [
      { title: "유입경로", data: countSingle(filteredSubmissions, (submission) => safeText(submission.source)) },
      { title: "성별", data: countSingle(filteredSubmissions, (submission) => safeText(submission.bodyInfo?.gender)) },
      { title: "헬스경험", data: countSingle(filteredSubmissions, (submission) => safeText(submission.fitnessExperience)) },
      { title: "운동 목적", data: countMultiple(filteredSubmissions, (submission) => safeArray(submission.goals)) },
    ],
    [filteredSubmissions],
  );

  async function handleStatusChange(id: string, status: SubmissionStatus) {
    const previous = submissions;
    setSubmissions((current) => current.map((submission) => (submission.id === id ? { ...submission, status } : submission)));
    setErrorMessage("");

    try {
      await updateSurveyStatus(id, status);
    } catch (error) {
      setSubmissions(previous);
      setErrorMessage(error instanceof Error ? error.message : "상태 변경에 실패했습니다.");
    }
  }

  async function handleDelete(id: string) {
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

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#FFF9EF] px-4 py-5 text-[#262320] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-[#EFE0CD] bg-[#FFF9EF] p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B67854]">ATRUEGYM ADMIN</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-[#262320] sm:text-4xl">지점별 설문 대시보드</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#262320]/65">
                지점별 설문 현황과 주요 응답 분포를 확인하고, 상담 진행 상태를 빠르게 관리합니다.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#EFE0CD] bg-white px-5 text-sm font-bold text-[#262320] shadow-sm transition hover:border-[#6F553C]"
              >
                설문 화면
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#262320] px-5 text-sm font-bold text-[#FFF9EF] shadow-sm transition hover:bg-[#6F553C]"
              >
                <LogOut size={16} aria-hidden />
                로그아웃
              </button>
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="지점 필터">
            <FilterButton active={selectedBranch === "all"} label="전체" onClick={() => setSelectedBranch("all")} />
            {BRANCH_OPTIONS.map((branch) => (
              <FilterButton
                key={branch.id}
                active={selectedBranch === branch.id}
                label={branch.label}
                onClick={() => setSelectedBranch(branch.id)}
              />
            ))}
          </nav>
        </header>

        {errorMessage ? (
          <div className="rounded-3xl border border-[#B67854] bg-white px-5 py-4 text-sm font-semibold text-[#B67854] shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard icon={<ClipboardList size={19} />} label="전체" value={stats.total} />
          <SummaryCard icon={<UserRound size={19} />} label="체험권" value={stats.trial} />
          <SummaryCard icon={<Phone size={19} />} label="상담" value={stats.consultation} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {charts.map((chart) => (
            <ChartCard key={chart.title} title={chart.title} data={chart.data} />
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#EFE0CD] bg-white shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
          <div className="border-b border-[#EFE0CD] bg-[#FFF9EF] px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B67854]">SUBMISSIONS</p>
            <h2 className="mt-1 text-xl font-bold text-[#262320]">
              {selectedBranch === "all" ? "전체" : BRANCH_LABELS[selectedBranch]} 설문 목록
            </h2>
          </div>

          {isLoading ? (
            <EmptyState message="설문 목록을 불러오는 중입니다." />
          ) : filteredSubmissions.length === 0 ? (
            <EmptyState message="해당 지점에 제출된 설문이 없습니다." />
          ) : (
            <>
              <DesktopTable submissions={filteredSubmissions} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              <MobileList submissions={filteredSubmissions} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-11 rounded-2xl border border-[#262320] bg-[#262320] px-4 text-sm font-bold text-[#FFF9EF] shadow-sm transition"
          : "h-11 rounded-2xl border border-[#EFE0CD] bg-white px-4 text-sm font-bold text-[#262320] transition hover:border-[#6F553C] hover:bg-[#EFE0CD]/40"
      }
    >
      {label}
    </button>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#262320] text-[#FFF9EF]">{icon}</div>
      <p className="text-xs font-bold text-[#6F553C]">{label}</p>
      <p className="mt-1 text-3xl font-bold leading-none text-[#262320]">{value}</p>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: ChartDatum[] }) {
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-3xl border border-[#EFE0CD] bg-white p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B67854]">CHART</p>
          <h3 className="mt-1 text-lg font-bold text-[#262320]">{title}</h3>
        </div>
        <span className="rounded-full bg-[#FFF9EF] px-3 py-1 text-xs font-bold text-[#6F553C]">{total}건</span>
      </div>

      <div className="mt-4 h-56 rounded-3xl bg-[#FFF9EF] px-2 py-3">
        {safeData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-[#262320]/50">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="48%"
                outerRadius="72%"
                paddingAngle={2}
                stroke="#FFF9EF"
                strokeWidth={3}
              >
                {safeData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}건`, name]}
                contentStyle={{
                  border: "1px solid #EFE0CD",
                  borderRadius: 14,
                  boxShadow: "0 14px 38px rgba(38, 35, 32, 0.14)",
                  color: "#262320",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-xs text-[#262320]/70">
        {safeData.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-bold text-[#262320]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
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
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead className="bg-[#FFF9EF] text-xs font-bold text-[#6F553C]">
          <tr>
            <th className="px-5 py-4">이름</th>
            <th className="px-5 py-4">지점</th>
            <th className="px-5 py-4">설문유형</th>
            <th className="px-5 py-4">연락처</th>
            <th className="px-5 py-4">운동목적</th>
            <th className="px-5 py-4">상태</th>
            <th className="px-5 py-4">제출일</th>
            <th className="px-5 py-4 text-center">삭제</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFE0CD]">
          {submissions.map((submission) => (
            <tr key={submission.id} className="text-sm text-[#262320]/75 transition hover:bg-[#FFF9EF]/70">
              <td className="px-5 py-4">
                <Link
                  href={`/admin/submissions/${submission.id}`}
                  className="inline-flex rounded-xl bg-[#FFF9EF] px-3 py-2 text-sm font-bold text-[#6F553C] underline-offset-4 transition hover:bg-[#EFE0CD]"
                >
                  {submission.basicInfo.name}
                </Link>
              </td>
              <td className="px-5 py-4 font-bold text-[#262320]">{BRANCH_LABELS[submission.branch]}</td>
              <td className="px-5 py-4">{SURVEY_LABELS[submission.surveyType]}</td>
              <td className="px-5 py-4">{submission.basicInfo.phone}</td>
              <td className="max-w-[260px] px-5 py-4">{joinOrFallback(submission.goals)}</td>
              <td className="px-5 py-4">
                <StatusSelect value={submission.status} onChange={(status) => onStatusChange(submission.id, status)} />
              </td>
              <td className="px-5 py-4">{formatDate(submission.submittedAt)}</td>
              <td className="px-5 py-4 text-center">
                <DeleteButton onClick={() => onDelete(submission.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileList({
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
        <article key={submission.id} className="rounded-3xl border border-[#EFE0CD] bg-[#FFF9EF] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#B67854]">
                {BRANCH_LABELS[submission.branch]} · {SURVEY_LABELS[submission.surveyType]}
              </p>
              <Link
                href={`/admin/submissions/${submission.id}`}
                className="mt-1 inline-flex rounded-xl bg-white px-3 py-2 text-lg font-bold text-[#262320] shadow-sm"
              >
                {submission.basicInfo.name}
              </Link>
              <p className="mt-2 text-sm text-[#262320]/60">{submission.basicInfo.phone}</p>
            </div>
            <StatusSelect value={submission.status} onChange={(status) => onStatusChange(submission.id, status)} />
          </div>
              <InfoRow label="운동목적" value={joinOrFallback(submission.goals)} />
          <InfoRow label="제출일" value={formatDate(submission.submittedAt)} />
          <button
            type="button"
            onClick={() => onDelete(submission.id)}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-500 px-4 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} aria-hidden />
            삭제
          </button>
        </article>
      ))}
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
      className="h-10 rounded-2xl border border-[#EFE0CD] bg-white px-3 text-sm font-bold text-[#262320] outline-none transition focus:border-[#262320]"
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
      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-500 px-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
    >
      <Trash2 size={16} aria-hidden />
      삭제
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 border-t border-[#EFE0CD] pt-3">
      <p className="text-xs font-bold text-[#6F553C]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#262320]/75">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="m-4 rounded-3xl bg-[#FFF9EF] px-5 py-12 text-center text-sm font-semibold text-[#262320]/60">{message}</div>;
}

function countSingle(items: SurveySubmission[], selector: (submission: SurveySubmission) => string): ChartDatum[] {
  return sortChartData(
    items.reduce<Record<string, number>>((acc, submission) => {
      const key = safeText(selector(submission));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  );
}

function countMultiple(items: SurveySubmission[], selector: (submission: SurveySubmission) => string[]): ChartDatum[] {
  return sortChartData(
    items.reduce<Record<string, number>>((acc, submission) => {
      const values = safeArray(selector(submission)).map(safeText).filter((value) => value !== "미입력");
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

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "미입력";
}

function joinOrFallback(value: unknown) {
  const items = safeArray(value).map(safeText).filter((item) => item !== "미입력");
  return items.length > 0 ? items.join(", ") : "미입력";
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
