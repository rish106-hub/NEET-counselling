import { NextRequest, NextResponse } from "next/server";
import { getAssessmentOutput } from "@/lib/server/output";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  if (!uuid) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const output = await getAssessmentOutput(uuid);
  if (!output) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(output);
}
