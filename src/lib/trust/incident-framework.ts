import type { IncidentCategory, IncidentNotice } from "./types";

/** Banner-ready incident notices — populate via admin settings in future. */
export const ACTIVE_INCIDENTS: IncidentNotice[] = [];

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  maintenance: "Scheduled maintenance",
  service_disruption: "Service disruption",
  security_advisory: "Security advisory",
  operational_update: "Operational update",
  resolved_incident: "Resolved incident"
};

export const INCIDENT_CATEGORY_STYLES: Record<IncidentCategory, string> = {
  maintenance: "border-slate-500/30 bg-slate-500/10 text-slate-800 dark:text-slate-200",
  service_disruption: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  security_advisory: "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-100",
  operational_update: "border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100",
  resolved_incident: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
};

export function getBannerIncidents(now = new Date()): IncidentNotice[] {
  const ts = now.getTime();
  return ACTIVE_INCIDENTS.filter((incident) => {
    if (!incident.bannerVisible) return false;
    if (incident.startsAt && new Date(incident.startsAt).getTime() > ts) return false;
    if (incident.endsAt && new Date(incident.endsAt).getTime() < ts) return false;
    return true;
  });
}

/** Future: load from settings / database without changing consumer API. */
export function listScheduledIncidents(): IncidentNotice[] {
  return ACTIVE_INCIDENTS;
}
