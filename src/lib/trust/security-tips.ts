export type SecurityTip = {
  id: string;
  title: string;
  body: string;
};

export const MEMBER_SECURITY_TIPS: SecurityTip[] = [
  {
    id: "unique-password",
    title: "Use a unique password",
    body: "Choose a strong password used only for Alto Rich. Never share it with anyone, including support staff."
  },
  {
    id: "verify-url",
    title: "Check the website address",
    body: "Always confirm you are on the official Alto Rich domain before entering your credentials."
  },
  {
    id: "review-activity",
    title: "Review login activity",
    body: "Check recent sign-ins regularly. If you see an unfamiliar device or location, change your password and contact support."
  },
  {
    id: "trusted-devices",
    title: "Manage trusted devices",
    body: "Remove browsers you no longer use. Each trusted device can sign in with your username and PIN."
  },
  {
    id: "phishing",
    title: "Beware of phishing",
    body: "Alto Rich will never ask for your password or PIN by email, SMS, or phone. Report suspicious messages immediately."
  },
  {
    id: "sign-out",
    title: "Sign out on shared devices",
    body: "Always sign out when using a public or shared computer."
  }
];

export const ACCOUNT_RECOVERY_STEPS = [
  {
    step: 1,
    title: "Reset your password",
    body: "Use the forgot password link on the sign-in page. A secure reset link will be sent to your registered email."
  },
  {
    step: 2,
    title: "Verify your email",
    body: "If you cannot access your email, contact support with your registered full name and username for identity verification."
  },
  {
    step: 3,
    title: "Remove unfamiliar devices",
    body: "From Security Center, remove any trusted devices you do not recognise."
  },
  {
    step: 4,
    title: "Contact support",
    body: "For urgent account lockouts or suspected fraud, email support with \"Account Recovery\" in the subject line."
  }
];
