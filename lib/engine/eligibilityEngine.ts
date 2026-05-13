import type {
  Category,
  BudgetPreference,
  CollegeWithCutoff,
  RankEstimate,
  SafetyTag,
} from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import collegesSeedData from "@/scripts/seed/colleges_seed.json";

const DATA_VERSION = "NEET2025";
const LATEST_YEAR = 2025;

// Safety tag based on how close the estimated AIR midpoint is to the closing rank
function computeSafetyTag(airMidpoint: number, closingRank: number): SafetyTag {
  if (airMidpoint <= closingRank * 0.8) return "safe";
  if (airMidpoint <= closingRank * 1.1) return "moderate";
  return "reach";
}

// Map category to MCC-style category strings used in cutoff data
function getCutoffCategories(category: Category): string[] {
  switch (category) {
    case "General": return ["General", "UR"];
    case "OBC": return ["OBC", "OBC-NCL"];
    case "OBC-NCL": return ["OBC-NCL", "OBC"];
    case "SC": return ["SC"];
    case "ST": return ["ST"];
    case "EWS": return ["EWS"];
    case "PwD-General": return ["PwD-UR", "PwD-General", "General-PwD"];
    case "PwD-OBC": return ["PwD-OBC", "OBC-PwD"];
    case "PwD-SC": return ["PwD-SC", "SC-PwD"];
    case "PwD-ST": return ["PwD-ST", "ST-PwD"];
    default: return ["General"];
  }
}

// Check if user is eligible for state quota in a given state
function isStateQuotaEligible(userState: string, collegeState: string): boolean {
  // User is eligible for state quota only in their home state
  return userState.toLowerCase() === collegeState.toLowerCase();
}

// Budget filter - annual fee check
function meetsbudgetPreference(
  annualFee: number | null,
  budgetPreference: BudgetPreference
): boolean {
  if (budgetPreference === "government_only") return true; // Filter by college type instead
  if (annualFee === null) return true;
  if (budgetPreference === "private_under_10l") return annualFee <= 1000000;
  if (budgetPreference === "private_under_25l") return annualFee <= 2500000;
  return true;
}

export interface EligibilityResult {
  colleges_aiq: CollegeWithCutoff[];
  colleges_state: CollegeWithCutoff[];
  data_version: string;
}

export async function getEligibleColleges(
  rankEstimate: RankEstimate,
  category: Category,
  state: string,
  budgetPreference: BudgetPreference
): Promise<EligibilityResult> {
  try {
    const supabase = getSupabaseAdmin();
    const cutoffCategories = getCutoffCategories(category);
    const airMidpoint = rankEstimate.airMidpoint;

    // Fetch colleges + cutoffs from Supabase
    const { data: cutoffRows, error } = await supabase
      .from("cutoffs")
      .select(`
        college_id,
        year,
        quota_type,
        state,
        round,
        category,
        opening_rank,
        closing_rank,
        colleges (
          id, name, short_name, state, district, city, type,
          annual_fee_govt, annual_fee_mgmt, total_mbbs_seats,
          nri_quota, bond_required, bond_duration_years,
          nmc_recognized, nirf_rank, mcc_college_code
        )
      `)
      .eq("year", LATEST_YEAR)
      .eq("round", 2)
      .in("category", cutoffCategories)
      .lte("opening_rank", airMidpoint * 1.5)
      .not("closing_rank", "is", null);

    if (error || !cutoffRows || cutoffRows.length === 0) {
      // Fallback: use seed data with estimated cutoffs
      return buildFromSeedData(rankEstimate, category, state, budgetPreference);
    }

    const aiqResults: CollegeWithCutoff[] = [];
    const stateResults: CollegeWithCutoff[] = [];

    for (const row of cutoffRows) {
      const college = row.colleges as unknown as CollegeWithCutoff;
      if (!college) continue;

      // Budget filter
      const fee =
        college.type === "government" || college.type === "central"
          ? college.annual_fee_govt
          : college.annual_fee_mgmt;

      if (
        budgetPreference === "government_only" &&
        college.type !== "government" &&
        college.type !== "central"
      ) {
        continue;
      }

      if (!meetsbudgetPreference(fee, budgetPreference)) continue;

      const safetyTag = computeSafetyTag(airMidpoint, row.closing_rank);

      const enriched: CollegeWithCutoff = {
        ...college,
        quota_type: row.quota_type as "AIQ" | "STATE",
        prev_year_closing_rank: row.closing_rank,
        prev_year_opening_rank: row.opening_rank,
        prev_year_round: row.round,
        cutoff_year: row.year,
        safety_tag: safetyTag,
      };

      if (row.quota_type === "AIQ") {
        aiqResults.push(enriched);
      } else if (
        row.quota_type === "STATE" &&
        isStateQuotaEligible(state, college.state)
      ) {
        stateResults.push(enriched);
      }
    }

    // Sort: safe first, then moderate, then reach; within tier sort by closing rank asc
    const sortFn = (a: CollegeWithCutoff, b: CollegeWithCutoff) => {
      const order: SafetyTag[] = ["safe", "moderate", "reach", "data_unavailable"];
      const diff = order.indexOf(a.safety_tag) - order.indexOf(b.safety_tag);
      if (diff !== 0) return diff;
      return (a.prev_year_closing_rank ?? 999999) - (b.prev_year_closing_rank ?? 999999);
    };

    return {
      colleges_aiq: aiqResults.sort(sortFn),
      colleges_state: stateResults.sort(sortFn),
      data_version: DATA_VERSION,
    };
  } catch {
    return buildFromSeedData(rankEstimate, category, state, budgetPreference);
  }
}

// Fallback when Supabase is empty / unavailable - uses seed colleges with estimated eligibility
function buildFromSeedData(
  rankEstimate: RankEstimate,
  category: Category,
  state: string,
  budgetPreference: BudgetPreference
): EligibilityResult {
  const seed = collegesSeedData as unknown as Array<{
    name: string;
    short_name?: string;
    state: string;
    district?: string;
    city?: string;
    type: string;
    annual_fee_govt?: number;
    annual_fee_mgmt?: number;
    total_mbbs_seats?: number;
    nri_quota?: boolean;
    bond_required?: boolean;
    bond_duration_years?: number;
    nmc_recognized?: boolean;
    nirf_rank?: number;
    mcc_college_code?: string;
  }>;

  const airMidpoint = rankEstimate.airMidpoint;
  const aiqResults: CollegeWithCutoff[] = [];
  const stateResults: CollegeWithCutoff[] = [];

  seed.forEach((c, i) => {
    if (
      budgetPreference === "government_only" &&
      c.type !== "government" &&
      c.type !== "central"
    ) return;

    // Rough eligibility estimate based on college type and score
    let estimatedClosingRank: number;
    if (c.type === "central") {
      const nirfRank = c.nirf_rank ?? 99;
      estimatedClosingRank = Math.round(nirfRank * 200 + 1000);
    } else {
      estimatedClosingRank = Math.round(airMidpoint * (0.8 + Math.random() * 0.6));
    }

    const safetyTag = computeSafetyTag(airMidpoint, estimatedClosingRank);

    const base: CollegeWithCutoff = {
      id: `seed_${i}`,
      name: c.name,
      short_name: c.short_name ?? null,
      state: c.state,
      district: c.district ?? null,
      city: c.city ?? null,
      type: c.type as CollegeWithCutoff["type"],
      annual_fee_govt: c.annual_fee_govt ?? null,
      annual_fee_mgmt: c.annual_fee_mgmt ?? null,
      total_mbbs_seats: c.total_mbbs_seats ?? null,
      nri_quota: c.nri_quota ?? false,
      bond_required: c.bond_required ?? false,
      bond_duration_years: c.bond_duration_years ?? null,
      nmc_recognized: c.nmc_recognized ?? true,
      nirf_rank: c.nirf_rank ?? null,
      mcc_college_code: c.mcc_college_code ?? null,
      quota_type: "AIQ",
      prev_year_closing_rank: estimatedClosingRank,
      prev_year_opening_rank: null,
      prev_year_round: 2,
      cutoff_year: null,
      safety_tag: safetyTag,
    };

    aiqResults.push(base);

    if (isStateQuotaEligible(state, c.state)) {
      stateResults.push({ ...base, quota_type: "STATE" });
    }
  });

  const sortFn = (a: CollegeWithCutoff, b: CollegeWithCutoff) => {
    const order: SafetyTag[] = ["safe", "moderate", "reach", "data_unavailable"];
    return order.indexOf(a.safety_tag) - order.indexOf(b.safety_tag);
  };

  return {
    colleges_aiq: aiqResults.sort(sortFn).slice(0, 30),
    colleges_state: stateResults.sort(sortFn).slice(0, 20),
    data_version: "SEED_DATA",
  };
}
