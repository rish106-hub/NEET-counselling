import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How NEET Counselling Works | Complete Guide",
  description:
    "Complete guide to NEET UG counselling: AIQ vs state quota, MCC rounds, freeze/float/slide explained. Free, no paywall.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="px-4 py-10 max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-primary mb-6 block">Back to home</Link>

      <h1 className="text-2xl font-bold text-primary mb-2">
        How NEET Counselling Works
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        A complete, honest guide for NEET UG 2026 students.
      </p>

      <div className="prose prose-sm max-w-none space-y-6">
        <Section title="The Two-Track System">
          <p>
            After NEET results, you must navigate two parallel counselling tracks simultaneously:
          </p>
          <ul className="space-y-2 mt-3">
            <li className="flex gap-2">
              <span className="font-semibold text-primary shrink-0">AIQ:</span>
              <span>All India Quota covers 15% of government seats in all states. Managed by MCC at mcc.nic.in. Open to all students regardless of home state.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary shrink-0">State Quota:</span>
              <span>85% of government seats reserved for home state residents. Managed by each state&apos;s DME portal. You must be a domicile resident.</span>
            </li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 dark:bg-amber-400/15 dark:border-amber-300/20 rounded-lg p-4 mt-3">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-100">Critical: Register for both, independently</p>
            <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
              Missing state registration = losing access to 85% of government seats. Both registrations have separate windows, separate fees, and separate portals.
            </p>
          </div>
        </Section>

        <Section title="MCC AIQ Counselling Rounds">
          <ol className="space-y-3">
            {AIQ_ROUNDS.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Freeze, Float, and Slide Explained">
          <p className="text-sm text-muted-foreground mb-3">When you receive a seat, you choose one of:</p>
          {OPTIONS.map((o) => (
            <div key={o.name} className="border border-border bg-card rounded-lg p-4 mb-3">
              <p className="text-sm font-bold text-card-foreground">{o.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{o.desc}</p>
            </div>
          ))}
        </Section>

        <Section title="The Document Trap">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Thousands of students lose allotted seats every year because they cannot produce documents at the time of reporting. The most common culprits:
          </p>
          <ul className="mt-3 space-y-2">
            {DOC_TRAPS.map((t, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-red-700 dark:text-red-300 font-bold shrink-0">x</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Start gathering documents <strong>before</strong> counselling registration opens, not after.
          </p>
        </Section>

        <div className="pt-4">
          <Link href="/assess">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base rounded-lg">
              Get my personalised plan
            </Button>
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-3 border-l-4 border-primary pl-3">
        {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

const AIQ_ROUNDS = [
  {
    name: "Round 1",
    desc: "Main round. Most seats allotted here. Registration, choice filling, and seat allotment all happen in quick succession. Choose Float unless you are completely certain about your seat.",
  },
  {
    name: "Round 2",
    desc: "Second chance. Students who floated in Round 1 are reconsidered. New vacancies from students who withdrew. Often better options for mid-range scores.",
  },
  {
    name: "Mop-up Round",
    desc: "After Round 2. Fewer seats, shorter windows. Students with no seat or unsatisfactory seat can participate. Worth checking if you don't have a government seat after Round 2.",
  },
  {
    name: "Stray Vacancy Round",
    desc: "Final round for remaining vacant seats. Very limited seats, very short window, sometimes 24 to 48 hours. Check MCC notifications closely.",
  },
];

const OPTIONS = [
  {
    name: "Freeze",
    desc: "You accept this seat permanently and will not be reconsidered for any better seat in future rounds. Choose this only if you are completely satisfied with the seat you have.",
  },
  {
    name: "Float (Recommended in most cases)",
    desc: "You keep your current seat but are also considered for a better seat in the next round. If a better option appears, you automatically get it. If not, you keep your current seat. You lose nothing by floating. It is almost always the right choice in Round 1.",
  },
  {
    name: "Slide (Upgrade)",
    desc: "You want to retain your current college but move to a better branch within it. Rarely relevant for MBBS (most colleges have a single MBBS program). More relevant for BDS or AYUSH.",
  },
];

const DOC_TRAPS = [
  "OBC-NCL certificate in state format (AIQ requires central government format)",
  "EWS certificate from previous financial year (must be issued after April 1 of current year)",
  "Domicile certificate not in prescribed format for the specific state",
  "Caste certificate not from the correct issuing authority",
  "Class 12 mark sheet showing PCB subjects not clearly",
  "Gap year affidavit missing when there was a gap between Class 12 and NEET attempt",
];
