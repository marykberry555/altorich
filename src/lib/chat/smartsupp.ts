import type { SmartsuppEventName } from "@/lib/chat/smartsupp-events";

export const SMARTSUPP_REFRESH_EVENT = "smartsupp:refresh-identity";
export const SMARTSUPP_SCRIPT_ID = "smartsupp-loader";

export type SmartsuppIdentity = {
  authenticated: boolean;
  name?: string;
  email?: string;
  userId?: string;
  package?: string;
  vipLevel?: number;
  vipLabel?: string;
  walletBalance?: number;
  tags: string[];
  role: "guest" | "member" | "investor" | "admin";
};

type SmartsuppCommand = {
  (...args: ["name", string] | ["email", string] | ["phone", string] | ["variables", Record<string, string | number>] | ["group", string] | ["chat:show"] | ["chat:hide"] | ["chat:open"] | ["chat:close"] | ["chat:message", string]): void;
  _: Array<unknown[]>;
  (callback: () => void): void;
};

declare global {
  interface Window {
    smartsupp?: SmartsuppCommand;
    _smartsupp?: {
      key?: string;
      color?: string;
      orientation?: "left" | "right";
      offsetY?: number;
      ratingEnabled?: boolean;
      privacyNoticeEnabled?: boolean;
    };
    __SMARTSUPP_BOOTSTRAPPED__?: boolean;
  }
}

export function getSmartsuppKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_SMARTSUPP_KEY?.trim();
  return key || undefined;
}

export function isSmartsuppEnabled(): boolean {
  return Boolean(getSmartsuppKey());
}

function runWhenReady(callback: () => void) {
  if (typeof window === "undefined") return;
  if (typeof window.smartsupp !== "function") return;

  try {
    window.smartsupp(callback);
  } catch {
    callback();
  }
}

export function identifySmartsuppVisitor(identity: SmartsuppIdentity) {
  if (!isSmartsuppEnabled()) return;

  runWhenReady(() => {
    const api = window.smartsupp;
    if (!api) return;

    if (identity.name) api("name", identity.name);
    if (identity.email) api("email", identity.email);

    const variables: Record<string, string | number> = {
      Tags: identity.tags.join(", "),
      Role: identity.role
    };

    if (identity.userId) variables.User_ID = identity.userId;
    if (identity.package) variables.Current_Package = identity.package;
    if (identity.vipLabel) variables.VIP_Level = identity.vipLabel;
    if (typeof identity.vipLevel === "number") variables.VIP_Level_Index = identity.vipLevel;
    if (typeof identity.walletBalance === "number") variables.Wallet_Balance_NGN = identity.walletBalance;

    api("variables", variables);
  });
}

export function trackSmartsuppEvent(event: SmartsuppEventName, metadata: Record<string, string | number> = {}) {
  if (!isSmartsuppEnabled()) return;

  runWhenReady(() => {
    const api = window.smartsupp;
    if (!api) return;

    const timestamp = new Date().toISOString();
    const eventKey = event.replace(/\s+/g, "_");

    api("variables", {
      Last_Event: event,
      Last_Event_At: timestamp,
      [`Event_${eventKey}`]: timestamp,
      ...metadata
    });
  });
}

export function refreshSmartsuppIdentity() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SMARTSUPP_REFRESH_EVENT));
}

export function smartsuppThemeColor(theme: "light" | "dark") {
  return theme === "dark" ? "#34d399" : "#047857";
}

export function buildSmartsuppBootstrap(key: string) {
  return `
(function () {
  if (window.__SMARTSUPP_BOOTSTRAPPED__) return;
  window.__SMARTSUPP_BOOTSTRAPPED__ = true;

  var theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

  window._smartsupp = window._smartsupp || {};
  window._smartsupp.key = ${JSON.stringify(key)};
  window._smartsupp.color = theme === "dark" ? "#34d399" : "#047857";
  window._smartsupp.orientation = "right";
  window._smartsupp.ratingEnabled = true;
  window._smartsupp.privacyNoticeEnabled = true;

  window.smartsupp||(function (d) {
    var s, c, o = (window.smartsupp = function () { o._.push(arguments); });
    o._ = [];
    s = d.getElementsByTagName("script")[0];
    c = d.createElement("script");
    c.id = ${JSON.stringify(SMARTSUPP_SCRIPT_ID)};
    c.type = "text/javascript";
    c.charset = "utf-8";
    c.async = true;
    c.src = "https://www.smartsuppchat.com/loader.js?";
    s.parentNode.insertBefore(c, s);
  })(document);
})();
`.trim();
}
