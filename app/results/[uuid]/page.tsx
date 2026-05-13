import type { Metadata } from "next";
import { getAssessmentOutput } from "@/lib/server/output";
import { ResultsClient } from "@/components/ResultsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): Promise<Metadata> {
  const { uuid } = await params;
  const output = await getAssessmentOutput(uuid);
  if (!output) {
    return {
      title: "Counselling Plan | NEET Counselling Navigator",
    };
  }
  return {
    title: `NEET ${output.neet_score} (${output.category}) Counselling Plan | NEET Counselling Navigator`,
    description: `Personalised counselling guidance for NEET score ${output.neet_score}, ${output.category} category, ${output.state}. Free, accurate, no paywall.`,
  };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const output = await getAssessmentOutput(uuid);

  return <ResultsClient uuid={uuid} initialOutput={output} />;
}
