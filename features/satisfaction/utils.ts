import { BRANCH_NAME_BY_ID } from "./constants";
import type {
  Branch,
  BranchId,
  QuestionCategory,
  SatisfactionAnswerDraft,
  SatisfactionAnswerInsert,
  SatisfactionQuestion,
  SatisfactionQuestionOption,
  Staff,
} from "./types";

const KNOWN_CATEGORIES: QuestionCategory[] = ["cleanliness", "kindness", "facility", "intention", "free_text", "other"];

export function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function getLocalDateString() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

export function getBranchName(branches: Branch[], branchId: BranchId) {
  return branches.find((branch) => branch.id === branchId)?.name ?? BRANCH_NAME_BY_ID[branchId] ?? branchId;
}

export function getQuestionCategory(question: SatisfactionQuestion): QuestionCategory {
  return KNOWN_CATEGORIES.includes(question.category as QuestionCategory) ? (question.category as QuestionCategory) : "other";
}

export function getOptionStoredValue(option: SatisfactionQuestionOption) {
  return option.option_value ?? option.option_text;
}

export function groupOptionsByQuestion(options: SatisfactionQuestionOption[]) {
  return options.reduce((acc, option) => {
    const list = acc.get(option.question_id) ?? [];
    list.push(option);
    acc.set(option.question_id, list);
    return acc;
  }, new Map<string, SatisfactionQuestionOption[]>());
}

export function isQuestionAnswered(question: SatisfactionQuestion, draft: SatisfactionAnswerDraft | undefined) {
  if (!question.is_required) {
    return true;
  }

  if (!draft) {
    return false;
  }

  if (question.question_type === "rating") {
    return Boolean(draft.rating_value && draft.rating_value >= 1);
  }

  if (question.question_type === "text_short" || question.question_type === "text_long") {
    return Boolean(draft.text_value?.trim());
  }

  if (question.question_type === "single_choice") {
    return Boolean(draft.choice_value);
  }

  if (question.question_type === "multiple_choice") {
    return Boolean(draft.choice_values?.length);
  }

  if (question.question_type === "staff_choice") {
    return Boolean(draft.staff_id || draft.staff_none);
  }

  return false;
}

export function isLowAnswer(question: SatisfactionQuestion, draft: SatisfactionAnswerDraft | undefined) {
  if (!draft) {
    return false;
  }

  if (question.question_type === "rating" && (draft.rating_value ?? 0) > 0) {
    return (draft.rating_value ?? 0) <= 2;
  }

  if (question.question_type === "staff_choice" && question.staff_choice_purpose === "improvement") {
    return Boolean(draft.staff_id && !draft.staff_none);
  }

  return false;
}

export function buildAnswerInsert({
  question,
  draft,
  options,
  staff,
  selectedBranchId,
}: {
  question: SatisfactionQuestion;
  draft: SatisfactionAnswerDraft | undefined;
  options: SatisfactionQuestionOption[];
  staff: Staff[];
  selectedBranchId: BranchId;
}): Omit<SatisfactionAnswerInsert, "response_id"> {
  const selectedOption =
    question.question_type === "single_choice" && draft?.choice_value
      ? options.find((option) => getOptionStoredValue(option) === draft.choice_value)
      : undefined;
  const selectedOptions =
    question.question_type === "multiple_choice"
      ? options.filter((option) => (draft?.choice_values ?? []).includes(getOptionStoredValue(option)))
      : [];
  const selectedStaff =
    question.question_type === "staff_choice" && draft?.staff_id ? staff.find((member) => member.id === draft.staff_id) : undefined;

  return {
    question_id: question.id,
    rating_value: question.question_type === "rating" ? draft?.rating_value ?? null : null,
    text_value:
      question.question_type === "text_short" || question.question_type === "text_long"
        ? optionalText(draft?.text_value ?? "")
        : null,
    choice_value: question.question_type === "single_choice" ? draft?.choice_value ?? null : null,
    choice_values: question.question_type === "multiple_choice" ? draft?.choice_values ?? [] : null,
    staff_id: question.question_type === "staff_choice" && !draft?.staff_none ? draft?.staff_id ?? null : null,
    question_text_snapshot: question.question_text,
    question_type_snapshot: question.question_type,
    option_text_snapshot:
      question.question_type === "single_choice"
        ? selectedOption?.option_text ?? null
        : selectedOptions.length
          ? selectedOptions.map((option) => option.option_text).join(", ")
          : null,
    option_value_snapshot:
      question.question_type === "single_choice"
        ? selectedOption
          ? getOptionStoredValue(selectedOption)
          : draft?.choice_value ?? null
        : selectedOptions.length
          ? selectedOptions.map((option) => getOptionStoredValue(option)).join(", ")
          : null,
    staff_name_snapshot: draft?.staff_none ? "없음" : selectedStaff?.name ?? null,
    staff_role_snapshot: selectedStaff?.role ?? null,
    staff_branch_id_snapshot: selectedStaff?.branch_id ?? (draft?.staff_none ? selectedBranchId : null),
  };
}
