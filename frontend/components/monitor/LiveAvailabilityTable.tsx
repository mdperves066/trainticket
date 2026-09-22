"use client";

import React from "react";
import { Train, ExternalLink, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export interface LiveItem {
  train_name: string;
  class_name: string;
  available_count: number;
  fare?: number;
  departure_time?: string;
  arrival_time?: string;
  status: string;
  raw_source_label?: string;
}

interface LiveAvailabilityTableProps {
  items: LiveItem[];
  lastChecked?: string;
  nextCheckSeconds?: number;
  source: string;
  isMonitoring: boolean;
  onOpenBooking: (train: string, cls: string) => void;
}

export const LiveAvailabilityTable: React.FC<LiveAvailabilityTableProps> = ({
  items,
  lastChecked,
  nextCheckSeconds,
  source,
  isMonitoring,
  onOpenBooking,
}) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <Train className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Live Availability Table
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              source === "OFFICIAL"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
            }`}
          >
            {source === "OFFICIAL" ? "OFFICIAL PORTAL" : "MOCK SOURCE"}
          </span>
        </div>

        {/* Polling & Countdown Status */}
        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          {isMonitoring && (
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Monitoring Active</span>
              {typeof nextCheckSeconds === "number" && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-mono">
                  Next in ~{nextCheckSeconds}s
                </span>
              )}
            </div>
          )}
          {lastChecked && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span>Last checked: <b className="text-zinc-300">{new Date(lastChecked).toLocaleTimeString()}</b></span>
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Train className="h-10 w-10 text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-400">No availability results yet.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Fill the journey parameters above and click <b>Search Once</b> or <b>Start Monitoring</b> to check official seat availability.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/40 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Train Name</th>
                <th className="py-3 px-4">Seat Class</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Fare</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Official Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {items.map((item, index) => {
                const isAvailable = item.available_count > 0;
                return (
                  <tr
                    key={index}
                    className={`transition hover:bg-zinc-800/40 ${
                      isAvailable ? "bg-emerald-950/15" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{item.train_name}</div>
                      {(item.departure_time || item.arrival_time) && (
                        <div className="text-xs text-zinc-400">
                          {item.departure_time} {item.arrival_time ? `→ ${item.arrival_time}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
                        {item.class_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isAvailable ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-base">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>{item.available_count} Seats</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-zinc-400 text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                          <span>SOLD OUT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {item.fare ? `৳ ${item.fare}` : "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "AVAILABLE"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : item.status === "PARSE_ERROR"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenBooking(item.train_name, item.class_name)}
                        className={`inline-flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isAvailable
                            ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-900/40"
                            : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        <span>Open Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
