"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComponentType } from "react";
import type { AssessOutput } from "@/lib/types";
import { EligibilitySummary } from "@/components/tabs/EligibilitySummary";
import { CollegeList } from "@/components/tabs/CollegeList";
import { ActionPlan } from "@/components/tabs/ActionPlan";
import { RedFlags } from "@/components/tabs/RedFlags";
import { DocumentChecklist } from "@/components/tabs/DocumentChecklist";
import { WhatsAppShare } from "@/components/WhatsAppShare";
import { ClipboardList, FileText, GraduationCap, ShieldAlert, Target } from "lucide-react";

interface Props {
  output: AssessOutput;
}

const TABS = [
  { value: "eligibility", label: "Summary", shortLabel: "Summary" },
  { value: "colleges", label: "Colleges", shortLabel: "Colleges" },
  { value: "plan", label: "Action Plan", shortLabel: "Plan" },
  { value: "warnings", label: "Red Flags", shortLabel: "Flags" },
  { value: "documents", label: "Documents", shortLabel: "Docs" },
];

export function OutputDashboard({ output }: Props) {
  return (
    <div className="pb-24 sm:pb-8">
      <Tabs defaultValue="eligibility" className="w-full">
        {/* Desktop: top tabs */}
        <div className="hidden sm:block border-b border-border bg-card px-4 sticky top-[57px] z-10">
          <TabsList className="h-auto gap-0 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-3 text-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab content */}
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <TabsContent value="eligibility">
            <EligibilitySummary output={output} />
          </TabsContent>
          <TabsContent value="colleges">
            <CollegeList output={output} />
          </TabsContent>
          <TabsContent value="plan">
            <ActionPlan output={output} />
          </TabsContent>
          <TabsContent value="warnings">
            <RedFlags output={output} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentChecklist output={output} />
          </TabsContent>
        </div>

        {/* Mobile: bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-card border-t border-border z-20">
          <TabsList className="grid grid-cols-5 h-14 bg-transparent p-0 gap-0 w-full rounded-none">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex flex-col gap-0.5 rounded-none h-full text-[10px] data-[state=active]:text-primary data-[state=active]:bg-primary/10"
              >
                <TabIcon value={t.value} />
                {t.shortLabel}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* WhatsApp share - sticky on mobile */}
      <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-30">
        <WhatsAppShare output={output} />
      </div>
    </div>
  );
}

function TabIcon({ value }: { value: string }) {
  const icons: Record<string, ComponentType<{ className?: string }>> = {
    eligibility: Target,
    colleges: GraduationCap,
    plan: ClipboardList,
    warnings: ShieldAlert,
    documents: FileText,
  };
  const Icon = icons[value] ?? Target;
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}
