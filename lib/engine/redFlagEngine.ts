import type { RedFlag, CollegeWithCutoff, BudgetPreference } from "@/lib/types";

export function getRedFlags(
  score: number,
  colleges: CollegeWithCutoff[],
  budgetPreference: BudgetPreference
): RedFlag[] {
  const flags: RedFlag[] = [];

  // Predatory consultant warning - universal but amplified in mid-score range
  flags.push({
    type: "predatory_consultant",
    severity: "warning",
    headline: "Watch out for paid counselling consultants",
    body: `Private counselling consultants charge INR 50,000 to INR 2,00,000 for services this tool provides free. Many are unregulated and some are scams. If someone approaches you offering a "guaranteed seat" for a fee - that is illegal. Legitimate admission is always through the official MCC portal (mcc.nic.in) or your state's DME portal. Never pay anyone to "arrange" a government seat.`,
  });

  // Management quota warning - if user is looking at private colleges or score is in range where it gets pushed
  const hasPrivateColleges = colleges.some(
    (c) => c.type === "private" || c.type === "deemed"
  );
  if (
    hasPrivateColleges ||
    budgetPreference !== "government_only" ||
    score < 480
  ) {
    flags.push({
      type: "management_quota",
      severity: "critical",
      headline: "Management Quota seats cost INR 50-80 lakh - know what you are signing up for",
      body: `Management Quota (MQ) seats are filled by the college directly, outside the official counselling process. They cost INR 50-80 lakh over 5 years (sometimes more). This is legal, but very different from a merit seat. Red flags: being asked to pay a lump sum upfront, being told to skip the MCC counselling process, or being offered a "shortcut" to a specific college. Always complete the official NEET counselling rounds before considering management quota. Never pay capitation (unofficial extra fee) - it is illegal.`,
    });
  }

  // NRI quota warning
  if (score < 600) {
    flags.push({
      type: "nri_quota",
      severity: "warning",
      headline: "NRI Quota is expensive and has strict eligibility",
      body: `NRI Quota seats are reserved for Non-Resident Indians or their relatives. They cost INR 25-50 lakh per year or equivalent in USD. You are eligible only if a close NRI relative is sponsoring you - and the eligibility criteria are strict and verified. If someone is offering you an NRI quota seat without a genuine NRI sponsor, it is likely fraudulent. Do not pursue this unless you have a legitimate NRI sponsor relationship.`,
    });
  }

  // Bond obligation - flag if colleges with bond requirement are on the list
  const bondColleges = colleges.filter((c) => c.bond_required);
  if (bondColleges.length > 0) {
    const examples = bondColleges
      .slice(0, 3)
      .map((c) => c.short_name || c.name)
      .join(", ");
    flags.push({
      type: "bond_obligation",
      severity: "warning",
      headline: `Some colleges on your list require rural service bonds`,
      body: `Colleges like ${examples} require graduates to serve in government/rural health facilities for 1-2 years after completing MBBS before receiving their degree certificate or NMC registration. This is a legal requirement and cannot be waived. Factor this into your college choice if you have specific postgraduate plans. Bond period salary is typically INR 25,000-INR 50,000/month.`,
    });
  }

  // Private fee burden warning for students who might not fully grasp the cost
  if (
    budgetPreference === "private_under_25l" ||
    budgetPreference === "all" ||
    (score < 450 && budgetPreference !== "government_only")
  ) {
    flags.push({
      type: "private_fee_burden",
      severity: "warning",
      headline: "Private MBBS fees: understand the full cost before deciding",
      body: `Private MBBS fees range from INR 5 lakh to INR 25 lakh per year - meaning INR 25 lakh to INR 1.25 crore for the full 5.5-year course. Many families take education loans at 10-12% interest. Calculate the total cost including interest before committing. A private MBBS is not necessarily better than a government MBBS at a lower-ranked college - the NMC license you get is identical. Weigh cost vs location vs college rank carefully.`,
    });
  }

  return flags;
}
