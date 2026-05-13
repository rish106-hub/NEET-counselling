"use client";

import { useEffect, useState } from "react";
import type { AssessOutput } from "@/lib/types";
import { DataDisclaimer } from "@/components/DataDisclaimer";
import { OutputDashboard } from "@/components/OutputDashboard";
import Link from "next/link";

type Props = {
  uuid: string;
  initialOutput: AssessOutput | null;
};

const STORAGE_PREFIX = "neet_assessment_output_";

export function storeAssessmentOutput(output: AssessOutput) {
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${output.assessment_id}`,
      JSON.stringify(output)
    );
  } catch {
    return;
  }
}

export function ResultsClient({ uuid, initialOutput }: Props) {
  const [output, setOutput] = useState<AssessOutput | null>(initialOutput);
  const [loading, setLoading] = useState(!initialOutput);

  useEffect(() => {
    if (initialOutput) return;

    let cancelled = false;

    async function loadOutput() {
      try {
        const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${uuid}`);
        if (stored) {
          const parsed = JSON.parse(stored) as AssessOutput;
          if (!cancelled) setOutput(parsed);
          return;
        }

        const res = await fetch(`/api/output/${uuid}`);
        if (res.ok) {
          const data = (await res.json()) as AssessOutput;
          if (!cancelled) {
            setOutput(data);
            storeAssessmentOutput(data);
          }
        }
      } catch {
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOutput();
    return () => {
      cancelled = true;
    };
  }, [initialOutput, uuid]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold text-primary">Loading counselling plan</p>
          <p className="mt-2 text-sm text-muted-foreground">Checking your saved result.</p>
        </div>
      </main>
    );
  }

  if (!output) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <p className="text-5xl font-bold text-primary mb-4">404</p>
          <h1 className="text-xl font-semibold text-foreground mb-2">Result not found</h1>
          <p className="text-sm text-muted-foreground mb-8">
            This result link is unavailable. Generate a new counselling plan to continue.
          </p>
          <Link href="/assess" className="primary-link">
            Get new counselling plan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs opacity-75">Your counselling plan</span>
          <span className="font-semibold text-sm">
            Score {output.neet_score} | {output.category} | {output.state}
          </span>
        </div>
        <Link
          href="/assess"
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          Edit inputs
        </Link>
      </div>

      <DataDisclaimer dataVersion={output.data_version} generatedAt={output.generated_at} />
      <OutputDashboard output={output} />
    </main>
  );
}
