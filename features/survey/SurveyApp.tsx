"use client";

import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Dumbbell, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { createSurveySubmission } from "@/lib/storage/surveySubmitClient";
import {
  ACTIVITY_OPTIONS,
  BRANCH_LABELS,
  BRANCH_OPTIONS,
  DISEASE_OPTIONS,
  FITNESS_EXPERIENCE_OPTIONS,
  FULL_COMPLETION_TEXT,
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  GREETINGS,
  INITIAL_FORM_DATA,
  INJURY_OPTIONS,
  MEAL_OPTIONS,
  SHORT_COMPLETION_TEXT,
  SLEEP_OPTIONS,
  SOURCE_OPTIONS,
  STEP_TITLES,
  STRESS_OPTIONS,
  SURVEY_LABELS,
  WEEKLY_WORKOUT_OPTIONS,
  WORKOUT_TIME_OPTIONS,
} from "./constants";
import type { SurveyFormData, SurveySubmission, SurveyType } from "./types";

const FINAL_REVIEW_STEP = 11;

type FieldErrors = Record<string, string>;
type NestedFormGroups = Pick<SurveyFormData, "basicInfo" | "bodyInfo" | "health" | "lifestyle">;

export function SurveyApp() {
  const [form, setForm] = useState<SurveyFormData>(INITIAL_FORM_DATA);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showFullText, setShowFullText] = useState(false);

  const progress = useMemo(() => Math.round(((step + 1) / STEP_TITLES.length) * 100), [step]);

  function selectSurveyType(surveyType: SurveyType) {
    setForm({ ...INITIAL_FORM_DATA, surveyType });
    setStep(0);
    setErrors({});
    setIsSubmitted(false);
    setShowFullText(false);
  }

  function updateForm<T extends keyof SurveyFormData>(key: T, value: SurveyFormData[T]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateNested<T extends keyof NestedFormGroups, K extends keyof NestedFormGroups[T]>(
    group: T,
    key: K,
    value: NestedFormGroups[T][K],
  ) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...(current[group] as object),
        [key]: value,
      },
    }));
  }

  function toggleArray(group: "goals" | "health.injuries" | "health.diseases", option: string) {
    setForm((current) => {
      if (group === "goals") {
        return { ...current, goals: toggleOption(current.goals, option) };
      }

      const key = group === "health.injuries" ? "injuries" : "diseases";
      return {
        ...current,
        health: {
          ...current.health,
          [key]: toggleOption(current.health[key], option),
        },
      };
    });
  }

  function validateCurrentStep() {
    const nextErrors: FieldErrors = {};
    const required = (condition: boolean, key: string, message = "필수 항목입니다.") => {
      if (!condition) {
        nextErrors[key] = message;
      }
    };

    if (step === 0) {
      required(Boolean(form.branch), "branch", "신청 지점을 선택해 주세요.");
    }

    if (step === 1) {
      required(Boolean(form.source), "source", "어트루짐을 알게 된 경로를 선택해 주세요.");
    }

    if (step === 2) {
      required(Boolean(form.basicInfo.name.trim()), "name");
      required(Boolean(form.basicInfo.phone.trim()), "phone");
      required(Boolean(form.basicInfo.age.trim()), "age");
      required(Boolean(form.basicInfo.job.trim()), "job");
      required(Boolean(form.basicInfo.hobby.trim()), "hobby");
    }

    if (step === 3) {
      required(Boolean(form.bodyInfo.gender), "gender");
      required(Boolean(form.bodyInfo.height.trim()), "height");
      required(Boolean(form.bodyInfo.weight.trim()), "weight");
    }

    if (step === 4) {
      required(Boolean(form.fitnessExperience), "fitnessExperience", "헬스 경험을 선택해 주세요.");
    }

    if (step === 5) {
      required(form.goals.length > 0, "goals", "운동 목적을 하나 이상 선택해 주세요.");
    }

    if (step === 6) {
      required(form.health.injuries.length > 0, "injuries", "부상 및 통증 부위를 선택해 주세요.");
      required(form.health.diseases.length > 0, "diseases", "질환 및 질병을 선택해 주세요.");
      required(Boolean(form.health.hasMedicalRestriction), "hasMedicalRestriction", "운동 제한 여부를 선택해 주세요.");
      if (form.health.hasMedicalRestriction === "예") {
        required(Boolean(form.health.medicalRestrictionDetail.trim()), "medicalRestrictionDetail", "상세 내용을 적어 주세요.");
      }
    }

    if (step === 7) {
      required(Boolean(form.lifestyle.activityLevel), "activityLevel");
      required(Boolean(form.lifestyle.sleepHours), "sleepHours");
      required(Boolean(form.lifestyle.stressLevel), "stressLevel");
      required(Boolean(form.lifestyle.mealRegularity), "mealRegularity");
      required(Boolean(form.lifestyle.weeklyWorkoutCount), "weeklyWorkoutCount");
      required(Boolean(form.lifestyle.preferredWorkoutTime), "preferredWorkoutTime");
      required(Boolean(form.lifestyle.firstChoiceTime.trim()), "firstChoiceTime");
      required(Boolean(form.lifestyle.secondChoiceTime.trim()), "secondChoiceTime");
    }

    if (step === 8) {
      required(Boolean(form.desiredExercises.trim()), "desiredExercises", "배워보고 싶은 운동을 적어 주세요.");
    }

    if (step === 9) {
      required(Boolean(form.requestToCoach.trim()), "requestToCoach", "상담자에게 바라는 점을 적어 주세요.");
    }

    if (step === 10) {
      required(form.privacyConsent, "privacyConsent", "개인정보 수집 및 이용에 동의해 주세요.");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, FINAL_REVIEW_STEP));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitSurvey() {
    if (!form.surveyType || !form.branch) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const submission: SurveySubmission = {
      ...form,
      surveyType: form.surveyType,
      branch: form.branch,
      id: createId(),
      status: "신규",
      submittedAt: new Date().toISOString(),
    };

    try {
      await createSurveySubmission(submission);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "설문 제출 중 오류가 발생했습니다.";
      setSubmitError(message);
      alert(`제출 오류: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function restart() {
    setForm(INITIAL_FORM_DATA);
    setStep(0);
    setErrors({});
    setIsSubmitted(false);
    setShowFullText(false);
  }

  if (!form.surveyType) {
    return <SurveyTypeSelect onSelect={selectSurveyType} />;
  }

  if (isSubmitted) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8 sm:py-12">
        <section className="rounded-[28px] border border-oatmeal/80 bg-ivory/95 p-6 shadow-soft sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-ivory">
            <Check size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-clay">제출이 완료되었습니다</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-charcoal">소중한 답변 감사합니다.</h1>
          <div className="mt-7 space-y-4 text-base leading-8 text-charcoal/80">
            {SHORT_COMPLETION_TEXT.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowFullText((current) => !current)}
            className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-charcoal px-5 py-4 text-sm font-bold text-ivory transition hover:bg-cocoa sm:w-auto"
          >
            {showFullText ? "접기" : "전체 글 보기"}
          </button>

          {showFullText ? (
            <div className="mt-7 space-y-4 rounded-3xl bg-white/70 p-5 text-sm leading-7 text-charcoal/75">
              {FULL_COMPLETION_TEXT.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={restart}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cocoa"
          >
            <RotateCcw size={16} aria-hidden />
            다른 설문 작성하기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-6 sm:py-10">
      <section className="mb-5 rounded-[28px] border border-oatmeal/80 bg-ivory/95 p-5 shadow-soft sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">ATRUEGYM PRE-SURVEY</p>
            <h1 className="mt-2 text-2xl font-bold text-charcoal">{SURVEY_LABELS[form.surveyType]} 사전 설문</h1>
          </div>
          <button
            type="button"
            onClick={restart}
            className="shrink-0 rounded-full border border-oatmeal bg-white/70 px-3 py-2 text-xs font-bold text-cocoa"
          >
            처음으로
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-charcoal/60">
            <span>
              STEP {step + 1} / {STEP_TITLES.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-oatmeal/70">
            <div className="h-full rounded-full bg-charcoal transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-oatmeal/80 bg-white/90 p-5 shadow-soft sm:p-7">
        {step === 0 ? (
          <Greeting surveyType={form.surveyType} />
        ) : null}

        <div className="mb-6">
          <p className="text-sm font-semibold text-clay">STEP {step + 1}</p>
          <h2 className="mt-1 text-2xl font-bold text-charcoal">{STEP_TITLES[step]}</h2>
        </div>

        <StepContent
          form={form}
          step={step}
          errors={errors}
          updateForm={updateForm}
          updateNested={updateNested}
          toggleArray={toggleArray}
        />

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-oatmeal bg-white text-sm font-bold text-charcoal transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={17} aria-hidden />
            이전
          </button>

          {step === FINAL_REVIEW_STEP ? (
            <div className="flex flex-[1.3] flex-col gap-2">
              <button
                type="button"
                onClick={submitSurvey}
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-charcoal text-sm font-bold text-ivory transition hover:bg-cocoa disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "제출 중..." : "제출하기"}
                <ClipboardCheck size={18} aria-hidden />
              </button>
              {submitError ? <p className="text-sm font-semibold text-clay">{submitError}</p> : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-2xl bg-charcoal text-sm font-bold text-ivory transition hover:bg-cocoa"
            >
              다음
              <ArrowRight size={17} aria-hidden />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function SurveyTypeSelect({ onSelect }: { onSelect: (surveyType: SurveyType) => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 py-8">
      <section className="rounded-[30px] border border-oatmeal/80 bg-ivory/95 p-6 shadow-soft sm:p-8">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-charcoal text-ivory">
          <Dumbbell size={28} aria-hidden />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-clay">ATRUEGYM PT</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
          어떤 설문을 작성하러 오셨나요?
        </h1>
        <p className="mt-4 text-base leading-7 text-charcoal/70">
          처음 운동을 시작하는 마음도 편하게 적으실 수 있도록, 필요한 질문만 단계별로 안내해드릴게요.
        </p>
        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => onSelect("trial")}
            className="rounded-3xl border border-oatmeal bg-white px-5 py-5 text-left text-base font-bold text-charcoal transition hover:border-charcoal hover:bg-oatmeal/40"
          >
            1:1 PT 1회 체험권 신청자입니다
          </button>
          <button
            type="button"
            onClick={() => onSelect("consultation")}
            className="rounded-3xl border border-oatmeal bg-white px-5 py-5 text-left text-base font-bold text-charcoal transition hover:border-charcoal hover:bg-oatmeal/40"
          >
            PT 상담 신청자입니다
          </button>
        </div>
      </section>
    </main>
  );
}

function Greeting({ surveyType }: { surveyType: SurveyType }) {
  return (
    <div className="mb-7 rounded-3xl bg-ivory p-5 text-sm leading-7 text-charcoal/80">
      {GREETINGS[surveyType].map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

type StepContentProps = {
  form: SurveyFormData;
  step: number;
  errors: FieldErrors;
  updateForm: <T extends keyof SurveyFormData>(key: T, value: SurveyFormData[T]) => void;
  updateNested: <T extends keyof NestedFormGroups, K extends keyof NestedFormGroups[T]>(
    group: T,
    key: K,
    value: NestedFormGroups[T][K],
  ) => void;
  toggleArray: (group: "goals" | "health.injuries" | "health.diseases", option: string) => void;
};

function StepContent({ form, step, errors, updateForm, updateNested, toggleArray }: StepContentProps) {
  if (step === 0) {
    return (
      <FieldBlock helper="상담 또는 체험권 수업을 희망하는 지점을 선택해 주세요." error={errors.branch}>
        <OptionGrid
          options={BRANCH_OPTIONS.map((branch) => branch.label)}
          selected={form.branch ? BRANCH_LABELS[form.branch] : ""}
          onSelect={(label) => {
            const branch = BRANCH_OPTIONS.find((option) => option.label === label);
            if (branch) {
              updateForm("branch", branch.id);
            }
          }}
        />
      </FieldBlock>
    );
  }

  if (step === 1) {
    return (
      <FieldBlock error={errors.source}>
        <OptionGrid
          options={SOURCE_OPTIONS}
          selected={form.source}
          onSelect={(source) => updateForm("source", source)}
        />
      </FieldBlock>
    );
  }

  if (step === 2) {
    return (
      <div className="grid gap-4">
        <TextInput label="성함" value={form.basicInfo.name} error={errors.name} onChange={(name) => updateNested("basicInfo", "name", name)} />
        <TextInput label="연락처" value={form.basicInfo.phone} error={errors.phone} onChange={(phone) => updateNested("basicInfo", "phone", phone)} />
        <TextInput label="나이" value={form.basicInfo.age} error={errors.age} onChange={(age) => updateNested("basicInfo", "age", age)} />
        <TextInput label="직업" value={form.basicInfo.job} error={errors.job} onChange={(job) => updateNested("basicInfo", "job", job)} />
        <TextInput label="취미" value={form.basicInfo.hobby} error={errors.hobby} onChange={(hobby) => updateNested("basicInfo", "hobby", hobby)} />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="grid gap-5">
        <FieldBlock label="성별" error={errors.gender}>
          <OptionGrid
            options={GENDER_OPTIONS}
            selected={form.bodyInfo.gender}
            onSelect={(gender) => updateNested("bodyInfo", "gender", gender)}
          />
        </FieldBlock>
        <TextInput label="키" suffix="cm" value={form.bodyInfo.height} error={errors.height} onChange={(height) => updateNested("bodyInfo", "height", height)} />
        <TextInput label="몸무게" suffix="kg" value={form.bodyInfo.weight} error={errors.weight} onChange={(weight) => updateNested("bodyInfo", "weight", weight)} />
      </div>
    );
  }

  if (step === 4) {
    return (
      <FieldBlock error={errors.fitnessExperience}>
        <OptionGrid
          options={FITNESS_EXPERIENCE_OPTIONS}
          selected={form.fitnessExperience}
          onSelect={(fitnessExperience) => updateForm("fitnessExperience", fitnessExperience)}
        />
      </FieldBlock>
    );
  }

  if (step === 5) {
    return (
      <FieldBlock helper="해당되는 항목을 모두 선택해 주세요." error={errors.goals}>
        <MultiOptionGrid options={GOAL_OPTIONS} selected={form.goals} onToggle={(option) => toggleArray("goals", option)} />
      </FieldBlock>
    );
  }

  if (step === 6) {
    return (
      <div className="grid gap-7">
        <FieldBlock label="부상 및 통증 부위" helper="해당되는 항목을 모두 선택해 주세요." error={errors.injuries}>
          <MultiOptionGrid
            options={INJURY_OPTIONS}
            selected={form.health.injuries}
            onToggle={(option) => toggleArray("health.injuries", option)}
          />
        </FieldBlock>
        <FieldBlock label="질환 및 질병" helper="해당되는 항목을 모두 선택해 주세요." error={errors.diseases}>
          <MultiOptionGrid
            options={DISEASE_OPTIONS}
            selected={form.health.diseases}
            onToggle={(option) => toggleArray("health.diseases", option)}
          />
        </FieldBlock>
        <FieldBlock
          label="현재 병원 치료 중이거나 운동 제한을 받은 적이 있으신가요?"
          error={errors.hasMedicalRestriction}
        >
          <OptionGrid
            options={["예", "아니오"]}
            selected={form.health.hasMedicalRestriction}
            onSelect={(hasMedicalRestriction) => updateNested("health", "hasMedicalRestriction", hasMedicalRestriction as "예" | "아니오")}
          />
        </FieldBlock>
        {form.health.hasMedicalRestriction === "예" ? (
          <Textarea
            label="상세 내용"
            value={form.health.medicalRestrictionDetail}
            error={errors.medicalRestrictionDetail}
            placeholder="치료 중인 내용, 의사에게 들은 운동 제한, 조심해야 할 움직임 등을 적어 주세요."
            onChange={(medicalRestrictionDetail) => updateNested("health", "medicalRestrictionDetail", medicalRestrictionDetail)}
          />
        ) : null}
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="grid gap-6">
        <FieldBlock label="평소 활동량" error={errors.activityLevel}>
          <OptionGrid options={ACTIVITY_OPTIONS} selected={form.lifestyle.activityLevel} onSelect={(activityLevel) => updateNested("lifestyle", "activityLevel", activityLevel)} />
        </FieldBlock>
        <FieldBlock label="평균 수면시간" error={errors.sleepHours}>
          <OptionGrid options={SLEEP_OPTIONS} selected={form.lifestyle.sleepHours} onSelect={(sleepHours) => updateNested("lifestyle", "sleepHours", sleepHours)} />
        </FieldBlock>
        <FieldBlock label="스트레스 수준" error={errors.stressLevel}>
          <OptionGrid options={STRESS_OPTIONS} selected={form.lifestyle.stressLevel} onSelect={(stressLevel) => updateNested("lifestyle", "stressLevel", stressLevel)} />
        </FieldBlock>
        <FieldBlock label="식사 규칙성" error={errors.mealRegularity}>
          <OptionGrid options={MEAL_OPTIONS} selected={form.lifestyle.mealRegularity} onSelect={(mealRegularity) => updateNested("lifestyle", "mealRegularity", mealRegularity)} />
        </FieldBlock>
        <FieldBlock label="주 운동 가능 횟수" error={errors.weeklyWorkoutCount}>
          <OptionGrid options={WEEKLY_WORKOUT_OPTIONS} selected={form.lifestyle.weeklyWorkoutCount} onSelect={(weeklyWorkoutCount) => updateNested("lifestyle", "weeklyWorkoutCount", weeklyWorkoutCount)} />
        </FieldBlock>
        <FieldBlock label="선호 운동 시간대" error={errors.preferredWorkoutTime}>
          <OptionGrid options={WORKOUT_TIME_OPTIONS} selected={form.lifestyle.preferredWorkoutTime} onSelect={(preferredWorkoutTime) => updateNested("lifestyle", "preferredWorkoutTime", preferredWorkoutTime)} />
        </FieldBlock>
        <TextInput label="1순위 희망 시간" value={form.lifestyle.firstChoiceTime} error={errors.firstChoiceTime} onChange={(firstChoiceTime) => updateNested("lifestyle", "firstChoiceTime", firstChoiceTime)} />
        <TextInput label="2순위 희망 시간" value={form.lifestyle.secondChoiceTime} error={errors.secondChoiceTime} onChange={(secondChoiceTime) => updateNested("lifestyle", "secondChoiceTime", secondChoiceTime)} />
      </div>
    );
  }

  if (step === 8) {
    return (
      <Textarea
        label="배워보고 싶은 운동"
        value={form.desiredExercises}
        error={errors.desiredExercises}
        placeholder="예: 하체 운동, 기구 사용법, 허리 통증 없는 운동, 체중 감량 루틴 등"
        onChange={(desiredExercises) => updateForm("desiredExercises", desiredExercises)}
      />
    );
  }

  if (step === 9) {
    return (
      <Textarea
        label="상담자에게 바라는 점"
        value={form.requestToCoach}
        error={errors.requestToCoach}
        placeholder="상담 때 꼭 확인하고 싶은 점이나 코치가 알아두면 좋은 내용을 편하게 적어 주세요."
        onChange={(requestToCoach) => updateForm("requestToCoach", requestToCoach)}
      />
    );
  }

  if (step === 10) {
    return (
      <FieldBlock error={errors.privacyConsent}>
        <label className="flex cursor-pointer gap-3 rounded-3xl border border-oatmeal bg-ivory p-5">
          <input
            type="checkbox"
            checked={form.privacyConsent}
            onChange={(event) => updateForm("privacyConsent", event.target.checked)}
            className="mt-1 h-5 w-5 accent-charcoal"
          />
          <span className="text-sm leading-7 text-charcoal/75">
            상담 및 체험권 수업 준비를 위해 설문에 입력한 개인정보를 수집하고 이용하는 것에 동의합니다.
            입력된 정보는 어트루짐 상담과 수업 안내 목적으로만 사용됩니다.
          </span>
        </label>
      </FieldBlock>
    );
  }

  return <Review form={form} />;
}

function FieldBlock({
  label,
  helper,
  error,
  children,
}: {
  label?: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label ? <p className="mb-2 text-sm font-bold text-charcoal">{label}</p> : null}
      {helper ? <p className="mb-3 text-xs font-medium text-charcoal/60">{helper}</p> : null}
      {children}
      {error ? <p className="mt-2 text-sm font-semibold text-clay">{error}</p> : null}
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            "min-h-12 rounded-2xl border px-3 py-3 text-sm font-bold transition",
            selected === option
              ? "border-charcoal bg-charcoal text-ivory"
              : "border-oatmeal bg-ivory text-charcoal hover:border-cocoa",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function MultiOptionGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            className={cn(
              "min-h-12 rounded-2xl border px-3 py-3 text-sm font-bold transition",
              isSelected
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-oatmeal bg-ivory text-charcoal hover:border-cocoa",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function TextInput({
  label,
  value,
  suffix,
  error,
  onChange,
}: {
  label: string;
  value: string;
  suffix?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-charcoal">{label}</span>
      <div className="flex items-center rounded-2xl border border-oatmeal bg-ivory px-4 focus-within:border-charcoal">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full bg-transparent text-base text-charcoal outline-none placeholder:text-charcoal/40"
          placeholder={`${label} 입력`}
        />
        {suffix ? <span className="shrink-0 text-sm font-bold text-charcoal/50">{suffix}</span> : null}
      </div>
      {error ? <span className="mt-2 block text-sm font-semibold text-clay">{error}</span> : null}
    </label>
  );
}

function Textarea({
  label,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-charcoal">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-oatmeal bg-ivory px-4 py-4 text-base leading-7 text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-charcoal"
      />
      {error ? <span className="mt-2 block text-sm font-semibold text-clay">{error}</span> : null}
    </label>
  );
}

function Review({ form }: { form: SurveyFormData }) {
  const rows = [
    ["설문 유형", form.surveyType ? SURVEY_LABELS[form.surveyType] : ""],
    ["신청 지점", form.branch ? BRANCH_LABELS[form.branch] : ""],
    ["유입 경로", form.source],
    ["성함", form.basicInfo.name],
    ["연락처", form.basicInfo.phone],
    ["나이", form.basicInfo.age],
    ["직업/취미", `${form.basicInfo.job} / ${form.basicInfo.hobby}`],
    ["성별/키/몸무게", `${form.bodyInfo.gender} / ${form.bodyInfo.height}cm / ${form.bodyInfo.weight}kg`],
    ["헬스 경험", form.fitnessExperience],
    ["운동 목적", form.goals.join(", ")],
    ["부상 및 통증", form.health.injuries.join(", ")],
    ["질환 및 질병", form.health.diseases.join(", ")],
    [
      "운동 제한",
      form.health.hasMedicalRestriction === "예"
        ? `예 - ${form.health.medicalRestrictionDetail}`
        : form.health.hasMedicalRestriction,
    ],
    [
      "라이프스타일",
      `${form.lifestyle.activityLevel}, 수면 ${form.lifestyle.sleepHours}, 스트레스 ${form.lifestyle.stressLevel}, 식사 ${form.lifestyle.mealRegularity}`,
    ],
    [
      "희망 시간대",
      `${form.lifestyle.weeklyWorkoutCount}, ${form.lifestyle.preferredWorkoutTime}, 1순위 ${form.lifestyle.firstChoiceTime}, 2순위 ${form.lifestyle.secondChoiceTime}`,
    ],
    ["배워보고 싶은 운동", form.desiredExercises],
    ["상담자에게 바라는 점", form.requestToCoach],
  ];

  return (
    <div>
      <p className="mb-5 rounded-2xl bg-ivory p-4 text-sm leading-7 text-charcoal/75">
        작성해주신 내용을 확인해 주세요. 수정이 필요하면 이전 버튼으로 돌아갈 수 있습니다.
      </p>
      <dl className="divide-y divide-oatmeal rounded-3xl border border-oatmeal bg-ivory">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="text-xs font-bold text-cocoa">{label}</dt>
            <dd className="text-sm leading-6 text-charcoal/80">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function toggleOption(selected: string[], option: string) {
  if (option === "없음") {
    return selected.includes("없음") ? [] : ["없음"];
  }

  const withoutNone = selected.filter((item) => item !== "없음");
  return withoutNone.includes(option)
    ? withoutNone.filter((item) => item !== option)
    : [...withoutNone, option];
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `submission-${Date.now()}`;
}
