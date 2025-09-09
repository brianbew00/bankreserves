"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://banks.data.fdic.gov";

/* ---------------- helpers ---------------- */
async function fdicGet(
  path: string,
  params: Record<string, string | number | undefined>
) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.append(k, String(v));
  }
  const apiKey = process.env.NEXT_PUBLIC_FDIC_API_KEY;
  if (apiKey) qs.set("api_key", apiKey);

  const url =
    path.startsWith("http")
      ? path
      : `${API_BASE}/${path.startsWith("api/") ? "" : "api/"}${path}?${qs.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `FDIC request failed: ${res.status} ${res.statusText}${
        text ? ` — ${text}` : ""
      }`
    );
  }
  return res.json();
}

type Institution = {
  CERT: number;
  NAME: string;
  CITY: string;
  STNAME: string;
};

function formatRepdte(rep: any) {
  if (!rep) return "—";
  const s = String(rep);
  if (s.length === 8 && /^\d{8}$/.test(s)) {
    const y = s.slice(0, 4),
      m = s.slice(4, 6),
      d = s.slice(6, 8);
    const dt = new Date(`${y}-${m}-${d}T00:00:00Z`);
    return isNaN(dt.getTime()) ? s : dt.toLocaleDateString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? s : dt.toLocaleDateString();
}

const fmtMoney = (n?: number) =>
  n != null && Number.isFinite(n)
    ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "—";

/* ---------------- component ---------------- */
export default function BankReserves() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Institution[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [fin, setFin] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Autosuggest institutions by NAME
  useEffect(() => {
    let active = true;

    // Don’t search while suggestions are intentionally hidden after a selection
    if (!showSuggestions) {
      setSuggestions([]);
      return () => {
        active = false;
      };
    }

    (async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setError(null);
      try {
        const data = await fdicGet("institutions", {
          search: `NAME:"${query.replace(/"/g, '\\"')}"`,
          fields: "CERT,NAME,CITY,STNAME",
          limit: 8,
          format: "json",
        });
        if (!active) return;
        const rows = (data?.data || []).map((d: any) => d.data as Institution);
        setSuggestions(rows);
      } catch (e: any) {
        if (active) setError(e.message || String(e));
      }
    })();

    return () => {
      active = false;
    };
  }, [query, showSuggestions]);

  async function loadFinancials(cert: number) {
    setLoading(true);
    setError(null);
    setFin(null);
    try {
      // BankFind financials aliases:
      // CHBAL (cash & balances due), CHFRB (Fed balances), LIAB (total liabilities)
      const fields = ["NAME", "CERT", "REPDTE", "CHBAL", "CHFRB", "LIAB"].join(
        ","
      );
      const data = await fdicGet("financials", {
        filters: `CERT:${cert}`,
        fields,
        sort_by: "REPDTE",
        sort_order: "desc",
        limit: 1,
        format: "json",
      });
      const row = data?.data?.[0]?.data;
      setFin(row || {});
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // Ratios as numbers; format in JSX
  const liquidityRatio: number | null = useMemo(() => {
    if (!fin?.CHBAL || !fin?.LIAB) return null;
    const cash = Number(fin.CHBAL);
    const liab = Number(fin.LIAB);
    if (!(cash > 0) || !(liab > 0)) return null;
    return cash / liab;
  }, [fin]);

  const fedOnlyRatio: number | null = useMemo(() => {
    if (!fin?.CHFRB || !fin?.LIAB) return null;
    const frb = Number(fin.CHFRB);
    const liab = Number(fin.LIAB);
    if (!(frb > 0) || !(liab > 0)) return null;
    return frb / liab;
  }, [fin]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Bank Reserves</h1>

      <input
        value={query}
        onChange={(e) => {
          setShowSuggestions(true); // typing re-enables autosuggest
          setQuery(e.target.value);
        }}
        placeholder="Type a bank name…"
        className="w-full border rounded px-3 py-2 mb-3"
      />

      {suggestions.length > 0 && (
        <div className="border rounded mb-3">
          {suggestions.map((s) => {
            const label = `${s.NAME} (${s.CITY}, ${s.STNAME})`;
            return (
              <button
                key={s.CERT}
                onClick={() => {
                  setQuery(label); // fill full label (Name + City, State)
                  setShowSuggestions(false); // hide autosuggest after selection
                  setSuggestions([]);
                  setShowRaw(false);
                  loadFinancials(s.CERT);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-slate-100"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {loading && <div className="mb-3">Loading…</div>}

      {fin && (
        <div className="border rounded p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-xl">{fin.NAME}</h2>
            <button
              className="text-xs text-slate-500 underline"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "Hide JSON" : "Show JSON"}
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-2">
            As of {formatRepdte(fin.REPDTE)}
          </p>

          <ul className="space-y-1">
            <li>
              <strong>CHBAL (Cash & balances due):</strong>{" "}
              {fmtMoney(fin.CHBAL)}
            </li>
            <li>
              <strong>CHFRB (Balances at Fed):</strong> {fmtMoney(fin.CHFRB)}
            </li>
            <li>
              <strong>LIAB (Total liabilities):</strong> {fmtMoney(fin.LIAB)}
            </li>
            <li>
              <strong>Liquidity ratio (CHBAL ÷ LIAB):</strong>{" "}
              {liquidityRatio != null
                ? `${(liquidityRatio * 100).toFixed(2)}%`
                : "—"}
            </li>
            <li>
              <strong>Fed balances ÷ liabilities (CHFRB ÷ LIAB):</strong>{" "}
              {fedOnlyRatio != null
                ? `${(fedOnlyRatio * 100).toFixed(2)}%`
                : "—"}
            </li>
          </ul>

          {showRaw && (
            <pre className="mt-4 text-xs overflow-auto bg-slate-50 p-3 rounded">
              {JSON.stringify(fin, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
