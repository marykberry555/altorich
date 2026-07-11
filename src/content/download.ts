import { COMPANY } from "@/lib/company";
import { PWA } from "@/lib/pwa/config";

export const APP_VERSION = PWA.version;

export const downloadBenefits = [
  {
    title: "Instant access",
    description: "Open AltoRich from your home screen — no browser tabs, no distractions."
  },
  {
    title: "Secure sign-in",
    description: "Your session stays protected with the same banking-grade auth as the website."
  },
  {
    title: "Full platform",
    description: "Investments, wallet, deposits, payouts, and referrals — everything in one app."
  },
  {
    title: "Works offline",
    description: "Cached pages load when signal is weak; live actions sync when you reconnect."
  }
] as const;

export const installOptions = [
  {
    id: "android-play",
    title: "Google Play",
    status: "coming-soon" as const,
    description: "Official AltoRich app for Android — publication in progress.",
    cta: "Coming soon"
  },
  {
    id: "android-pwa",
    title: "Install on Android",
    status: "available" as const,
    description: "Install directly from Chrome or Samsung Internet — no store required.",
    cta: "Install web app"
  },
  {
    id: "android-apk",
    title: "Direct APK",
    status: "optional" as const,
    description: "For testing before Play Store release. Build from the TWA project in the repository.",
    cta: "See build guide"
  },
  {
    id: "desktop",
    title: "Desktop install",
    status: "available" as const,
    description: "Install from Chrome or Edge on Windows and macOS.",
    cta: "Install on desktop"
  },
  {
    id: "iphone",
    title: "iPhone / iPad",
    status: "available" as const,
    description: "Add AltoRich to your home screen using Safari.",
    cta: "iOS instructions"
  }
] as const;

export const installGuides = {
  android: [
    { step: "1", title: "Open in Chrome", body: "Visit altorich.com/download on your Android phone." },
    { step: "2", title: "Install", body: "Tap Install App or use the browser menu → Install app / Add to Home screen." },
    { step: "3", title: "Open", body: "Launch AltoRich from your home screen — full screen, no browser chrome." },
    { step: "4", title: "Sign in", body: "Log in with your username and PIN to reach your dashboard instantly." }
  ],
  desktop: [
    { step: "1", title: "Open website", body: "Go to altorich.com in Chrome or Edge." },
    { step: "2", title: "Install", body: "Click the install icon in the address bar or use the Download App button." },
    { step: "3", title: "Pin to taskbar", body: "Launch from your apps menu or pin for one-click access." },
    { step: "4", title: "Use offline", body: "Previously visited pages may load without a connection." }
  ],
  iphone: [
    { step: "1", title: "Open Safari", body: "Use Safari on iPhone — other browsers cannot install PWAs on iOS." },
    { step: "2", title: "Share", body: "Tap the Share button at the bottom of the screen." },
    { step: "3", title: "Add to Home Screen", body: "Scroll and tap Add to Home Screen, then confirm." },
    { step: "4", title: "Launch", body: "Open AltoRich from your home screen and sign in." }
  ]
} as const;

export const downloadFaqs = [
  {
    q: "Is the app different from the website?",
    a: "No. AltoRich uses the same secure platform — the installed app is a faster, full-screen window into your account."
  },
  {
    q: "Where does the app open?",
    a: "When installed, AltoRich opens on the sign-in screen. If you're already logged in, you go straight to your dashboard."
  },
  {
    q: "Can I still visit the marketing website?",
    a: "Yes. Tap the AltoRich logo inside the app to return to the public homepage at altorich.com."
  },
  {
    q: "When will Google Play be available?",
    a: "The Trusted Web Activity package is prepared. Play Store listing will go live after final review — use Install on Android until then."
  },
  {
    q: "What are the requirements?",
    a: "Android 8+ with Chrome 80+ or Samsung Internet 12+. Desktop: latest Chrome or Edge. iOS 16.4+ with Safari for home screen install."
  }
] as const;

export const downloadMeta = {
  title: "Download AltoRich App",
  description: `Install ${COMPANY.brand} on Android, iPhone, or desktop. Full-screen access to your investments, wallet, and payouts.`,
  requirements: "Android 8+ · Chrome 80+ · iOS 16.4+ (Safari) · Desktop Chrome/Edge"
};

export const releaseNotes = [
  "PWA install with login-first launch",
  "Offline page and asset caching",
  "App shortcuts for dashboard, wallet, deposits, and investments",
  "Trusted Web Activity project prepared for Google Play"
] as const;
