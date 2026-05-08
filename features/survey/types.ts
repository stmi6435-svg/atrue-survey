export type SurveyType = "trial" | "consultation";

export type SubmissionStatus =
  | "신규"
  | "연락완료"
  | "예약완료"
  | "방문완료"
  | "등록완료"
  | "보류";

export type YesNo = "예" | "아니오" | "";

export type SurveyFormData = {
  surveyType: SurveyType | "";
  source: string;
  basicInfo: {
    name: string;
    phone: string;
    age: string;
    job: string;
    hobby: string;
  };
  bodyInfo: {
    gender: string;
    height: string;
    weight: string;
  };
  fitnessExperience: string;
  goals: string[];
  health: {
    injuries: string[];
    diseases: string[];
    hasMedicalRestriction: YesNo;
    medicalRestrictionDetail: string;
  };
  lifestyle: {
    activityLevel: string;
    sleepHours: string;
    stressLevel: string;
    mealRegularity: string;
    weeklyWorkoutCount: string;
    preferredWorkoutTime: string;
    firstChoiceTime: string;
    secondChoiceTime: string;
  };
  desiredExercises: string;
  requestToCoach: string;
  privacyConsent: boolean;
};

export type SurveySubmission = SurveyFormData & {
  id: string;
  surveyType: SurveyType;
  status: SubmissionStatus;
  submittedAt: string;
};
