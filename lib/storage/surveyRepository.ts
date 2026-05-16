import { getSupabaseClient } from "@/lib/supabase";
import type { SurveySubmissionRow } from "@/lib/supabase";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

const TABLE_NAME = "pt_survey_submissions";

export async function getSurveySubmissions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return (Array.isArray(data) ? data : []).map(fromRow);
}

export async function getSurveySubmissionById(id: string) {
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return fromRow(row);
}

export async function updateSurveyStatus(id: string, status: SubmissionStatus) {
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from(TABLE_NAME)
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return fromRow(row);
}

export async function deleteSurveySubmission(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

function fromRow(row: SurveySubmissionRow): SurveySubmission {
  return {
    id: row.id,
    surveyType: row.survey_type || "consultation",
    branch: row.branch || "munjeong",
    source: textOrFallback(row.referral_source),
    basicInfo: {
      name: textOrFallback(row.name),
      phone: textOrFallback(row.phone),
      age: valueToText(row.age),
      job: textOrFallback(row.job),
      hobby: textOrFallback(row.hobby),
    },
    bodyInfo: {
      gender: textOrFallback(row.gender),
      height: valueToText(row.height_cm),
      weight: valueToText(row.weight_kg),
    },
    fitnessExperience: textOrFallback(row.fitness_experience),
    goals: arrayOrEmpty(row.goals),
    health: {
      injuries: arrayOrEmpty(row.pain_areas),
      diseases: arrayOrEmpty(row.diseases),
      hasMedicalRestriction: row.medical_restriction ? "예" : "아니오",
      medicalRestrictionDetail: textOrEmpty(row.medical_restriction_detail),
    },
    lifestyle: {
      activityLevel: textOrFallback(row.activity_level),
      sleepHours: textOrFallback(row.sleep_hours),
      stressLevel: textOrFallback(row.stress_level),
      mealRegularity: textOrFallback(row.meal_regularity),
      weeklyWorkoutCount: textOrFallback(row.weekly_workout_count),
      preferredWorkoutTime: textOrFallback(row.preferred_time_zone),
      firstChoiceTime: textOrFallback(row.preferred_time_1),
      secondChoiceTime: textOrFallback(row.preferred_time_2),
    },
    desiredExercises: textOrFallback(row.want_to_learn),
    requestToCoach: textOrFallback(row.request_to_consultant),
    privacyConsent: Boolean(row.privacy_agreed),
    status: row.status || "신규",
    submittedAt: row.created_at || new Date(0).toISOString(),
  };
}

function arrayOrEmpty(value: string[] | null) {
  return Array.isArray(value) ? value : [];
}

function textOrFallback(value: string | null) {
  return value && value.trim() ? value : "미입력";
}

function textOrEmpty(value: string | null) {
  return value || "";
}

function valueToText(value: number | null) {
  return value === null || value === undefined ? "미입력" : String(value);
}
