"use client";

import { useState } from "react";
import type { AssessOutput } from "@/lib/types";
import { MCC_PORTAL_URL, STATE_DME_PORTALS } from "@/lib/constants";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props {
  output: AssessOutput;
}

const STORAGE_KEY_PREFIX = "neet_nav_action_";

export function ActionPlan({ output }: Props) {
  const storageKey = `${STORAGE_KEY_PREFIX}${output.assessment_id}`;
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(() => {
    try {
      if (typeof window === "undefined") return new Set();
      const stored = window.localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored) as number[]) : new Set();
    } catch {
      return new Set();
    }
  });

  function toggleStep(i: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const { round_strategy, action_plan, action_steps_fallback, state } = output;
  const stateDmeUrl = STATE_DME_PORTALS[state];

  // Parse LLM action plan into numbered steps
  const llmSteps = action_plan
    ? action_plan
        .split(/\n(?=\d+\.)/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5 && /^\d+\./.test(s))
    : null;

  const steps = llmSteps ?? action_steps_fallback;

  return (
    <div className="space-y-5 pb-6">
      {/* Progress indicator */}
      {checkedSteps.size > 0 && (
        <div className="bg-[#E8F4F7] rounded-xl px-4 py-3 text-sm text-[#0F5C6B] font-medium">
          {checkedSteps.size} of {steps.length} steps completed
        </div>
      )}

      {/* Action steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done = checkedSteps.has(i);
          // Strip leading "N." from LLM output
          const text = step.replace(/^\d+\.\s*/, "");

          return (
            <div
              key={i}
              className={`flex gap-3 bg-white border rounded-xl p-4 transition-colors ${
                done ? "border-[#2D7D46]/30 bg-[#2D7D46]/5" : "border-gray-100"
              }`}
            >
              <button
                onClick={() => toggleStep(i)}
                className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  done
                    ? "bg-[#2D7D46] border-[#2D7D46] text-white"
                    : "border-gray-300 hover:border-[#0F5C6B]"
                }`}
                aria-label={done ? "Mark incomplete" : "Mark complete"}
              >
                {done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#0F5C6B] bg-[#E8F4F7] px-2 py-0.5 rounded-full">
                    Step {i + 1}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                  {text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Round strategy card */}
      <Accordion multiple={false}>
        <AccordionItem value="strategy" className="border border-gray-100 rounded-xl bg-white">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-800 hover:no-underline">
            Round strategy for your score band
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div className="text-xs bg-[#E8F4F7] text-[#0F5C6B] rounded-lg p-2 font-medium">
              {round_strategy.score_band}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{round_strategy.strategy}</p>

            <div className="space-y-2">
              <div className="bg-[#2D7D46]/10 rounded-lg p-3">
                <p className="text-xs font-semibold text-[#2D7D46] mb-1">When to Freeze (Lock)</p>
                <p className="text-xs text-gray-700">{round_strategy.lock_guidance}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">When to Float</p>
                <p className="text-xs text-gray-700">{round_strategy.float_guidance}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">About Mop-up Round</p>
                <p className="text-xs text-gray-700">{round_strategy.mopup_guidance}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">What does Freeze / Float / Slide mean?</p>
              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                {round_strategy.freeze_float_slide_explanation}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Quick links */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">Official portals</p>
        <div className="space-y-2">
          <a
            href={MCC_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-sm text-[#0F5C6B] bg-[#E8F4F7] rounded-lg px-3 py-2"
          >
            <span>MCC AIQ Counselling Portal</span>
            <span></span>
          </a>
          {stateDmeUrl && (
            <a
              href={stateDmeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm text-[#0F5C6B] bg-[#E8F4F7] rounded-lg px-3 py-2"
            >
              <span>{state} State Counselling Portal</span>
              <span></span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
