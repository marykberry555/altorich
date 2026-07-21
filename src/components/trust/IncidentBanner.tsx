"use client";

import { INCIDENT_CATEGORY_LABELS, INCIDENT_CATEGORY_STYLES, getBannerIncidents } from "@/lib/trust/incident-framework";
import { cn } from "@/lib/utils";

/** Banner-ready incident notices — renders nothing when no active incidents. */
export function IncidentBanner() {
  const incidents = getBannerIncidents();

  if (incidents.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Service notices">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className={cn("border-b px-4 py-3 text-sm", INCIDENT_CATEGORY_STYLES[incident.category])}
        >
          <p className="font-semibold">
            {INCIDENT_CATEGORY_LABELS[incident.category]}: {incident.title}
          </p>
          <p className="mt-1 opacity-90">{incident.body}</p>
        </div>
      ))}
    </div>
  );
}
