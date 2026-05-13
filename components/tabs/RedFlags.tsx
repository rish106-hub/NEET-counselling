import type { AssessOutput } from "@/lib/types";

interface Props {
  output: AssessOutput;
}

const FLAG_ICONS: Record<string, string> = {
  management_quota: "Critical",
  nri_quota: "Warning",
  capitation_fee: "Blocked",
  predatory_consultant: "Verify",
  bond_obligation: "Plan",
  private_fee_burden: "Fees",
};

export function RedFlags({ output }: Props) {
  const { red_flags } = output;

  if (red_flags.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No specific red flags for your profile. Stay alert during counselling.
      </div>
    );
  }

  const critical = red_flags.filter((f) => f.severity === "critical");
  const warnings = red_flags.filter((f) => f.severity === "warning");

  return (
    <div className="space-y-4 pb-6">
      <p className="text-sm text-gray-500">
        These warnings are specific to your score, category, and situation. Read before proceeding.
      </p>

      {critical.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#B32D2D] uppercase tracking-wide">Critical warnings</p>
          {critical.map((flag, i) => (
            <div key={i} className="border-l-4 border-[#B32D2D] bg-red-50 rounded-r-xl p-4">
              <div className="flex gap-2 items-center mb-2">
                <span>{FLAG_ICONS[flag.type] ?? "Critical"}</span>
                <p className="text-sm font-semibold text-red-800">{flag.headline}</p>
              </div>
              <p className="text-xs text-red-700 leading-relaxed">{flag.body}</p>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Warnings</p>
          {warnings.map((flag, i) => (
            <div key={i} className="border-l-4 border-amber-400 bg-amber-50 rounded-r-xl p-4">
              <div className="flex gap-2 items-center mb-2">
                <span>{FLAG_ICONS[flag.type] ?? "Warning"}</span>
                <p className="text-sm font-semibold text-amber-800">{flag.headline}</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">{flag.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* General safety reminder */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">General rule: when in doubt, verify</p>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside leading-relaxed">
          <li>All seat allotments happen only through official MCC or state DME portals</li>
          <li>No one can &quot;arrange&quot; a government merit seat outside this process</li>
          <li>Never pay anyone cash before a seat is officially allotted to you</li>
          <li>If something feels wrong, call the MCC helpline: 1800-116-001</li>
        </ul>
      </div>
    </div>
  );
}
