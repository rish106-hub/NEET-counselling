export const CATEGORIES = [
  { value: "General", label: "General" },
  { value: "OBC", label: "OBC (Other Backward Class)" },
  { value: "OBC-NCL", label: "OBC-NCL (Non-Creamy Layer)" },
  { value: "SC", label: "SC (Scheduled Caste)" },
  { value: "ST", label: "ST (Scheduled Tribe)" },
  { value: "EWS", label: "EWS (Economically Weaker Section)" },
  { value: "PwD-General", label: "PwD - General" },
  { value: "PwD-OBC", label: "PwD - OBC" },
  { value: "PwD-SC", label: "PwD - SC" },
  { value: "PwD-ST", label: "PwD - ST" },
] as const;

export const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Chandigarh",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
] as const;

export const BUDGET_OPTIONS = [
  {
    value: "government_only",
    label: "Government seats only",
    description: "Show only government / central institution MBBS seats (fees: INR 10,000-INR 1,00,000/year)",
  },
  {
    value: "private_under_10l",
    label: "Private up to INR 10L/year",
    description: "Include private colleges with annual fees up to INR 10 lakh",
  },
  {
    value: "private_under_25l",
    label: "Private up to INR 25L/year",
    description: "Include private colleges with annual fees up to INR 25 lakh",
  },
  {
    value: "all",
    label: "Show all options",
    description: "Show all college types regardless of fee",
  },
] as const;

export const DATA_VERSION_LABEL = "NEET 2025 cycle data";
export const DATA_DISCLAIMER =
  "Cutoff ranks shown are from the NEET 2025 counselling cycle. Actual 2026 cutoffs will differ. Use these as a guide, not a guarantee. Always verify with official MCC and state DME sources.";

export const MCC_PORTAL_URL = "https://mcc.nic.in";
export const NTA_PORTAL_URL = "https://neet.nta.nic.in";

export const STATE_DME_PORTALS: Record<string, string> = {
  "Uttar Pradesh": "https://upneet.gov.in",
  Maharashtra: "https://cetcell.mahacet.org",
  Karnataka: "https://kea.kar.nic.in",
  "Tamil Nadu": "https://www.tnmedicalselection.net",
  Rajasthan: "https://www.rajneet.in",
  Gujarat: "https://medadmgujarat.org",
  Delhi: "https://fmb.ac.in",
  "Madhya Pradesh": "https://www.dme.mponline.gov.in",
  Bihar: "https://bceceboard.bihar.gov.in",
  "West Bengal": "https://wbmcc.nic.in",
  Telangana: "https://knruhs.telangana.gov.in",
  Kerala: "https://cee.kerala.gov.in",
};
