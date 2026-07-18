import { z } from "zod";
import { isNgStateCode, NG_STATE_CODES } from "@/lib/location/ng-locations";

export const locationStateCodeSchema = z
  .string()
  .refine((v): v is (typeof NG_STATE_CODES)[number] => isNgStateCode(v), {
    message: "Select a valid Nigerian state."
  });

export const memberLocationSchema = z.object({
  locationStateCode: locationStateCodeSchema,
  locationCityArea: z
    .string()
    .trim()
    .min(2, "Enter your city or area.")
    .max(64, "City / area must be 64 characters or fewer.")
});

export type MemberLocationInput = z.infer<typeof memberLocationSchema>;
