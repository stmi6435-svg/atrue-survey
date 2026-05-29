import type { BranchId, ReviewMetric } from "./types";

export const BRANCH_OPTIONS: Array<{ id: BranchId; label: string }> = [
  { id: "munjeong", label: "문정점" },
  { id: "dapsimni", label: "답십리역점" },
  { id: "bulgwang", label: "불광역점" },
];

export const BRANCH_LABELS: Record<BranchId, string> = {
  munjeong: "문정점",
  dapsimni: "답십리역점",
  bulgwang: "불광역점",
};

export const GOAL_PROGRESS_QUESTION =
  "회원님이 처음 PT를 시작했던 목적 기준으로, 현재 수업이 목표에 맞게 잘 진행되고 있다고 느끼시나요?";

export const GOAL_PROGRESS_OPTIONS = [
  { value: 1, label: "아직 목표 방향이 잘 잡히지 않았어요" },
  { value: 2, label: "목표는 이해했지만 변화는 아직 잘 모르겠어요" },
  { value: 3, label: "조금씩 변화나 개선을 느끼고 있어요" },
  { value: 4, label: "목표에 맞게 확실히 좋아지고 있다고 느껴요" },
  { value: 5, label: "기대 이상으로 만족스럽게 진행되고 있어요" },
] as const;

export const GOAL_PROGRESS_LABELS: Record<number, string> = GOAL_PROGRESS_OPTIONS.reduce(
  (labels, option) => ({
    ...labels,
    [option.value]: option.label,
  }),
  {} as Record<number, string>,
);

export const REVIEW_METRICS: Array<{
  key: ReviewMetric;
  label: string;
  helper: string;
}> = [
  {
    key: "routine_delivery_score",
    label: "개인 운동 루틴 전달률",
    helper: "혼자 운동할 때 따라 할 수 있을 만큼 루틴이 잘 전달되었나요?",
  },
  {
    key: "session_log_score",
    label: "수업 일지 작성률",
    helper: "수업 내용과 진행 상황이 꾸준히 기록되었다고 느끼셨나요?",
  },
  {
    key: "kindness_score",
    label: "친절도",
    helper: "질문과 요청에 편안하고 친절하게 응대해 주셨나요?",
  },
  {
    key: "schedule_coordination_score",
    label: "수업 스케줄 협의",
    helper: "수업 일정 조율이 원활하고 충분히 배려된다고 느끼셨나요?",
  },
];

export const ADMIN_ALL_BRANCH_VALUE = "all";
