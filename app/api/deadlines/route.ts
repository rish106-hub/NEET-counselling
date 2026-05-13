import { NextRequest, NextResponse } from "next/server";
import { getDeadlines } from "@/lib/server/deadlines";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stateFilter = searchParams.get("state");
  const trackFilter = searchParams.get("track");
  const state = stateFilter && stateFilter.length <= 100 ? stateFilter : null;
  const track = trackFilter && ["AIQ", "STATE", "BOTH"].includes(trackFilter) ? trackFilter : null;

  const result = await getDeadlines({ state, track });
  return NextResponse.json(result, { status: 200 });
}
