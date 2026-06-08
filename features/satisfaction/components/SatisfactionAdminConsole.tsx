"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_OPTIONS,
  RESPONSE_STATUS_LABELS,
  RESPONSE_STATUS_OPTIONS,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_OPTIONS,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_OPTIONS,
} from "@/features/satisfaction/constants";
import type {
  Branch,
  BranchId,
  QuestionCategory,
  QuestionType,
  ResponseStatus,
  SatisfactionAnswer,
  SatisfactionQuestion,
  SatisfactionQuestionOption,
  SatisfactionResponse,
  SatisfactionResponseEvent,
  SatisfactionSurvey,
  Staff,
  StaffChoicePurpose,
  StaffRole,
  SurveyStatus,
} from "@/features/satisfaction/types";
import { getBranchName } from "@/features/satisfaction/utils";
import { getSupabaseClient } from "@/lib/supabase";

type AdminTab = "dashboard" | "responses" | "questions" | "surveys" | "staff";
type BranchFilter = BranchId | "all";
type DateFilter = "all" | "7d" | "30d" | "month";
type ActiveFilter = "all" | "active" | "inactive";
type VisibleFilter = "all" | "visible" | "hidden";
type RoleFilter = StaffRole | "all";

type AdminData = {
  branches: Branch[];
  surveys: SatisfactionSurvey[];
  staff: Staff[];
  questions: SatisfactionQuestion[];
  options: SatisfactionQuestionOption[];
  responses: SatisfactionResponse[];
  answers: SatisfactionAnswer[];
  events: SatisfactionResponseEvent[];
};

type StaffFormState = {
  id: string | null;
  name: string;
  branch_id: string;
  role: StaffRole;
  display_order: number;
  is_active: boolean;
  is_visible_in_survey: boolean;
};

type QuestionFormState = {
  id: string | null;
  survey_id: string;
  category: QuestionCategory;
  question_text: string;
  question_type: QuestionType;
  staff_choice_purpose: Exclude<StaffChoicePurpose, null>;
  is_required: boolean;
  is_active: boolean;
  is_core_metric: boolean;
  display_order: number;
  placeholder: string;
};

type OptionFormState = {
  id: string | null;
  question_id: string;
  option_text: string;
  option_value: string;
  display_order: number;
  is_active: boolean;
};

type SurveyFormState = {
  id: string | null;
  title: string;
  year: number;
  quarter: number | null;
  start_date: string;
  end_date: string;
  status: SurveyStatus;
};

type ResponseDraft = {
  status: ResponseStatus;
  admin_note: string;
  assigned_to: string;
};

type DeleteSatisfactionResponseResult = {
  deleted_count: number;
  response_id: string;
  success: boolean;
};

const EMPTY_DATA: AdminData = {
  branches: [],
  surveys: [],
  staff: [],
  questions: [],
  options: [],
  responses: [],
  answers: [],
  events: [],
};

const TAB_LINKS: Array<{ tab: AdminTab; href: string; label: string }> = [
  { tab: "dashboard", href: "/admin/satisfaction", label: "대시보드" },
  { tab: "responses", href: "/admin/satisfaction/responses", label: "응답 내역" },
  { tab: "questions", href: "/admin/satisfaction/questions", label: "질문 관리" },
  { tab: "surveys", href: "/admin/satisfaction/surveys", label: "설문 회차" },
  { tab: "staff", href: "/admin/satisfaction/staff", label: "직원 관리" },
];

const POSITIVE_CHOICE_VALUES = new Set(["very_likely", "likely", "yes", "recommend", "very_recommend"]);
const NEGATIVE_CHOICE_VALUES = new Set(["unlikely", "very_unlikely", "no", "not_recommend"]);

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function formatAverage(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

function formatPercent(value: number | null) {
  return value === null ? "-" : `${Math.round(value)}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isChoiceQuestion(question: SatisfactionQuestion | QuestionFormState) {
  return question.question_type === "single_choice" || question.question_type === "multiple_choice";
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getCategoryLabel(category: string | null) {
  return CATEGORY_LABELS[(category as QuestionCategory) ?? "other"] ?? category ?? "기타";
}

function isSupportedStaffRole(role: string | null | undefined): role is StaffRole {
  return STAFF_ROLE_OPTIONS.includes(role as StaffRole);
}

function getRoleLabel(role: string | null) {
  if (!role) {
    return "-";
  }

  return isSupportedStaffRole(role) ? STAFF_ROLE_LABELS[role] : `기존 직무(${role})`;
}

function getQuestionTypeLabel(type: QuestionType) {
  return QUESTION_TYPE_LABELS[type] ?? type;
}

function getSurveyStatusLabel(status: SurveyStatus) {
  return SURVEY_STATUS_LABELS[status] ?? status;
}

function getResponseStatusLabel(status: ResponseStatus) {
  return RESPONSE_STATUS_LABELS[status] ?? status;
}

function defaultStaffForm(branchId = ""): StaffFormState {
  return {
    id: null,
    name: "",
    branch_id: branchId,
    role: "trainer",
    display_order: 0,
    is_active: true,
    is_visible_in_survey: true,
  };
}

function defaultQuestionForm(surveyId = ""): QuestionFormState {
  return {
    id: null,
    survey_id: surveyId,
    category: "cleanliness",
    question_text: "",
    question_type: "rating",
    staff_choice_purpose: "positive",
    is_required: true,
    is_active: true,
    is_core_metric: false,
    display_order: 0,
    placeholder: "",
  };
}

function defaultOptionForm(questionId = ""): OptionFormState {
  return {
    id: null,
    question_id: questionId,
    option_text: "",
    option_value: "",
    display_order: 0,
    is_active: true,
  };
}

function defaultSurveyForm(): SurveyFormState {
  const year = new Date().getFullYear();
  return {
    id: null,
    title: `${year}년 회원 만족도 조사`,
    year,
    quarter: null,
    start_date: todayString(),
    end_date: addDays(new Date(), 30).toISOString().slice(0, 10),
    status: "draft",
  };
}

function belongsToDateFilter(response: SatisfactionResponse, dateFilter: DateFilter) {
  if (dateFilter === "all") {
    return true;
  }

  const submittedAt = new Date(response.submitted_at);
  const now = new Date();

  if (dateFilter === "7d") {
    return submittedAt >= addDays(now, -7);
  }

  if (dateFilter === "30d") {
    return submittedAt >= addDays(now, -30);
  }

  return submittedAt.getFullYear() === now.getFullYear() && submittedAt.getMonth() === now.getMonth();
}

function getScopedResponses({
  branchFilter,
  dateFilter,
  responses,
  surveyFilter,
}: {
  branchFilter: BranchFilter;
  dateFilter: DateFilter;
  responses: SatisfactionResponse[];
  surveyFilter: string;
}) {
  return responses.filter((response) => {
    if (surveyFilter !== "all" && response.survey_id !== surveyFilter) {
      return false;
    }

    if (branchFilter !== "all" && response.branch_id !== branchFilter) {
      return false;
    }

    return belongsToDateFilter(response, dateFilter);
  });
}

async function deleteSatisfactionResponseRows(responseId: string) {
  const trimmedResponseId = responseId.trim();
  if (!trimmedResponseId) {
    throw new Error("삭제할 응답 ID가 없습니다.");
  }

  console.log("delete responseId", trimmedResponseId);

  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  if (!sessionData.session) {
    throw new Error("회원 만족도 응답 삭제는 Supabase 관리자 로그인이 필요합니다.");
  }

  const { data, error } = await supabase.rpc("delete_satisfaction_response", { p_response_id: trimmedResponseId });
  if (error) {
    throw error;
  }

  const result = data as DeleteSatisfactionResponseResult | null;
  console.log("delete satisfaction response result", result);

  return {
    deletedCount: Number(result?.deleted_count ?? 0),
    responseId: result?.response_id ?? trimmedResponseId,
    success: Boolean(result?.success),
  };
}

function getAnswerQuestionText(answer: SatisfactionAnswer, questionMap: Map<string, SatisfactionQuestion>) {
  return answer.question_text_snapshot?.trim() || questionMap.get(answer.question_id)?.question_text || "질문 정보 없음";
}

function getAnswerQuestionType(answer: SatisfactionAnswer, questionMap: Map<string, SatisfactionQuestion>) {
  return (answer.question_type_snapshot || questionMap.get(answer.question_id)?.question_type || "") as QuestionType | "";
}

function getAnswerOptionText(answer: SatisfactionAnswer, optionMap: Map<string, SatisfactionQuestionOption>) {
  if (answer.option_text_snapshot?.trim()) {
    return answer.option_text_snapshot.trim();
  }

  if (answer.choice_value) {
    const liveOption = Array.from(optionMap.values()).find((option) => option.option_value === answer.choice_value || option.option_text === answer.choice_value);
    return liveOption?.option_text ?? answer.choice_value;
  }

  if (answer.choice_values?.length) {
    return answer.choice_values
      .map((value) => {
        const liveOption = Array.from(optionMap.values()).find((option) => option.option_value === value || option.option_text === value);
        return liveOption?.option_text ?? value;
      })
      .join(", ");
  }

  return "";
}

function getAnswerStaffText(answer: SatisfactionAnswer, staffMap: Map<string, Staff>) {
  const snapshotName = answer.staff_name_snapshot?.trim();
  const liveStaff = answer.staff_id ? staffMap.get(answer.staff_id) : undefined;
  const name = snapshotName || liveStaff?.name || "";
  const role = answer.staff_role_snapshot?.trim() || liveStaff?.role || "";

  if (!name) {
    return "";
  }

  return role ? `${name} (${getRoleLabel(role)})` : name;
}

function getAnswerDisplayValue(answer: SatisfactionAnswer, questionMap: Map<string, SatisfactionQuestion>, optionMap: Map<string, SatisfactionQuestionOption>, staffMap: Map<string, Staff>) {
  const questionType = getAnswerQuestionType(answer, questionMap);

  if (questionType === "rating") {
    return answer.rating_value ? `${answer.rating_value}점` : "-";
  }

  if (questionType === "text_short" || questionType === "text_long") {
    return answer.text_value?.trim() || "-";
  }

  if (questionType === "single_choice" || questionType === "multiple_choice") {
    return getAnswerOptionText(answer, optionMap) || "-";
  }

  if (questionType === "staff_choice") {
    return getAnswerStaffText(answer, staffMap) || answer.staff_name_snapshot || "없음";
  }

  return answer.text_value || getAnswerOptionText(answer, optionMap) || getAnswerStaffText(answer, staffMap) || "-";
}

function isLowAnswer(answer: SatisfactionAnswer, questionMap: Map<string, SatisfactionQuestion>) {
  const question = questionMap.get(answer.question_id);
  const questionText = getAnswerQuestionText(answer, questionMap);
  const questionType = getAnswerQuestionType(answer, questionMap);

  if (questionType === "rating" && (answer.rating_value ?? 0) > 0) {
    return (answer.rating_value ?? 0) <= 2;
  }

  if ((question?.staff_choice_purpose === "improvement" || questionText.includes("개선")) && (answer.staff_id || answer.staff_name_snapshot)) {
    return true;
  }

  if (answer.choice_value && NEGATIVE_CHOICE_VALUES.has(answer.choice_value)) {
    return true;
  }

  return false;
}

function responseHasText(responseId: string, answers: SatisfactionAnswer[]) {
  return answers.some((answer) => answer.response_id === responseId && Boolean(answer.text_value?.trim()));
}

function responseHasLowScore(responseId: string, answers: SatisfactionAnswer[], questionMap: Map<string, SatisfactionQuestion>) {
  return answers.some((answer) => answer.response_id === responseId && isLowAnswer(answer, questionMap));
}

function categoryAverage(category: QuestionCategory, questions: SatisfactionQuestion[], answers: SatisfactionAnswer[]) {
  const questionIds = new Set(
    questions.filter((question) => question.category === category && question.question_type === "rating").map((question) => question.id),
  );

  return average(
    answers
      .filter((answer) => questionIds.has(answer.question_id))
      .map((answer) => answer.rating_value)
      .filter((value): value is number => typeof value === "number"),
  );
}

function choiceRate(matcher: (question: SatisfactionQuestion) => boolean, questions: SatisfactionQuestion[], answers: SatisfactionAnswer[]) {
  const question = questions.find(matcher);
  if (!question) {
    return null;
  }

  const relevantAnswers = answers.filter((answer) => answer.question_id === question.id && answer.choice_value);
  if (relevantAnswers.length === 0) {
    return null;
  }

  const positiveCount = relevantAnswers.filter((answer) => answer.choice_value && POSITIVE_CHOICE_VALUES.has(answer.choice_value)).length;
  return (positiveCount / relevantAnswers.length) * 100;
}

function buildChoiceStats(questions: SatisfactionQuestion[], options: SatisfactionQuestionOption[], answers: SatisfactionAnswer[]) {
  return questions
    .filter((question) => isChoiceQuestion(question))
    .map((question) => {
      const questionOptions = options.filter((option) => option.question_id === question.id);
      const relevantAnswers = answers.filter((answer) => answer.question_id === question.id);
      const rows = new Map<string, { label: string; count: number }>();

      questionOptions.forEach((option) => {
        rows.set(option.option_value ?? option.option_text, { label: option.option_text, count: 0 });
      });

      relevantAnswers.forEach((answer) => {
        const snapshotLabels =
          answer.option_text_snapshot
            ?.split(",")
            .map((label) => label.trim())
            .filter(Boolean) ?? [];
        const values = question.question_type === "multiple_choice" ? answer.choice_values ?? [] : answer.choice_value ? [answer.choice_value] : [];

        values.forEach((value, index) => {
          const liveOption = questionOptions.find((option) => option.option_value === value || option.option_text === value);
          const label = snapshotLabels[index] ?? liveOption?.option_text ?? value;
          const current = rows.get(value) ?? { label, count: 0 };
          current.count += 1;
          rows.set(value, current);
        });
      });

      return {
        questionId: question.id,
        questionText: question.question_text,
        rows: Array.from(rows.values()).filter((row) => row.count > 0 || questionOptions.length > 0),
      };
    })
    .filter((stat) => stat.rows.length > 0);
}

function buildStaffMentionRows(data: AdminData, scopedAnswers: SatisfactionAnswer[]) {
  const questionMap = new Map(data.questions.map((question) => [question.id, question]));
  const staffMap = new Map(data.staff.map((member) => [member.id, member]));
  const rows = new Map<string, { key: string; name: string; role: string; branchName: string; positiveCount: number; improvementCount: number }>();

  scopedAnswers.forEach((answer) => {
    const question = questionMap.get(answer.question_id);
    const questionText = getAnswerQuestionText(answer, questionMap);
    const purpose = question?.staff_choice_purpose ?? (questionText.includes("개선") ? "improvement" : questionText.includes("친절") ? "positive" : null);

    if ((purpose !== "positive" && purpose !== "improvement") || (!answer.staff_id && !answer.staff_name_snapshot)) {
      return;
    }

    const staff = answer.staff_id ? staffMap.get(answer.staff_id) : undefined;
    const name = answer.staff_name_snapshot?.trim() || staff?.name || "직원 정보 없음";
    if (name === "없음") {
      return;
    }

    const branchId = answer.staff_branch_id_snapshot || staff?.branch_id || "";
    const role = answer.staff_role_snapshot || staff?.role || "";
    const key = answer.staff_id ?? `${name}:${role}:${branchId}`;
    const current = rows.get(key) ?? {
      key,
      name,
      role: getRoleLabel(role),
      branchName: branchId ? getBranchName(data.branches, branchId) : "-",
      positiveCount: 0,
      improvementCount: 0,
    };

    if (purpose === "positive") {
      current.positiveCount += 1;
    } else {
      current.improvementCount += 1;
    }

    rows.set(key, current);
  });

  return Array.from(rows.values()).sort((a, b) => b.positiveCount + b.improvementCount - (a.positiveCount + a.improvementCount));
}

function buildRuleReport({
  cleanlinessAverage,
  facilityAverage,
  kindnessAverage,
  needsReviewCount,
  responseCount,
}: {
  cleanlinessAverage: number | null;
  facilityAverage: number | null;
  kindnessAverage: number | null;
  needsReviewCount: number;
  responseCount: number;
}) {
  if (responseCount === 0) {
    return "아직 응답 데이터가 없습니다. 응답이 쌓이면 취약 영역과 우선 처리 항목을 자동으로 요약합니다.";
  }

  const categoryRows = [
    { label: "청결", value: cleanlinessAverage },
    { label: "친절", value: kindnessAverage },
    { label: "시설", value: facilityAverage },
  ].filter((row): row is { label: string; value: number } => row.value !== null);
  const weakest = categoryRows.sort((a, b) => a.value - b.value)[0];
  const reviewSentence = needsReviewCount > 0 ? `확인 필요 응답 ${needsReviewCount}건을 먼저 처리하세요.` : "현재 확인 필요 응답은 없습니다.";

  return weakest
    ? `${weakest.label} 평균이 ${weakest.value.toFixed(1)}점으로 가장 낮습니다. 해당 지점과 주관식 의견을 함께 확인하세요. ${reviewSentence}`
    : reviewSentence;
}

export function SatisfactionAdminConsole({ activeTab }: { activeTab: AdminTab }) {
  const [data, setData] = useState<AdminData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [surveyFilter, setSurveyFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState<BranchFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [responseStatusFilter, setResponseStatusFilter] = useState<ResponseStatus | "all">("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [textOnly, setTextOnly] = useState(false);

  const [staffBranchFilter, setStaffBranchFilter] = useState<BranchFilter>("all");
  const [staffActiveFilter, setStaffActiveFilter] = useState<ActiveFilter>("all");
  const [staffVisibleFilter, setStaffVisibleFilter] = useState<VisibleFilter>("all");
  const [staffRoleFilter, setStaffRoleFilter] = useState<RoleFilter>("all");
  const [staffForm, setStaffForm] = useState<StaffFormState>(defaultStaffForm());
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);

  const [questionSurveyFilter, setQuestionSurveyFilter] = useState("all");
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(defaultQuestionForm());
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [optionsQuestionId, setOptionsQuestionId] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState<OptionFormState>(defaultOptionForm());
  const [isOptionFormOpen, setIsOptionFormOpen] = useState(false);

  const [surveyForm, setSurveyForm] = useState<SurveyFormState>(defaultSurveyForm());
  const [isSurveyFormOpen, setIsSurveyFormOpen] = useState(false);
  const [copySourceByTarget, setCopySourceByTarget] = useState<Record<string, string>>({});

  const [responseDrafts, setResponseDrafts] = useState<Record<string, ResponseDraft>>({});
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      const [
        { data: branchData, error: branchError },
        { data: surveyData, error: surveyError },
        { data: staffData, error: staffError },
        { data: questionData, error: questionError },
        { data: optionData, error: optionError },
        { data: responseData, error: responseError },
        { data: answerData, error: answerError },
        { data: eventData, error: eventError },
      ] = await Promise.all([
        supabase.from("branches").select("*").order("display_order", { ascending: true }).order("name", { ascending: true }),
        supabase.from("satisfaction_surveys").select("*").order("start_date", { ascending: false }),
        supabase.from("staff").select("*").order("branch_id", { ascending: true }).order("display_order", { ascending: true }),
        supabase.from("satisfaction_questions").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("satisfaction_question_options").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("satisfaction_responses").select("*").order("submitted_at", { ascending: false }),
        supabase.from("satisfaction_answers").select("*"),
        supabase.from("satisfaction_response_events").select("*").order("created_at", { ascending: false }),
      ]);

      const errors = [branchError, surveyError, staffError, questionError, optionError, responseError, answerError, eventError].filter(Boolean);
      if (errors[0]) {
        throw errors[0];
      }

      setData({
        branches: branchData ?? [],
        surveys: surveyData ?? [],
        staff: staffData ?? [],
        questions: questionData ?? [],
        options: optionData ?? [],
        responses: responseData ?? [],
        answers: answerData ?? [],
        events: eventData ?? [],
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원 만족도 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setResponseDrafts(
      data.responses.reduce<Record<string, ResponseDraft>>((acc, response) => {
        acc[response.id] = {
          status: response.status,
          admin_note: response.admin_note ?? "",
          assigned_to: response.assigned_to ?? "",
        };
        return acc;
      }, {}),
    );
  }, [data.responses]);

  useEffect(() => {
    if (data.branches.length > 0 && !staffForm.branch_id) {
      setStaffForm((current) => ({ ...current, branch_id: data.branches[0]?.id ?? "" }));
    }

    if (data.surveys.length > 0 && !questionForm.survey_id) {
      setQuestionForm((current) => ({ ...current, survey_id: data.surveys[0]?.id ?? "" }));
    }
  }, [data.branches, data.surveys, questionForm.survey_id, staffForm.branch_id]);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
  }

  function showError(error: unknown, fallback: string) {
    setSuccessMessage("");
    setErrorMessage(error instanceof Error ? error.message : fallback);
  }

  function logSupabaseError(label: string, error: unknown, context?: Record<string, unknown>) {
    const supabaseError = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown; status?: unknown; statusCode?: unknown };
    console.error(label, {
      ...context,
      status: supabaseError.status ?? supabaseError.statusCode,
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
      raw: error,
    });
  }

  const questionMap = useMemo(() => new Map(data.questions.map((question) => [question.id, question])), [data.questions]);
  const optionMap = useMemo(() => new Map(data.options.map((option) => [option.id, option])), [data.options]);
  const staffMap = useMemo(() => new Map(data.staff.map((member) => [member.id, member])), [data.staff]);
  const responseIds = useMemo(() => new Set(data.responses.map((response) => response.id)), [data.responses]);

  const scopedResponses = useMemo(
    () =>
      getScopedResponses({
        responses: data.responses,
        surveyFilter,
        branchFilter,
        dateFilter,
      }),
    [branchFilter, data.responses, dateFilter, surveyFilter],
  );
  const scopedResponseIds = useMemo(() => new Set(scopedResponses.map((response) => response.id)), [scopedResponses]);
  const scopedAnswers = useMemo(() => data.answers.filter((answer) => scopedResponseIds.has(answer.response_id)), [data.answers, scopedResponseIds]);

  const filteredResponses = useMemo(() => {
    return scopedResponses.filter((response) => {
      if (responseStatusFilter !== "all" && response.status !== responseStatusFilter) {
        return false;
      }

      if (lowOnly && !responseHasLowScore(response.id, data.answers, questionMap)) {
        return false;
      }

      if (textOnly && !responseHasText(response.id, data.answers)) {
        return false;
      }

      return true;
    });
  }, [data.answers, lowOnly, questionMap, responseStatusFilter, scopedResponses, textOnly]);

  const filteredStaff = useMemo(() => {
    return data.staff.filter((member) => {
      if (staffBranchFilter !== "all" && member.branch_id !== staffBranchFilter) {
        return false;
      }

      if (staffActiveFilter === "active" && !member.is_active) {
        return false;
      }

      if (staffActiveFilter === "inactive" && member.is_active) {
        return false;
      }

      if (staffVisibleFilter === "visible" && !member.is_visible_in_survey) {
        return false;
      }

      if (staffVisibleFilter === "hidden" && member.is_visible_in_survey) {
        return false;
      }

      if (staffRoleFilter !== "all" && member.role !== staffRoleFilter) {
        return false;
      }

      return true;
    });
  }, [data.staff, staffActiveFilter, staffBranchFilter, staffRoleFilter, staffVisibleFilter]);

  const filteredQuestions = useMemo(() => {
    return data.questions.filter((question) => questionSurveyFilter === "all" || question.survey_id === questionSurveyFilter);
  }, [data.questions, questionSurveyFilter]);

  const activeSurvey = useMemo(() => data.surveys.find((survey) => survey.status === "active") ?? null, [data.surveys]);
  const totalAverage = useMemo(
    () => average(scopedAnswers.map((answer) => answer.rating_value).filter((value): value is number => typeof value === "number")),
    [scopedAnswers],
  );
  const cleanlinessAverage = useMemo(() => categoryAverage("cleanliness", data.questions, scopedAnswers), [data.questions, scopedAnswers]);
  const kindnessAverage = useMemo(() => categoryAverage("kindness", data.questions, scopedAnswers), [data.questions, scopedAnswers]);
  const facilityAverage = useMemo(() => categoryAverage("facility", data.questions, scopedAnswers), [data.questions, scopedAnswers]);
  const recommendRate = useMemo(
    () => choiceRate((question) => question.question_text.includes("추천"), data.questions, scopedAnswers),
    [data.questions, scopedAnswers],
  );
  const retentionRate = useMemo(
    () => choiceRate((question) => question.question_text.includes("계속") || question.question_text.includes("이용"), data.questions, scopedAnswers),
    [data.questions, scopedAnswers],
  );
  const staffMentionRows = useMemo(() => buildStaffMentionRows(data, scopedAnswers), [data, scopedAnswers]);
  const choiceStats = useMemo(() => buildChoiceStats(data.questions, data.options, scopedAnswers), [data.questions, data.options, scopedAnswers]);
  const branchRows = useMemo(() => {
    return data.branches.map((branch) => {
      const branchResponses = scopedResponses.filter((response) => response.branch_id === branch.id);
      const branchResponseIds = new Set(branchResponses.map((response) => response.id));
      const branchAnswers = scopedAnswers.filter((answer) => branchResponseIds.has(answer.response_id));
      return {
        branchId: branch.id,
        branchName: branch.name,
        responseCount: branchResponses.length,
        totalAverage: average(branchAnswers.map((answer) => answer.rating_value).filter((value): value is number => typeof value === "number")),
        cleanlinessAverage: categoryAverage("cleanliness", data.questions, branchAnswers),
        kindnessAverage: categoryAverage("kindness", data.questions, branchAnswers),
        facilityAverage: categoryAverage("facility", data.questions, branchAnswers),
      };
    });
  }, [data.branches, data.questions, scopedAnswers, scopedResponses]);

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const supabase = getSupabaseClient();
      const payload = {
        name: staffForm.name.trim(),
        branch_id: staffForm.branch_id,
        role: staffForm.role,
        display_order: Number(staffForm.display_order) || 0,
        is_active: staffForm.is_active,
        is_visible_in_survey: staffForm.is_visible_in_survey,
      };

      if (staffForm.id) {
        const { error } = await supabase.from("staff").update(payload).eq("id", staffForm.id);
        if (error) {
          throw error;
        }
        showSuccess("직원 정보를 수정했습니다.");
      } else {
        const { error } = await supabase.from("staff").insert(payload);
        if (error) {
          throw error;
        }
        showSuccess("직원을 추가했습니다.");
      }

      setStaffForm(defaultStaffForm(data.branches[0]?.id ?? ""));
      setIsStaffFormOpen(false);
      await loadData();
    } catch (error) {
      showError(error, "직원 저장에 실패했습니다.");
    }
  }

  async function updateStaff(id: string, payload: Partial<Pick<Staff, "branch_id" | "display_order" | "is_active" | "is_visible_in_survey" | "name" | "role">>) {
    try {
      const { error } = await getSupabaseClient().from("staff").update(payload).eq("id", id);
      if (error) {
        throw error;
      }
      showSuccess("직원 정보를 업데이트했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "직원 업데이트에 실패했습니다.");
    }
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const supabase = getSupabaseClient();
      const payload = {
        survey_id: questionForm.survey_id,
        category: questionForm.category,
        question_text: questionForm.question_text.trim(),
        question_type: questionForm.question_type,
        staff_choice_purpose: questionForm.question_type === "staff_choice" ? questionForm.staff_choice_purpose : null,
        is_required: questionForm.is_required,
        is_active: questionForm.is_active,
        is_core_metric: questionForm.is_core_metric,
        display_order: Number(questionForm.display_order) || 0,
        placeholder: optionalText(questionForm.placeholder),
      };

      if (questionForm.id) {
        const { error } = await supabase.from("satisfaction_questions").update(payload).eq("id", questionForm.id);
        if (error) {
          throw error;
        }
        showSuccess("질문을 수정했습니다.");
      } else {
        const { error } = await supabase.from("satisfaction_questions").insert(payload);
        if (error) {
          throw error;
        }
        showSuccess("질문을 추가했습니다.");
      }

      setQuestionForm(defaultQuestionForm(data.surveys[0]?.id ?? ""));
      setIsQuestionFormOpen(false);
      await loadData();
    } catch (error) {
      showError(error, "질문 저장에 실패했습니다.");
    }
  }

  async function updateQuestion(id: string, payload: Partial<Pick<SatisfactionQuestion, "display_order" | "is_active">>) {
    try {
      const { error } = await getSupabaseClient().from("satisfaction_questions").update(payload).eq("id", id);
      if (error) {
        throw error;
      }
      showSuccess("질문을 업데이트했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "질문 업데이트에 실패했습니다.");
    }
  }

  async function moveQuestion(question: SatisfactionQuestion, direction: "up" | "down") {
    const siblings = data.questions
      .filter((item) => item.survey_id === question.survey_id)
      .sort((a, b) => a.display_order - b.display_order || a.created_at.localeCompare(b.created_at));
    const currentIndex = siblings.findIndex((item) => item.id === question.id);
    const target = siblings[direction === "up" ? currentIndex - 1 : currentIndex + 1];
    if (!target) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const [{ error: firstError }, { error: secondError }] = await Promise.all([
        supabase.from("satisfaction_questions").update({ display_order: target.display_order }).eq("id", question.id),
        supabase.from("satisfaction_questions").update({ display_order: question.display_order }).eq("id", target.id),
      ]);
      if (firstError || secondError) {
        throw firstError ?? secondError;
      }
      showSuccess("질문 순서를 변경했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "질문 순서 변경에 실패했습니다.");
    }
  }

  async function saveOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const supabase = getSupabaseClient();
      const payload = {
        question_id: optionForm.question_id,
        option_text: optionForm.option_text.trim(),
        option_value: optionalText(optionForm.option_value),
        display_order: Number(optionForm.display_order) || 0,
        is_active: optionForm.is_active,
      };

      if (optionForm.id) {
        const { error } = await supabase.from("satisfaction_question_options").update(payload).eq("id", optionForm.id);
        if (error) {
          throw error;
        }
        showSuccess("선택지를 수정했습니다.");
      } else {
        const { error } = await supabase.from("satisfaction_question_options").insert(payload);
        if (error) {
          throw error;
        }
        showSuccess("선택지를 추가했습니다.");
      }

      setOptionForm(defaultOptionForm(optionForm.question_id));
      setIsOptionFormOpen(false);
      await loadData();
    } catch (error) {
      showError(error, "선택지 저장에 실패했습니다.");
    }
  }

  async function updateOption(id: string, payload: Partial<Pick<SatisfactionQuestionOption, "display_order" | "is_active">>) {
    try {
      const { error } = await getSupabaseClient().from("satisfaction_question_options").update(payload).eq("id", id);
      if (error) {
        throw error;
      }
      showSuccess("선택지를 업데이트했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "선택지 업데이트에 실패했습니다.");
    }
  }

  async function moveOption(option: SatisfactionQuestionOption, direction: "up" | "down") {
    const siblings = data.options
      .filter((item) => item.question_id === option.question_id)
      .sort((a, b) => a.display_order - b.display_order || a.created_at.localeCompare(b.created_at));
    const currentIndex = siblings.findIndex((item) => item.id === option.id);
    const target = siblings[direction === "up" ? currentIndex - 1 : currentIndex + 1];
    if (!target) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const [{ error: firstError }, { error: secondError }] = await Promise.all([
        supabase.from("satisfaction_question_options").update({ display_order: target.display_order }).eq("id", option.id),
        supabase.from("satisfaction_question_options").update({ display_order: option.display_order }).eq("id", target.id),
      ]);
      if (firstError || secondError) {
        throw firstError ?? secondError;
      }
      showSuccess("선택지 순서를 변경했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "선택지 순서 변경에 실패했습니다.");
    }
  }

  async function saveSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const supabase = getSupabaseClient();
      const payload = {
        title: surveyForm.title.trim(),
        year: Number(surveyForm.year),
        quarter: surveyForm.quarter,
        start_date: surveyForm.start_date,
        end_date: surveyForm.end_date,
        status: surveyForm.status,
      };

      if (surveyForm.id) {
        const { error } = await supabase.from("satisfaction_surveys").update(payload).eq("id", surveyForm.id);
        if (error) {
          throw error;
        }
        showSuccess("설문 회차를 수정했습니다.");
      } else {
        const { error } = await supabase.from("satisfaction_surveys").insert(payload);
        if (error) {
          throw error;
        }
        showSuccess("설문 회차를 생성했습니다.");
      }

      setSurveyForm(defaultSurveyForm());
      setIsSurveyFormOpen(false);
      await loadData();
    } catch (error) {
      showError(error, "설문 회차 저장에 실패했습니다.");
    }
  }

  async function updateSurvey(id: string, payload: Partial<Pick<SatisfactionSurvey, "status" | "title" | "year" | "quarter" | "start_date" | "end_date">>) {
    try {
      const { error } = await getSupabaseClient().from("satisfaction_surveys").update(payload).eq("id", id);
      if (error) {
        throw error;
      }
      showSuccess("설문 회차를 업데이트했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "설문 회차 업데이트에 실패했습니다.");
    }
  }

  async function copyQuestionsToSurvey(targetSurveyId: string) {
    const sourceSurveyId = copySourceByTarget[targetSurveyId];
    if (!sourceSurveyId || sourceSurveyId === targetSurveyId) {
      setErrorMessage("복사할 원본 설문 회차를 선택해주세요.");
      return;
    }

    try {
      const sourceQuestions = data.questions.filter((question) => question.survey_id === sourceSurveyId);
      if (sourceQuestions.length === 0) {
        setErrorMessage("원본 설문에 복사할 질문이 없습니다.");
        return;
      }

      const questionIdMap = new Map<string, string>();
      const questionPayloads = sourceQuestions.map((question) => {
        const nextId = crypto.randomUUID();
        questionIdMap.set(question.id, nextId);
        return {
          id: nextId,
          survey_id: targetSurveyId,
          category: question.category,
          question_text: question.question_text,
          question_type: question.question_type,
          staff_choice_purpose: question.question_type === "staff_choice" ? question.staff_choice_purpose : null,
          is_required: question.is_required,
          is_active: question.is_active,
          is_core_metric: question.is_core_metric,
          display_order: question.display_order,
          placeholder: question.placeholder,
        };
      });
      const optionPayloads = data.options
        .filter((option) => questionIdMap.has(option.question_id))
        .map((option) => ({
          question_id: questionIdMap.get(option.question_id) ?? "",
          option_text: option.option_text,
          option_value: option.option_value,
          display_order: option.display_order,
          is_active: option.is_active,
        }))
        .filter((option) => option.question_id);
      const supabase = getSupabaseClient();
      const { error: questionError } = await supabase.from("satisfaction_questions").insert(questionPayloads);
      if (questionError) {
        throw questionError;
      }

      if (optionPayloads.length > 0) {
        const { error: optionError } = await supabase.from("satisfaction_question_options").insert(optionPayloads);
        if (optionError) {
          throw optionError;
        }
      }

      showSuccess("질문과 선택지를 복사했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "질문 복사에 실패했습니다.");
    }
  }

  async function saveResponse(responseId: string) {
    const draft = responseDrafts[responseId];
    if (!draft) {
      return;
    }

    try {
      const { error } = await getSupabaseClient()
        .from("satisfaction_responses")
        .update({
          status: draft.status,
          admin_note: optionalText(draft.admin_note),
          assigned_to: optionalText(draft.assigned_to),
        })
        .eq("id", responseId);
      if (error) {
        throw error;
      }
      showSuccess("응답 처리 상태를 저장했습니다.");
      await loadData();
    } catch (error) {
      showError(error, "응답 처리 상태 저장에 실패했습니다.");
    }
  }

  async function deleteSatisfactionResponse(responseId: string) {
    const targetResponseId = responseId?.trim();
    console.log("delete responseId", targetResponseId);
    if (!targetResponseId) {
      const message = "삭제할 응답 ID가 없습니다.";
      console.error("응답 삭제 ID 누락", { responseId });
      setSuccessMessage("");
      setErrorMessage(message);
      return;
    }

    const isConfirmed = window.confirm("이 응답을 삭제하시겠습니까?\n테스트 응답 삭제 용도로만 사용해주세요.\n삭제 후 복구할 수 없습니다.");
    if (!isConfirmed) {
      return;
    }

    setDeletingResponseId(targetResponseId);

    try {
      const deleteResult = await deleteSatisfactionResponseRows(targetResponseId);
      if (deleteResult.deletedCount < 1 || !deleteResult.success) {
        const message = "삭제할 응답을 찾지 못했습니다.";
        console.error("응답 삭제 0건", {
          responseId: targetResponseId,
          deletedCount: deleteResult.deletedCount,
          rpcResponseId: deleteResult.responseId,
          success: deleteResult.success,
          message,
        });
        setSuccessMessage("");
        setErrorMessage(message);
        await loadData();
        return;
      }

      setSelectedResponseId((current) => (current === targetResponseId ? null : current));
      setResponseDrafts((current) => {
        const next = { ...current };
        delete next[targetResponseId];
        return next;
      });
      setData((current) => ({
        ...current,
        responses: current.responses.filter((response) => response.id !== targetResponseId),
        answers: current.answers.filter((answer) => answer.response_id !== targetResponseId),
        events: current.events.filter((event) => event.response_id !== targetResponseId),
      }));
      showSuccess("응답이 삭제되었습니다.");
      await loadData();
    } catch (error) {
      logSupabaseError("응답 삭제 실패", error, { responseId: targetResponseId });
      showError(error, "응답 삭제에 실패했습니다.");
    } finally {
      setDeletingResponseId((current) => (current === targetResponseId ? null : current));
    }
  }

  const selectedResponse = selectedResponseId ? data.responses.find((response) => response.id === selectedResponseId) ?? null : null;

  return (
    <div className="grid gap-6">
      <header className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">SATISFACTION ADMIN</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">분기별 설문조사 관리</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/65">
              설문 회차, 질문, 선택지, 직원, 응답 처리를 직접 운영하는 관리형 설문 시스템입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-oatmeal bg-white px-4 text-sm font-bold text-cocoa transition hover:border-sand"
            >
              <RefreshCw size={16} aria-hidden />
              새로고침
            </button>
            <Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-2xl border border-oatmeal bg-ivory px-4 text-sm font-bold text-cocoa transition hover:border-sand">
              대시보드
            </Link>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="분기별 설문조사 관리 메뉴">
          {TAB_LINKS.map((link) => (
            <Link
              key={link.tab}
              href={link.href}
              className={
                activeTab === link.tab
                  ? "rounded-2xl bg-charcoal px-4 py-2 text-sm font-bold text-ivory"
                  : "rounded-2xl border border-oatmeal bg-white px-4 py-2 text-sm font-bold text-cocoa transition hover:border-sand"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      {successMessage ? <SuccessBanner message={successMessage} /> : null}

      {activeTab === "dashboard" ? (
        <DashboardView
          activeSurvey={activeSurvey}
          branchFilter={branchFilter}
          branchRows={branchRows}
          branches={data.branches}
          choiceStats={choiceStats}
          cleanlinessAverage={cleanlinessAverage}
          dateFilter={dateFilter}
          facilityAverage={facilityAverage}
          isLoading={isLoading}
          kindnessAverage={kindnessAverage}
          needsReviewCount={scopedResponses.filter((response) => response.status === "needs_review" || response.status === "in_progress").length}
          deletingResponseId={deletingResponseId}
          recommendRate={recommendRate}
          recentResponses={scopedResponses.slice(0, 6)}
          retentionRate={retentionRate}
          responseCount={scopedResponses.length}
          staffMentionRows={staffMentionRows}
          surveyFilter={surveyFilter}
          surveys={data.surveys}
          totalAverage={totalAverage}
          onBranchFilterChange={setBranchFilter}
          onDateFilterChange={setDateFilter}
          onDeleteResponse={deleteSatisfactionResponse}
          onSurveyFilterChange={setSurveyFilter}
        />
      ) : null}

      {activeTab === "responses" ? (
        <ResponsesView
          answers={data.answers}
          branches={data.branches}
          branchFilter={branchFilter}
          dateFilter={dateFilter}
          events={data.events}
          deletingResponseId={deletingResponseId}
          filteredResponses={filteredResponses}
          isLoading={isLoading}
          lowOnly={lowOnly}
          optionMap={optionMap}
          questionMap={questionMap}
          responseDrafts={responseDrafts}
          responseStatusFilter={responseStatusFilter}
          selectedResponse={selectedResponse}
          staffMap={staffMap}
          surveyFilter={surveyFilter}
          surveys={data.surveys}
          textOnly={textOnly}
          onBranchFilterChange={setBranchFilter}
          onDateFilterChange={setDateFilter}
          onDraftChange={(responseId, draft) => setResponseDrafts((current) => ({ ...current, [responseId]: draft }))}
          onLowOnlyChange={setLowOnly}
          onDeleteResponse={deleteSatisfactionResponse}
          onSaveResponse={saveResponse}
          onSelectResponse={setSelectedResponseId}
          onStatusFilterChange={setResponseStatusFilter}
          onSurveyFilterChange={setSurveyFilter}
          onTextOnlyChange={setTextOnly}
        />
      ) : null}

      {activeTab === "questions" ? (
        <QuestionsView
          data={data}
          isFormOpen={isQuestionFormOpen}
          isLoading={isLoading}
          isOptionFormOpen={isOptionFormOpen}
          optionForm={optionForm}
          optionsQuestionId={optionsQuestionId}
          questionForm={questionForm}
          questionSurveyFilter={questionSurveyFilter}
          questions={filteredQuestions}
          onEditOption={(option) => {
            setOptionForm({
              id: option.id,
              question_id: option.question_id,
              option_text: option.option_text,
              option_value: option.option_value ?? "",
              display_order: option.display_order,
              is_active: option.is_active,
            });
            setIsOptionFormOpen(true);
          }}
          onEditQuestion={(question) => {
            setQuestionForm({
              id: question.id,
              survey_id: question.survey_id,
              category: (question.category as QuestionCategory) ?? "other",
              question_text: question.question_text,
              question_type: question.question_type,
              staff_choice_purpose: question.staff_choice_purpose ?? "positive",
              is_required: question.is_required,
              is_active: question.is_active,
              is_core_metric: question.is_core_metric,
              display_order: question.display_order,
              placeholder: question.placeholder ?? "",
            });
            setIsQuestionFormOpen(true);
          }}
          onMoveOption={moveOption}
          onMoveQuestion={moveQuestion}
          onNewOption={(questionId) => {
            setOptionForm(defaultOptionForm(questionId));
            setIsOptionFormOpen(true);
          }}
          onNewQuestion={() => {
            setQuestionForm(defaultQuestionForm(data.surveys[0]?.id ?? ""));
            setIsQuestionFormOpen(true);
          }}
          onOptionFormChange={setOptionForm}
          onOptionsQuestionChange={setOptionsQuestionId}
          onQuestionFormChange={setQuestionForm}
          onQuestionSurveyFilterChange={setQuestionSurveyFilter}
          onSaveOption={saveOption}
          onSaveQuestion={saveQuestion}
          onToggleOption={(option) => void updateOption(option.id, { is_active: !option.is_active })}
          onToggleQuestion={(question) => void updateQuestion(question.id, { is_active: !question.is_active })}
          onToggleOptionForm={() => setIsOptionFormOpen((current) => !current)}
          onToggleQuestionForm={() => setIsQuestionFormOpen((current) => !current)}
        />
      ) : null}

      {activeTab === "surveys" ? (
        <SurveysView
          copySourceByTarget={copySourceByTarget}
          data={data}
          isFormOpen={isSurveyFormOpen}
          isLoading={isLoading}
          surveyForm={surveyForm}
          onArchiveSurvey={(survey) => void updateSurvey(survey.id, { status: "archived" })}
          onCopyQuestions={copyQuestionsToSurvey}
          onCopySourceChange={(targetSurveyId, sourceSurveyId) =>
            setCopySourceByTarget((current) => ({
              ...current,
              [targetSurveyId]: sourceSurveyId,
            }))
          }
          onEditSurvey={(survey) => {
            setSurveyForm({
              id: survey.id,
              title: survey.title,
              year: survey.year,
              quarter: survey.quarter,
              start_date: survey.start_date,
              end_date: survey.end_date,
              status: survey.status,
            });
            setIsSurveyFormOpen(true);
          }}
          onNewSurvey={() => {
            setSurveyForm(defaultSurveyForm());
            setIsSurveyFormOpen(true);
          }}
          onSaveSurvey={saveSurvey}
          onSurveyFormChange={setSurveyForm}
          onToggleForm={() => setIsSurveyFormOpen((current) => !current)}
          onUpdateStatus={(survey, status) => void updateSurvey(survey.id, { status })}
        />
      ) : null}

      {activeTab === "staff" ? (
        <StaffView
          branches={data.branches}
          filteredStaff={filteredStaff}
          isFormOpen={isStaffFormOpen}
          isLoading={isLoading}
          staffActiveFilter={staffActiveFilter}
          staffBranchFilter={staffBranchFilter}
          staffForm={staffForm}
          staffRoleFilter={staffRoleFilter}
          staffVisibleFilter={staffVisibleFilter}
          onActiveFilterChange={setStaffActiveFilter}
          onBranchFilterChange={setStaffBranchFilter}
          onEditStaff={(member) => {
            setStaffForm({
              id: member.id,
              name: member.name,
              branch_id: member.branch_id,
              role: isSupportedStaffRole(member.role) ? member.role : "trainer",
              display_order: member.display_order,
              is_active: member.is_active,
              is_visible_in_survey: member.is_visible_in_survey,
            });
            setIsStaffFormOpen(true);
          }}
          onNewStaff={() => {
            setStaffForm(defaultStaffForm(data.branches[0]?.id ?? ""));
            setIsStaffFormOpen(true);
          }}
          onRoleFilterChange={setStaffRoleFilter}
          onSaveStaff={saveStaff}
          onStaffFormChange={setStaffForm}
          onToggleActive={(member) => void updateStaff(member.id, { is_active: !member.is_active })}
          onToggleForm={() => setIsStaffFormOpen((current) => !current)}
          onToggleVisible={(member) => void updateStaff(member.id, { is_visible_in_survey: !member.is_visible_in_survey })}
          onVisibleFilterChange={setStaffVisibleFilter}
        />
      ) : null}
    </div>
  );
}

function DashboardView({
  activeSurvey,
  branchFilter,
  branchRows,
  branches,
  choiceStats,
  cleanlinessAverage,
  dateFilter,
  deletingResponseId,
  facilityAverage,
  isLoading,
  kindnessAverage,
  needsReviewCount,
  recommendRate,
  recentResponses,
  responseCount,
  retentionRate,
  staffMentionRows,
  surveyFilter,
  surveys,
  totalAverage,
  onBranchFilterChange,
  onDateFilterChange,
  onDeleteResponse,
  onSurveyFilterChange,
}: {
  activeSurvey: SatisfactionSurvey | null;
  branchFilter: BranchFilter;
  branchRows: Array<{
    branchId: string;
    branchName: string;
    responseCount: number;
    totalAverage: number | null;
    cleanlinessAverage: number | null;
    kindnessAverage: number | null;
    facilityAverage: number | null;
  }>;
  branches: Branch[];
  choiceStats: Array<{ questionId: string; questionText: string; rows: Array<{ label: string; count: number }> }>;
  cleanlinessAverage: number | null;
  dateFilter: DateFilter;
  deletingResponseId: string | null;
  facilityAverage: number | null;
  isLoading: boolean;
  kindnessAverage: number | null;
  needsReviewCount: number;
  recommendRate: number | null;
  recentResponses: SatisfactionResponse[];
  responseCount: number;
  retentionRate: number | null;
  staffMentionRows: Array<{ key: string; name: string; role: string; branchName: string; positiveCount: number; improvementCount: number }>;
  surveyFilter: string;
  surveys: SatisfactionSurvey[];
  totalAverage: number | null;
  onBranchFilterChange: (value: BranchFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onDeleteResponse: (responseId: string) => Promise<void>;
  onSurveyFilterChange: (value: string) => void;
}) {
  const report = buildRuleReport({
    cleanlinessAverage,
    facilityAverage,
    kindnessAverage,
    needsReviewCount,
    responseCount,
  });

  return (
    <div className="grid gap-5">
      <SatisfactionFilterBar
        branchFilter={branchFilter}
        branches={branches}
        dateFilter={dateFilter}
        surveyFilter={surveyFilter}
        surveys={surveys}
        onBranchFilterChange={onBranchFilterChange}
        onDateFilterChange={onDateFilterChange}
        onSurveyFilterChange={onSurveyFilterChange}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Star size={18} />} label="전체 만족도 평균" value={isLoading ? "불러오는 중" : formatAverage(totalAverage)} />
        <MetricCard icon={<ClipboardList size={18} />} label="총 응답 수" value={isLoading ? "불러오는 중" : `${responseCount}건`} />
        <MetricCard icon={<MessageSquareText size={18} />} label="현재 설문 회차" value={isLoading ? "불러오는 중" : activeSurvey?.title ?? "없음"} />
        <MetricCard icon={<HelpCircle size={18} />} label="처리 필요" value={isLoading ? "불러오는 중" : `${needsReviewCount}건`} />
        <MetricCard icon={<BarChart3 size={18} />} label="청결 평균" value={isLoading ? "불러오는 중" : formatAverage(cleanlinessAverage)} />
        <MetricCard icon={<BarChart3 size={18} />} label="친절 평균" value={isLoading ? "불러오는 중" : formatAverage(kindnessAverage)} />
        <MetricCard icon={<BarChart3 size={18} />} label="시설 평균" value={isLoading ? "불러오는 중" : formatAverage(facilityAverage)} />
        <MetricCard icon={<ArrowRight size={18} />} label="추천 / 계속 이용" value={isLoading ? "불러오는 중" : `${formatPercent(recommendRate)} / ${formatPercent(retentionRate)}`} />
      </section>

      <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold">지점별 평균 테이블</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">
              <tr>
                <th className="px-4 py-3">지점</th>
                <th className="px-4 py-3">응답 수</th>
                <th className="px-4 py-3">전체</th>
                <th className="px-4 py-3">청결</th>
                <th className="px-4 py-3">친절</th>
                <th className="px-4 py-3">시설</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oatmeal">
              {branchRows.map((row) => (
                <tr key={row.branchId}>
                  <td className="px-4 py-3 font-bold">{row.branchName}</td>
                  <td className="px-4 py-3">{row.responseCount}건</td>
                  <td className="px-4 py-3">{formatAverage(row.totalAverage)}</td>
                  <td className="px-4 py-3">{formatAverage(row.cleanlinessAverage)}</td>
                  <td className="px-4 py-3">{formatAverage(row.kindnessAverage)}</td>
                  <td className="px-4 py-3">{formatAverage(row.facilityAverage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">최근 응답</h2>
            <p className="mt-1 text-sm text-charcoal/60">현재 필터에 해당하는 최근 응답입니다. 테스트 응답은 여기서도 삭제할 수 있습니다.</p>
          </div>
          <Link href="/admin/satisfaction/responses" className="inline-flex h-10 items-center justify-center rounded-2xl border border-oatmeal bg-ivory px-4 text-sm font-bold text-cocoa transition hover:border-sand">
            전체 응답 보기
          </Link>
        </div>

        {isLoading ? <EmptyBox message="최근 응답을 불러오는 중입니다." /> : null}
        {!isLoading && recentResponses.length === 0 ? <EmptyBox message="최근 응답이 없습니다." /> : null}
        {!isLoading && recentResponses.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">
                <tr>
                  <th className="px-4 py-3">제출일</th>
                  <th className="px-4 py-3">지점</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal">
                {recentResponses.map((response) => (
                  <tr key={response.id}>
                    <td className="px-4 py-3">{formatDate(response.submitted_at)}</td>
                    <td className="px-4 py-3 font-bold">{getBranchName(branches, response.branch_id)}</td>
                    <td className="px-4 py-3">{getResponseStatusLabel(response.status)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={deletingResponseId === response.id}
                        onClick={() => void onDeleteResponse(response.id)}
                        className="inline-flex items-center gap-1 rounded-2xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={13} aria-hidden />
                        {deletingResponseId === response.id ? "삭제 중" : "삭제"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold">직원별 친절/개선 언급 수</h2>
          <div className="mt-4 grid gap-2">
            {staffMentionRows.length === 0 ? <EmptyBox message="직원 선택 응답이 없습니다." /> : null}
            {staffMentionRows.slice(0, 8).map((row) => (
              <article key={row.key} className="rounded-2xl border border-oatmeal bg-ivory px-4 py-3">
                <p className="font-bold">{row.name}</p>
                <p className="mt-1 text-sm text-cocoa">
                  {row.branchName} · {row.role}
                </p>
                <p className="mt-2 text-sm font-bold">
                  친절 {row.positiveCount}회 · 개선 필요 {row.improvementCount}회
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold">선택형 응답 통계</h2>
          <div className="mt-4 grid gap-3">
            {choiceStats.length === 0 ? <EmptyBox message="선택형 응답 통계가 없습니다." /> : null}
            {choiceStats.slice(0, 5).map((stat) => (
              <article key={stat.questionId} className="rounded-2xl border border-oatmeal bg-ivory px-4 py-3">
                <p className="font-bold">{stat.questionText}</p>
                <div className="mt-2 grid gap-1 text-sm">
                  {stat.rows.map((row) => (
                    <p key={`${stat.questionId}-${row.label}`} className="flex justify-between gap-3">
                      <span>{row.label}</span>
                      <strong>{row.count}건</strong>
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">AI REPORT</p>
        <h2 className="mt-2 text-xl font-bold">AI 분석 리포트 영역</h2>
        <p className="mt-3 rounded-2xl bg-ivory px-4 py-4 text-sm font-semibold leading-6 text-charcoal/75">{report}</p>
      </section>
    </div>
  );
}

function ResponsesView({
  answers,
  branches,
  branchFilter,
  dateFilter,
  events,
  deletingResponseId,
  filteredResponses,
  isLoading,
  lowOnly,
  optionMap,
  questionMap,
  responseDrafts,
  responseStatusFilter,
  selectedResponse,
  staffMap,
  surveyFilter,
  surveys,
  textOnly,
  onBranchFilterChange,
  onDateFilterChange,
  onDraftChange,
  onLowOnlyChange,
  onDeleteResponse,
  onSaveResponse,
  onSelectResponse,
  onStatusFilterChange,
  onSurveyFilterChange,
  onTextOnlyChange,
}: {
  answers: SatisfactionAnswer[];
  branches: Branch[];
  branchFilter: BranchFilter;
  dateFilter: DateFilter;
  events: SatisfactionResponseEvent[];
  deletingResponseId: string | null;
  filteredResponses: SatisfactionResponse[];
  isLoading: boolean;
  lowOnly: boolean;
  optionMap: Map<string, SatisfactionQuestionOption>;
  questionMap: Map<string, SatisfactionQuestion>;
  responseDrafts: Record<string, ResponseDraft>;
  responseStatusFilter: ResponseStatus | "all";
  selectedResponse: SatisfactionResponse | null;
  staffMap: Map<string, Staff>;
  surveyFilter: string;
  surveys: SatisfactionSurvey[];
  textOnly: boolean;
  onBranchFilterChange: (value: BranchFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onDraftChange: (responseId: string, draft: ResponseDraft) => void;
  onLowOnlyChange: (value: boolean) => void;
  onDeleteResponse: (responseId: string) => Promise<void>;
  onSaveResponse: (responseId: string) => Promise<void>;
  onSelectResponse: (responseId: string | null) => void;
  onStatusFilterChange: (value: ResponseStatus | "all") => void;
  onSurveyFilterChange: (value: string) => void;
  onTextOnlyChange: (value: boolean) => void;
}) {
  const selectedAnswers = selectedResponse ? answers.filter((answer) => answer.response_id === selectedResponse.id) : [];
  const selectedEvents = selectedResponse ? events.filter((event) => event.response_id === selectedResponse.id) : [];
  const selectedSurveyTitle = selectedResponse ? surveys.find((survey) => survey.id === selectedResponse.survey_id)?.title ?? "알 수 없는 설문" : "";
  const selectedDraft = selectedResponse ? responseDrafts[selectedResponse.id] : undefined;

  useEffect(() => {
    if (!selectedResponse) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSelectResponse(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSelectResponse, selectedResponse]);

  return (
    <div className="grid gap-5">
      <SatisfactionFilterBar
        branchFilter={branchFilter}
        branches={branches}
        dateFilter={dateFilter}
        surveyFilter={surveyFilter}
        surveys={surveys}
        onBranchFilterChange={onBranchFilterChange}
        onDateFilterChange={onDateFilterChange}
        onSurveyFilterChange={onSurveyFilterChange}
      />

      <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">응답 내역 관리</h2>
            <p className="mt-1 text-sm text-charcoal/60">상세 보기, 상태 변경, 담당자와 관리자 메모를 관리합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={responseStatusFilter} onChange={(event) => onStatusFilterChange(event.target.value as ResponseStatus | "all")} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
              <option value="all">전체 상태</option>
              {RESPONSE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {getResponseStatusLabel(status)}
                </option>
              ))}
            </select>
            <label className="inline-flex h-10 items-center gap-2 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
              <input type="checkbox" checked={lowOnly} onChange={(event) => onLowOnlyChange(event.target.checked)} />
              낮은 점수만
            </label>
            <label className="inline-flex h-10 items-center gap-2 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
              <input type="checkbox" checked={textOnly} onChange={(event) => onTextOnlyChange(event.target.checked)} />
              주관식 있음
            </label>
          </div>
        </div>

        {isLoading ? <EmptyBox message="응답을 불러오는 중입니다." /> : null}
        {!isLoading && filteredResponses.length === 0 ? <EmptyBox message="조건에 맞는 응답이 없습니다." /> : null}
        {!isLoading && filteredResponses.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">
                <tr>
                  <th className="px-4 py-3">제출일</th>
                  <th className="px-4 py-3">지점</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">담당자</th>
                  <th className="px-4 py-3">관리 메모</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal">
                {filteredResponses.map((response) => {
                  const draft = responseDrafts[response.id] ?? {
                    status: response.status,
                    admin_note: response.admin_note ?? "",
                    assigned_to: response.assigned_to ?? "",
                  };

                  return (
                    <tr key={response.id}>
                      <td className="px-4 py-3">{formatDate(response.submitted_at)}</td>
                      <td className="px-4 py-3 font-bold">{getBranchName(branches, response.branch_id)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={draft.status}
                          onChange={(event) => onDraftChange(response.id, { ...draft, status: event.target.value as ResponseStatus })}
                          className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold"
                        >
                          {RESPONSE_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {getResponseStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={draft.assigned_to}
                          onChange={(event) => onDraftChange(response.id, { ...draft, assigned_to: event.target.value })}
                          className="h-10 w-36 rounded-2xl border border-oatmeal bg-white px-3 text-sm"
                          placeholder="담당자"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={draft.admin_note}
                          onChange={(event) => onDraftChange(response.id, { ...draft, admin_note: event.target.value })}
                          className="h-10 w-64 rounded-2xl border border-oatmeal bg-white px-3 text-sm"
                          placeholder="관리 메모"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => onSelectResponse(response.id)} className="rounded-2xl border border-oatmeal px-3 py-2 text-xs font-bold">
                            상세
                          </button>
                          <button type="button" onClick={() => void onSaveResponse(response.id)} className="rounded-2xl bg-charcoal px-3 py-2 text-xs font-bold text-ivory">
                            저장
                          </button>
                          <button
                            type="button"
                            disabled={deletingResponseId === response.id}
                            onClick={() => void onDeleteResponse(response.id)}
                            className="inline-flex items-center gap-1 rounded-2xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={13} aria-hidden />
                            {deletingResponseId === response.id ? "삭제 중" : "삭제"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedResponse ? (
        <ResponseDetailModal
          answers={selectedAnswers}
          branchName={getBranchName(branches, selectedResponse.branch_id)}
          events={selectedEvents}
          optionMap={optionMap}
          questionMap={questionMap}
          response={selectedResponse}
          responseDraft={selectedDraft}
          staffMap={staffMap}
          surveyTitle={selectedSurveyTitle}
          onClose={() => onSelectResponse(null)}
        />
      ) : null}
    </div>
  );
}

function ResponseDetailModal({
  answers,
  branchName,
  events,
  optionMap,
  questionMap,
  response,
  responseDraft,
  staffMap,
  surveyTitle,
  onClose,
}: {
  answers: SatisfactionAnswer[];
  branchName: string;
  events: SatisfactionResponseEvent[];
  optionMap: Map<string, SatisfactionQuestionOption>;
  questionMap: Map<string, SatisfactionQuestion>;
  response: SatisfactionResponse;
  responseDraft?: ResponseDraft;
  staffMap: Map<string, Staff>;
  surveyTitle: string;
  onClose: () => void;
}) {
  const displayStatus = responseDraft?.status ?? response.status;
  const displayAssignedTo = responseDraft?.assigned_to || response.assigned_to || "-";
  const displayAdminNote = responseDraft?.admin_note || response.admin_note || "-";
  const ratingAnswers = answers.filter((answer) => getAnswerQuestionType(answer, questionMap) === "rating");
  const choiceAnswers = answers.filter((answer) => {
    const type = getAnswerQuestionType(answer, questionMap);
    return type === "single_choice" || type === "multiple_choice";
  });
  const staffChoiceAnswers = answers.filter((answer) => getAnswerQuestionType(answer, questionMap) === "staff_choice");
  const textAnswers = answers.filter((answer) => {
    const type = getAnswerQuestionType(answer, questionMap);
    return type === "text_short" || type === "text_long";
  });
  const groupedIds = new Set([...ratingAnswers, ...choiceAnswers, ...staffChoiceAnswers, ...textAnswers].map((answer) => answer.id));
  const otherAnswers = answers.filter((answer) => !groupedIds.has(answer.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="응답 상세 닫기" className="absolute inset-0 h-full w-full bg-black/55" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="satisfaction-response-detail-title"
        className="relative z-10 flex max-h-[85vh] w-[calc(100%-32px)] max-w-4xl flex-col overflow-hidden rounded-3xl border border-oatmeal bg-white shadow-[0_24px_90px_rgba(38,35,32,0.28)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-oatmeal px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">RESPONSE DETAIL</p>
            <h2 id="satisfaction-response-detail-title" className="mt-1 text-2xl font-black">
              응답 상세
            </h2>
            <p className="mt-1 text-sm text-charcoal/60">
              {formatDate(response.submitted_at)} · {branchName}
            </p>
          </div>
          <button
            type="button"
            aria-label="응답 상세 닫기"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-oatmeal bg-white text-cocoa transition hover:border-sand"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="overflow-y-auto px-5 pb-5 pt-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailMeta label="제출일" value={formatDate(response.submitted_at)} />
            <DetailMeta label="지점" value={branchName} />
            <DetailMeta label="설문 회차" value={surveyTitle} />
            <DetailMeta label="응답 상태" value={getResponseStatusLabel(displayStatus)} />
            <DetailMeta label="담당자" value={displayAssignedTo} />
            <DetailMeta label="관리자 메모" value={displayAdminNote} wide />
          </div>

          <div className="mt-5 grid gap-4">
            <ResponseAnswerSection answers={ratingAnswers} title="평점 응답" questionMap={questionMap} optionMap={optionMap} staffMap={staffMap} />
            <ResponseAnswerSection answers={choiceAnswers} title="선택형 응답" questionMap={questionMap} optionMap={optionMap} staffMap={staffMap} />
            <ResponseAnswerSection answers={staffChoiceAnswers} title="직원 선택형 응답" questionMap={questionMap} optionMap={optionMap} staffMap={staffMap} />
            <ResponseAnswerSection answers={textAnswers} title="주관식 응답" questionMap={questionMap} optionMap={optionMap} staffMap={staffMap} />
            <ResponseAnswerSection answers={otherAnswers} title="기타 응답" questionMap={questionMap} optionMap={optionMap} staffMap={staffMap} />
          </div>

          <div className="mt-5 rounded-2xl border border-oatmeal bg-white px-4 py-4">
            <h3 className="text-base font-bold">처리 이벤트</h3>
            {events.length === 0 ? <p className="mt-2 text-sm text-charcoal/60">기록된 이벤트가 없습니다.</p> : null}
            <div className="mt-3 grid gap-2">
              {events.map((event) => (
                <p key={event.id} className="rounded-xl bg-ivory px-3 py-2 text-sm">
                  {formatDate(event.created_at)} · {event.event_type} · {event.previous_status ?? "-"} → {event.new_status ?? "-"}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailMeta({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-oatmeal bg-ivory px-4 py-3 ${wide ? "sm:col-span-2 lg:col-span-1" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-bold leading-6 text-charcoal">{value || "-"}</p>
    </div>
  );
}

function ResponseAnswerSection({
  answers,
  optionMap,
  questionMap,
  staffMap,
  title,
}: {
  answers: SatisfactionAnswer[];
  optionMap: Map<string, SatisfactionQuestionOption>;
  questionMap: Map<string, SatisfactionQuestion>;
  staffMap: Map<string, Staff>;
  title: string;
}) {
  if (answers.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-oatmeal bg-white px-4 py-4">
      <h3 className="text-base font-bold">{title}</h3>
      <div className="mt-3 grid gap-3">
        {answers.map((answer) => (
          <article key={answer.id} className="rounded-2xl border border-oatmeal bg-ivory px-4 py-3">
            <p className="text-sm font-bold text-cocoa">{getAnswerQuestionText(answer, questionMap)}</p>
            <p className="mt-2 whitespace-pre-line text-base font-bold">{getAnswerDisplayValue(answer, questionMap, optionMap, staffMap)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuestionsView({
  data,
  isFormOpen,
  isLoading,
  isOptionFormOpen,
  optionForm,
  optionsQuestionId,
  questionForm,
  questionSurveyFilter,
  questions,
  onEditOption,
  onEditQuestion,
  onMoveOption,
  onMoveQuestion,
  onNewOption,
  onNewQuestion,
  onOptionFormChange,
  onOptionsQuestionChange,
  onQuestionFormChange,
  onQuestionSurveyFilterChange,
  onSaveOption,
  onSaveQuestion,
  onToggleOption,
  onToggleOptionForm,
  onToggleQuestion,
  onToggleQuestionForm,
}: {
  data: AdminData;
  isFormOpen: boolean;
  isLoading: boolean;
  isOptionFormOpen: boolean;
  optionForm: OptionFormState;
  optionsQuestionId: string | null;
  questionForm: QuestionFormState;
  questionSurveyFilter: string;
  questions: SatisfactionQuestion[];
  onEditOption: (option: SatisfactionQuestionOption) => void;
  onEditQuestion: (question: SatisfactionQuestion) => void;
  onMoveOption: (option: SatisfactionQuestionOption, direction: "up" | "down") => Promise<void>;
  onMoveQuestion: (question: SatisfactionQuestion, direction: "up" | "down") => Promise<void>;
  onNewOption: (questionId: string) => void;
  onNewQuestion: () => void;
  onOptionFormChange: (form: OptionFormState) => void;
  onOptionsQuestionChange: (questionId: string | null) => void;
  onQuestionFormChange: (form: QuestionFormState) => void;
  onQuestionSurveyFilterChange: (surveyId: string) => void;
  onSaveOption: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSaveQuestion: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggleOption: (option: SatisfactionQuestionOption) => void;
  onToggleOptionForm: () => void;
  onToggleQuestion: (question: SatisfactionQuestion) => void;
  onToggleQuestionForm: () => void;
}) {
  const surveyById = new Map(data.surveys.map((survey) => [survey.id, survey.title]));

  return (
    <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
      <SectionHeader
        description="질문 추가, 수정, 비활성화, 순서 변경, 선택지 관리를 수행합니다."
        title="질문 관리"
        actionLabel="질문 추가"
        onAction={onNewQuestion}
      />

      <p className="mt-4 rounded-2xl border border-sand bg-ivory px-4 py-3 text-sm font-semibold leading-6 text-cocoa">
        이미 응답이 있는 질문을 크게 수정하면 과거 통계 해석이 달라질 수 있습니다. 새로운 의미의 질문이라면 기존 질문을 비활성화하고 새 질문을 추가해주세요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={questionSurveyFilter} onChange={(event) => onQuestionSurveyFilterChange(event.target.value)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 설문</option>
          {data.surveys.map((survey) => (
            <option key={survey.id} value={survey.id}>
              {survey.title}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen ? (
        <QuestionForm
          form={questionForm}
          surveys={data.surveys}
          onChange={onQuestionFormChange}
          onSubmit={onSaveQuestion}
          onCancel={onToggleQuestionForm}
        />
      ) : null}

      {isLoading ? <EmptyBox message="질문을 불러오는 중입니다." /> : null}
      {!isLoading && questions.length === 0 ? <EmptyBox message="질문이 없습니다." /> : null}
      <div className="mt-4 grid gap-3">
        {questions.map((question) => {
          const questionOptions = data.options.filter((option) => option.question_id === question.id);
          const isOptionsOpen = optionsQuestionId === question.id;
          return (
            <article key={question.id} className="rounded-2xl border border-oatmeal bg-ivory px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-cocoa">{surveyById.get(question.survey_id) ?? "알 수 없는 설문"}</p>
                  <h3 className="mt-1 text-lg font-bold">{question.question_text}</h3>
                  <p className="mt-2 text-sm text-charcoal/65">
                    {getCategoryLabel(question.category)} · {getQuestionTypeLabel(question.question_type)} · {question.is_required ? "필수" : "선택"} ·{" "}
                    {question.is_core_metric ? "핵심 지표" : "일반"} · 순서 {question.display_order} · {question.is_active ? "활성" : "비활성"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SmallButton label="수정" icon={<Pencil size={14} />} onClick={() => onEditQuestion(question)} />
                  <SmallButton label={question.is_active ? "비활성화" : "활성화"} onClick={() => onToggleQuestion(question)} />
                  <SmallButton label="위로" icon={<ArrowUp size={14} />} onClick={() => void onMoveQuestion(question, "up")} />
                  <SmallButton label="아래로" icon={<ArrowDown size={14} />} onClick={() => void onMoveQuestion(question, "down")} />
                  {isChoiceQuestion(question) ? <SmallButton label="선택지 관리" onClick={() => onOptionsQuestionChange(isOptionsOpen ? null : question.id)} /> : null}
                </div>
              </div>

              {isOptionsOpen ? (
                <div className="mt-4 rounded-2xl border border-oatmeal bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold">선택지 관리</h4>
                    <button type="button" onClick={() => onNewOption(question.id)} className="inline-flex h-9 items-center gap-2 rounded-2xl bg-charcoal px-3 text-sm font-bold text-ivory">
                      <Plus size={15} aria-hidden />
                      선택지 추가
                    </button>
                  </div>
                  {isOptionFormOpen && optionForm.question_id === question.id ? (
                    <OptionForm form={optionForm} onChange={onOptionFormChange} onSubmit={onSaveOption} onCancel={onToggleOptionForm} />
                  ) : null}
                  <div className="mt-3 grid gap-2">
                    {questionOptions.map((option) => (
                      <div key={option.id} className="flex flex-col gap-2 rounded-xl bg-ivory px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm">
                          <strong>{option.option_text}</strong> · {option.option_value ?? "-"} · 순서 {option.display_order} · {option.is_active ? "활성" : "비활성"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <SmallButton label="수정" onClick={() => onEditOption(option)} />
                          <SmallButton label={option.is_active ? "비활성화" : "활성화"} onClick={() => onToggleOption(option)} />
                          <SmallButton label="위로" onClick={() => void onMoveOption(option, "up")} />
                          <SmallButton label="아래로" onClick={() => void onMoveOption(option, "down")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StaffView({
  branches,
  filteredStaff,
  isFormOpen,
  isLoading,
  staffActiveFilter,
  staffBranchFilter,
  staffForm,
  staffRoleFilter,
  staffVisibleFilter,
  onActiveFilterChange,
  onBranchFilterChange,
  onEditStaff,
  onNewStaff,
  onRoleFilterChange,
  onSaveStaff,
  onStaffFormChange,
  onToggleActive,
  onToggleForm,
  onToggleVisible,
  onVisibleFilterChange,
}: {
  branches: Branch[];
  filteredStaff: Staff[];
  isFormOpen: boolean;
  isLoading: boolean;
  staffActiveFilter: ActiveFilter;
  staffBranchFilter: BranchFilter;
  staffForm: StaffFormState;
  staffRoleFilter: RoleFilter;
  staffVisibleFilter: VisibleFilter;
  onActiveFilterChange: (value: ActiveFilter) => void;
  onBranchFilterChange: (value: BranchFilter) => void;
  onEditStaff: (member: Staff) => void;
  onNewStaff: () => void;
  onRoleFilterChange: (value: RoleFilter) => void;
  onSaveStaff: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onStaffFormChange: (form: StaffFormState) => void;
  onToggleActive: (member: Staff) => void;
  onToggleForm: () => void;
  onToggleVisible: (member: Staff) => void;
  onVisibleFilterChange: (value: VisibleFilter) => void;
}) {
  return (
    <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
      <SectionHeader
        description="직원 추가, 수정, 활성 상태, 설문 노출 여부를 관리합니다."
        title="직원 관리"
        actionLabel="직원 추가"
        onAction={onNewStaff}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={staffBranchFilter} onChange={(event) => onBranchFilterChange(event.target.value as BranchFilter)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 지점</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <select value={staffActiveFilter} onChange={(event) => onActiveFilterChange(event.target.value as ActiveFilter)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
        <select value={staffVisibleFilter} onChange={(event) => onVisibleFilterChange(event.target.value as VisibleFilter)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 노출</option>
          <option value="visible">노출</option>
          <option value="hidden">미노출</option>
        </select>
        <select value={staffRoleFilter} onChange={(event) => onRoleFilterChange(event.target.value as RoleFilter)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 직무</option>
          {STAFF_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {STAFF_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen ? <StaffForm branches={branches} form={staffForm} onChange={onStaffFormChange} onSubmit={onSaveStaff} onCancel={onToggleForm} /> : null}

      {isLoading ? <EmptyBox message="직원 목록을 불러오는 중입니다." /> : null}
      {!isLoading && filteredStaff.length === 0 ? <EmptyBox message="조건에 맞는 직원이 없습니다." /> : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">
            <tr>
              <th className="px-4 py-3">직원명</th>
              <th className="px-4 py-3">지점</th>
              <th className="px-4 py-3">직무</th>
              <th className="px-4 py-3">정렬</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">설문 노출</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oatmeal">
            {filteredStaff.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-bold">{member.name}</td>
                <td className="px-4 py-3">{getBranchName(branches, member.branch_id)}</td>
                <td className="px-4 py-3">{getRoleLabel(member.role)}</td>
                <td className="px-4 py-3">{member.display_order}</td>
                <td className="px-4 py-3">{member.is_active ? "활성" : "비활성"}</td>
                <td className="px-4 py-3">{member.is_visible_in_survey ? "노출" : "미노출"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <SmallButton label="수정" icon={<Pencil size={14} />} onClick={() => onEditStaff(member)} />
                    <SmallButton label={member.is_active ? "비활성화" : "활성화"} onClick={() => onToggleActive(member)} />
                    <SmallButton
                      label={member.is_visible_in_survey ? "미노출" : "노출"}
                      icon={member.is_visible_in_survey ? <EyeOff size={14} /> : <Eye size={14} />}
                      onClick={() => onToggleVisible(member)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SurveysView({
  copySourceByTarget,
  data,
  isFormOpen,
  isLoading,
  surveyForm,
  onArchiveSurvey,
  onCopyQuestions,
  onCopySourceChange,
  onEditSurvey,
  onNewSurvey,
  onSaveSurvey,
  onSurveyFormChange,
  onToggleForm,
  onUpdateStatus,
}: {
  copySourceByTarget: Record<string, string>;
  data: AdminData;
  isFormOpen: boolean;
  isLoading: boolean;
  surveyForm: SurveyFormState;
  onArchiveSurvey: (survey: SatisfactionSurvey) => void;
  onCopyQuestions: (targetSurveyId: string) => Promise<void>;
  onCopySourceChange: (targetSurveyId: string, sourceSurveyId: string) => void;
  onEditSurvey: (survey: SatisfactionSurvey) => void;
  onNewSurvey: () => void;
  onSaveSurvey: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSurveyFormChange: (form: SurveyFormState) => void;
  onToggleForm: () => void;
  onUpdateStatus: (survey: SatisfactionSurvey, status: SurveyStatus) => void;
}) {
  return (
    <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
      <SectionHeader
        description="설문 회차 생성, 수정, 상태 변경, 보관 처리, 이전 회차 질문 복사를 수행합니다."
        title="설문 회차 관리"
        actionLabel="설문 회차 추가"
        onAction={onNewSurvey}
      />

      {isFormOpen ? <SurveyForm form={surveyForm} onChange={onSurveyFormChange} onSubmit={onSaveSurvey} onCancel={onToggleForm} /> : null}
      {isLoading ? <EmptyBox message="설문 회차를 불러오는 중입니다." /> : null}
      {!isLoading && data.surveys.length === 0 ? <EmptyBox message="설문 회차가 없습니다." /> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">연도/분기</th>
              <th className="px-4 py-3">기간</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">응답 수</th>
              <th className="px-4 py-3">질문 수</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oatmeal">
            {data.surveys.map((survey) => {
              const responseCount = data.responses.filter((response) => response.survey_id === survey.id).length;
              const questionCount = data.questions.filter((question) => question.survey_id === survey.id).length;
              return (
                <tr key={survey.id}>
                  <td className="px-4 py-3 font-bold">{survey.title}</td>
                  <td className="px-4 py-3">
                    {survey.year}년 {survey.quarter ?? "-"}분기
                  </td>
                  <td className="px-4 py-3">
                    {survey.start_date} ~ {survey.end_date}
                  </td>
                  <td className="px-4 py-3">
                    <select value={survey.status} onChange={(event) => onUpdateStatus(survey, event.target.value as SurveyStatus)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
                      {SURVEY_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {getSurveyStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{responseCount}건</td>
                  <td className="px-4 py-3">{questionCount}개</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <SmallButton label="수정" onClick={() => onEditSurvey(survey)} />
                      <SmallButton label="보관 처리" onClick={() => onArchiveSurvey(survey)} />
                      <select
                        value={copySourceByTarget[survey.id] ?? ""}
                        onChange={(event) => onCopySourceChange(survey.id, event.target.value)}
                        className="h-9 rounded-2xl border border-oatmeal bg-white px-2 text-xs font-bold"
                      >
                        <option value="">복사 원본</option>
                        {data.surveys
                          .filter((source) => source.id !== survey.id)
                          .map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.title}
                            </option>
                          ))}
                      </select>
                      <SmallButton label="질문 복사" onClick={() => void onCopyQuestions(survey.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SatisfactionFilterBar({
  branchFilter,
  branches,
  dateFilter,
  surveyFilter,
  surveys,
  onBranchFilterChange,
  onDateFilterChange,
  onSurveyFilterChange,
}: {
  branchFilter: BranchFilter;
  branches: Branch[];
  dateFilter: DateFilter;
  surveyFilter: string;
  surveys: SatisfactionSurvey[];
  onBranchFilterChange: (value: BranchFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onSurveyFilterChange: (value: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-oatmeal bg-white p-4 shadow-soft">
      <div className="flex flex-wrap gap-2">
        <select value={surveyFilter} onChange={(event) => onSurveyFilterChange(event.target.value)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 설문</option>
          {surveys.map((survey) => (
            <option key={survey.id} value={survey.id}>
              {survey.title}
            </option>
          ))}
        </select>
        <select value={branchFilter} onChange={(event) => onBranchFilterChange(event.target.value as BranchFilter)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 지점</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <select value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value as DateFilter)} className="h-10 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
          <option value="all">전체 기간</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="month">이번 달</option>
        </select>
      </div>
    </section>
  );
}

function StaffForm({
  branches,
  form,
  onCancel,
  onChange,
  onSubmit,
}: {
  branches: Branch[];
  form: StaffFormState;
  onCancel: () => void;
  onChange: (form: StaffFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-2xl border border-oatmeal bg-ivory p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <TextField label="직원명" value={form.name} onChange={(value) => onChange({ ...form, name: value })} required />
        <SelectField label="지점" value={form.branch_id} onChange={(value) => onChange({ ...form, branch_id: value })}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="직무" value={form.role} onChange={(value) => onChange({ ...form, role: value as StaffRole })}>
          {STAFF_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {STAFF_ROLE_LABELS[role]}
            </option>
          ))}
        </SelectField>
        <NumberField label="정렬 순서" value={form.display_order} onChange={(value) => onChange({ ...form, display_order: value })} />
        <CheckboxField label="활성 상태" checked={form.is_active} onChange={(value) => onChange({ ...form, is_active: value })} />
        <CheckboxField label="설문 노출" checked={form.is_visible_in_survey} onChange={(value) => onChange({ ...form, is_visible_in_survey: value })} />
      </div>
      <FormActions isEditing={Boolean(form.id)} onCancel={onCancel} />
    </form>
  );
}

function QuestionForm({
  form,
  onCancel,
  onChange,
  onSubmit,
  surveys,
}: {
  form: QuestionFormState;
  onCancel: () => void;
  onChange: (form: QuestionFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  surveys: SatisfactionSurvey[];
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-2xl border border-oatmeal bg-ivory p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="설문 회차" value={form.survey_id} onChange={(value) => onChange({ ...form, survey_id: value })}>
          {surveys.map((survey) => (
            <option key={survey.id} value={survey.id}>
              {survey.title}
            </option>
          ))}
        </SelectField>
        <TextField label="질문 문구" value={form.question_text} onChange={(value) => onChange({ ...form, question_text: value })} required />
        <SelectField
          label="질문 유형"
          value={form.question_type}
          onChange={(value) =>
            onChange({
              ...form,
              question_type: value as QuestionType,
              staff_choice_purpose: value === "staff_choice" ? form.staff_choice_purpose : "positive",
            })
          }
        >
          {QUESTION_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {QUESTION_TYPE_LABELS[type]}
            </option>
          ))}
        </SelectField>
        <SelectField label="카테고리" value={form.category} onChange={(value) => onChange({ ...form, category: value as QuestionCategory })}>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </SelectField>
        <NumberField label="노출 순서" value={form.display_order} onChange={(value) => onChange({ ...form, display_order: value })} />
        <TextField label="placeholder" value={form.placeholder} onChange={(value) => onChange({ ...form, placeholder: value })} />
        <SelectField
          label="직원 선택 목적"
          value={form.staff_choice_purpose}
          onChange={(value) => onChange({ ...form, staff_choice_purpose: value as Exclude<StaffChoicePurpose, null> })}
          disabled={form.question_type !== "staff_choice"}
        >
          <option value="positive">친절 직원 선택</option>
          <option value="improvement">개선 필요 직원 선택</option>
        </SelectField>
        <div className="grid grid-cols-3 gap-2">
          <CheckboxField label="필수 응답" checked={form.is_required} onChange={(value) => onChange({ ...form, is_required: value })} />
          <CheckboxField label="활성" checked={form.is_active} onChange={(value) => onChange({ ...form, is_active: value })} />
          <CheckboxField label="핵심 지표" checked={form.is_core_metric} onChange={(value) => onChange({ ...form, is_core_metric: value })} />
        </div>
      </div>
      <FormActions isEditing={Boolean(form.id)} onCancel={onCancel} />
    </form>
  );
}

function OptionForm({
  form,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: OptionFormState;
  onCancel: () => void;
  onChange: (form: OptionFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3 rounded-xl border border-oatmeal bg-ivory p-3">
      <div className="grid gap-3 md:grid-cols-4">
        <TextField label="선택지명" value={form.option_text} onChange={(value) => onChange({ ...form, option_text: value })} required />
        <TextField label="저장 값" value={form.option_value} onChange={(value) => onChange({ ...form, option_value: value })} />
        <NumberField label="정렬 순서" value={form.display_order} onChange={(value) => onChange({ ...form, display_order: value })} />
        <CheckboxField label="활성" checked={form.is_active} onChange={(value) => onChange({ ...form, is_active: value })} />
      </div>
      <FormActions isEditing={Boolean(form.id)} onCancel={onCancel} />
    </form>
  );
}

function SurveyForm({
  form,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: SurveyFormState;
  onCancel: () => void;
  onChange: (form: SurveyFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-2xl border border-oatmeal bg-ivory p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <TextField label="제목" value={form.title} onChange={(value) => onChange({ ...form, title: value })} required />
        <NumberField label="연도" value={form.year} onChange={(value) => onChange({ ...form, year: value })} />
        <NumberField label="분기" value={form.quarter ?? 0} onChange={(value) => onChange({ ...form, quarter: value || null })} />
        <DateField label="시작일" value={form.start_date} onChange={(value) => onChange({ ...form, start_date: value })} />
        <DateField label="종료일" value={form.end_date} onChange={(value) => onChange({ ...form, end_date: value })} />
        <SelectField label="상태" value={form.status} onChange={(value) => onChange({ ...form, status: value as SurveyStatus })}>
          {SURVEY_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {SURVEY_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>
      </div>
      <FormActions isEditing={Boolean(form.id)} onCancel={onCancel} />
    </form>
  );
}

function SectionHeader({
  actionLabel,
  description,
  title,
  onAction,
}: {
  actionLabel: string;
  description: string;
  title: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-charcoal/60">{description}</p>
      </div>
      <button type="button" onClick={onAction} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-charcoal px-4 text-sm font-bold text-ivory">
        <Plus size={16} aria-hidden />
        {actionLabel}
      </button>
    </div>
  );
}

function TextField({ label, required, value, onChange }: { label: string; required?: boolean; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-11 w-full rounded-2xl border border-oatmeal bg-white px-3 text-sm outline-none focus:border-cocoa"
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-2xl border border-oatmeal bg-white px-3 text-sm outline-none focus:border-cocoa"
      />
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-oatmeal bg-white px-3 text-sm outline-none focus:border-cocoa"
      />
    </label>
  );
}

function SelectField({
  children,
  disabled,
  label,
  value,
  onChange,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-2xl border border-oatmeal bg-white px-3 text-sm outline-none focus:border-cocoa disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}

function CheckboxField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-2xl border border-oatmeal bg-white px-3 text-sm font-bold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function FormActions({ isEditing, onCancel }: { isEditing: boolean; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-charcoal px-4 text-sm font-bold text-ivory">
        <Save size={15} aria-hidden />
        {isEditing ? "수정 저장" : "추가 저장"}
      </button>
      <button type="button" onClick={onCancel} className="h-10 rounded-2xl border border-oatmeal bg-white px-4 text-sm font-bold">
        취소
      </button>
    </div>
  );
}

function SmallButton({ icon, label, onClick }: { icon?: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-1 rounded-2xl border border-oatmeal bg-white px-3 text-xs font-bold text-charcoal transition hover:border-sand">
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-charcoal text-ivory">{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-cocoa">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold">{value}</p>
    </article>
  );
}

function EmptyBox({ message }: { message: string }) {
  return <p className="mt-4 rounded-2xl bg-ivory px-4 py-8 text-center text-sm font-bold text-charcoal/60">{message}</p>;
}

function ErrorBanner({ message }: { message: string }) {
  return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>;
}

function SuccessBanner({ message }: { message: string }) {
  return <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p>;
}
