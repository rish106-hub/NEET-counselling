import type {
  Category,
  BudgetPreference,
  CollegeWithCutoff,
  RankEstimate,
  SafetyTag,
} from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getPredictedColleges } from "@/lib/engine/predictionEngine";
import collegesSeedData from "@/scripts/seed/colleges_seed.json";

const DATA_VERSION = "NEET2025";
const LATEST_YEAR = 2025;

// Safety tag for real Supabase cutoff data (tight thresholds — data is authoritative)
function computeSafetyTag(airMidpoint: number, closingRank: number): SafetyTag {
  if (airMidpoint <= closingRank * 0.8) return "safe";
  if (airMidpoint <= closingRank * 1.1) return "moderate";
  return "reach";
}

// Safety tag for estimated seed-fallback data (wider thresholds — estimates carry ±30% variance)
function computeSafetyTagEstimated(airMidpoint: number, estimatedClosingRank: number): SafetyTag {
  if (estimatedClosingRank >= 1200000) return "data_unavailable";
  if (airMidpoint <= estimatedClosingRank * 0.75) return "safe";
  if (airMidpoint <= estimatedClosingRank * 1.15) return "moderate";
  return "reach";
}

/**
 * Converts a General AIQ closing rank (AIR) to a category-specific AIQ closing rank (AIR).
 *
 * In AIQ counselling MCC uses AIR for all categories — SC/ST/OBC/EWS each fill
 * their reserved seats from a separate pool, so their cutoffs are typically much
 * looser (higher AIR number) than General.
 *
 * Multipliers calibrated from MCC NEET UG AIQ Round 2 published data (2023–2024).
 * Source: https://mcc.nic.in/ug-medical-counselling/ → Seat Allotment Results
 */
function getCategoryAIQClosingRank(generalClosingRank: number, category: Category): number {
  const g = generalClosingRank;

  // PwD and General use the published General closing rank directly
  if (category === "General" || category.startsWith("PwD-")) return g;

  switch (category) {
    case "OBC":
    case "OBC-NCL":
      // OBC seats fill at ~1.7–3× the General cutoff depending on college tier
      if (g <= 500)   return Math.round(g * 3.0);
      if (g <= 5000)  return Math.round(g * 2.5);
      if (g <= 25000) return Math.round(g * 2.0);
      return Math.round(g * 1.7);

    case "EWS":
      // EWS slightly tighter than OBC (smaller pool)
      if (g <= 500)   return Math.round(g * 2.5);
      if (g <= 5000)  return Math.round(g * 2.0);
      if (g <= 25000) return Math.round(g * 1.8);
      return Math.round(g * 1.5);

    case "SC":
      // SC seats fill at dramatically higher AIR for top institutes
      // AIIMS Delhi General~50 → SC~5000–8000; KGMU General~8000 → SC~50000
      if (g <= 100)   return Math.round(g * 80);
      if (g <= 500)   return Math.round(g * 35);
      if (g <= 2000)  return Math.round(g * 15);
      if (g <= 10000) return Math.round(g * 6);
      if (g <= 40000) return Math.round(g * 3.5);
      return Math.round(g * 2.2);

    case "ST":
      // ST seats often go to very high AIR numbers; some seats may remain unfilled
      // AIIMS Delhi General~50 → ST~15000–25000; KGMU General~8000 → ST~90000
      if (g <= 100)   return Math.round(g * 200);
      if (g <= 500)   return Math.round(g * 80);
      if (g <= 2000)  return Math.round(g * 30);
      if (g <= 10000) return Math.round(g * 12);
      if (g <= 40000) return Math.round(g * 6);
      return Math.round(g * 3.5);

    default:
      return g;
  }
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
    const prediction = await getPredictedColleges(
      rankEstimate,
      category,
      state,
      budgetPreference
    );

    if (
      prediction &&
      (prediction.colleges_aiq.length > 0 || prediction.colleges_state.length > 0)
    ) {
      return prediction;
    }
  } catch {
    // Prediction engine is best-effort; fall back to direct cutoff lookup below.
  }

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
      // Only include colleges where the closing rank is >= 20% of the student's AIR
      // (exclude trivially over-competitive colleges) and <= 8× (exclude hopeless reaches)
      .gte("closing_rank", Math.round(airMidpoint * 0.2))
      .lte("closing_rank", airMidpoint * 8)
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
    estimated_aiq_closing_rank?: number;
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

    // Step 1: derive the General AIQ closing rank for this college
    let generalClosingRank: number;
    if (c.estimated_aiq_closing_rank != null) {
      generalClosingRank = c.estimated_aiq_closing_rank;
    } else if (c.type === "central") {
      const nirfRank = c.nirf_rank ?? 50;
      generalClosingRank = Math.round(nirfRank * 400 + 2000);
    } else {
      const nirfRank = c.nirf_rank ?? 70;
      generalClosingRank = Math.round(nirfRank * 1500 + 5000);
    }

    // Step 2: convert to the category-specific AIQ closing rank.
    // Reserved-category students compete in a separate AIR pool; their cutoffs
    // (in AIR terms) are significantly looser than the General cutoff.
    const estimatedClosingRank = getCategoryAIQClosingRank(generalClosingRank, category);

    // Step 3: compute safety tag using wider thresholds for estimated data
    const safetyTag = computeSafetyTagEstimated(airMidpoint, estimatedClosingRank);

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
