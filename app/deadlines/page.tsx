import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getDeadlines as getDeadlineData } from "@/lib/server/deadlines";

export const metadata: Metadata = {
  title: "NEET 2026 Counselling Deadline Calendar - NEET Counselling Navigator",
  description: "All MCC AIQ and state quota counselling deadlines in one place. Updated as dates are announced.",
};

async function getDeadlineEvents() {
  const data = await getDeadlineData();
  return data.events;
}

const TRACK_STYLES: Record<string, string> = {
  AIQ: "bg-[#E8F4F7] text-[#0F5C6B]",
  STATE: "bg-purple-50 text-purple-700",
  BOTH: "bg-gray-100 text-gray-600",
};

export default async function DeadlinesPage() {
  const events = await getDeadlineEvents();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="px-4 py-10 max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-primary mb-6 block">Back to home</Link>

      <h1 className="text-2xl font-bold text-primary mb-2">Deadline Calendar</h1>
      <p className="text-sm text-muted-foreground mb-8">
        NEET 2026 counselling key dates. Updated as MCC and state DMEs announce. Estimated dates are marked.
      </p>

      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No dates confirmed yet</p>
          <p className="text-sm">Dates will appear here as soon as NTA declares NEET 2026 re-exam results.</p>
          <a
            href="https://mcc.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-primary underline"
          >
            Check mcc.nic.in directly
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-card-foreground flex-1">
                  {event.event_name}
                </p>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${TRACK_STYLES[event.track] ?? TRACK_STYLES.BOTH}`}>
                  {event.track}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {event.event_date ? (
                  <span className="font-medium text-foreground">
                    {new Date(event.event_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-300">Date not yet announced</span>
                )}

                {!event.is_confirmed && (
                  <span className="bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    Estimated
                  </span>
                )}
              </div>

              {event.notes && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{event.notes}</p>
              )}

              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-1 inline-block"
                >
                  Official source
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-muted-foreground text-center">
        Check back daily during the counselling window. Dates are updated within hours of official announcement.
      </div>
      </div>
    </main>
  );
}
