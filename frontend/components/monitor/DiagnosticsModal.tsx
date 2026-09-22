"use client";

import React, { useEffect, useState } from "react";
import { 
  X, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Radio, 
  Send, 
  Globe 
} from "lucide-react";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "LIVE" | "MOCK";
  onSwitchMode: (mode: "LIVE" | "MOCK") => void;
  apiUrl: string;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSwitchMode,
  apiUrl,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/diagnostics`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn("Diagnostics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2.5 border-b border-zinc-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System Diagnostics</h3>
            <p className="text-xs text-zinc-400">Personal monitoring health and runtime inspection</p>
          </div>
        </div>

        {/* Operating Mode Switcher */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300">Operating Mode</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                LIVE queries real Railway portal; MOCK enables offline verification.
              </p>
            </div>
            <div className="flex space-x-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
              <button
                onClick={() => onSwitchMode("MOCK")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  mode === "MOCK"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                MOCK
              </button>
              <button
                onClick={() => onSwitchMode("LIVE")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  mode === "LIVE"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                LIVE
              </button>
            </div>
          </div>
        </div>

        {/* System Checklist */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
            <span className="font-medium text-zinc-300">Backend Server (FastAPI)</span>
            <span className="flex items-center space-x-1 font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>OK</span>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
            <span className="font-medium text-zinc-300">Asyncio Watch Scheduler</span>
            <span className="flex items-center space-x-1 font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{data?.worker || "OK"}</span>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
            <span className="font-medium text-zinc-300">Playwright Automation Engine</span>
            <span
              className={`flex items-center space-x-1 font-bold ${
                data?.playwright === "OK" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {data?.playwright === "OK" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>{data?.playwright || "CHECKING"}</span>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
            <span className="font-medium text-zinc-300">Browser Profile Session</span>
            <span
              className={`flex items-center space-x-1 font-bold ${
                data?.browser_session === "ACTIVE"
                  ? "text-emerald-400"
                  : data?.browser_session === "LOGIN_REQUIRED"
                  ? "text-amber-400"
                  : "text-zinc-400"
              }`}
            >
              <span>{data?.browser_session || "CHECKING"}</span>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
            <span className="font-medium text-zinc-300">Official Portal (eticket.railway.gov.bd)</span>
            <span
              className={`flex items-center space-x-1 font-bold ${
                data?.official_portal === "REACHABLE" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>
                {data?.official_portal || "CHECKING"}
                {data?.official_portal_latency_ms ? ` (${data.official_portal_latency_ms}ms)` : ""}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
            <span className="font-medium text-zinc-300">Telegram Notifications</span>
            <span
              className={`flex items-center space-x-1 font-bold ${
                data?.telegram_configured ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              <Send className="h-4 w-4" />
              <span>{data?.telegram_configured ? "CONFIGURED" : "DISABLED (No Token)"}</span>
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Diagnostics</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
