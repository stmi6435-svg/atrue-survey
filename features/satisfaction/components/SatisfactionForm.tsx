"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  DEFAULT_BRANCHES,
  SATISFACTION_COMPLETE_MESSAGE,
  SUBMITTED_STORAGE_PREFIX,
} from "@/features/satisfaction/constants";
import type {
  Branch,
  BranchId,
  QuestionCategory,
  SatisfactionAnswerDraft,
  SatisfactionQuestion,
  SatisfactionQuestionOption,
  SatisfactionSurvey,
  Staff,
} from "@/features/satisfaction/types";
import {
  buildAnswerInsert,
  getBranchName,
  getLocalDateString,
  getOptionStoredValue,
  getQuestionCategory,
  groupOptionsByQuestion,
  isLowAnswer,
  isQuestionAnswered,
  optionalText,
} from "@/features/satisfaction/utils";
import { getSupabaseClient } from "@/lib/supabase";

const QUESTION_CATEGORY_ORDER: QuestionCategory[] = ["cleanliness", "kindness", "facility", "intention", "free_text", "other"];
const SCORE_VALUES = [1, 2, 3, 4, 5];

function getClientToken() {
  const key = "atruegym_satisfaction_client_token";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, token);
  return token;
}

type SupabaseErrorDetails = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  name?: string;
};

function getSupabaseErrorDetails(error: unknown): SupabaseErrorDetails {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  const record = error as Partial<Record<keyof SupabaseErrorDetails, unknown>>;

  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    details: typeof record.details === "string" ? record.details : undefined,
    hint: typeof record.hint === "string" ? record.hint : undefined,
    name: typeof record.name === "string" ? record.name : undefined,
  };
}

function getErrorMessage(error: unknown) {
  return getSupabaseErrorDetails(error).message ?? (error instanceof Error ? error.message : "");
}

function logSupabaseError(label: string, error: unknown, context?: Record<string, unknown>) {
  const details = getSupabaseErrorDetails(error);
  console.error(label, {
    code: details.code,
    message: details.message,
    details: details.details,
    hint: details.hint,
    name: details.name,
    context,
    raw: error,
  });
}

function MessagePanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-3xl border border-oatmeal bg-white p-6 text-center shadow-soft sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ivory text-cocoa">
        <CheckCircle2 size={32} aria-hidden />
      </div>
      <h2 className="mt-5 text-2xl font-black text-charcoal">{title}</h2>
      <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-base font-medium leading-7 text-charcoal/70">{body}</p>
    </section>
  );
}

function QuestionCard({
  question,
  options,
  staff,
  answer,
  selectedBranchId,
  isLoadingStaff,
  disabled,
  onChange,
}: {
  question: SatisfactionQuestion;
  options: SatisfactionQuestionOption[];
  staff: Staff[];
  answer: SatisfactionAnswerDraft | undefined;
  selectedBranchId: BranchId;
  isLoadingStaff: boolean;
  disabled: boolean;
  onChange: (answer: SatisfactionAnswerDraft) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-oatmeal bg-white p-4 sm:p-5">
      <legend className="px-1 text-base font-black leading-6 text-charcoal">
        {question.question_text}
        {question.is_required ? <span className="ml-1 text-clay">*</span> : null}
      </legend>
      {question.placeholder ? <p className="mt-2 text-sm font-medium leading-6 text-charcoal/60">{question.placeholder}</p> : null}

      {question.question_type === "rating" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {SCORE_VALUES.map((score) => {
            const isSelected = answer?.rating_value === score;
            return (
              <button
                key={score}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onChange({ rating_value: score })}
                className={`h-12 w-12 rounded-2xl border text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected ? "border-clay bg-clay text-white shadow-soft" : "border-oatmeal bg-ivory text-cocoa hover:border-clay"
                }`}
              >
                {score}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.question_type === "text_short" ? (
        <input
          value={answer?.text_value ?? ""}
          onChange={(event) => onChange({ text_value: event.target.value })}
          disabled={disabled}
          placeholder={question.placeholder ?? "의견을 입력해주세요."}
          className="mt-4 h-12 w-full rounded-2xl border border-oatmeal bg-ivory px-4 text-base font-medium text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay disabled:opacity-60"
        />
      ) : null}

      {question.question_type === "text_long" ? (
        <textarea
          value={answer?.text_value ?? ""}
          onChange={(event) => onChange({ text_value: event.target.value })}
          disabled={disabled}
          placeholder={question.placeholder ?? "자유롭게 적어주세요."}
          className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-oatmeal bg-ivory px-4 py-3 text-base font-medium text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay disabled:opacity-60"
        />
      ) : null}

      {question.question_type === "single_choice" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const value = getOptionStoredValue(option);
            const isSelected = answer?.choice_value === value;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ choice_value: value })}
                className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected ? "border-clay bg-[#FFF1DE] text-charcoal shadow-soft" : "border-oatmeal bg-ivory text-charcoal/75 hover:border-clay"
                }`}
              >
                {option.option_text}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.question_type === "multiple_choice" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const value = getOptionStoredValue(option);
            const selectedValues = answer?.choice_values ?? [];
            const isSelected = selectedValues.includes(value);
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const nextValues = isSelected ? selectedValues.filter((item) => item !== value) : [...selectedValues, value];
                  onChange({ choice_values: nextValues });
                }}
                className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected ? "border-clay bg-[#FFF1DE] text-charcoal shadow-soft" : "border-oatmeal bg-ivory text-charcoal/75 hover:border-clay"
                }`}
              >
                {option.option_text}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.question_type === "staff_choice" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {!selectedBranchId ? (
            <p className="rounded-2xl border border-oatmeal bg-ivory px-4 py-3 text-sm font-bold text-charcoal/65">먼저 지점을 선택해주세요.</p>
          ) : null}
          {isLoadingStaff ? (
            <p className="rounded-2xl border border-oatmeal bg-ivory px-4 py-3 text-sm font-bold text-charcoal/65">직원 목록을 불러오는 중입니다.</p>
          ) : null}
          {!isLoadingStaff
            ? [
                ...staff.map((member) => ({ id: member.id, label: member.name, isNone: false })),
                { id: "none", label: "없음", isNone: true },
              ].map((item) => {
                const isSelected = item.isNone ? Boolean(answer?.staff_none) : answer?.staff_id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(item.isNone ? { staff_id: null, staff_none: true } : { staff_id: item.id, staff_none: false })}
                    className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected ? "border-clay bg-[#FFF1DE] text-charcoal shadow-soft" : "border-oatmeal bg-ivory text-charcoal/75 hover:border-clay"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })
            : null}
        </div>
      ) : null}
    </fieldset>
  );
}

export function SatisfactionForm() {
  const router = useRouter();
  const [survey, setSurvey] = useState<SatisfactionSurvey | null>(null);
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [questions, setQuestions] = useState<SatisfactionQuestion[]>([]);
  const [options, setOptions] = useState<SatisfactionQuestionOption[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId>("");
  const [answers, setAnswers] = useState<Record<string, SatisfactionAnswerDraft>>({});
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const optionsByQuestion = useMemo(() => groupOptionsByQuestion(options), [options]);
  const questionsByCategory = useMemo(() => {
    return QUESTION_CATEGORY_ORDER.map((category) => ({
      category,
      questions: questions.filter((question) => getQuestionCategory(question) === category),
    })).filter((section) => section.questions.length > 0);
  }, [questions]);

  useEffect(() => {
    async function loadSurveyData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const supabase = getSupabaseClient();
        const today = getLocalDateString();

        const { data: branchData, error: branchError } = await supabase
          .from("branches")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("name", { ascending: true });

        if (branchError) {
          throw branchError;
        }

        if (branchData.length > 0) {
          setBranches(branchData);
        }

        const { data: surveyData, error: surveyError } = await supabase
          .from("satisfaction_surveys")
          .select("*")
          .eq("status", "active")
          .lte("start_date", today)
          .gte("end_date", today)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (surveyError) {
          throw surveyError;
        }

        if (!surveyData) {
          router.replace("/satisfaction/closed");
          return;
        }

        setSurvey(surveyData);
        setIsAlreadySubmitted(window.localStorage.getItem(`${SUBMITTED_STORAGE_PREFIX}${surveyData.id}`) === "true");

        const { data: questionData, error: questionError } = await supabase
          .from("satisfaction_questions")
          .select("*")
          .eq("survey_id", surveyData.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (questionError) {
          throw questionError;
        }

        setQuestions(questionData);

        if (questionData.length === 0) {
          setOptions([]);
          return;
        }

        const { data: optionData, error: optionError } = await supabase
          .from("satisfaction_question_options")
          .select("*")
          .in(
            "question_id",
            questionData.map((question) => question.id),
          )
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (optionError) {
          throw optionError;
        }

        setOptions(optionData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "회원 만족도 조사를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSurveyData();
  }, [router]);

  useEffect(() => {
    async function loadStaff(branchId: BranchId) {
      setIsLoadingStaff(true);
      setErrorMessage("");

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .eq("branch_id", branchId)
          .eq("is_active", true)
          .eq("is_visible_in_survey", true)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        setStaff(data);
      } catch (error) {
        setStaff([]);
        setErrorMessage(error instanceof Error ? error.message : "직원 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoadingStaff(false);
      }
    }

    if (!selectedBranchId) {
      setStaff([]);
      return;
    }

    void loadStaff(selectedBranchId);
  }, [selectedBranchId]);

  function updateAnswer(questionId: string, nextAnswer: SatisfactionAnswerDraft) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        ...nextAnswer,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!survey) {
      setErrorMessage("진행 중인 설문 회차가 없습니다.");
      return;
    }

    if (!selectedBranchId) {
      setErrorMessage("먼저 이용 중인 지점을 선택해주세요.");
      return;
    }

    const missingQuestion = questions.find((question) => !isQuestionAnswered(question, answers[question.id]));
    if (missingQuestion) {
      setErrorMessage(`필수 질문에 응답해주세요: ${missingQuestion.question_text}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const answerPayloads = questions.map((question) =>
        buildAnswerInsert({
          question,
          draft: answers[question.id],
          options: optionsByQuestion.get(question.id) ?? [],
          staff,
          selectedBranchId,
        }),
      );
      const hasLowSignal = questions.some((question) => isLowAnswer(question, answers[question.id]));
      const supabase = getSupabaseClient();
      const responseId = crypto.randomUUID();

      const responsePayload = {
        id: responseId,
        survey_id: survey.id,
        branch_id: selectedBranchId,
        member_name: optionalText(memberName),
        member_phone: optionalText(memberPhone),
        client_token: getClientToken(),
        status: hasLowSignal ? "needs_review" : "normal",
      } as const;

      const { error: responseError } = await supabase.from("satisfaction_responses").insert(responsePayload);

      if (responseError) {
        logSupabaseError("Failed to insert satisfaction response", responseError, {
          responseId,
          survey_id: survey.id,
          branch_id: selectedBranchId,
          status: hasLowSignal ? "needs_review" : "normal",
        });
        throw responseError;
      }

      const answerInsertPayloads = answerPayloads.map((answer) => ({
        response_id: responseId,
        ...answer,
      }));

      const { error: answerError } = await supabase.from("satisfaction_answers").insert(answerInsertPayloads);

      if (answerError) {
        logSupabaseError("Failed to insert satisfaction answers", answerError, {
          responseId,
          survey_id: survey.id,
          branch_id: selectedBranchId,
          answerCount: answerInsertPayloads.length,
          questionIds: answerInsertPayloads.map((answer) => answer.question_id),
          questionTypes: questions.map((question) => question.question_type),
          staffAnswerCount: answerInsertPayloads.filter((answer) => answer.staff_id).length,
          ratingAnswerCount: answerInsertPayloads.filter((answer) => answer.rating_value !== null).length,
          singleChoiceAnswerCount: answerInsertPayloads.filter((answer) => answer.choice_value !== null).length,
          multipleChoiceAnswerCount: answerInsertPayloads.filter((answer) => answer.choice_values?.length).length,
        });
        throw answerError;
      }

      window.localStorage.setItem(`${SUBMITTED_STORAGE_PREFIX}${survey.id}`, "true");
      router.replace("/satisfaction/complete");
    } catch (error) {
      logSupabaseError("Satisfaction survey submit failed", error, {
        survey_id: survey.id,
        branch_id: selectedBranchId,
        questionCount: questions.length,
        answeredQuestionCount: Object.keys(answers).length,
      });

      const message = getErrorMessage(error);
      setErrorMessage(message ? `설문 제출에 실패했습니다. ${message}` : "설문 제출에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-oatmeal bg-white p-6 text-center shadow-soft sm:p-8">
        <Loader2 className="mx-auto animate-spin text-cocoa" size={34} aria-hidden />
        <p className="mt-4 text-sm font-black text-charcoal/70">회원 만족도 조사를 불러오고 있습니다.</p>
      </section>
    );
  }

  if (isAlreadySubmitted && survey) {
    return <MessagePanel title="이미 제출한 설문입니다." body="같은 브라우저에서는 동일 설문 회차를 한 번만 제출할 수 있습니다." />;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-xl font-black text-charcoal">{survey?.title ?? "회원 만족도 조사"}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-charcoal/65">
          이용 중인 지점을 선택한 뒤 각 문항에 응답해주세요. 답변은 센터 운영 개선 목적으로만 사용됩니다.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {branches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setAnswers((current) => {
                    const next = { ...current };
                    questions
                      .filter((question) => question.question_type === "staff_choice")
                      .forEach((question) => {
                        delete next[question.id];
                      });
                    return next;
                  });
                }}
                className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-base font-black transition ${
                  isSelected ? "border-clay bg-[#FFF1DE] text-charcoal shadow-soft" : "border-oatmeal bg-ivory text-charcoal/75 hover:border-clay"
                }`}
              >
                {branch.name}
              </button>
            );
          })}
        </div>
        {selectedBranchId ? (
          <p className="mt-4 rounded-2xl bg-ivory px-4 py-3 text-sm font-black text-cocoa">
            선택 지점: {getBranchName(branches, selectedBranchId)}
          </p>
        ) : null}
      </section>

      {questionsByCategory.map((section) => (
        <section key={section.category} className="grid gap-4 rounded-3xl border border-oatmeal bg-white/75 p-4 shadow-soft sm:p-5">
          <h3 className="text-lg font-black text-cocoa">{CATEGORY_LABELS[section.category]}</h3>
          {section.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              options={optionsByQuestion.get(question.id) ?? []}
              staff={staff}
              answer={answers[question.id]}
              selectedBranchId={selectedBranchId}
              isLoadingStaff={isLoadingStaff}
              disabled={isSubmitting}
              onChange={(nextAnswer) => updateAnswer(question.id, nextAnswer)}
            />
          ))}
        </section>
      ))}

      <section className="rounded-3xl border border-oatmeal bg-white p-5 shadow-soft sm:p-6">
        <h3 className="text-lg font-black text-charcoal">선택 입력</h3>
        <p className="mt-2 text-sm font-medium leading-6 text-charcoal/65">응답 확인이 필요한 경우에만 이름과 연락처를 남겨주세요.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-charcoal">이름</span>
            <input
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl border border-oatmeal bg-ivory px-4 text-base font-medium text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay disabled:opacity-60"
              placeholder="선택 입력"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-charcoal">연락처</span>
            <input
              value={memberPhone}
              onChange={(event) => setMemberPhone(event.target.value)}
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl border border-oatmeal bg-ivory px-4 text-base font-medium text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay disabled:opacity-60"
              placeholder="선택 입력"
            />
          </label>
        </div>
      </section>

      {errorMessage ? (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={17} aria-hidden />
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-charcoal px-5 text-base font-black text-ivory transition hover:bg-cocoa disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <Send size={18} aria-hidden />}
        {isSubmitting ? "제출 중" : "설문 제출하기"}
      </button>
    </form>
  );
}
