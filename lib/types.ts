export type Category =
  | "General"
  | "OBC"
  | "OBC-NCL"
  | "SC"
  | "ST"
  | "EWS"
  | "PwD-General"
  | "PwD-OBC"
  | "PwD-SC"
  | "PwD-ST";

export type BudgetPreference =
  | "government_only"
  | "private_under_10l"
  | "private_under_25l"
  | "all";

export type CollegeType = "government" | "private" | "deemed" | "central" | "ayush";
export type SafetyTag = "safe" | "moderate" | "reach" | "data_unavailable";
export type QuotaType = "AIQ" | "STATE";

export interface AssessInput {
  neet_score: number;
  category: Category;
  state: string;
  budget_preference: BudgetPreference;
}

export interface RankEstimate {
  airMin: number;
  airMax: number;
  airMidpoint: number;
  categoryRankMin: number | null;
  categoryRankMax: number | null;
  hasCategoryRank: boolean;
}

export interface College {
  id: string;
  name: string;
  short_name: string | null;
  state: string;
  district: string | null;
  city: string | null;
  type: CollegeType;
  annual_fee_govt: number | null;
  annual_fee_mgmt: number | null;
  total_mbbs_seats: number | null;
  nri_quota: boolean;
  bond_required: boolean;
  bond_duration_years: number | null;
  nmc_recognized: boolean;
  nirf_rank: number | null;
  mcc_college_code: string | null;
}

export interface CollegeWithCutoff extends College {
  quota_type: QuotaType;
  prev_year_closing_rank: number | null;
  prev_year_opening_rank: number | null;
  prev_year_round: number | null;
  cutoff_year: number | null;
  safety_tag: SafetyTag;
}

export interface RoundStrategy {
  score_band: string;
  strategy: string;
  lock_guidance: string;
  float_guidance: string;
  mopup_guidance: string;
  risk_level: "low" | "medium" | "high";
  freeze_float_slide_explanation: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  description: string | null;
  required_for: "AIQ" | "STATE" | "BOTH";
  format_required: string | null;
  issuing_authority: string | null;
  procurement_days_estimate: number;
  state_specific_note: string | null;
}

export interface RedFlag {
  type: "management_quota" | "nri_quota" | "capitation_fee" | "predatory_consultant" | "bond_obligation" | "private_fee_burden";
  severity: "warning" | "critical";
  headline: string;
  body: string;
}

export interface DeadlineEvent {
  id: string;
  event_name: string;
  track: "AIQ" | "STATE" | "BOTH";
  state: string | null;
  round: number | null;
  event_type: string;
  event_date: string | null;
  is_confirmed: boolean;
  source_url: string | null;
  notes: string | null;
}

export interface AssessOutput {
  assessment_id: string;
  neet_score: number;
  category: Category;
  state: string;
  budget_preference: BudgetPreference;
  rank_estimate: RankEstimate;
  aiq_eligible: boolean;
  state_quota_eligible: boolean;
  colleges_aiq: CollegeWithCutoff[];
  colleges_state: CollegeWithCutoff[];
  round_strategy: RoundStrategy;
  document_checklist: DocumentItem[];
  red_flags: RedFlag[];
  action_plan: string | null;
  action_steps_fallback: string[];
  data_version: string;
  generated_at: string;
}
