export type SatisfactionBranchId = string;
export type BranchId = SatisfactionBranchId;

export type Branch = {
  id: BranchId;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffRole = "trainer" | "fc" | "branch_manager" | "pt_leader" | "weekend_part_timer";

export type Staff = {
  id: string;
  branch_id: BranchId;
  name: string;
  role: StaffRole | string | null;
  display_order: number;
  is_active: boolean;
  is_visible_in_survey: boolean;
  created_at: string;
  updated_at: string;
};

export type SurveyStatus = "draft" | "scheduled" | "active" | "closed" | "archived";

export type SatisfactionSurvey = {
  id: string;
  title: string;
  year: number;
  quarter: number | null;
  start_date: string;
  end_date: string;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
};

export type QuestionCategory = "cleanliness" | "kindness" | "facility" | "intention" | "free_text" | "other";

export type QuestionType = "rating" | "text_short" | "text_long" | "single_choice" | "multiple_choice" | "staff_choice";

export type StaffChoicePurpose = "positive" | "improvement" | null;

export type SatisfactionQuestion = {
  id: string;
  survey_id: string;
  category: QuestionCategory | string | null;
  question_text: string;
  question_type: QuestionType;
  staff_choice_purpose: StaffChoicePurpose;
  is_required: boolean;
  is_active: boolean;
  is_core_metric: boolean;
  display_order: number;
  placeholder: string | null;
  created_at: string;
  updated_at: string;
};

export type SatisfactionQuestionOption = {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ResponseStatus = "normal" | "needs_review" | "reviewed" | "in_progress" | "resolved";

export type SatisfactionResponse = {
  id: string;
  survey_id: string;
  branch_id: BranchId;
  member_name: string | null;
  member_phone: string | null;
  client_token: string | null;
  status: ResponseStatus;
  admin_note: string | null;
  assigned_to: string | null;
  reviewed_at: string | null;
  resolved_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type SatisfactionResponseInsert = {
  id?: string;
  survey_id: string;
  branch_id: BranchId;
  member_name?: string | null;
  member_phone?: string | null;
  client_token?: string | null;
  status?: ResponseStatus;
  admin_note?: string | null;
  assigned_to?: string | null;
  reviewed_at?: string | null;
  resolved_at?: string | null;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type SatisfactionResponseUpdate = Partial<SatisfactionResponseInsert>;

export type SatisfactionAnswer = {
  id: string;
  response_id: string;
  question_id: string;
  rating_value: number | null;
  text_value: string | null;
  choice_value: string | null;
  choice_values: string[] | null;
  staff_id: string | null;
  question_text_snapshot: string | null;
  question_type_snapshot: string | null;
  option_text_snapshot: string | null;
  option_value_snapshot: string | null;
  staff_name_snapshot: string | null;
  staff_role_snapshot: string | null;
  staff_branch_id_snapshot: BranchId | null;
  created_at: string;
};

export type SatisfactionAnswerInsert = {
  id?: string;
  response_id: string;
  question_id: string;
  rating_value?: number | null;
  text_value?: string | null;
  choice_value?: string | null;
  choice_values?: string[] | null;
  staff_id?: string | null;
  question_text_snapshot?: string | null;
  question_type_snapshot?: QuestionType | string | null;
  option_text_snapshot?: string | null;
  option_value_snapshot?: string | null;
  staff_name_snapshot?: string | null;
  staff_role_snapshot?: string | null;
  staff_branch_id_snapshot?: BranchId | null;
  created_at?: string;
};

export type SatisfactionAnswerUpdate = Partial<SatisfactionAnswerInsert>;

export type SatisfactionResponseEvent = {
  id: string;
  response_id: string;
  event_type: string;
  previous_status: ResponseStatus | null;
  new_status: ResponseStatus | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type SatisfactionResponseEventInsert = {
  id?: string;
  response_id: string;
  event_type: string;
  previous_status?: ResponseStatus | null;
  new_status?: ResponseStatus | null;
  note?: string | null;
  created_by?: string | null;
  created_at?: string;
};

export type SatisfactionResponseEventUpdate = Partial<SatisfactionResponseEventInsert>;

export type SatisfactionAnswerDraft = {
  rating_value?: number | null;
  text_value?: string | null;
  choice_value?: string | null;
  choice_values?: string[] | null;
  staff_id?: string | null;
  staff_none?: boolean;
};
