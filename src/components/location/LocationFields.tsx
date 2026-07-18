"use client";

import {
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

/** State select + free-text City / Area. */
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
        <input
          className="field"
          type="text"
          value={cityArea}
          disabled={disabled || !stateCode}
          required={required}
          maxLength={64}
          autoComplete="address-level2"
          placeholder={stateCode ? "e.g. Lekki, Ikeja, Wuse" : "Select state first"}
          onChange={(e) => onCityChange(e.target.value)}
        />
      </label>

      {error ? <p className="text-xs text-red-600 sm:col-span-2">{error}</p> : null}
    </div>
  );
}
