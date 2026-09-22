"use client";

import React from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Activity, 
  Radio, 
  LogIn, 
  Play, 
  Settings,
  BellRing
} from "lucide-react";

interface HeaderProps {
  mode: "LIVE" | "MOCK";
  sessionStatus: string;
  isAlarmPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onStopAlarm: () => void;
  onTestAlarm: () => void;
  onOpenDiagnostics: () => void;
  onOpenLogin: () => void;
  onToggleMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  sessionStatus,
  isAlarmPlaying,
  isMuted,
  onToggleMute,
  onStopAlarm,
  onTestAlarm,
  onOpenDiagnostics,
  onOpenLogin,
  onToggleMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Source Label */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                BD Railway Ticket Monitor
              </h1>
              {/* Mode Badge */}
              <button
                onClick={onToggleMode}
                title="Click to toggle between LIVE Official mode and MOCK mode"
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  mode === "LIVE"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                    : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25"
                }`}
              >
                {mode === "LIVE" ? "● LIVE OFFICIAL MODE" : "○ MOCK DEV MODE"}
              </button>
            </div>
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <span>Source:</span>
              <a
                href="https://eticket.railway.gov.bd/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 font-medium text-emerald-400 hover:underline"
              >
                <span>eticket.railway.gov.bd</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Status Badges & Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active Siren Banner if Sound Playing */}
          {isAlarmPlaying && (
            <div className="flex items-center space-x-2 rounded-lg bg-rose-500/20 px-3 py-1.5 border border-rose-500 animate-bounce">
              <BellRing className="h-4 w-4 text-rose-400 animate-spin" />
              <span className="text-xs font-bold text-rose-300">ALARM TRIGGERED!</span>
              <button
                onClick={onStopAlarm}
                className="rounded bg-rose-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                STOP ALARM
              </button>
            </div>
          )}

          {/* Session Status Badge */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border ${
              sessionStatus === "ACTIVE"
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                : sessionStatus === "LOGIN_REQUIRED"
                ? "bg-amber-950/40 text-amber-300 border-amber-800/50"
                : sessionStatus === "CAPTCHA_REQUIRED"
                ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
                : "bg-zinc-900 text-zinc-400 border-zinc-800"
            }`}
          >
            {sessionStatus === "ACTIVE" ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>SESSION: {sessionStatus}</span>
          </div>

          {/* Login Official Site Button */}
          <button
            onClick={onOpenLogin}
            title="Launch visible Chromium browser window to log in to Bangladesh Railway official account"
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
          >
            <LogIn className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Browser Login</span>
          </button>

          {/* Sound Controls */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute Alarm Sound" : "Mute Alarm Sound (Quiet Mode)"}
            className={`flex items-center justify-center rounded-lg p-1.5 text-xs font-medium border transition ${
              isMuted
                ? "bg-amber-950/30 text-amber-400 border-amber-800/40 hover:bg-amber-900/40"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={onTestAlarm}
            title="Test Alarm Sound & Siren"
            className="hidden sm:flex items-center space-x-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <Play className="h-3 w-3 text-indigo-400" />
            <span>Test Siren</span>
          </button>

          {/* Diagnostics Button */}
          <button
            onClick={onOpenDiagnostics}
            title="System Diagnostics & Health"
            className="flex items-center space-x-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Diagnostics</span>
          </button>
        </div>
      </div>
    </header>
  );
};
