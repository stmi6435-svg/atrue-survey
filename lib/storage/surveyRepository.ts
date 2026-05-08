import { getSupabaseClient } from "@/lib/supabase";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

const TABLE_NAME = "pt_survey_submissions";

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

export async function createSurveySubmission(data: SurveySubmission) {
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from(TABLE_NAME)
    .insert(toRow(data))
    .select()
    .single<SurveySubmissionRow>();

  if (error) {
    throw error;
  }

  return fromRow(row);
}

export async function getSurveySubmissions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("submitted_at", { ascending: false })
    .returns<SurveySubmissionRow[]>();

  if (error) {
    throw error;
  }

  return data.map(fromRow);
}

export async function updateSurveyStatus(id: string, status: SubmissionStatus) {
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from(TABLE_NAME)
    .update({ status })
    .eq("id", id)
    .select()
    .single<SurveySubmissionRow>();

  if (error) {
    throw error;
  }

  return fromRow(row);
}

function toRow(data: SurveySubmission): SurveySubmissionRow {
  return {
    id: data.id,
    survey_type: data.surveyType,
    source: data.source,
    basic_info: data.basicInfo,
    body_info: data.bodyInfo,
    fitness_experience: data.fitnessExperience,
    goals: data.goals,
    health: data.health,
    lifestyle: data.lifestyle,
    desired_exercises: data.desiredExercises,
    request_to_coach: data.requestToCoach,
    privacy_consent: data.privacyConsent,
    status: data.status,
    submitted_at: data.submittedAt,
  };
}

function fromRow(row: SurveySubmissionRow): SurveySubmission {
  return {
    id: row.id,
    surveyType: row.survey_type,
    source: row.source,
    basicInfo: row.basic_info,
    bodyInfo: row.body_info,
    fitnessExperience: row.fitness_experience,
    goals: row.goals,
    health: row.health,
    lifestyle: row.lifestyle,
    desiredExercises: row.desired_exercises,
    requestToCoach: row.request_to_coach,
    privacyConsent: row.privacy_consent,
    status: row.status,
    submittedAt: row.submitted_at,
  };
}
