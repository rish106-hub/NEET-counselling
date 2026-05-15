import { getSupabaseAdmin } from "@/lib/db/supabase";
import type {
  BudgetPreference,
  Category,
  CollegePrediction,
  CollegeWithCutoff,
  PredictionEvidence,
  RankEstimate,
  SafetyTag,
} from "@/lib/types";

const MODEL = "percentile_weighted_cutoff_v1" as const;
const MAX_HISTORY_YEARS = 4;
const MIN_HISTORY_FOR_HIGH_CONFIDENCE = 3;

// Mirrors eligibilityEngine constant — must be kept in sync.
// Student's AIR may not exceed this multiple of the college's expected closing rank.
const MAX_REACH_RATIO = 1.40;

type CutoffRow = {
  year: number;
  quota_type: "AIQ" | "STATE";
  state: string | null;
  round: number;
  category: string;
  opening_rank: number | null;
  closing_rank: number;
  source_url: string | null;
  confidence: "high" | "medium" | "low";
  colleges: CollegeWithCutoff | null;
};

type YearStats = {
  data_year: number;
  total_candidates: number;
};

type Candidate = {
  college: CollegeWithCutoff;
  quota_type: "AIQ" | "STATE";
  history: CutoffRow[];
};

export interface PredictionResult {
  colleges_aiq: CollegeWithCutoff[];
  colleges_state: CollegeWithCutoff[];
  data_version: string;
}

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

function isStateQuotaEligible(userState: string, collegeState: string): boolean {
  return userState.toLowerCase() === collegeState.toLowerCase();
}

function meetsbudgetPreference(
  college: CollegeWithCutoff,
  budgetPreference: BudgetPreference
): boolean {
  if (
    budgetPreference === "government_only" &&
    college.type !== "government" &&
    college.type !== "central"
  ) {
    return false;
  }

  const fee =
    college.type === "government" || college.type === "central"
      ? college.annual_fee_govt
      : college.annual_fee_mgmt;

  if (fee == null) return true;
  if (budgetPreference === "private_under_10l") return fee <= 1000000;
  if (budgetPreference === "private_under_25l") return fee <= 2500000;
  return true;
}

function percentileFromRank(rank: number, totalCandidates: number | undefined): number | null {
  if (!totalCandidates || totalCandidates <= 0) return null;
  // Mid-rank formula: (N - rank + 0.5) / N gives rank 1 → ~1.0 and rank N → ~0.5/N ≈ 0
  return Math.max(0, Math.min(1, (totalCandidates - rank + 0.5) / totalCandidates));
}

function weightedAverage(values: Array<{ value: number; weight: number }>): number | null {
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return null;
  return values.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function computeChanceBand(
  studentPercentile: number | null,
  predictedCutoffPercentile: number | null,
  historicalStdDev: number
): SafetyTag {
  if (studentPercentile == null || predictedCutoffPercentile == null) {
    return "data_unavailable";
  }

  const margin = studentPercentile - predictedCutoffPercentile;
  // Floor of 0.005 (~0.5 pctile ≈ 11,600 rank positions in 2024 pool) prevents
  // overconfident safe/reach labels when there is only one year of history (stdDev=0).
  const buffer = Math.max(0.005, historicalStdDev * 0.75);
  const nearBand = Math.max(0.010, historicalStdDev * 1.5);

  if (margin >= buffer) return "safe";
  if (margin >= -nearBand) return "moderate";
  return "reach";
}

function computeConfidence(history: PredictionEvidence[], stdDev: number): "high" | "medium" | "low" {
  const highQualityRows = history.filter((h) => h.confidence === "high").length;
  if (history.length >= MIN_HISTORY_FOR_HIGH_CONFIDENCE && highQualityRows >= 2 && stdDev <= 0.006) {
    return "high";
  }
  if (history.length >= 2 && stdDev <= 0.012) return "medium";
  return "low";
}

function latestYear(rows: CutoffRow[]): number | null {
  return rows.reduce<number | null>(
    (latest, row) => (latest == null || row.year > latest ? row.year : latest),
    null
  );
}

function buildPrediction(
  rankEstimate: RankEstimate,
  history: CutoffRow[],
  statsByYear: Map<number, number>,
  currentTotalCandidates: number | undefined
): CollegePrediction {
  const sorted = [...history]
    .sort((a, b) => b.year - a.year)
    .slice(0, MAX_HISTORY_YEARS);

  const evidence: PredictionEvidence[] = sorted.map((row) => ({
    year: row.year,
    opening_rank: row.opening_rank,
    closing_rank: row.closing_rank,
    closing_percentile: percentileFromRank(row.closing_rank, statsByYear.get(row.year)),
    source_url: row.source_url,
    confidence: row.confidence,
  }));

  const percentileValues = evidence
    .filter((row): row is PredictionEvidence & { closing_percentile: number } =>
      row.closing_percentile != null
    )
    .map((row, index) => ({
      value: row.closing_percentile,
      // Recent years matter more, but older years still stabilize volatility.
      weight: index === 0 ? 0.5 : index === 1 ? 0.3 : index === 2 ? 0.15 : 0.05,
    }));

  const predictedClosingPercentile = weightedAverage(percentileValues);
  const stdDev = standardDeviation(percentileValues.map((v) => v.value));
  const studentRank = rankEstimate.airMidpoint;
  const studentPercentile = percentileFromRank(studentRank, currentTotalCandidates);
  const chanceBand = computeChanceBand(studentPercentile, predictedClosingPercentile, stdDev);
  const predictedClosingRank =
    predictedClosingPercentile != null && currentTotalCandidates
      ? Math.max(1, Math.round((1 - predictedClosingPercentile) * currentTotalCandidates))
      : null;

  const notes: string[] = [];
  if (evidence.length < 2) {
    notes.push("Only one official historical cutoff row available; confidence reduced.");
  }
  if (predictedClosingPercentile == null) {
    notes.push("Missing NTA total-candidate stats for historical years; percentile model unavailable.");
  }
  if (stdDev > 0.012) {
    notes.push("Historical cutoffs are volatile for this college/category/round.");
  }

  return {
    model: MODEL,
    chance_band: chanceBand,
    confidence: computeConfidence(evidence, stdDev),
    student_rank: studentRank,
    student_percentile: studentPercentile,
    predicted_closing_rank: predictedClosingRank,
    predicted_closing_percentile: predictedClosingPercentile,
    percentile_margin:
      studentPercentile != null && predictedClosingPercentile != null
        ? studentPercentile - predictedClosingPercentile
        : null,
    evidence,
    notes,
  };
}

/**
 * For each (college, quota_type, year) group keep only the highest round number.
 * Round 2 / Mop-up is the final, authoritative cutoff for that year.
 * Without this, multi-round rows inflate "history length" and distort weights.
 */
function deduplicateHistoryByYear(history: CutoffRow[]): CutoffRow[] {
  const byYear = new Map<number, CutoffRow>();
  for (const row of history) {
    const existing = byYear.get(row.year);
    if (!existing || row.round > existing.round) {
      byYear.set(row.year, row);
    }
  }
  return Array.from(byYear.values()).sort((a, b) => b.year - a.year);
}

function groupByCollegeQuota(rows: CutoffRow[]): Candidate[] {
  const groups = new Map<string, Candidate>();

  for (const row of rows) {
    if (!row.colleges) continue;
    const key = `${row.colleges.id}:${row.quota_type}`;
    const existing = groups.get(key);
    if (existing) {
      existing.history.push(row);
      continue;
    }

    groups.set(key, {
      college: row.colleges,
      quota_type: row.quota_type,
      history: [row],
    });
  }

  // Deduplicate after grouping so each year contributes exactly one data point
  const candidates = Array.from(groups.values());
  for (const c of candidates) {
    c.history = deduplicateHistoryByYear(c.history);
  }
  return candidates;
}

function sortPredictions(a: CollegeWithCutoff, b: CollegeWithCutoff): number {
  const order: SafetyTag[] = ["safe", "moderate", "reach", "data_unavailable"];
  const bandDiff = order.indexOf(a.safety_tag) - order.indexOf(b.safety_tag);
  if (bandDiff !== 0) return bandDiff;

  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  const aConf = a.prediction?.confidence ?? "low";
  const bConf = b.prediction?.confidence ?? "low";
  const confidenceDiff = confidenceOrder[aConf] - confidenceOrder[bConf];
  if (confidenceDiff !== 0) return confidenceDiff;

  return (a.prediction?.predicted_closing_rank ?? 9999999)
    - (b.prediction?.predicted_closing_rank ?? 9999999);
}

export async function getPredictedColleges(
  rankEstimate: RankEstimate,
  category: Category,
  state: string,
  budgetPreference: BudgetPreference
): Promise<PredictionResult | null> {
  const supabase = getSupabaseAdmin();
  const cutoffCategories = getCutoffCategories(category);

  const { data: statsRows, error: statsError } = await supabase
    .from("neet_year_stats")
    .select("data_year,total_candidates")
    .order("data_year", { ascending: false });

  if (statsError || !statsRows || statsRows.length === 0) {
    return null;
  }

  const statsByYear = new Map<number, number>(
    (statsRows as YearStats[]).map((row) => [row.data_year, row.total_candidates])
  );
  const currentTotalCandidates = statsRows[0]?.total_candidates;

  const { data: cutoffRows, error } = await supabase
    .from("cutoffs")
    .select(`
      year,
      quota_type,
      state,
      round,
      category,
      opening_rank,
      closing_rank,
      source_url,
      confidence,
      colleges (
        id, name, short_name, state, district, city, type,
        annual_fee_govt, annual_fee_mgmt, total_mbbs_seats,
        nri_quota, bond_required, bond_duration_years,
        nmc_recognized, nirf_rank, mcc_college_code
      )
    `)
    .in("category", cutoffCategories)
    .not("closing_rank", "is", null)
    .order("year", { ascending: false });

  if (error || !cutoffRows || cutoffRows.length === 0) {
    return null;
  }

  const candidates = groupByCollegeQuota(cutoffRows as unknown as CutoffRow[]);
  const aiqResults: CollegeWithCutoff[] = [];
  const stateResults: CollegeWithCutoff[] = [];

  for (const candidate of candidates) {
    const college = candidate.college;
    if (!meetsbudgetPreference(college, budgetPreference)) continue;
    if (
      candidate.quota_type === "STATE" &&
      !isStateQuotaEligible(state, college.state)
    ) {
      continue;
    }

    const prediction = buildPrediction(
      rankEstimate,
      candidate.history,
      statsByYear,
      currentTotalCandidates
    );

    // Hard exclude: if student's rank is more than MAX_REACH_RATIO worse than the
    // predicted (or last known) closing rank, this college is out of realistic reach.
    const latestHistoryYear = latestYear(candidate.history);
    const latestRow = candidate.history.find((row) => row.year === latestHistoryYear);
    const referenceClosingRank =
      prediction.predicted_closing_rank ?? latestRow?.closing_rank ?? null;
    if (
      referenceClosingRank !== null &&
      rankEstimate.airMidpoint > referenceClosingRank * MAX_REACH_RATIO
    ) {
      continue;
    }

    const enriched: CollegeWithCutoff = {
      ...college,
      quota_type: candidate.quota_type,
      prev_year_closing_rank: latestRow?.closing_rank ?? null,
      prev_year_opening_rank: latestRow?.opening_rank ?? null,
      prev_year_round: latestRow?.round ?? null,
      cutoff_year: latestRow?.year ?? null,
      safety_tag: prediction.chance_band,
      prediction,
    };

    if (candidate.quota_type === "AIQ") {
      aiqResults.push(enriched);
    } else {
      stateResults.push(enriched);
    }
  }

  return {
    colleges_aiq: aiqResults.sort(sortPredictions).slice(0, 40),
    colleges_state: stateResults.sort(sortPredictions).slice(0, 30),
    data_version: MODEL,
  };
}
