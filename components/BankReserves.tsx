"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://banks.data.fdic.gov";

/* ---------------- helpers ---------------- */
async function fdicGet(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<any> {
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

type FinancialsRecord = {
  CERT: number;
  NAME: string;
  REPDTE: string;
  CHBAL?: number;
  CHFRB?: number;
  LIAB?: number;
  [key: string]: string | number | undefined;
};

function formatRepdte(rep: string | undefined): string {
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

  const [fin, setFin] = useState<FinancialsRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Autosuggest institutions by NAME
  useEffect(() => {
    let active = true;

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
        const rows: Institution[] = (data?.data || []).map(
          (d: { data: Institution }) => d.data
        );
        setSuggestions(rows);
      } catch (e: unknown) {
        if (active) {
          setError(e instanceof Error ? e.message : String(e));
        }
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
      const fields = ["NAME", "CERT", "REPDTE", "CHBAL", "CHFRB", "LIAB"].join(",");
      const data = await fdicGet("financials", {
        filters: `CERT:${cert}`,
        fields,
        sort_by: "REPDTE",
        sort_order: "desc",
        limit: 1,
        format: "json",
      });
      const row: FinancialsRecord | undefined = data?.data?.[0]?.data;
      setFin(row || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path
                    fillRule="evenodd"
                    d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Bank Reserves</h1>
                <p className="text-sm text-gray-500">FDIC Financial Data Analytics</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-500">Powered by FDIC API</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Search Banks</h2>
            <p className="text-gray-600">
              Find financial data and reserves information for FDIC-insured institutions
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => {
                setShowSuggestions(true);
                setQuery(e.target.value);
              }}
              placeholder="Enter bank name (e.g., Chase, Wells Fargo, Bank of America)..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <p className="text-sm font-medium text-gray-700">Search Results</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((s) => {
                const label = `${s.NAME} (${s.CITY}, ${s.STNAME})`;
                return (
                  <button
                    key={s.CERT}
                    onClick={() => {
                      setQuery(label);
                      setShowSuggestions(false);
                      setSuggestions([]);
                      setShowRaw(false);
                      loadFinancials(s.CERT);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{s.NAME}</p>
                        <p className="text-sm text-gray-500">
                          {s.CITY}, {s.STNAME}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">CERT #{s.CERT}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error & Loading */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error Loading Data</p>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800 font-medium">Loading financial data...</p>
            </div>
          </div>
        )}

        {/* Bank Data */}
        {fin && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{fin.NAME}</h2>
                  <p className="text-blue-100 text-sm">
                    Financial Data as of {formatRepdte(fin.REPDTE)}
                  </p>
                </div>
                <button
                  className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                  onClick={() => setShowRaw((v) => !v)}
                >
                  {showRaw ? "Hide JSON" : "Show JSON"}
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* CHBAL */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-medium text-green-800">Cash & Balances Due</h3>
                  <p className="text-2xl font-bold text-green-900">${fmtMoney(fin.CHBAL)}</p>
                  <p className="text-xs text-green-600 mt-1">CHBAL</p>
                </div>
                {/* CHFRB */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800">Fed Balances</h3>
                  <p className="text-2xl font-bold text-blue-900">${fmtMoney(fin.CHFRB)}</p>
                  <p className="text-xs text-blue-600 mt-1">CHFRB</p>
                </div>
                {/* LIAB */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-sm font-medium text-red-800">Total Liabilities</h3>
                  <p className="text-2xl font-bold text-red-900">${fmtMoney(fin.LIAB)}</p>
                  <p className="text-xs text-red-600 mt-1">LIAB</p>
                </div>
              </div>

              {/* Ratios */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Liquidity Ratio</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      {liquidityRatio != null
                        ? `${(liquidityRatio * 100).toFixed(2)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Cash & Balances ÷ Total Liabilities
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Fed Reserves Ratio</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      {fedOnlyRatio != null
                        ? `${(fedOnlyRatio * 100).toFixed(2)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Fed Balances ÷ Total Liabilities
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              {showRaw && (
                <div className="border-t mt-6 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Raw API Response
                  </h3>
                  <pre className="text-xs overflow-auto bg-gray-900 text-green-400 p-4 rounded-lg max-h-64">
                    {JSON.stringify(fin, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
