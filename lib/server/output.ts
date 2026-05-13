import type { AssessOutput } from "@/lib/types";
import { getCachedOutput } from "@/lib/cache/redis";
import { getSupabaseAdmin } from "@/lib/db/supabase";

const OUTPUT_TTL_DAYS = 90;

export async function getAssessmentOutput(uuid: string): Promise<AssessOutput | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
    return null;
  }

  const cached = await getCachedOutput(uuid);
  if (cached) {
    return cached as AssessOutput;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("output_cache")
      .select("payload")
      .eq("id", uuid)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.payload as AssessOutput;
  } catch {
    return null;
  }
}

export async function persistAssessmentOutput(
  uuid: string,
  payload: AssessOutput
): Promise<void> {
  const expiresAt = new Date(Date.now() + OUTPUT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("output_cache").upsert({
      id: uuid,
      payload,
      expires_at: expiresAt,
    });
  } catch {
    // Redis remains the primary transient path in local setups without Supabase.
  }
}
