export type SocialEvent = {
  type: "signup" | "invest" | "withdraw";
  firstName: string;
  location: string;
  amount?: string;
  occurredAt: number;
};

const FIRST_NAMES = [
  "Tola", "Chinedu", "Amina", "Kemi", "Seyi", "Ngozi", "Emeka", "Fatima", "Yusuf", "Blessing",
  "Ada", "Ibrahim", "Chioma", "Halima", "David", "Funke", "Musa", "Zainab", "Patrick", "Grace",
  "Olu", "Aisha", "Victor", "Bisi", "Samuel", "Hauwa", "Daniel", "Efe", "Aliyu", "Joy",
  "Michael", "Ronke", "Peter", "Maryam", "John", "Shade", "Paul", "Ifeoma", "Mark", "Ade",
  "James", "Uche", "Andrew", "Yemi", "Joseph", "Khadija", "Thomas", "Lola", "Richard", "Amaka"
];

const LOCATIONS = [
  "Lekki", "Abuja", "Kano", "Ibadan", "Surulere", "Port Harcourt", "Enugu", "Benin City",
  "Kaduna", "Abeokuta", "Ikeja", "Victoria Island", "Wuse", "Garki", "Yaba", "Uyo",
  "Calabar", "Jos", "Maiduguri", "Warri", "Onitsha", "Owerri", "Akure", "Ilorin",
  "Zaria", "Sokoto", "Asaba", "Lagos Island", "Ajah", "Gwarinpa"
];

const INVEST_AMOUNTS = [
  25_000, 30_000, 50_000, 75_000, 100_000, 120_000, 150_000, 200_000, 250_000, 300_000,
  350_000, 500_000, 750_000, 1_000_000, 1_200_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 5_000_000
];

const WITHDRAW_AMOUNTS = [
  15_000, 20_000, 35_000, 42_500, 50_000, 65_000, 80_000, 92_500, 105_000, 120_000,
  150_000, 180_000, 210_000, 250_000, 300_000, 420_000, 500_000, 650_000, 800_000, 1_000_000
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

/** ~220 synthetic activity events for social proof rotation. */
export function buildSocialProofEvents(now: number, count = 220): SocialEvent[] {
  const events: SocialEvent[] = [];

  for (let i = 0; i < count; i += 1) {
    const firstName = pick(FIRST_NAMES, i * 3 + 7);
    const location = pick(LOCATIONS, i * 5 + 11);
    const minutesAgo = (i % 180) * 4 + (i % 17) + 1;
    const occurredAt = now - minutesAgo * 60 * 1000;
    const kind = i % 10;

    if (kind < 3) {
      events.push({ type: "signup", firstName, location, occurredAt });
    } else if (kind < 7) {
      events.push({
        type: "invest",
        firstName,
        location,
        amount: formatNaira(pick(INVEST_AMOUNTS, i)),
        occurredAt
      });
    } else {
      events.push({
        type: "withdraw",
        firstName,
        location,
        amount: formatNaira(pick(WITHDRAW_AMOUNTS, i + 2)),
        occurredAt
      });
    }
  }

  return events.sort((a, b) => b.occurredAt - a.occurredAt);
}
