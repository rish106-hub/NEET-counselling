import type { Category, RankEstimate } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import fallbackData from "@/public/data/score_to_rank.json";

type Bracket = {
  score_min: number;
  score_max: number;
  air_min: number;
  air_max: number;
  cat_rank_min?: number;
  cat_rank_max?: number;
};

const CATEGORIES_WITH_RANK: Category[] = ["OBC", "OBC-NCL", "SC", "ST", "EWS"];

// The most recently ingested data year to query.
// Updated automatically when new data is ingested via /api/admin/ingest.
const PREFERRED_YEAR = 2025;

// PwD categories fall back to their base category for rank lookup
function normalizeCategory(category: Category): string {
  if (category === "PwD-General") return "General";
  if (category === "PwD-OBC") return "OBC";
  if (category === "PwD-SC") return "SC";
  if (category === "PwD-ST") return "ST";
  return category;
}

function buildResult(category: Category, bracket: Bracket | undefined): RankEstimate {
  if (!bracket) {
    return {
      airMin: 1316000,
      airMax: 1316000,
      airMidpoint: 1316000,
      categoryRankMin: null,
      categoryRankMax: null,
      hasCategoryRank: false,
    };
  }

  const hasCategoryRank =
    CATEGORIES_WITH_RANK.includes(category) &&
    bracket.cat_rank_min != null;

  return {
    airMin: bracket.air_min,
    airMax: bracket.air_max,
    airMidpoint: Math.round((bracket.air_min + bracket.air_max) / 2),
    categoryRankMin: bracket.cat_rank_min ?? null,
    categoryRankMax: bracket.cat_rank_max ?? null,
    hasCategoryRank,
  };
}

/**
 * Estimates AIR and category rank from a NEET score.
 *
 * Primary source: Supabase `score_rank_brackets` table, populated from official
 * NTA score distribution data via POST /api/admin/ingest.
 *
 * Fallback: bundled public/data/score_to_rank.json (last-resort for dev or DB outage).
 */
export async function estimateRank(score: number, category: Category): Promise<RankEstimate> {
  const key = normalizeCategory(category);

  // Primary: Supabase (live, updateable without code deploy)
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("score_rank_brackets")
      .select("score_min, score_max, air_min, air_max, cat_rank_min, cat_rank_max")
      .eq("category", key)
      .eq("data_year", PREFERRED_YEAR)
      .lte("score_min", score)
      .gte("score_max", score)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return buildResult(category, data as Bracket);
    }

    // No row for PREFERRED_YEAR — try the latest available year
    const { data: latestRows, error: latestErr } = await supabase
      .from("score_rank_brackets")
      .select("score_min, score_max, air_min, air_max, cat_rank_min, cat_rank_max, data_year")
      .eq("category", key)
      .lte("score_min", score)
      .gte("score_max", score)
      .order("data_year", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestErr && latestRows) {
      return buildResult(category, latestRows as Bracket);
    }
  } catch {
    // Supabase unavailable — fall through to bundled data
  }

  // Fallback: bundled JSON (dev / no-DB / DB outage)
  const data = fallbackData as unknown as Record<string, Bracket[]>;
  const brackets: Bracket[] = data[key] ?? data["General"];
  const bracket = brackets.find(
    (b) => score >= b.score_min && score <= b.score_max
  );

  return buildResult(category, bracket);
}
