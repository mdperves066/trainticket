"use client";

import React from "react";
import { 
  Bookmark, 
  Play, 
  Square, 
  Trash2, 
  Search, 
  Download, 
  Clock, 
  Calendar, 
  Users, 
  Train, 
  AlertCircle 
} from "lucide-react";
import { formatDhakaTime } from "@/lib/formatTime";

export interface WatchJob {
  id: string;
  from_station: string;
  to_station: string;
  journey_date: string;
  passenger_count: number;
  selected_trains: string[];
  selected_classes: string[];
  monitoring_enabled: boolean;
  current_status: string;
  last_check_at?: string | null;
  next_check_at?: string | null;
  last_error?: string | null;
  created_at: string;
}

interface WatchListProps {
  watches: WatchJob[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onSearchOnce: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: "csv" | "json") => void;
}

export const WatchList: React.FC<WatchListProps> = ({
  watches,
  onStart,
  onStop,
  onSearchOnce,
  onDelete,
  onExport,
}) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <Bookmark className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Active Watch Jobs ({watches.length})
          </h2>
        </div>
        <span className="text-xs text-zinc-400">
          Continuous background check tasks
        </span>
      </div>

      {watches.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          No watch jobs created yet. Use the setup form above and click <b>START MONITORING</b>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {watches.map((w) => {
            const isRunning = w.monitoring_enabled || w.current_status === "RUNNING";

            return (
              <div
                key={w.id}
                className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 transition hover:border-zinc-700"
              >
                <div>
                  {/* Top line: Route and Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {w.from_station} → {w.to_station}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isRunning
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                          : w.current_status === "BACKOFF"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : w.current_status === "MANUAL_ACTION_REQUIRED"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      <span>● {w.current_status}</span>
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2.5 space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Date: <b className="text-zinc-300">{w.journey_date}</b></span>
                      <span className="text-zinc-600">|</span>
                      <Users className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{w.passenger_count} pass.</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Train className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="truncate">
                        Trains: <b className="text-zinc-300">{w.selected_trains.join(", ")}</b>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-zinc-500">Classes:</span>
                      <span className="text-zinc-300">{w.selected_classes.join(", ")}</span>
                    </div>

                    {w.last_check_at && (
                      <div className="flex items-center space-x-1 text-[11px] text-zinc-500 pt-1">
                        <Clock className="h-3 w-3" />
                        <span>Last check: {formatDhakaTime(w.last_check_at)} BST</span>
                      </div>
                    )}

                    {w.last_error && (
                      <div className="flex items-center space-x-1 text-[11px] text-amber-400/90 pt-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{w.last_error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center space-x-1.5">
                    {isRunning ? (
                      <button
                        onClick={() => onStop(w.id)}
                        className="flex items-center space-x-1 rounded-lg bg-rose-600/20 px-2.5 py-1.5 text-xs font-semibold text-rose-300 border border-rose-600/40 hover:bg-rose-600/30 transition"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onStart(w.id)}
                        className="flex items-center space-x-1 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-600/40 hover:bg-emerald-600/30 transition"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Start</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSearchOnce(w.id)}
                      title="Run single check now"
                      className="flex items-center space-x-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                    >
                      <Search className="h-3 w-3" />
                      <span>Check</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onExport(w.id, "csv")}
                      title="Export History CSV"
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete watch for ${w.from_station} → ${w.to_station}?`)) {
                          onDelete(w.id);
                        }
                      }}
                      title="Delete Watch Job"
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
