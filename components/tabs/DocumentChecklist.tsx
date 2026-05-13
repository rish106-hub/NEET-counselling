"use client";

import { useState } from "react";
import type { AssessOutput, DocumentItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  output: AssessOutput;
}

const STORAGE_KEY_PREFIX = "neet_nav_docs_";

export function DocumentChecklist({ output }: Props) {
  const storageKey = `${STORAGE_KEY_PREFIX}${output.assessment_id}`;
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      if (typeof window === "undefined") return new Set();
      const stored = window.localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [filter, setFilter] = useState<"all" | "AIQ" | "STATE">("all");

  function toggleDoc(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const docs = output.document_checklist;
  const filtered =
    filter === "all"
      ? docs
      : docs.filter((d) => d.required_for === filter || d.required_for === "BOTH");

  const readyCount = docs.filter((d) => checked.has(d.id)).length;

  return (
    <div className="space-y-4 pb-6">
      {/* Progress */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Documents ready</span>
          <span className="font-bold text-[#0F5C6B]">
            {readyCount} / {docs.length}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-[#2D7D46] h-2 rounded-full transition-all"
            style={{ width: `${Math.round((readyCount / docs.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "AIQ", "STATE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filter === f
                ? "bg-[#0F5C6B] text-white border-[#0F5C6B]"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {f === "all" ? "All documents" : f === "AIQ" ? "AIQ only" : "State only"}
          </button>
        ))}
      </div>

      {/* Urgent first */}
      {filter === "all" && docs.filter((d) => d.procurement_days_estimate >= 7).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Start these immediately - they take time to obtain</p>
          <p className="text-xs text-amber-700">
            Documents below are sorted with the longest procurement time first.
          </p>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-2">
        {filtered.map((doc: DocumentItem) => {
          const done = checked.has(doc.id);
          return (
            <div
              key={doc.id}
              className={`bg-white border rounded-xl p-4 transition-colors ${
                done ? "border-[#2D7D46]/30 bg-[#2D7D46]/5" : "border-gray-100"
              }`}
            >
              <div className="flex gap-3 items-start">
                <button
                  onClick={() => toggleDoc(doc.id)}
                  className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    done
                      ? "bg-[#2D7D46] border-[#2D7D46] text-white"
                      : "border-gray-300"
                  }`}
                  aria-label={done ? "Mark not ready" : "Mark ready"}
                >
                  {done && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {doc.name}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      {doc.procurement_days_estimate >= 7 && (
                        <Badge variant="secondary" className="text-orange-600 bg-orange-50 text-[10px]">
                          {doc.procurement_days_estimate}d
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {doc.required_for}
                      </Badge>
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{doc.description}</p>
                  )}

                  {doc.format_required && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Format:</span> {doc.format_required}
                    </p>
                  )}

                  {doc.issuing_authority && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">From:</span> {doc.issuing_authority}
                    </p>
                  )}

                  {doc.state_specific_note && (
                    <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        <span className="font-semibold">{output.state} note:</span>{" "}
                        {doc.state_specific_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
