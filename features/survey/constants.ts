import type { BranchId, SubmissionStatus, SurveyFormData, SurveyType } from "./types";

export const SURVEY_LABELS: Record<SurveyType, string> = {
  trial: "PT 체험권",
  consultation: "PT 상담",
};

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

export const GREETINGS: Record<SurveyType, string[]> = {
  trial: [
    "안녕하세요!",
    "어트루짐 1:1 PT 1회 체험권을 신청해 주셔서 감사합니다.",
    "해당 사전 설문지는 회원님께 더욱 효과적인 체험권 수업을 제공하기 위해\n몇 가지 문항을 여쭤보는 설문입니다.",
    "최대한 자세하게 답변해 주실수록 회원님께 더 효과적인 수업을 제공해드릴 수 있으니,\n편하게 작성해 주시기 바랍니다.",
  ],
  consultation: [
    "안녕하세요!",
    "어트루짐 PT 상담을 신청해 주셔서 감사합니다.",
    "해당 설문지는 회원님께 더욱 효과적인 상담을 제공하기 위해 몇 가지 문항을 여쭤보는 사전 설문입니다.",
    "최대한 자세하게 답변해 주실수록 회원님께 더 적합한 상담을 제공해드릴 수 있으니, 편하게 작성해 주시기 바랍니다.",
  ],
};

export const SOURCE_OPTIONS = [
  "지인 추천",
  "네이버 검색",
  "카카오 검색",
  "네이버 광고",
  "인스타그램",
  "블로그",
  "외부홍보",
  "기타",
];

export const GENDER_OPTIONS = ["여성", "남성", "기타"];

export const FITNESS_EXPERIENCE_OPTIONS = [
  "경험 없음",
  "0~3개월",
  "3~6개월",
  "6~12개월",
  "12개월 이상",
];

export const GOAL_OPTIONS = [
  "건강 개선",
  "근력 증가",
  "체중 감량",
  "체력 증진",
  "자세 교정",
  "재활 운동",
  "대회 준비/바디프로필",
  "운동 습관 만들기",
  "통증 없는 운동 배우기",
  "혼자 운동할 수 있는 루틴 만들기",
];

export const INJURY_OPTIONS = [
  "없음",
  "목",
  "어깨",
  "허리",
  "무릎",
  "발목",
  "손목",
  "팔꿈치",
  "고관절",
  "기타",
];

export const DISEASE_OPTIONS = [
  "없음",
  "고혈압",
  "저혈압",
  "당뇨",
  "심근경색",
  "폐질환",
  "천식",
  "관절염",
  "골절",
  "갑상선",
  "골다공증",
  "기타",
];

export const ACTIVITY_OPTIONS = ["좌식", "가벼움", "보통", "활발", "매우 활발"];
export const SLEEP_OPTIONS = ["5시간 미만", "5~6시간", "6~7시간", "7~8시간", "8시간 이상"];
export const STRESS_OPTIONS = ["매우 낮음", "낮음", "보통", "높음", "매우 높음"];
export const MEAL_OPTIONS = ["불규칙", "보통", "규칙적"];
export const WEEKLY_WORKOUT_OPTIONS = ["주 1회", "주 2회", "주 3회", "주 4회", "주 5회 이상"];
export const WORKOUT_TIME_OPTIONS = ["오전 6시~11시", "낮 12시~16시", "저녁 17시~22시"];

export const STATUS_OPTIONS: SubmissionStatus[] = [
  "신규",
  "연락완료",
  "예약완료",
  "방문완료",
  "등록완료",
  "보류",
];

export const STEP_TITLES = [
  "신청 지점",
  "유입 경로",
  "기본정보",
  "신체정보",
  "헬스 경험",
  "운동 목적",
  "건강 상태",
  "라이프스타일",
  "배워보고 싶은 운동",
  "상담자에게 바라는 점",
  "개인정보 수집 및 이용 동의",
  "최종 확인",
];

export const INITIAL_FORM_DATA: SurveyFormData = {
  surveyType: "",
  branch: "",
  source: "",
  basicInfo: {
    name: "",
    phone: "",
    age: "",
    job: "",
    hobby: "",
  },
  bodyInfo: {
    gender: "",
    height: "",
    weight: "",
  },
  fitnessExperience: "",
  goals: [],
  health: {
    injuries: [],
    diseases: [],
    hasMedicalRestriction: "",
    medicalRestrictionDetail: "",
  },
  lifestyle: {
    activityLevel: "",
    sleepHours: "",
    stressLevel: "",
    mealRegularity: "",
    weeklyWorkoutCount: "",
    preferredWorkoutTime: "",
    firstChoiceTime: "",
    secondChoiceTime: "",
  },
  desiredExercises: "",
  requestToCoach: "",
  trial_policy_confirmed: false,
  privacyConsent: false,
};

export const SHORT_COMPLETION_TEXT = [
  "21일 법칙을 아시나요?",
  "운동은 완벽하게 시작하는 것보다, 21일 동안 작은 행동을 반복해보는 것이 중요합니다.",
  "어트루짐은 회원님이 첫 운동 이후 21일을 잘 이어갈 수 있도록 함께 돕겠습니다.",
];

export const FULL_COMPLETION_TEXT = [
  "21일 법칙을 아시나요?",
  "21일 법칙은 억지로라도 21일 동안 생각과 행동을 반복하면 그것이 내 것이 될 수 있다는 것입니다.",
  "생각과 행동이 감각, 운동, 언어기능을 담당하는 대뇌피질과 감정을 담당하는 대뇌변연계를 거쳐 습관을 관장하는 뇌간까지 가는데 걸리는 최소한의 시간이 바로 21일입니다.",
  "그래서 어트루짐은 첫 운동 시작 후, 21일을 굉장히 중요하게 생각합니다.",
  "새롭게 혹은 처음으로 운동을 하시면서 부정적인 감정이 올라오더라도 '막상 해보면 별거 아니야! 21일만 꾸준히 해보자!'라고 일단 시작해보세요.",
  "안 좋은 습관은 아무렇지 않게 우리를 찾아와서 평생 우리의 인생을 불행하게 만들지만, 좋은 습관은 습관을 들이기까지 인고의 고통이 따르더라도 한번 형성되면 우리의 삶을 훨씬 더 풍요롭게 만들어줍니다.",
  "작은 습관부터 하나씩, 꾸준하게, 지혜롭게 운동을 하실 수 있도록 어트루짐이 돕겠습니다.",
  "감사합니다.",
];
