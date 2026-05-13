import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { estimateRank } from "@/lib/engine/rankEstimator";
import { getEligibleColleges } from "@/lib/engine/eligibilityEngine";
import { getRoundStrategy } from "@/lib/engine/roundStrategy";
import { getDocumentChecklist } from "@/lib/engine/documentChecklist";
import { getRedFlags } from "@/lib/engine/redFlagEngine";
import { generateText } from "@/lib/llm/gemini";
import { buildActionPlanPrompt } from "@/lib/llm/prompts/actionPlan";
import { cacheOutput, checkRateLimit } from "@/lib/cache/redis";
import { persistAssessmentOutput } from "@/lib/server/output";
import type { AssessOutput, Category, BudgetPreference } from "@/lib/types";

const AssessSchema = z.object({
  neet_score: z.number().int().min(0).max(720),
  category: z.enum([
    "General",
    "OBC",
    "OBC-NCL",
    "SC",
    "ST",
    "EWS",
    "PwD-General",
    "PwD-OBC",
    "PwD-SC",
    "PwD-ST",
  ]),
  state: z.string().min(1).max(100),
  budget_preference: z
    .enum(["government_only", "private_under_10l", "private_under_25l", "all"])
    .default("government_only"),
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP.
  const ip = getClientIp(req);
  const allowed = await checkRateLimit(`assess:${ip}`, 20, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AssessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data as {
    neet_score: number;
    category: Category;
    state: string;
    budget_preference: BudgetPreference;
  };

  // Core engine pipeline
  const rankEstimate = estimateRank(input.neet_score, input.category);
  const { colleges_aiq, colleges_state, data_version } = await getEligibleColleges(
    rankEstimate,
    input.category,
    input.state,
    input.budget_preference
  );
  const roundStrategy = getRoundStrategy(input.neet_score);
  const documentChecklist = getDocumentChecklist(input.category, input.state);
  const redFlags = getRedFlags(
    input.neet_score,
    [...colleges_aiq, ...colleges_state],
    input.budget_preference
  );

  // Fallback action steps (used if LLM fails)
  const fallbackSteps = [
    `Register on the MCC portal at mcc.nic.in immediately when AIQ counselling opens. Registration closes within 3 to 5 days of opening.`,
    `Register on the ${input.state} state DME portal at the same time. State counselling runs parallel to AIQ and has its own registration window.`,
    `Fill your college choices on the MCC portal during the choice-filling window. You can fill up to 300 colleges, so fill as many as you are comfortable attending.`,
    `${roundStrategy.float_guidance}`,
    `After Round 1 allotment: ${roundStrategy.lock_guidance}`,
    `Prepare all documents from your personalised checklist before Round 1 reporting dates. Getting documents late is the #1 reason students lose seats.`,
    `Check the deadline calendar daily during the counselling window. Dates are announced with short notice.`,
  ];

  // LLM action plan with graceful degradation on failure.
  let actionPlan: string | null = null;
  try {
    const prompt = buildActionPlanPrompt({
      input,
      rankEstimate,
      topAiqColleges: colleges_aiq.slice(0, 5),
      topStateColleges: colleges_state.slice(0, 5),
      roundStrategy,
    });
    actionPlan = await generateText(prompt);
  } catch {
    // LLM failure is non-fatal because fallback steps are used by the frontend.
    actionPlan = null;
  }

  const assessmentId = uuidv4();
  const output: AssessOutput = {
    assessment_id: assessmentId,
    neet_score: input.neet_score,
    category: input.category,
    state: input.state,
    budget_preference: input.budget_preference,
    rank_estimate: rankEstimate,
    aiq_eligible: true,
    state_quota_eligible: colleges_state.length > 0,
    colleges_aiq,
    colleges_state,
    round_strategy: roundStrategy,
    document_checklist: documentChecklist,
    red_flags: redFlags,
    action_plan: actionPlan,
    action_steps_fallback: fallbackSteps,
    data_version,
    generated_at: new Date().toISOString(),
  };

  // Store for UUID retrieval. Redis is optional; Supabase keeps links durable in production.
  await cacheOutput(assessmentId, output);
  await persistAssessmentOutput(assessmentId, output);

  return NextResponse.json(
    { assessment_id: assessmentId, output },
    { status: 200 }
  );
}
