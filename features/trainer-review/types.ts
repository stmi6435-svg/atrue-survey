export type BranchId = "munjeong" | "dapsimni" | "bulgwang";

export type Trainer = {
  id: string;
  branch: BranchId;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type TrainerReview = {
  id: string;
  branch: BranchId;
  trainer_id: string | null;
  trainer_name: string;
  goal_progress_score: number;
  member_name: string | null;
  phone_last4: string | null;
  pt_session_count: number | null;
  routine_delivery_score: number;
  session_log_score: number;
  kindness_score: number;
  schedule_coordination_score: number;
  improvement_feedback: string | null;
  created_at: string;
};

export type ReviewScores = {
  routine_delivery_score: number;
  session_log_score: number;
  kindness_score: number;
  schedule_coordination_score: number;
};

export type ReviewMetric = keyof ReviewScores;
