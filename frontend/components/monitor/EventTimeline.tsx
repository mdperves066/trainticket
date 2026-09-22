"use client";

import React from "react";
import { History, BellRing, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { formatDhakaTime } from "@/lib/formatTime";

export interface TimelineEvent {
  id?: number;
  train: string;
  class_name: string;
  previous_availability: number;
  current_availability: number;
  event_type: string;
  detected_at: string;
  details?: string;
  closed_at?: string | null;
}

interface EventTimelineProps {
  events: TimelineEvent[];
  onClearHistory?: () => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events, onClearHistory }) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Availability Event Timeline
          </h2>
        </div>
        {events.length > 0 && onClearHistory && (
          <button
            onClick={onClearHistory}
            className="text-xs text-zinc-400 hover:text-rose-400 transition"
          >
            Clear History
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          No state transition events recorded yet. Transitions (e.g. 0 → 2 seats) will appear here in real-time.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
          {events.slice(0, 20).map((ev, idx) => {
            const isAlert = ev.event_type === "SEAT_AVAILABLE";
            const isClosed = ev.event_type === "SEAT_SOLD_OUT";

            return (
              <div key={ev.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                    isAlert
                      ? "bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse"
                      : isClosed
                      ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                      : "bg-indigo-500/20 text-indigo-400 border-indigo-500"
                  }`}
                >
                  {isAlert ? (
                    <BellRing className="h-3 w-3" />
                  ) : isClosed ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs transition group-hover:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {ev.train} — <span className="text-zinc-300">{ev.class_name}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-zinc-400 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>{formatDhakaTime(ev.detected_at)} BST</span>
                    </span>
                  </div>

                  <div className="mt-1 flex items-center space-x-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        isAlert
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : isClosed
                          ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {ev.event_type}
                    </span>

                    <div className="flex items-center space-x-1 font-mono text-zinc-300">
                      <span className="text-zinc-500">{ev.previous_availability} seats</span>
                      <ArrowRight className="h-3 w-3 text-zinc-500" />
                      <span className={isAlert ? "font-bold text-emerald-400" : "text-zinc-400"}>
                        {ev.current_availability} seats
                      </span>
                    </div>
                  </div>

                  {ev.details && (
                    <p className="mt-1 text-[11px] text-zinc-400">{ev.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
