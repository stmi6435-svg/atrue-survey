import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

export type Database = {
  public: {
    Tables: {
      pt_survey_submissions: {
        Row: SurveySubmissionRow;
        Insert: SurveySubmissionRow;
        Update: Partial<SurveySubmissionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SurveySubmissionRow = {
  id: string;
  survey_type: SurveySubmission["surveyType"];
  source: string;
  basic_info: SurveySubmission["basicInfo"];
  body_info: SurveySubmission["bodyInfo"];
  fitness_experience: string;
  goals: string[];
  health: SurveySubmission["health"];
  lifestyle: SurveySubmission["lifestyle"];
  desired_exercises: string;
  request_to_coach: string;
  privacy_consent: boolean;
  status: SubmissionStatus;
  submitted_at: string;
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
