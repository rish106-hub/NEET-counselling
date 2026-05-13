"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DeadlineEvent } from "@/lib/types";

export function DeadlineBanner() {
  const [nextEvent, setNextEvent] = useState<DeadlineEvent | null>(null);

  useEffect(() => {
    fetch("/api/deadlines")
      .then((r) => r.json())
      .then((data: { events: DeadlineEvent[] }) => {
        const upcoming = data.events
          .filter((e) => e.event_date != null)
          .sort(
            (a, b) =>
              new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime()
          )
          .find((e) => new Date(e.event_date!) >= new Date());
        setNextEvent(upcoming ?? null);
      })
      .catch(() => null);
  }, []);

  if (!nextEvent) return null;

  const dateStr = nextEvent.event_date
    ? new Date(nextEvent.event_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date TBD";

  return (
    <div className="bg-[#E8A838] text-white text-sm px-4 py-2 text-center">
      <span className="font-medium">Next deadline:</span>{" "}
      {nextEvent.event_name} - {dateStr}
      {!nextEvent.is_confirmed && " (estimated)"}
      {" | "}
      <Link href="/deadlines" className="underline underline-offset-2">
        View all deadlines
      </Link>
    </div>
  );
}
