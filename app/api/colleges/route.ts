import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import collegesSeedData from "@/scripts/seed/colleges_seed.json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stateParam = searchParams.get("state");
  const typeParam = searchParams.get("type");
  const feeParam = searchParams.get("max_fee");
  const state = stateParam && stateParam.length <= 100 ? stateParam : null;
  const collegeType =
    typeParam && ["government", "private", "deemed", "central", "ayush"].includes(typeParam)
      ? typeParam
      : null;
  const maxFee = feeParam ? Number.parseInt(feeParam, 10) : null;

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("colleges")
      .select("*")
      .order("nirf_rank", { ascending: true, nullsFirst: false });

    if (state) query = query.eq("state", state);
    if (collegeType) query = query.eq("type", collegeType);
    // Match on either fee field: govt colleges use annual_fee_govt, private use annual_fee_mgmt.
    // OR lets either field satisfy the cap; null fees pass through (unknown = include).
    if (maxFee && maxFee > 0) {
      query = query.or(`annual_fee_govt.lte.${maxFee},annual_fee_mgmt.lte.${maxFee}`);
    }

    const { data, error } = await query.limit(100);

    if (error || !data || data.length === 0) {
      // Fallback to seed data
      let filtered = collegesSeedData as typeof collegesSeedData;
      if (state) {
        filtered = filtered.filter(
          (c) => c.state.toLowerCase() === state.toLowerCase()
        );
      }
      if (collegeType) {
        filtered = filtered.filter((c) => c.type === collegeType);
      }
      return NextResponse.json({ colleges: filtered, source: "seed" });
    }

    return NextResponse.json({ colleges: data, source: "db" });
  } catch {
    return NextResponse.json({ colleges: collegesSeedData, source: "seed" });
  }
}
