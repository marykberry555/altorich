import { z } from "zod";
import { isNgStateCode, isValidCityForState, NG_STATE_CODES } from "@/lib/location/ng-locations";

export const locationStateCodeSchema = z
  .string()
  .refine((v): v is (typeof NG_STATE_CODES)[number] => isNgStateCode(v), {
    message: "Select a valid Nigerian state."
  });

export const memberLocationSchema = z
  .object({
    locationStateCode: locationStateCodeSchema,
    locationCityArea: z.string().min(2).max(64)
  })
  .superRefine((data, ctx) => {
    if (!isValidCityForState(data.locationStateCode, data.locationCityArea)) {
      ctx.addIssue({
        code: "custom",
        path: ["locationCityArea"],
        message: "Select a city / area that matches the selected state."
      });
    }
  });

export type MemberLocationInput = z.infer<typeof memberLocationSchema>;
