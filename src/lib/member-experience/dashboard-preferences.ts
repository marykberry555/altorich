import type { DashboardWidgetConfig, DashboardWidgetId } from "./types";

export const DASHBOARD_PREFS_KEY = "alto-dashboard-widgets";

export const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  "greeting",
  "today_summary",
  "recommendations",
  "wealth_hero",
  "next_step",
  "journey",
  "quick_actions",
  "welcome_bonus",
  "portfolio",
  "insights",
  "calendar",
  "achievements",
  "referrals",
  "activity",
  "charts",
  "settlements",
  "knowledge",
  "notifications"
];

export const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  greeting: "Personal greeting",
  today_summary: "Today's summary",
  recommendations: "Recommendations",
  wealth_hero: "Wealth overview",
  next_step: "Next step",
  journey: "My journey",
  quick_actions: "Quick actions",
  welcome_bonus: "Welcome bonus",
  portfolio: "Portfolio",
  referrals: "Referrals",
  calendar: "Financial calendar",
  insights: "Insights",
  achievements: "Achievements",
  reputation: "Member reputation",
  activity: "Recent activity",
  charts: "Performance charts",
  settlements: "Upcoming settlements",
  knowledge: "Knowledge Center",
  notifications: "Alerts"
};

export function defaultWidgetConfigs(): DashboardWidgetConfig[] {
  return DEFAULT_WIDGET_ORDER.map((id) => ({
    id,
    label: WIDGET_LABELS[id],
    visible: id !== "reputation"
  }));
}

export function mergeWidgetConfigs(stored: DashboardWidgetConfig[] | null): DashboardWidgetConfig[] {
  const defaults = defaultWidgetConfigs();
  if (!stored?.length) return defaults;

  const byId = new Map(stored.map((w) => [w.id, w]));
  const ordered: DashboardWidgetConfig[] = [];

  for (const item of stored) {
    if (WIDGET_LABELS[item.id]) {
      ordered.push({
        id: item.id,
        label: WIDGET_LABELS[item.id],
        visible: item.visible
      });
    }
  }

  for (const def of defaults) {
    if (!ordered.some((w) => w.id === def.id)) {
      ordered.push(def);
    }
  }

  return ordered;
}

export function isWidgetVisible(configs: DashboardWidgetConfig[], id: DashboardWidgetId): boolean {
  return configs.find((w) => w.id === id)?.visible ?? true;
}
