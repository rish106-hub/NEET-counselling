import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OutputDashboard } from "@/components/OutputDashboard";
import { DataDisclaimer } from "@/components/DataDisclaimer";
import { getAssessmentOutput } from "@/lib/server/output";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): Promise<Metadata> {
  const { uuid } = await params;
  const output = await getAssessmentOutput(uuid);
  if (!output) return {};
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
  if (!output) notFound();

  return (
    <main className="min-h-screen">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-[#0F5C6B] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs text-teal-200">Your counselling plan</span>
          <span className="font-semibold text-sm">
            Score {output.neet_score} | {output.category} | {output.state}
          </span>
        </div>
        <a
          href="/assess"
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          Edit inputs
        </a>
      </div>

      <DataDisclaimer dataVersion={output.data_version} generatedAt={output.generated_at} />

      <OutputDashboard output={output} />
    </main>
  );
}
