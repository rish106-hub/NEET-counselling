import type { Category, DocumentItem } from "@/lib/types";

interface RawDocument {
  name: string;
  description: string;
  required_for: "AIQ" | "STATE" | "BOTH";
  categories: string[];
  format_required: string;
  issuing_authority: string;
  procurement_days_estimate: number;
  state_notes?: Record<string, string>;
}

const BASE_DOCUMENTS: RawDocument[] = [
  {
    name: "NEET UG Admit Card",
    description: "Your original NEET UG exam admit card",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 2 photocopies",
    issuing_authority: "NTA (downloaded from neet.nta.nic.in)",
    procurement_days_estimate: 0,
  },
  {
    name: "NEET UG Score Card / Rank Letter",
    description: "Official NEET UG result/rank letter issued by NTA",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 2 photocopies",
    issuing_authority: "NTA (downloaded from neet.nta.nic.in)",
    procurement_days_estimate: 0,
  },
  {
    name: "Class 10 Mark Sheet",
    description: "Board exam mark sheet showing date of birth",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Your school / state board",
    procurement_days_estimate: 0,
  },
  {
    name: "Class 10 Certificate (Birth Date Proof)",
    description: "School leaving certificate or matriculation certificate confirming date of birth",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Your school",
    procurement_days_estimate: 3,
  },
  {
    name: "Class 12 Mark Sheet",
    description: "Board exam mark sheet showing Physics, Chemistry, Biology marks (must show 50%+ for General, 40%+ for SC/ST/OBC/PwD)",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Your state/central board",
    procurement_days_estimate: 0,
  },
  {
    name: "Class 12 Passing Certificate",
    description: "Certificate confirming Class 12 pass",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Your state/central board",
    procurement_days_estimate: 0,
  },
  {
    name: "Passport-size Photographs",
    description: "Recent passport-size photographs (white background, as per MCC specification)",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "10-12 copies (recent, same as NEET form photo if possible)",
    issuing_authority: "Studio",
    procurement_days_estimate: 0,
  },
  {
    name: "Photo ID Proof",
    description: "Government-issued photo ID (Aadhaar Card preferred)",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Original + 3 photocopies",
    issuing_authority: "Government (Aadhaar, PAN, Voter ID, Passport)",
    procurement_days_estimate: 0,
  },
  {
    name: "Proof of Domicile / Residence Certificate",
    description: "Certificate proving residence in your state - required for state quota eligibility",
    required_for: "STATE",
    categories: ["ALL"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Tehsildar / SDM / Local authority of your state",
    procurement_days_estimate: 7,
    state_notes: {
      "Maharashtra": "Domicile certificate must be issued by Revenue Authority. 15 years of continuous residence required for state quota.",
      "Karnataka": "Study certificate from Classes 1-12 in Karnataka is the primary domicile proof. Domicile certificate alone may not suffice.",
      "Uttar Pradesh": "Domicile certificate issued by DM/ADM/Tehsildar. Family must have resided in UP for minimum 5 years.",
    },
  },
  {
    name: "Income Certificate",
    description: "Family annual income certificate - required for EWS and OBC-NCL categories",
    required_for: "BOTH",
    categories: ["EWS", "OBC-NCL", "OBC"],
    format_required: "Original - must be issued in current financial year (not older than 1 year)",
    issuing_authority: "Tehsildar / SDM / Revenue Authority",
    procurement_days_estimate: 10,
    state_notes: {
      "Bihar": "Income certificate issued by CO/DCO/SDO. Must be on government letterhead with seal.",
      "Rajasthan": "Income EWS certificate from Tehsildar, must mention that family does not own over 5 acres agricultural land.",
    },
  },
  {
    name: "OBC Non-Creamy Layer (NCL) Certificate",
    description: "Certificate confirming OBC-NCL status - mandatory for OBC AIQ seats. Central govt-issued only for AIQ (state-issued for state quota).",
    required_for: "AIQ",
    categories: ["OBC", "OBC-NCL"],
    format_required: "Original - must be in Central Government format. State format NOT valid for AIQ.",
    issuing_authority: "SDM / District Magistrate - must specifically say 'Non-Creamy Layer'",
    procurement_days_estimate: 14,
    state_notes: {
      "general": "For AIQ counselling, OBC certificate must be in the central government format. A state-format OBC certificate is NOT accepted for AIQ. Get the correct central-format certificate early.",
    },
  },
  {
    name: "Scheduled Caste (SC) Certificate",
    description: "Caste certificate confirming SC status",
    required_for: "BOTH",
    categories: ["SC"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Tehsildar / District Social Welfare Officer",
    procurement_days_estimate: 7,
  },
  {
    name: "Scheduled Tribe (ST) Certificate",
    description: "Caste certificate confirming ST status",
    required_for: "BOTH",
    categories: ["ST"],
    format_required: "Original + 3 attested photocopies",
    issuing_authority: "Tehsildar / District Collector",
    procurement_days_estimate: 7,
  },
  {
    name: "EWS Certificate",
    description: "Economically Weaker Section certificate - income below INR 8 lakh per year, no land over 5 acres",
    required_for: "BOTH",
    categories: ["EWS"],
    format_required: "Original - must be issued in CURRENT financial year (April onwards). Old EWS certificates are rejected.",
    issuing_authority: "Tehsildar / SDM",
    procurement_days_estimate: 14,
  },
  {
    name: "PwD Certificate (Disability Certificate)",
    description: "Certificate from a government hospital or UDID card confirming disability category and percentage",
    required_for: "BOTH",
    categories: ["PwD-General", "PwD-OBC", "PwD-SC", "PwD-ST"],
    format_required: "Original UDID card or certificate from specified medical authority",
    issuing_authority: "Government Medical Board / UDID Portal",
    procurement_days_estimate: 21,
  },
  {
    name: "MCC Registration Confirmation / Payment Receipt",
    description: "Proof of MCC AIQ counselling registration and fee payment",
    required_for: "AIQ",
    categories: ["ALL"],
    format_required: "Printed copy",
    issuing_authority: "mcc.nic.in (after registration)",
    procurement_days_estimate: 0,
  },
  {
    name: "Seat Allotment Letter",
    description: "Official seat allotment letter from MCC or state DME - required at college reporting",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Printed original",
    issuing_authority: "MCC (mcc.nic.in) or State DME portal",
    procurement_days_estimate: 0,
  },
  {
    name: "Migration Certificate (if applicable)",
    description: "Required if shifting from one state board to another or from one institution to another",
    required_for: "STATE",
    categories: ["ALL"],
    format_required: "Original",
    issuing_authority: "Your Class 12 institution / board",
    procurement_days_estimate: 14,
  },
  {
    name: "Gap Year Affidavit (if applicable)",
    description: "Self-declaration affidavit on INR 10 stamp paper if there is a gap between Class 12 and NEET attempt",
    required_for: "BOTH",
    categories: ["ALL"],
    format_required: "Notarized affidavit on INR 10 stamp paper",
    issuing_authority: "Local Notary",
    procurement_days_estimate: 1,
  },
];

function categoryMatchesDocument(category: Category, docCategories: string[]): boolean {
  if (docCategories.includes("ALL")) return true;
  // Handle PwD categories
  if (category === "PwD-General" && docCategories.includes("PwD-General")) return true;
  if (category === "PwD-OBC" && docCategories.includes("PwD-OBC")) return true;
  if (category === "PwD-SC" && docCategories.includes("PwD-SC")) return true;
  if (category === "PwD-ST" && docCategories.includes("PwD-ST")) return true;
  return docCategories.includes(category);
}

export function getDocumentChecklist(category: Category, state: string): DocumentItem[] {
  const items: DocumentItem[] = [];

  BASE_DOCUMENTS.forEach((doc, index) => {
    if (!categoryMatchesDocument(category, doc.categories)) return;

    const stateNote =
      doc.state_notes?.[state] ?? doc.state_notes?.["general"] ?? null;

    items.push({
      id: `doc_${index}`,
      name: doc.name,
      description: doc.description,
      required_for: doc.required_for,
      format_required: doc.format_required,
      issuing_authority: doc.issuing_authority,
      procurement_days_estimate: doc.procurement_days_estimate,
      state_specific_note: stateNote,
    });
  });

  return items.sort((a, b) => {
    // Sort: longest procurement time first (urgency)
    return b.procurement_days_estimate - a.procurement_days_estimate;
  });
}
