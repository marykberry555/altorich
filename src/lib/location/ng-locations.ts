/**
 * Canonical Nigerian location catalog.
 * State selected first; cities/areas filtered by state_code.
 * Codes are stable for analytics, heatmaps, and regional features.
 */

export type NgStateCode =
  | "AB"
  | "AD"
  | "AK"
  | "AN"
  | "BA"
  | "BY"
  | "BE"
  | "BO"
  | "CR"
  | "DE"
  | "EB"
  | "ED"
  | "EK"
  | "EN"
  | "FC"
  | "GO"
  | "IM"
  | "JI"
  | "KD"
  | "KN"
  | "KT"
  | "KE"
  | "KO"
  | "KW"
  | "LA"
  | "NA"
  | "NI"
  | "OG"
  | "ON"
  | "OS"
  | "OY"
  | "PL"
  | "RI"
  | "SO"
  | "TA"
  | "YO"
  | "ZA";

export type NgState = {
  code: NgStateCode;
  /** Official / select-list name */
  name: string;
  /** Short label for social proof (FCT → Abuja) */
  displayName: string;
  cities: readonly string[];
};

/** Deduplicate + sort city lists for consistent selects. */
function cities(...names: string[]): string[] {
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "en")
  );
}

export const NG_STATES: readonly NgState[] = [
  {
    code: "AB",
    name: "Abia",
    displayName: "Abia",
    cities: cities("Aba", "Umuahia", "Ohafia", "Arochukwu", "Bende")
  },
  {
    code: "AD",
    name: "Adamawa",
    displayName: "Adamawa",
    cities: cities("Yola", "Mubi", "Jimeta", "Numan", "Ganye")
  },
  {
    code: "AK",
    name: "Akwa Ibom",
    displayName: "Akwa Ibom",
    cities: cities("Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak")
  },
  {
    code: "AN",
    name: "Anambra",
    displayName: "Anambra",
    cities: cities("Awka", "Onitsha", "Nnewi", "Ekwulobia", "Ihiala")
  },
  {
    code: "BA",
    name: "Bauchi",
    displayName: "Bauchi",
    cities: cities("Bauchi", "Azare", "Jama'are", "Misau", "Ningi")
  },
  {
    code: "BY",
    name: "Bayelsa",
    displayName: "Bayelsa",
    cities: cities("Yenagoa", "Brass", "Ogbia", "Sagbama", "Nembe")
  },
  {
    code: "BE",
    name: "Benue",
    displayName: "Benue",
    cities: cities("Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Zaki Biam")
  },
  {
    code: "BO",
    name: "Borno",
    displayName: "Borno",
    cities: cities("Maiduguri", "Bama", "Biu", "Dikwa", "Gwoza")
  },
  {
    code: "CR",
    name: "Cross River",
    displayName: "Cross River",
    cities: cities("Calabar", "Ikom", "Ogoja", "Obudu", "Ugep")
  },
  {
    code: "DE",
    name: "Delta",
    displayName: "Delta",
    cities: cities("Asaba", "Warri", "Sapele", "Ughelli", "Agbor", "Abraka")
  },
  {
    code: "EB",
    name: "Ebonyi",
    displayName: "Ebonyi",
    cities: cities("Abakaliki", "Afikpo", "Onueke", "Ezza")
  },
  {
    code: "ED",
    name: "Edo",
    displayName: "Edo",
    cities: cities("Benin City", "Auchi", "Ekpoma", "Uromi", "Irrua")
  },
  {
    code: "EK",
    name: "Ekiti",
    displayName: "Ekiti",
    cities: cities("Ado-Ekiti", "Ikere", "Ijero", "Oye", "Emure")
  },
  {
    code: "EN",
    name: "Enugu",
    displayName: "Enugu",
    cities: cities("Enugu", "Nsukka", "Agbani", "Awgu", "Oji River")
  },
  {
    code: "FC",
    name: "Federal Capital Territory (Abuja)",
    displayName: "Abuja",
    cities: cities(
      "Wuse",
      "Garki",
      "Maitama",
      "Asokoro",
      "Gwarinpa",
      "Lugbe",
      "Life Camp",
      "Jabi",
      "Utako",
      "Kubwa",
      "Karu",
      "Nyanya",
      "Guzape",
      "Central Business District"
    )
  },
  {
    code: "GO",
    name: "Gombe",
    displayName: "Gombe",
    cities: cities("Gombe", "Kaltungo", "Bajoga", "Billiri")
  },
  {
    code: "IM",
    name: "Imo",
    displayName: "Imo",
    cities: cities("Owerri", "Orlu", "Okigwe", "Mbaise", "Oguta")
  },
  {
    code: "JI",
    name: "Jigawa",
    displayName: "Jigawa",
    cities: cities("Dutse", "Hadejia", "Kazaure", "Gumel", "Birnin Kudu")
  },
  {
    code: "KD",
    name: "Kaduna",
    displayName: "Kaduna",
    cities: cities("Kaduna", "Zaria", "Kafanchan", "Kagoro", "Sabon Tasha")
  },
  {
    code: "KN",
    name: "Kano",
    displayName: "Kano",
    cities: cities("Kano", "Nassarawa", "Fagge", "Gwale", "Dala", "Tarauni")
  },
  {
    code: "KT",
    name: "Katsina",
    displayName: "Katsina",
    cities: cities("Katsina", "Daura", "Funtua", "Malumfashi")
  },
  {
    code: "KE",
    name: "Kebbi",
    displayName: "Kebbi",
    cities: cities("Birnin Kebbi", "Argungu", "Yauri", "Zuru")
  },
  {
    code: "KO",
    name: "Kogi",
    displayName: "Kogi",
    cities: cities("Lokoja", "Okene", "Idah", "Kabba", "Anyigba")
  },
  {
    code: "KW",
    name: "Kwara",
    displayName: "Kwara",
    cities: cities("Ilorin", "Offa", "Jebba", "Lafiagi", "Omu-Aran")
  },
  {
    code: "LA",
    name: "Lagos",
    displayName: "Lagos",
    cities: cities(
      "Lekki",
      "Victoria Island",
      "Ikoyi",
      "Ikeja",
      "Yaba",
      "Surulere",
      "Ajah",
      "Apapa",
      "Maryland",
      "Gbagada",
      "Festac",
      "Alimosho",
      "Agege",
      "Mushin",
      "Ikorodu",
      "Badagry",
      "Epe",
      "Ojodu",
      "Magodo",
      "Ogba"
    )
  },
  {
    code: "NA",
    name: "Nasarawa",
    displayName: "Nasarawa",
    cities: cities("Lafia", "Keffi", "Akwanga", "Nasarawa", "Karu")
  },
  {
    code: "NI",
    name: "Niger",
    displayName: "Niger",
    cities: cities("Minna", "Suleja", "Bida", "Kontagora", "New Bussa")
  },
  {
    code: "OG",
    name: "Ogun",
    displayName: "Ogun",
    cities: cities("Abeokuta", "Ijebu Ode", "Sango-Ota", "Sagamu", "Ilaro")
  },
  {
    code: "ON",
    name: "Ondo",
    displayName: "Ondo",
    cities: cities("Akure", "Ondo", "Owo", "Ikare", "Ore")
  },
  {
    code: "OS",
    name: "Osun",
    displayName: "Osun",
    cities: cities("Osogbo", "Ile-Ife", "Ilesa", "Ede", "Ikirun")
  },
  {
    code: "OY",
    name: "Oyo",
    displayName: "Oyo",
    cities: cities("Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki")
  },
  {
    code: "PL",
    name: "Plateau",
    displayName: "Plateau",
    cities: cities("Jos", "Bukuru", "Pankshin", "Shendam", "Langtang")
  },
  {
    code: "RI",
    name: "Rivers",
    displayName: "Rivers",
    cities: cities(
      "Port Harcourt",
      "GRA",
      "Obio-Akpor",
      "Eleme",
      "Bonny",
      "Okrika",
      "Ahoada",
      "Bori"
    )
  },
  {
    code: "SO",
    name: "Sokoto",
    displayName: "Sokoto",
    cities: cities("Sokoto", "Tambuwal", "Wurno", "Illela")
  },
  {
    code: "TA",
    name: "Taraba",
    displayName: "Taraba",
    cities: cities("Jalingo", "Wukari", "Bali", "Takum")
  },
  {
    code: "YO",
    name: "Yobe",
    displayName: "Yobe",
    cities: cities("Damaturu", "Potiskum", "Gashua", "Nguru")
  },
  {
    code: "ZA",
    name: "Zamfara",
    displayName: "Zamfara",
    cities: cities("Gusau", "Kaura Namoda", "Talata Mafara", "Anka")
  }
] as const;

export const NG_STATE_BY_CODE = Object.fromEntries(NG_STATES.map((s) => [s.code, s])) as Record<
  NgStateCode,
  NgState
>;

export const NG_STATE_CODES = NG_STATES.map((s) => s.code) as NgStateCode[];

export function isNgStateCode(value: string): value is NgStateCode {
  return value in NG_STATE_BY_CODE;
}

export function getCitiesForState(stateCode: string): readonly string[] {
  if (!isNgStateCode(stateCode)) return [];
  return NG_STATE_BY_CODE[stateCode].cities;
}

export function isValidCityForState(stateCode: string, cityArea: string): boolean {
  if (!isNgStateCode(stateCode)) return false;
  return NG_STATE_BY_CODE[stateCode].cities.some((c) => c === cityArea);
}

/** Social-proof / UI label: "Wuse, Abuja" (FCT displayName is Abuja). */
export function formatLocationLabel(stateCode: string | null | undefined, cityArea: string | null | undefined): string {
  const city = (cityArea ?? "").trim();
  if (!city) return "";
  if (!stateCode || !isNgStateCode(stateCode)) return city;
  const state = NG_STATE_BY_CODE[stateCode];
  return `${city}, ${state.displayName}`;
}

/** "{Name} from {City}, {State}" */
export function formatPersonFromLocation(
  firstName: string,
  stateCode: string | null | undefined,
  cityArea: string | null | undefined
): string {
  const location = formatLocationLabel(stateCode, cityArea);
  if (!location) return firstName;
  return `${firstName} from ${location}`;
}

/** Curated fallback pairs for social proof when live volume is thin. */
export const FALLBACK_LOCATIONS: ReadonlyArray<{ stateCode: NgStateCode; cityArea: string }> = [
  { stateCode: "LA", cityArea: "Victoria Island" },
  { stateCode: "LA", cityArea: "Lekki" },
  { stateCode: "LA", cityArea: "Ikeja" },
  { stateCode: "LA", cityArea: "Surulere" },
  { stateCode: "FC", cityArea: "Wuse" },
  { stateCode: "FC", cityArea: "Garki" },
  { stateCode: "RI", cityArea: "Port Harcourt" },
  { stateCode: "RI", cityArea: "GRA" },
  { stateCode: "AB", cityArea: "Aba" },
  { stateCode: "IM", cityArea: "Owerri" },
  { stateCode: "EN", cityArea: "Enugu" },
  { stateCode: "ED", cityArea: "Benin City" },
  { stateCode: "AK", cityArea: "Uyo" },
  { stateCode: "DE", cityArea: "Asaba" },
  { stateCode: "KN", cityArea: "Kano" },
  { stateCode: "KD", cityArea: "Kaduna" },
  { stateCode: "OY", cityArea: "Ibadan" },
  { stateCode: "AN", cityArea: "Onitsha" },
  { stateCode: "OG", cityArea: "Abeokuta" },
  { stateCode: "PL", cityArea: "Jos" }
];

export function locationFromSeed(seed: string): { stateCode: NgStateCode; cityArea: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_LOCATIONS[hash % FALLBACK_LOCATIONS.length];
}
