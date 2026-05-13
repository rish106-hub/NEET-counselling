import type { DeadlineEvent } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export const ESTIMATED_DEADLINES: DeadlineEvent[] = [
  {
    id: "est_1",
    event_name: "NEET UG 2026 results expected",
    track: "BOTH",
    state: null,
    round: null,
    event_type: "result_declaration",
    event_date: null,
    is_confirmed: false,
    source_url: "https://neet.nta.nic.in",
    notes: "Exact date not confirmed. Check NTA website daily.",
  },
  {
    id: "est_2",
    event_name: "MCC AIQ counselling registration opens",
    track: "AIQ",
    state: null,
    round: 1,
    event_type: "registration_open",
    event_date: null,
    is_confirmed: false,
    source_url: "https://mcc.nic.in",
    notes: "Typically opens 2 to 3 weeks after results. Check mcc.nic.in for official dates.",
  },
  {
    id: "est_3",
    event_name: "MCC AIQ Round 1 choice filling opens",
    track: "AIQ",
    state: null,
    round: 1,
    event_type: "choice_fill_open",
    event_date: null,
    is_confirmed: false,
    source_url: "https://mcc.nic.in",
    notes: "Choice filling usually stays open for 5 to 7 days. Fill all colleges you are prepared to attend.",
  },
  {
    id: "est_4",
    event_name: "State quota counselling registration",
    track: "STATE",
    state: null,
    round: 1,
    event_type: "registration_open",
    event_date: null,
    is_confirmed: false,
    source_url: null,
    notes: "Each state runs its own counselling. Register on your state DME portal in parallel with MCC registration.",
  },
];

export async function getDeadlines(params?: {
  state?: string | null;
  track?: string | null;
}): Promise<{ events: DeadlineEvent[]; source: "confirmed" | "estimated" }> {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("deadlines")
      .select("*")
      .order("event_date", { ascending: true });

    if (params?.state) {
      query = query.or(`state.eq.${params.state},state.is.null`);
    }
    if (params?.track) {
      query = query.or(`track.eq.${params.track},track.eq.BOTH`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { events: ESTIMATED_DEADLINES, source: "estimated" };
    }

    return { events: data as DeadlineEvent[], source: "confirmed" };
  } catch {
    return { events: ESTIMATED_DEADLINES, source: "estimated" };
  }
}
