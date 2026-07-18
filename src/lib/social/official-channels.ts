/** Official Alto Rich community channels — open in a new tab. */
export const OFFICIAL_SOCIAL_CHANNELS = [
  {
    id: "facebook" as const,
    label: "Facebook",
    href: "https://www.facebook.com/realaltorich"
  },
  {
    id: "whatsapp" as const,
    label: "WhatsApp Channel",
    href: "https://whatsapp.com/channel/0029VbDX5IsLdQebJ8M3TM43"
  }
] as const;

export type OfficialSocialId = (typeof OFFICIAL_SOCIAL_CHANNELS)[number]["id"];
