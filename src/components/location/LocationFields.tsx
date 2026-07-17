"use client";

import { useMemo } from "react";
import {
  getCitiesForState,
  NG_STATES,
  type NgStateCode
} from "@/lib/location/ng-locations";
import { cn } from "@/lib/utils";

type Props = {
  stateCode: NgStateCode | "";
  cityArea: string;
  onStateChange: (code: NgStateCode | "") => void;
  onCityChange: (city: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
};

/** Cascading State → City/Area selects — no free-text locations. */
export function LocationFields({
  stateCode,
  cityArea,
  onStateChange,
  onCityChange,
  disabled,
  required = true,
  error,
  className
}: Props) {
  const cities = useMemo(() => (stateCode ? getCitiesForState(stateCode) : []), [stateCode]);

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-[var(--heading)]">
          State
          {required ? (
            <span className="text-red-500" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </span>
        <select
          className="field"
          value={stateCode}
          disabled={disabled}
          required={required}
          onChange={(e) => {
            const next = e.target.value as NgStateCode | "";
            onStateChange(next);
            onCityChange("");
          }}
        >
          <option value="">Select state</option>
          {NG_STATES.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-[var(--heading)]">
          City / Area
          {required ? (
            <span className="text-red-500" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </span>
        <select
          className="field"
          value={cityArea}
          disabled={disabled || !stateCode}
          required={required}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="">{stateCode ? "Select city / area" : "Select state first"}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-xs text-red-600 sm:col-span-2">{error}</p> : null}
    </div>
  );
}
