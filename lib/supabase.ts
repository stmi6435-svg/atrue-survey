import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

export type SurveySubmissionRow = {
  id: string;
  created_at: string;
  survey_type: SurveySubmission["surveyType"];
  referral_source: string;
  name: string;
  phone: string;
  age: number;
  job: string;
  hobby: string;
  gender: string;
  height_cm: number;
  weight_kg: number;
  fitness_experience: string;
  goals: string[];
  pain_areas: string[];
  diseases: string[];
  medical_restriction: boolean;
  medical_restriction_detail: string;
  activity_level: string;
  sleep_hours: string;
  stress_level: string;
  meal_regularity: string;
  weekly_workout_count: string;
  preferred_time_zone: string;
  preferred_time_1: string;
  preferred_time_2: string;
  want_to_learn: string;
  request_to_consultant: string;
  privacy_agreed: boolean;
  status: SubmissionStatus;
};

export type SurveySubmissionInsert = Omit<SurveySubmissionRow, "id" | "created_at">;

export type Database = {
  public: {
    Tables: {
      pt_survey_submissions: {
        Row: SurveySubmissionRow;
        Insert: SurveySubmissionInsert;
        Update: Partial<SurveySubmissionInsert>;
        Relationships: [];
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
