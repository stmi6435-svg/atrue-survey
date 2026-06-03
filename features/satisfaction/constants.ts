import type { Branch, QuestionCategory, QuestionType, ResponseStatus, StaffRole, SurveyStatus } from "./types";

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "munjeong",
    name: "문정점",
    display_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "dapsimni",
    name: "답십리역점",
    display_order: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "bulgwang",
    name: "불광역점",
    display_order: 3,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

export const BRANCH_NAME_BY_ID = DEFAULT_BRANCHES.reduce<Record<string, string>>((acc, branch) => {
  acc[branch.id] = branch.name;
  return acc;
}, {});

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  cleanliness: "청결",
  kindness: "친절",
  facility: "시설 및 운동 환경",
  intention: "이용 의향",
  free_text: "자유 의견",
  other: "기타",
};

export const CATEGORY_OPTIONS: QuestionCategory[] = ["cleanliness", "kindness", "facility", "intention", "free_text", "other"];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  rating: "평점",
  text_short: "짧은 주관식",
  text_long: "긴 주관식",
  single_choice: "단일 선택",
  multiple_choice: "복수 선택",
  staff_choice: "직원 선택",
};

export const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  "rating",
  "text_short",
  "text_long",
  "single_choice",
  "multiple_choice",
  "staff_choice",
];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  trainer: "트레이너",
  fc: "FC",
  branch_manager: "지점장",
  pt_leader: "PT 팀장",
  weekend_part_timer: "주말 알바",
};

export const STAFF_ROLE_OPTIONS: StaffRole[] = ["trainer", "fc", "branch_manager", "pt_leader", "weekend_part_timer"];

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "작성 중",
  scheduled: "예약됨",
  active: "진행 중",
  closed: "종료됨",
  archived: "보관됨",
};

export const SURVEY_STATUS_OPTIONS: SurveyStatus[] = ["draft", "scheduled", "active", "closed", "archived"];

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  normal: "미확인",
  needs_review: "확인 필요",
  reviewed: "확인 완료",
  in_progress: "개선 진행 중",
  resolved: "개선 완료",
};

export const RESPONSE_STATUS_OPTIONS: ResponseStatus[] = ["normal", "needs_review", "reviewed", "in_progress", "resolved"];

export const SUBMITTED_STORAGE_PREFIX = "atruegym_satisfaction_submitted_";

export const SATISFACTION_CLOSED_MESSAGE = {
  title: "현재 진행 중인 회원 만족도 조사가 없습니다.",
  body: "조사 기간이 아니거나 아직 설문이 오픈되지 않았습니다.\n다음 조사 기간에 소중한 의견을 부탁드립니다.",
};

export const SATISFACTION_COMPLETE_MESSAGE = {
  title: "소중한 의견 감사합니다.",
  body: "남겨주신 의견은 더 나은 운동 환경을 만드는 데 꼼꼼히 반영하겠습니다.",
};
