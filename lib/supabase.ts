import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BranchId, Trainer, TrainerReview } from "@/features/trainer-review/types";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

export type SurveySubmissionRow = {
  id: string;
  created_at: string;
  survey_type: SurveySubmission["surveyType"] | null;
  branch: SurveySubmission["branch"] | null;
  referral_source: string | null;
  name: string | null;
  phone: string | null;
  age: number | null;
  job: string | null;
  hobby: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_experience: string | null;
  goals: string[] | null;
  pain_areas: string[] | null;
  diseases: string[] | null;
  medical_restriction: boolean | null;
  medical_restriction_detail: string | null;
  activity_level: string | null;
  sleep_hours: string | null;
  stress_level: string | null;
  meal_regularity: string | null;
  weekly_workout_count: string | null;
  preferred_time_zone: string | null;
  preferred_time_1: string | null;
  preferred_time_2: string | null;
  want_to_learn: string | null;
  request_to_consultant: string | null;
  privacy_agreed: boolean | null;
  status: SubmissionStatus | null;
};

export type SurveySubmissionInsert = Omit<SurveySubmissionRow, "id" | "created_at">;

export type TrainerInsert = {
  branch: BranchId;
  name: string;
  is_active?: boolean;
};

export type TrainerUpdate = Partial<Pick<Trainer, "branch" | "name" | "is_active">>;

export type TrainerReviewInsert = {
  branch: BranchId;
  trainer_id: string;
  trainer_name: string;
  member_name?: string | null;
  phone_last4?: string | null;
  pt_session_count?: number | null;
  routine_delivery_score: number;
  session_log_score: number;
  kindness_score: number;
  schedule_coordination_score: number;
  improvement_feedback?: string | null;
};

export type Database = {
  public: {
    Tables: {
      pt_survey_submissions: {
        Row: SurveySubmissionRow;
        Insert: SurveySubmissionInsert;
        Update: Partial<SurveySubmissionInsert>;
        Relationships: [];
      };
      trainers: {
        Row: Trainer;
        Insert: TrainerInsert;
        Update: TrainerUpdate;
        Relationships: [];
      };
      trainer_reviews: {
        Row: TrainerReview;
        Insert: TrainerReviewInsert;
        Update: Partial<TrainerReviewInsert>;
        Relationships: [
          {
            foreignKeyName: "trainer_reviews_trainer_id_fkey";
            columns: ["trainer_id"];
            referencedRelation: "trainers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 .env.local에 설정해 주세요.",
    );
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabasePublishableKey);
  }

  return client;
}
