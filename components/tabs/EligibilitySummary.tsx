"use client";

import type { AssessOutput } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { MCC_PORTAL_URL, STATE_DME_PORTALS } from "@/lib/constants";

interface Props {
  output: AssessOutput;
}

export function EligibilitySummary({ output }: Props) {
  const { rank_estimate, neet_score, category, state, colleges_aiq, colleges_state } = output;
  const stateDmeUrl = STATE_DME_PORTALS[state];

  const safeAiq = colleges_aiq.filter((c) => c.safety_tag === "safe").length;
  const moderateAiq = colleges_aiq.filter((c) => c.safety_tag === "moderate").length;
  const safeState = colleges_state.filter((c) => c.safety_tag === "safe").length;

  return (
    <div className="space-y-4 pb-6">
      {/* Score card */}
      <div className="bg-[#0F5C6B] text-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-teal-200 text-xs mb-1">NEET Score</p>
            <p className="text-4xl font-bold font-mono">{neet_score}</p>
            <p className="text-teal-200 text-xs">out of 720</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-0 text-xs mb-2">{category}</Badge>
            <p className="text-teal-200 text-xs">{state}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-teal-200 text-xs mb-1">Estimated AIR</p>
            <p className="text-white font-semibold font-mono text-sm">
              {rank_estimate.airMin.toLocaleString("en-IN")} - {rank_estimate.airMax.toLocaleString("en-IN")}
            </p>
          </div>
          {rank_estimate.hasCategoryRank && rank_estimate.categoryRankMin && (
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-teal-200 text-xs mb-1">{category} Category Rank</p>
              <p className="text-white font-semibold font-mono text-sm">
                {rank_estimate.categoryRankMin.toLocaleString("en-IN")} - {rank_estimate.categoryRankMax?.toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
        <p className="text-teal-200 text-xs mt-3">
          AIR is an estimate based on NEET 2021-2025 data. Actual rank depends on this year&apos;s score distribution.
        </p>
      </div>

      {/* Eligibility summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">AIQ Colleges (All India)</p>
          <p className="text-2xl font-bold text-[#0F5C6B]">{colleges_aiq.length}</p>
          <p className="text-xs text-gray-500">
            {safeAiq} safe | {moderateAiq} moderate
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">{state} State Quota</p>
          <p className="text-2xl font-bold text-[#0F5C6B]">{colleges_state.length}</p>
          <p className="text-xs text-gray-500">{safeState} safe</p>
        </div>
      </div>

      {/* Key actions */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">Two things to do right now</p>

        <div className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0F5C6B] text-white text-xs flex items-center justify-center font-bold">1</span>
          <div>
            <p className="text-sm text-gray-700 font-medium">Register on MCC portal (AIQ counselling)</p>
            <a
              href={MCC_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0F5C6B] underline"
            >
              {MCC_PORTAL_URL} 
            </a>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0F5C6B] text-white text-xs flex items-center justify-center font-bold">2</span>
          <div>
            <p className="text-sm text-gray-700 font-medium">Register on {state} state DME portal (state quota)</p>
            {stateDmeUrl ? (
              <a
                href={stateDmeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0F5C6B] underline"
              >
                {stateDmeUrl} 
              </a>
            ) : (
              <p className="text-xs text-gray-500">Search &quot;{state} DME MBBS counselling 2026&quot; for the official portal</p>
            )}
          </div>
        </div>
      </div>

      {/* AIQ vs State explanation */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">AIQ vs State Quota - what&apos;s the difference?</p>
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-medium">AIQ (All India Quota)</span> covers 15% of government seats in all states - managed by MCC at mcc.nic.in. Any student from any state can apply.<br /><br />
          <span className="font-medium">State Quota</span> covers 85% of government seats in your home state - managed by {state}&apos;s DME portal. Only {state} residents are eligible.<br /><br />
          <span className="font-medium">You must register for both separately.</span> Missing state registration means losing access to 85% of available government seats.
        </p>
      </div>
    </div>
  );
}
