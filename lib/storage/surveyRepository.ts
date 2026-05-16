import { getSupabaseClient } from "@/lib/supabase";
import type { SurveySubmissionInsert, SurveySubmissionRow } from "@/lib/supabase";
import type { SubmissionStatus, SurveySubmission } from "@/features/survey/types";

const TABLE_NAME = "pt_survey_submissions";

export async function createSurveySubmission(data: SurveySubmission) {
  const payload = toInsertPayload(data);
  console.log("Insert payload:", payload);

  const response = await fetch("/api/survey-submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    const message = result?.error || "설문 제출 중 오류가 발생했습니다.";
    console.error("Survey submit API error:", message);
    alert(`제출 오류: ${message}`);
    throw new Error(message);
  }

  return true;
}

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

  return data.map(fromRow);
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

function toInsertPayload(data: SurveySubmission): SurveySubmissionInsert {
  return {
    survey_type: data.surveyType,
    branch: data.branch,
    referral_source: data.source,
    name: data.basicInfo.name,
    phone: data.basicInfo.phone,
    age: Number(data.basicInfo.age),
    job: data.basicInfo.job,
    hobby: data.basicInfo.hobby,
    gender: data.bodyInfo.gender,
    height_cm: Number(data.bodyInfo.height),
    weight_kg: Number(data.bodyInfo.weight),
    fitness_experience: data.fitnessExperience,
    goals: data.goals,
    pain_areas: data.health.injuries,
    diseases: data.health.diseases,
    medical_restriction: data.health.hasMedicalRestriction === "예",
    medical_restriction_detail: data.health.medicalRestrictionDetail,
    activity_level: data.lifestyle.activityLevel,
    sleep_hours: data.lifestyle.sleepHours,
    stress_level: data.lifestyle.stressLevel,
    meal_regularity: data.lifestyle.mealRegularity,
    weekly_workout_count: data.lifestyle.weeklyWorkoutCount,
    preferred_time_zone: data.lifestyle.preferredWorkoutTime,
    preferred_time_1: data.lifestyle.firstChoiceTime,
    preferred_time_2: data.lifestyle.secondChoiceTime,
    want_to_learn: data.desiredExercises,
    request_to_consultant: data.requestToCoach,
    privacy_agreed: data.privacyConsent,
    status: data.status || "신규",
  };
}

function fromRow(row: SurveySubmissionRow): SurveySubmission {
  return {
    id: row.id,
    surveyType: row.survey_type,
    branch: row.branch,
    source: row.referral_source,
    basicInfo: {
      name: row.name,
      phone: row.phone,
      age: String(row.age),
      job: row.job,
      hobby: row.hobby,
    },
    bodyInfo: {
      gender: row.gender,
      height: String(row.height_cm),
      weight: String(row.weight_kg),
    },
    fitnessExperience: row.fitness_experience,
    goals: row.goals,
    health: {
      injuries: row.pain_areas,
      diseases: row.diseases,
      hasMedicalRestriction: row.medical_restriction ? "예" : "아니오",
      medicalRestrictionDetail: row.medical_restriction_detail,
    },
    lifestyle: {
      activityLevel: row.activity_level,
      sleepHours: row.sleep_hours,
      stressLevel: row.stress_level,
      mealRegularity: row.meal_regularity,
      weeklyWorkoutCount: row.weekly_workout_count,
      preferredWorkoutTime: row.preferred_time_zone,
      firstChoiceTime: row.preferred_time_1,
      secondChoiceTime: row.preferred_time_2,
    },
    desiredExercises: row.want_to_learn,
    requestToCoach: row.request_to_consultant,
    privacyConsent: row.privacy_agreed,
    status: row.status,
    submittedAt: row.created_at,
  };
}
