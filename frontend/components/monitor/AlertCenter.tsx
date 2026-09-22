"use client";

import React from "react";
import { BellRing, ExternalLink, CheckCircle2, VolumeX, AlertOctagon } from "lucide-react";

export interface ActiveAlert {
  alert_id?: number;
  watch_id?: string;
  train: string;
  class_name: string;
  previous_availability: number;
  current_availability: number;
  from_station?: string;
  to_station?: string;
  journey_date?: string;
  detected_at: string;
  message?: string;
  acknowledged_at?: string | null;
}

interface AlertCenterProps {
  alerts: ActiveAlert[];
  isAlarmPlaying: boolean;
  onStopAlarm: () => void;
  onAcknowledgeAlert: (id: number) => void;
  onOpenOfficialBooking: (alert: ActiveAlert) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  alerts,
  isAlarmPlaying,
  onStopAlarm,
  onAcknowledgeAlert,
  onOpenOfficialBooking,
}) => {
  if (alerts.length === 0 && !isAlarmPlaying) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-rose-500/80 bg-rose-950/30 p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-800/50 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wide text-rose-200">
              🚨 HIGH PRIORITY: TICKET AVAILABILITY DETECTED
            </h3>
            <p className="text-xs text-rose-300/80">
              Seat availability detected from official Bangladesh Railway e-Ticketing portal.
            </p>
          </div>
        </div>

        {isAlarmPlaying && (
          <button
            onClick={onStopAlarm}
            className="flex items-center space-x-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500 transition active:scale-95"
          >
            <VolumeX className="h-4 w-4" />
            <span>STOP SIREN SOUND</span>
          </button>
        )}
      </div>

      {/* Active Alerts List */}
      <div className="mt-4 space-y-3">
        {alerts.map((al, idx) => (
          <div
            key={al.alert_id || idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-700/60 bg-zinc-950/80 p-4 shadow-md"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-white">{al.train}</span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/30">
                  {al.class_name}
                </span>
                <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-300 border border-rose-500/30">
                  {al.current_availability} SEATS AVAILABLE
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                {al.from_station && al.to_station && (
                  <span>
                    Route: <b className="text-zinc-200">{al.from_station} → {al.to_station}</b>
                  </span>
                )}
                {al.journey_date && (
                  <span>
                    Date: <b className="text-zinc-200">{al.journey_date}</b>
                  </span>
                )}
                <span>
                  Transition: <b className="text-zinc-200">{al.previous_availability} → {al.current_availability} seats</b>
                </span>
                <span>
                  Detected: <b className="text-emerald-400">{new Date(al.detected_at).toLocaleTimeString()}</b>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 self-end sm:self-center">
              {al.alert_id && !al.acknowledged_at && (
                <button
                  onClick={() => onAcknowledgeAlert(al.alert_id!)}
                  className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Acknowledge</span>
                </button>
              )}

              <button
                onClick={() => onOpenOfficialBooking(al)}
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-900/30 hover:bg-emerald-500 transition"
              >
                <span>OPEN OFFICIAL BOOKING</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex items-center space-x-2 text-[11px] text-rose-300/70 border-t border-rose-900/30 pt-2.5">
        <AlertOctagon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Availability is detected from the official portal. This application does not guarantee ticket purchase. You must complete final purchase, OTP, and payment on the official Bangladesh Railway website.
        </span>
      </div>
    </div>
  );
};
