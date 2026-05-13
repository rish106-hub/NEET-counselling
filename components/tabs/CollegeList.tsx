"use client";

import { useState } from "react";
import type { AssessOutput, CollegeWithCutoff, SafetyTag } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  output: AssessOutput;
}

const SAFETY_STYLES: Record<SafetyTag, { bg: string; text: string; label: string }> = {
  safe: { bg: "bg-[#2D7D46]/10", text: "text-[#2D7D46]", label: "Safe" },
  moderate: { bg: "bg-[#D4700A]/10", text: "text-[#D4700A]", label: "Moderate" },
  reach: { bg: "bg-[#B32D2D]/10", text: "text-[#B32D2D]", label: "Reach" },
  data_unavailable: { bg: "bg-gray-100", text: "text-gray-500", label: "Data N/A" },
};

function CollegeCard({ college }: { college: CollegeWithCutoff }) {
  const s = SAFETY_STYLES[college.safety_tag];
  const fee = college.annual_fee_govt
    ? `INR ${(college.annual_fee_govt / 1000).toFixed(0)}K/yr`
    : "Fee N/A";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{college.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {college.city || college.district}, {college.state}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
          {s.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary" className="capitalize">
          {college.type}
        </Badge>
        <Badge variant="secondary">{college.quota_type}</Badge>
        {college.bond_required && (
          <Badge variant="secondary" className="text-orange-600 bg-orange-50">
            Bond {college.bond_duration_years}yr
          </Badge>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {college.prev_year_closing_rank
            ? `Prev closing rank: ${college.prev_year_closing_rank.toLocaleString("en-IN")}`
            : "Cutoff data unavailable"}
        </span>
        <span className="font-medium text-gray-700">{fee}</span>
      </div>

      {college.nirf_rank && (
        <p className="text-xs text-gray-400">NIRF #{college.nirf_rank}</p>
      )}
    </div>
  );
}

export function CollegeList({ output }: Props) {
  const [activeQuota, setActiveQuota] = useState<"aiq" | "state">("aiq");
  const [safetyFilter, setSafetyFilter] = useState<SafetyTag | "all">("all");

  const colleges = activeQuota === "aiq" ? output.colleges_aiq : output.colleges_state;
  const filtered =
    safetyFilter === "all"
      ? colleges
      : colleges.filter((c) => c.safety_tag === safetyFilter);

  return (
    <div className="space-y-4 pb-6">
      {/* Quota toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveQuota("aiq")}
          className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
            activeQuota === "aiq"
              ? "bg-[#0F5C6B] text-white border-[#0F5C6B]"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          All India Quota ({output.colleges_aiq.length})
        </button>
        <button
          onClick={() => setActiveQuota("state")}
          className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
            activeQuota === "state"
              ? "bg-[#0F5C6B] text-white border-[#0F5C6B]"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          {output.state} Quota ({output.colleges_state.length})
        </button>
      </div>

      {/* Safety filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(["all", "safe", "moderate", "reach"] as const).map((tag) => (
          <button
            key={tag}
            onClick={() => setSafetyFilter(tag)}
            className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
              safetyFilter === tag
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {tag === "all" ? "All" : SAFETY_STYLES[tag].label}
            {tag !== "all" && (
              <span className="ml-1 opacity-70">
                ({colleges.filter((c) => c.safety_tag === tag).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No colleges match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((college) => (
            <CollegeCard key={`${college.id}-${college.quota_type}`} college={college} />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Safe = your estimated rank is comfortably within previous year&apos;s cutoff. Moderate = close to cutoff. Reach = rank likely above cutoff but worth filling.
      </p>
    </div>
  );
}
