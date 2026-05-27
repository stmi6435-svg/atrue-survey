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
];

export const ADMIN_ALL_BRANCH_VALUE = "all";
