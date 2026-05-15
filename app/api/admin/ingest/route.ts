/**
 * POST /api/admin/ingest
 *
 * Protected data ingestion endpoint. Refreshes score-to-rank brackets and
 * college cutoffs from official government sources without requiring a code deploy.
 *
 * Authentication: Bearer token in Authorization header must match ADMIN_INGEST_SECRET.
 *
 * ─── Supported ingest types ────────────────────────────────────────────────
 *
 * 1. rank_brackets_from_nta_csv
 *    Fetches the NTA score distribution CSV from a government CDN URL,
 *    computes score-to-AIR brackets from the actual distribution, and stores
 *    them in the `score_rank_brackets` Supabase table.
 *
 *    Official source: NTA publishes marks for all candidates after results.
 *    URL pattern: https://cdnbbsr.s3waas.gov.in/.../<year>_neet_marks.csv
 *    Also mirrored at: https://dataful.in/datasets/20201 (Ministry of Education)
 *
 *    Required CSV columns: marks (integer 0–720)
 *    Optional: category (SC/ST/OBC/EWS/General) — if absent, category ranks
 *              are estimated from published NTA demographic fractions.
 *
 *    Body:
 *    {
 *      "type": "rank_brackets_from_nta_csv",
 *      "year": 2025,
 *      "source_url": "https://cdnbbsr.s3waas.gov.in/.../neet_2025_marks.csv",
 *      "category_fractions": {          // optional — NTA annual statistics
 *        "SC": 0.10, "ST": 0.038,
 *        "OBC": 0.357, "OBC-NCL": 0.357, "EWS": 0.075
 *      }
 *    }
 *
 * 2. rank_brackets
 *    Directly upload pre-computed bracket data (e.g. processed offline from
 *    NTA rank list PDF or computed by a local script).
 *
 *    Body:
 *    {
 *      "type": "rank_brackets",
 *      "year": 2025,
 *      "source_url": "https://...",          // optional, for provenance
 *      "source_description": "NTA 2025",     // optional
 *      "brackets": [
 *        { "category": "General", "score_min": 701, "score_max": 720,
 *          "air_min": 1, "air_max": 50 },
 *        { "category": "SC", "score_min": 701, "score_max": 720,
 *          "air_min": 1, "air_max": 50, "cat_rank_min": 1, "cat_rank_max": 5 },
 *        ...
 *      ]
 *    }
 *
 * 3. cutoffs
 *    Upload MCC/state college cutoff data directly.
 *    Download source: https://mcc.nic.in/ug-medical-counselling/ (Seat Allotment Results)
 *    MCC publishes Round-wise Excel files. Convert to JSON or use the
 *    scripts/ingest/parse-mcc-excel.ts helper to transform the Excel.
 *
 *    Body:
 *    {
 *      "type": "cutoffs",
 *      "year": 2024,
 *      "source_url": "https://cdnbbsr.s3waas.gov.in/.../2024_round2_allotment.xlsx",
 *      "cutoffs": [
 *        {
 *          "mcc_college_code": "101001",
 *          "quota_type": "AIQ",
 *          "round": 2,
 *          "category": "General",
 *          "opening_rank": 1,
 *          "closing_rank": 50,
 *          "confidence": "high"
 *        },
 *        ...
 *      ]
 *    }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabase";

// ─── Auth ──────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_INGEST_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Zod schemas ───────────────────────────────────────────────────────────

const BracketSchema = z.object({
  category: z.enum(["General", "OBC", "OBC-NCL", "SC", "ST", "EWS"]),
  score_min: z.number().int().min(0).max(720),
  score_max: z.number().int().min(0).max(720),
  air_min: z.number().int().min(1),
  air_max: z.number().int().min(1),
  cat_rank_min: z.number().int().min(1).optional(),
  cat_rank_max: z.number().int().min(1).optional(),
});

// Enum of all category strings the engines understand.
// Typos at ingest silently vanish from predictions — reject them here instead.
const CUTOFF_CATEGORY_ENUM = [
  "General", "UR",
  "OBC", "OBC-NCL",
  "SC", "ST", "EWS",
  "PwD-General", "PwD-UR", "General-PwD",
  "PwD-OBC", "OBC-PwD",
  "PwD-SC", "SC-PwD",
  "PwD-ST", "ST-PwD",
] as const;

const CutoffSchema = z.object({
  mcc_college_code: z.string().min(1),
  quota_type: z.enum(["AIQ", "STATE"]),
  state: z.string().optional(),
  round: z.number().int().min(1).max(5),
  category: z.enum(CUTOFF_CATEGORY_ENUM),
  opening_rank: z.number().int().min(1).optional(),
  closing_rank: z.number().int().min(1),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
});

// Defaults from NTA NEET UG 2024 press release (04 Jun 2024):
//   appeared by category / total appeared (2,333,297).
const CategoryFractionsSchema = z.object({
  SC: z.number().min(0).max(1).default(0.148),
  ST: z.number().min(0).max(1).default(0.064),
  OBC: z.number().min(0).max(1).default(0.440),
  "OBC-NCL": z.number().min(0).max(1).default(0.440),
  EWS: z.number().min(0).max(1).default(0.080),
});

const IngestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("rank_brackets_from_nta_csv"),
    year: z.number().int().min(2020).max(2030).default(2025),
    source_url: z.string().url(),
    category_fractions: CategoryFractionsSchema.optional(),
  }),
  z.object({
    type: z.literal("rank_brackets"),
    year: z.number().int().min(2020).max(2030).default(2025),
    source_url: z.string().url().optional(),
    source_description: z.string().optional(),
    brackets: z.array(BracketSchema).min(1),
  }),
  z.object({
    type: z.literal("cutoffs"),
    year: z.number().int().min(2020).max(2030).default(2024),
    source_url: z.string().url().optional(),
    cutoffs: z.array(CutoffSchema).min(1),
  }),
]);

// ─── NTA CSV processing ────────────────────────────────────────────────────

/**
 * Streams an NTA marks CSV and builds a frequency map: score → candidate count.
 * Handles large files (2M+ rows) without loading everything into memory.
 *
 * The NTA CSV format (dataful.in / data.gov.in) has a `marks` column.
 * Category information is not present in the public CSV; category ranks
 * are derived from demographic fractions provided separately.
 */
async function buildFrequencyMapFromNTACSV(
  url: string
): Promise<Map<number, number>> {
  const response = await fetch(url, {
    headers: { "User-Agent": "NEET-Counselling-Navigator/1.0 (data ingestion)" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NTA CSV: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const frequency = new Map<number, number>();

  let buffer = "";
  let headerParsed = false;
  let marksIndex = -1;
  let totalParsed = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const newlineIdx = buffer.lastIndexOf("\n");
      if (newlineIdx === -1) continue;

      const chunk = buffer.slice(0, newlineIdx + 1);
      buffer = buffer.slice(newlineIdx + 1);

      for (const rawLine of chunk.split("\n")) {
        const line = rawLine.trim();
        if (!line) continue;

        if (!headerParsed) {
          const headers = line.split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
          marksIndex = headers.findIndex((h) => h === "marks");
          if (marksIndex === -1) {
            throw new Error(
              `Column "marks" not found in CSV header. Found columns: ${headers.join(", ")}`
            );
          }
          headerParsed = true;
          continue;
        }

        const fields = line.split(",");
        const marksStr = fields[marksIndex]?.trim().replace(/['"]/g, "");
        if (!marksStr) continue;

        const marks = parseFloat(marksStr);
        if (isNaN(marks)) continue;

        // NTA uses integer scores 0–720; negative scores indicate absent/disqualified
        const score = Math.round(marks);
        if (score < 0 || score > 720) continue;

        frequency.set(score, (frequency.get(score) ?? 0) + 1);
        totalParsed++;
      }
    }
  } finally {
    reader.cancel();
  }

  if (totalParsed === 0) {
    throw new Error("No valid marks rows found in CSV");
  }

  return frequency;
}

type BracketRow = z.infer<typeof BracketSchema>;

/**
 * Computes score-to-AIR brackets from a frequency map.
 *
 * AIR assignment follows NTA's published tie-breaking rules:
 * - All candidates with the same score get the same AIR (best rank in the group).
 * - The next score band starts after the last rank in the tie group.
 *
 * Category ranks are estimated using demographic fractions derived from
 * NTA's annual category-wise statistics (published in results press release).
 */
function computeBracketsFromFrequency(
  frequency: Map<number, number>,
  year: number,
  sourceUrl: string,
  catFractions: z.infer<typeof CategoryFractionsSchema>
): BracketRow[] {
  const BAND = 20; // score band width in points

  // Build cumulative rank mapping: score → { air_min, air_max }
  const sortedScores = Array.from(frequency.keys()).sort((a, b) => b - a);
  const airAtScore = new Map<number, { air_min: number; air_max: number }>();
  let cumulative = 0;

  for (const score of sortedScores) {
    const count = frequency.get(score)!;
    airAtScore.set(score, {
      air_min: cumulative + 1,
      air_max: cumulative + count,
    });
    cumulative += count;
  }

  const categories = ["General", "OBC", "OBC-NCL", "SC", "ST", "EWS"] as const;
  const brackets: BracketRow[] = [];

  for (const category of categories) {
    const fraction = category === "General" ? null : catFractions[category as keyof typeof catFractions];

    for (let bandMax = 720; bandMax >= 0; bandMax -= BAND) {
      const bandMin = Math.max(0, bandMax - BAND + 1);
      let airMin: number | null = null;
      let airMax: number | null = null;

      // Walk the band from highest score down to pick AIR boundaries
      for (let s = bandMax; s >= bandMin; s--) {
        const entry = airAtScore.get(s);
        if (!entry) continue;
        if (airMin === null) airMin = entry.air_min;
        airMax = entry.air_max;
      }

      if (airMin === null || airMax === null) continue;

      const row: BracketRow = {
        category,
        score_min: bandMin,
        score_max: bandMax,
        air_min: airMin,
        air_max: airMax,
      };

      if (fraction !== null) {
        // Category rank ≈ AIR × fraction (candidates with same or better score in this category)
        row.cat_rank_min = Math.max(1, Math.round(airMin * fraction));
        row.cat_rank_max = Math.max(1, Math.round(airMax * fraction));
      }

      brackets.push(row);
    }
  }

  return brackets;
}

// ─── DB writes ─────────────────────────────────────────────────────────────

async function upsertRankBrackets(
  brackets: BracketRow[],
  year: number,
  sourceUrl: string | undefined,
  sourceDescription: string | undefined,
  totalCandidates?: number
) {
  const supabase = getSupabaseAdmin();

  // Delete existing brackets for this year before inserting fresh data
  const { error: deleteErr } = await supabase
    .from("score_rank_brackets")
    .delete()
    .eq("data_year", year);

  if (deleteErr) throw new Error(`Failed to clear old brackets: ${deleteErr.message}`);

  const rows = brackets.map((b) => ({
    category: b.category,
    score_min: b.score_min,
    score_max: b.score_max,
    air_min: b.air_min,
    air_max: b.air_max,
    cat_rank_min: b.cat_rank_min ?? null,
    cat_rank_max: b.cat_rank_max ?? null,
    data_year: year,
    source_url: sourceUrl ?? null,
    source_description: sourceDescription ?? null,
  }));

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from("score_rank_brackets")
      .insert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`Insert failed at offset ${i}: ${error.message}`);
  }

  const inferredTotalCandidates =
    totalCandidates ?? Math.max(...brackets.map((b) => b.air_max));

  const { error: statsError } = await supabase
    .from("neet_year_stats")
    .upsert({
      data_year: year,
      total_candidates: inferredTotalCandidates,
      source_url: sourceUrl ?? null,
      source_description: sourceDescription ?? null,
      updated_at: new Date().toISOString(),
    });

  if (statsError) {
    throw new Error(`Failed to upsert year stats: ${statsError.message}`);
  }

  return rows.length;
}

async function upsertCutoffs(
  cutoffs: z.infer<typeof CutoffSchema>[],
  year: number,
  sourceUrl: string | undefined
) {
  const supabase = getSupabaseAdmin();

  // Resolve college UUIDs from MCC college codes
  const codes = [...new Set(cutoffs.map((c) => c.mcc_college_code))];
  const { data: colleges, error: collegeErr } = await supabase
    .from("colleges")
    .select("id, mcc_college_code")
    .in("mcc_college_code", codes);

  if (collegeErr) throw new Error(`Failed to look up colleges: ${collegeErr.message}`);

  const codeToId = new Map<string, string>(
    (colleges ?? []).map((c) => [c.mcc_college_code, c.id])
  );

  const unmatchedCodes = codes.filter((c) => !codeToId.has(c));

  const rows = cutoffs
    .filter((c) => codeToId.has(c.mcc_college_code))
    .map((c) => ({
      college_id: codeToId.get(c.mcc_college_code)!,
      year,
      quota_type: c.quota_type,
      state: c.state ?? null,
      round: c.round,
      category: c.category,
      opening_rank: c.opening_rank ?? null,
      closing_rank: c.closing_rank,
      source_url: sourceUrl ?? null,
      confidence: c.confidence,
    }));

  if (rows.length === 0) {
    throw new Error(
      `No colleges matched. Unmatched MCC codes: ${unmatchedCodes.join(", ")}`
    );
  }

  // Upsert: replace existing rows for same college/year/quota/round/category
  const { error } = await supabase
    .from("cutoffs")
    .upsert(rows, {
      onConflict: "college_id,year,quota_type,round,category",
      ignoreDuplicates: false,
    });

  if (error) throw new Error(`Cutoff upsert failed: ${error.message}`);

  return { inserted: rows.length, skipped: unmatchedCodes };
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    // ── Type 1: Fetch NTA CSV and compute brackets ──────────────────────
    if (input.type === "rank_brackets_from_nta_csv") {
      const fractions = CategoryFractionsSchema.parse(input.category_fractions ?? {});

      const frequency = await buildFrequencyMapFromNTACSV(input.source_url);
      const totalCandidates = Array.from(frequency.values()).reduce((a, b) => a + b, 0);
      const brackets = computeBracketsFromFrequency(
        frequency,
        input.year,
        input.source_url,
        fractions
      );

      const inserted = await upsertRankBrackets(
        brackets,
        input.year,
        input.source_url,
        `NTA marks CSV — ${input.year}`,
        totalCandidates
      );

      return NextResponse.json({
        ok: true,
        type: input.type,
        year: input.year,
        source_url: input.source_url,
        total_candidates: totalCandidates,
        brackets_inserted: inserted,
        categories_covered: ["General", "OBC", "OBC-NCL", "SC", "ST", "EWS"],
      });
    }

    // ── Type 2: Direct bracket upload ──────────────────────────────────
    if (input.type === "rank_brackets") {
      const inserted = await upsertRankBrackets(
        input.brackets,
        input.year,
        input.source_url,
        input.source_description
      );

      return NextResponse.json({
        ok: true,
        type: input.type,
        year: input.year,
        brackets_inserted: inserted,
      });
    }

    // ── Type 3: College cutoff upload ──────────────────────────────────
    if (input.type === "cutoffs") {
      const result = await upsertCutoffs(input.cutoffs, input.year, input.source_url);

      return NextResponse.json({
        ok: true,
        type: input.type,
        year: input.year,
        cutoffs_inserted: result.inserted,
        unmatched_mcc_codes: result.skipped,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unhandled type" }, { status: 400 });
}
