/** Theme-aware brand asset paths (WebP preferred, PNG fallback) */
export const BRAND = {
  logo: {
    light: "/brand/logo-light.webp",
    dark: "/brand/logo-dark.webp",
    lightPng: "/brand/logo-light.png",
    darkPng: "/brand/logo-dark.png"
  },
  icon: {
    light: "/brand/icon-light.webp",
    dark: "/brand/icon-dark.webp",
    lightPng: "/brand/icon-light.png",
    darkPng: "/brand/icon-dark.png"
  },
  og: {
    default: "/og/default.webp",
    defaultPng: "/og/default.png"
  }
} as const;

export const ICONS = {
  favicon16Light: "/icons/favicon-16x16-light.png",
  favicon16Dark: "/icons/favicon-16x16-dark.png",
  favicon32Light: "/icons/favicon-32x32-light.png",
  favicon32Dark: "/icons/favicon-32x32-dark.png",
  appleTouch: "/icons/apple-touch-icon.png",
  android192: "/icons/android-chrome-192x192.png",
  android512: "/icons/android-chrome-512x512.png",
  mask: "/icons/mask-icon.png",
  msTile150: "/icons/mstile-150x150.png"
} as const;
