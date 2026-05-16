import type { SurveySubmissionInsert } from "@/lib/supabase";
import type { SurveySubmission } from "@/features/survey/types";

export async function createSurveySubmission(data: SurveySubmission) {
  const payload = toInsertPayload(data);
  console.log("Insert payload:", payload);

  const response = await fetch("/api/survey-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as { success?: boolean; error?: string };

  if (!response.ok || !result.success) {
    throw new Error(result.error || "설문 제출 중 오류가 발생했습니다.");
  }

  return result;
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
