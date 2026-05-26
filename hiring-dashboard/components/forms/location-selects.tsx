"use client";

import { useEffect, useState } from "react";
import { FormField, inputClassName } from "@/components/ui/form-field";

type StateRow = { id: string; name: string };
type CityRow = { id: string; name: string; isCustom?: boolean };

type Props = {
  country: string;
  state: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  required?: boolean;
};

export function LocationSelects({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  required,
}: Props) {
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [stateId, setStateId] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingStates(true);
      const res = await fetch("/api/locations?countryCode=IN");
      const data = await res.json();
      if (!cancelled && res.ok) {
        setStates(data.states || []);
        onCountryChange("India");
      }
      if (!cancelled) setLoadingStates(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed country once
  }, []);

  useEffect(() => {
    if (!state) {
      setStateId("");
      setCities([]);
      return;
    }
    const match = states.find((s) => s.name.toLowerCase() === state.toLowerCase());
    setStateId(match?.id || "");
  }, [state, states]);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    let cancelled = false;
    async function loadCities() {
      setLoadingCities(true);
      const res = await fetch(`/api/locations?stateId=${stateId}`);
      const data = await res.json();
      if (!cancelled && res.ok) setCities(data.cities || []);
      if (!cancelled) setLoadingCities(false);
    }
    void loadCities();
    return () => {
      cancelled = true;
    };
  }, [stateId]);

  async function addCustomCity() {
    if (!stateId || !customCity.trim()) return;
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stateId, name: customCity.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCities((prev) => [...prev, data.city].sort((a, b) => a.name.localeCompare(b.name)));
      onCityChange(data.city.name);
      setCustomCity("");
    }
  }

  return (
    <>
      <FormField label="Country">
        <select
          className={inputClassName}
          value={country || "India"}
          onChange={(e) => onCountryChange(e.target.value)}
          required={required}
        >
          <option value="India">India</option>
        </select>
      </FormField>
      <FormField label="State">
        <select
          className={inputClassName}
          value={state}
          onChange={(e) => {
            onStateChange(e.target.value);
            onCityChange("");
          }}
          required={required}
          disabled={loadingStates}
        >
          <option value="">{loadingStates ? "Loading states…" : "Select state…"}</option>
          {states.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="City">
        <select
          className={inputClassName}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          required={required}
          disabled={!state || loadingCities}
        >
          <option value="">
            {!state ? "Select state first" : loadingCities ? "Loading cities…" : "Select city…"}
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
              {c.isCustom ? " (custom)" : ""}
            </option>
          ))}
        </select>
        {state ? (
          <div className="mt-2 flex gap-2">
            <input
              className={`${inputClassName} flex-1`}
              placeholder="Add city if not listed"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void addCustomCity()}
              className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
            >
              Add
            </button>
          </div>
        ) : null}
      </FormField>
    </>
  );
}
