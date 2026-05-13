import type { Category, RankEstimate } from "@/lib/types";
import scoreToRankData from "@/public/data/score_to_rank.json";

type Bracket = {
  score_min: number;
  score_max: number;
  air_min: number;
  air_max: number;
  cat_rank_min?: number;
  cat_rank_max?: number;
};

const CATEGORIES_WITH_RANK: Category[] = ["OBC", "OBC-NCL", "SC", "ST", "EWS"];

// PwD categories fall back to their base category for rank lookup
function normalizeCategory(category: Category): string {
  if (category === "PwD-General") return "General";
  if (category === "PwD-OBC") return "OBC";
  if (category === "PwD-SC") return "SC";
  if (category === "PwD-ST") return "ST";
  return category;
}

export function estimateRank(score: number, category: Category): RankEstimate {
  const key = normalizeCategory(category);
  const data = scoreToRankData as unknown as Record<string, Bracket[]>;
  const brackets: Bracket[] = data[key] ?? data["General"];

  const bracket = brackets.find(
    (b) => score >= b.score_min && score <= b.score_max
  );

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
