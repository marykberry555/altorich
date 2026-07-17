import test from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_LOCATIONS,
  getCitiesForState,
  isValidCityForState,
  NG_STATES
} from "@/lib/location/ng-locations";

test("every state has unique sorted cities and no free-text duplicates", () => {
  for (const state of NG_STATES) {
    const set = new Set(state.cities);
    assert.equal(set.size, state.cities.length, state.code);
    const sorted = [...state.cities].sort((a, b) => a.localeCompare(b, "en"));
    assert.deepEqual([...state.cities], sorted);
  }
});

test("Lagos and FCT catalogs include required areas", () => {
  assert.equal(isValidCityForState("LA", "Lekki"), true);
  assert.equal(isValidCityForState("LA", "Victoria Island"), true);
  assert.equal(isValidCityForState("FC", "Wuse"), true);
  assert.equal(isValidCityForState("FC", "Garki"), true);
  assert.ok(getCitiesForState("LA").length >= 8);
});

test("fallback locations are catalog-valid", () => {
  for (const loc of FALLBACK_LOCATIONS) {
    assert.equal(isValidCityForState(loc.stateCode, loc.cityArea), true);
  }
});
