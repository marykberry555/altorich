import type { SystemHealthComponent, SystemHealthComponentId } from "./types";

const DEFINITIONS: Record<
  SystemHealthComponentId,
  { name: string; description: string; monitoringAvailable: boolean }
> = {
  application: {
    name: "Application",
    description: "Core web application and API availability.",
    monitoringAvailable: true
  },
  database: {
    name: "Database",
    description: "Primary data store connectivity and query health.",
    monitoringAvailable: false
  },
  email: {
    name: "Email",
    description: "Verification and transactional email delivery.",
    monitoringAvailable: true
  },
  notifications: {
    name: "Notifications",
    description: "In-app alerts and member notification pipeline.",
    monitoringAvailable: true
  },
  storage: {
    name: "Storage",
    description: "Document and asset storage services.",
    monitoringAvailable: false
  },
  queue: {
    name: "Queue",
    description: "Background job queue processing.",
    monitoringAvailable: false
  },
  scheduled_jobs: {
    name: "Scheduled jobs",
    description: "Cron and scheduled task execution.",
    monitoringAvailable: false
  },
  settlement_engine: {
    name: "Settlement engine",
    description: "Weekly settlement and payout processing.",
    monitoringAvailable: false
  }
};

/** Internal health architecture — does not fabricate live metrics. */
export function buildSystemHealthArchitecture(now = new Date()): SystemHealthComponent[] {
  const lastChecked = now.toISOString();
  return (Object.keys(DEFINITIONS) as SystemHealthComponentId[]).map((id) => {
    const def = DEFINITIONS[id];
    return {
      id,
      name: def.name,
      description: def.description,
      monitoringAvailable: def.monitoringAvailable,
      status: def.monitoringAvailable ? "operational" : "unavailable",
      message: def.monitoringAvailable
        ? "Basic public status available via transparency API."
        : "Detailed monitoring not yet connected — metrics will appear when instrumentation is enabled.",
      lastChecked
    };
  });
}
