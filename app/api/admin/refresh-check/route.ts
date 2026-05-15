/**
 * GET /api/admin/refresh-check
 *
 * Vercel cron endpoint (runs 06:00 UTC on 1 June each year — after NTA typically
 * declares results in May). Checks whether the NTA_MARKS_CSV_URL env var is set
 * and whether score_rank_brackets already has data for the current year.
 * If not, triggers an ingestion using the configured URL and default category
 * fractions derived from NTA's published category-wise statistics.
 *
 * Cron schedule: 0 6 1 6 * (June 1st, 06:00 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";

const CURRENT_YEAR = new Date().getFullYear();

// Category fractions from NTA NEET UG 2024 official press release (04 Jun 2024).
// Based on "Number of Candidates Present" (appeared) by category:
//   OBC: 1,026,388 / 2,333,297 = 0.440
//   SC:    344,327 / 2,333,297 = 0.148
//   ST:    150,181 / 2,333,297 = 0.064
//   EWS:   186,924 / 2,333,297 = 0.080
// Update after each year's press release if distribution shifts.
const DEFAULT_CAT_FRACTIONS = {
  SC: 0.148,
  ST: 0.064,
  OBC: 0.440,
  "OBC-NCL": 0.440,
  EWS: 0.080,
};

export async function GET(req: NextRequest) {
  // Vercel cron requests come with a specific header; validate it.
  const cronSecret = req.headers.get("x-vercel-cron-key");
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ntaUrl = process.env.NTA_MARKS_CSV_URL;

  if (!ntaUrl) {
    return NextResponse.json({
      ok: false,
      reason: "NTA_MARKS_CSV_URL not set. Set it in Vercel environment variables "
        + "after NTA publishes the marks CSV, then this cron will auto-ingest.",
    });
  }

  // Check if current year data already exists
  try {
    const supabase = getSupabaseAdmin();
    const { count } = await supabase
      .from("score_rank_brackets")
      .select("id", { count: "exact", head: true })
      .eq("data_year", CURRENT_YEAR);

    if ((count ?? 0) > 0) {
      return NextResponse.json({
        ok: true,
        reason: `score_rank_brackets already has ${count} rows for ${CURRENT_YEAR}. No action needed.`,
      });
    }
  } catch {
    // Supabase unreachable — skip
  }

  // Trigger ingestion
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get("host")}`;
  const ingestUrl = `${baseUrl}/api/admin/ingest`;

  const ingestRes = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ADMIN_INGEST_SECRET}`,
    },
    body: JSON.stringify({
      type: "rank_brackets_from_nta_csv",
      year: CURRENT_YEAR,
      source_url: ntaUrl,
      category_fractions: DEFAULT_CAT_FRACTIONS,
    }),
  });

  const result = await ingestRes.json();

  return NextResponse.json({
    ok: ingestRes.ok,
    triggered_ingest: true,
    year: CURRENT_YEAR,
    source_url: ntaUrl,
    ingest_result: result,
  }, { status: ingestRes.ok ? 200 : 500 });
}
