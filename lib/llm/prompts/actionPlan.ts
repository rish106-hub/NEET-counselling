import type { AssessInput, RankEstimate, CollegeWithCutoff, RoundStrategy } from "@/lib/types";

export const ACTION_PLAN_PROMPT_VERSION = "v1";

export function buildActionPlanPrompt(params: {
  input: AssessInput;
  rankEstimate: RankEstimate;
  topAiqColleges: CollegeWithCutoff[];
  topStateColleges: CollegeWithCutoff[];
  roundStrategy: RoundStrategy;
}): string {
  const { input, rankEstimate, topAiqColleges, topStateColleges, roundStrategy } = params;

  const aiqList = topAiqColleges
    .slice(0, 5)
    .map((c) => `- ${c.name} (${c.state}) - ${c.safety_tag}`)
    .join("\n");

  const stateList = topStateColleges
    .slice(0, 5)
    .map((c) => `- ${c.name} (${c.state}) - ${c.safety_tag}`)
    .join("\n");

  const categoryRankText =
    rankEstimate.hasCategoryRank && rankEstimate.categoryRankMin != null
      ? `Your estimated ${input.category} category rank: ${rankEstimate.categoryRankMin.toLocaleString()} - ${rankEstimate.categoryRankMax?.toLocaleString()}.`
      : "";

  return `You are a trusted, honest NEET counselling assistant. Write a clear, step-by-step action plan for a student with the following profile. Use plain language a Class 10 student can understand. No jargon without explanation. Be specific. Be honest about uncertainty. Do not make false guarantees.

STUDENT PROFILE:
- NEET Score: ${input.neet_score} out of 720
- Category: ${input.category}
- Home State: ${input.state}
- Budget Preference: ${input.budget_preference.replace(/_/g, " ")}
- Estimated All India Rank (AIR): ${rankEstimate.airMin.toLocaleString()} - ${rankEstimate.airMax.toLocaleString()}
${categoryRankText}

LIKELY ELIGIBLE COLLEGES (All India Quota):
${aiqList || "No AIQ college data available - please check mcc.nic.in directly."}

LIKELY ELIGIBLE COLLEGES (${input.state} State Quota):
${stateList || `No specific state quota data - check ${input.state} DME portal directly.`}

ROUND STRATEGY FOR THIS SCORE:
${roundStrategy.strategy}

TASK: Write a numbered step-by-step action plan (7 to 12 steps) covering:
1. What the student must do IMMEDIATELY (within this week)
2. How to register on the MCC portal for AIQ counselling
3. How to register on the ${input.state} state DME portal for state counselling
4. How to fill college choices strategically
5. What freeze/float/slide means and what to choose
6. What documents to prepare and when
7. What to do after Round 1 allotment
8. One honest reminder about what can go wrong and how to avoid it

Format: numbered list, plain English, no bullet sub-points. Each step should be 2-4 sentences. Include specific website names (mcc.nic.in, the state DME portal name if known). End with one sentence of genuine encouragement - not generic, specific to their situation.`;
}
