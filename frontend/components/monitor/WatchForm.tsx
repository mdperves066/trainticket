"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Play, 
  Train, 
  MapPin, 
  Calendar, 
  Users, 
  Layers, 
  ArrowLeftRight, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { BD_STATIONS } from "@/lib/stations";

export interface DiscoveredTrain {
  train_name: string;
  train_number?: string;
  departure_time?: string;
  classes: string[];
  schedule_status: string;
  status_detail?: string;
}

interface WatchFormProps {
  onSearchOnce: (params: any) => void;
  onStartMonitoring: (params: any) => void;
  loading: boolean;
  apiUrl?: string;
}

export const WatchForm: React.FC<WatchFormProps> = ({
  onSearchOnce,
  onStartMonitoring,
  loading,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_ENDPOINT || "http://localhost:8000",
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [fromStation, setFromStation] = useState("DHAKA");
  const [toStation, setToStation] = useState("SYLHET");
  const [journeyDate, setJourneyDate] = useState(defaultDateStr);
  const [passengerCount, setPassengerCount] = useState(1);

  // Dynamic discovery state
  const [discovering, setDiscovering] = useState(false);
  const [routeLabel, setRouteLabel] = useState("Dhaka → Sylhet");
  const [discoveredTrains, setDiscoveredTrains] = useState<DiscoveredTrain[]>([]);
  const [discoveredClasses, setDiscoveredClasses] = useState<string[]>(["Snigdha", "Shovon Chair", "AC_B", "AC_S"]);
  const [allTrains, setAllTrains] = useState(true);
  const [selectedTrains, setSelectedTrains] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Snigdha"]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Debounced train discovery when route or date changes
  useEffect(() => {
    let active = true;
    const fetchDiscovered = async () => {
      if (!fromStation || !toStation || fromStation.trim() === toStation.trim()) {
        setDiscoveredTrains([]);
        setRouteLabel(`${fromStation} → ${toStation}`);
        return;
      }

      setDiscovering(true);
      setDiscoveryError(null);

      try {
        const query = new URLSearchParams({
          from_station: fromStation.trim(),
          to_station: toStation.trim(),
          journey_date: journeyDate,
        });

        const res = await fetch(`${apiUrl}/api/trains/discover?${query.toString()}`);
        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          setRouteLabel(data.route_label || `${fromStation} → ${toStation}`);
          const trains: DiscoveredTrain[] = data.trains || [];
          setDiscoveredTrains(trains);

          const classes: string[] = data.available_classes && data.available_classes.length > 0
            ? data.available_classes
            : ["Snigdha", "Shovon Chair", "AC_B", "AC_S"];
          setDiscoveredClasses(classes);

          // If current selections are not in the new route's trains, reset selection
          const validTrainNames = trains.map((t) => t.train_name);
          setSelectedTrains((prev) => {
            const filtered = prev.filter((t) => validTrainNames.includes(t));
            if (filtered.length > 0) return filtered;
            return validTrainNames.length > 0 ? [validTrainNames[0]] : [];
          });

          // Ensure selected classes are valid
          setSelectedClasses((prev) => {
            const filtered = prev.filter((c) => classes.includes(c));
            return filtered.length > 0 ? filtered : [classes[0] || "Snigdha"];
          });
        } else {
          setDiscoveryError("Could not retrieve timetable for this route. Using standard discovery.");
        }
      } catch (err: any) {
        if (!active) return;
        setDiscoveryError("Network error querying route train services.");
      } finally {
        if (active) setDiscovering(false);
      }
    };

    const timer = setTimeout(fetchDiscovered, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fromStation, toStation, journeyDate, apiUrl]);

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleTrainToggle = (trainName: string) => {
    if (trainName === "ALL") {
      setAllTrains(true);
      return;
    }
    setAllTrains(false);
    setSelectedTrains((prev) =>
      prev.includes(trainName) ? prev.filter((t) => t !== trainName) : [...prev, trainName]
    );
  };

  const handleClassToggle = (cls: string) => {
    if (cls === "ALL") {
      setAllClasses(true);
      return;
    }
    setAllClasses(false);
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const getPayload = () => ({
    from_station: fromStation,
    to_station: toStation,
    journey_date: journeyDate,
    passenger_count: Number(passengerCount),
    selected_trains: allTrains ? ["ALL"] : selectedTrains.length ? selectedTrains : ["ALL"],
    selected_classes: allClasses ? ["ALL"] : selectedClasses.length ? selectedClasses : ["ALL"],
  });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <Train className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Real-Time Availability Search & Monitoring Setup
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-3 w-3" />
            <span>Official Portal Truth: eticket.railway.gov.bd</span>
          </span>
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
        {/* From Station */}
        <div>
          <label className="mb-1.5 flex items-center space-x-1.5 text-xs font-medium text-zinc-300">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>From Station (Origin)</span>
          </label>
          <div className="relative">
            <input
              list="from-stations"
              type="text"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value.toUpperCase())}
              placeholder="e.g. DHAKA or ঢাকা"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <datalist id="from-stations">
              {BD_STATIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Swap Button (Desktop & Mobile) */}
        <div className="hidden sm:block absolute lg:relative -top-2 lg:top-0">
          {/* Visual spacer on desktop */}
        </div>

        {/* To Station */}
        <div className="relative">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="flex items-center space-x-1.5 text-xs font-medium text-zinc-300">
              <MapPin className="h-3.5 w-3.5 text-rose-400" />
              <span>To Station (Destination)</span>
            </label>
            <button
              type="button"
              onClick={handleSwapStations}
              title="Swap From and To stations"
              className="flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-emerald-400 transition"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span>Swap</span>
            </button>
          </div>
          <input
            list="to-stations"
            type="text"
            value={toStation}
            onChange={(e) => setToStation(e.target.value.toUpperCase())}
            placeholder="e.g. SYLHET"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <datalist id="to-stations">
            {BD_STATIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Journey Date */}
        <div>
          <label className="mb-1.5 flex items-center space-x-1.5 text-xs font-medium text-zinc-300">
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            <span>Journey Date</span>
          </label>
          <input
            type="date"
            value={journeyDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setJourneyDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Passenger Count */}
        <div>
          <label className="mb-1.5 flex items-center space-x-1.5 text-xs font-medium text-zinc-300">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span>Passengers</span>
          </label>
          <select
            value={passengerCount}
            onChange={(e) => setPassengerCount(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={1}>1 Passenger</option>
            <option value={2}>2 Passengers</option>
            <option value={3}>3 Passengers</option>
            <option value={4}>4 Passengers (Max)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Route & Service Feedback Banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-emerald-400">{routeLabel}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Date: <b className="text-zinc-200">{journeyDate}</b></span>
        </div>

        <div className="flex items-center space-x-2">
          {discovering ? (
            <span className="flex items-center space-x-1.5 text-amber-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Discovering dynamic trains for route & date...</span>
            </span>
          ) : discoveredTrains.length > 0 ? (
            <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{discoveredTrains.length} relevant train services found</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-zinc-400">
              <AlertCircle className="h-3.5 w-3.5 text-zinc-500" />
              <span>No direct scheduled trains found for this route in timetable</span>
            </span>
          )}
        </div>
      </div>

      {/* Train & Class Filtering Sections */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Train Selection */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-300">
              <Train className="h-3.5 w-3.5 text-emerald-400" />
              <span>Relevant Trains ({allTrains ? "Monitoring ALL" : selectedTrains.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setAllTrains(!allTrains)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                allTrains
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {allTrains ? "✓ ALL MATCHING TRAINS" : "Select Specific Trains"}
            </button>
          </div>

          {!allTrains && (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {discoveredTrains.length === 0 ? (
                <div className="py-2 text-xs text-zinc-500 italic">
                  No train services available for this route & date. You can still search once to query official live portal.
                </div>
              ) : (
                discoveredTrains.map((t) => {
                  const isSelected = selectedTrains.includes(t.train_name);
                  const isSuspended = t.schedule_status === "TEMPORARILY_SUSPENDED";
                  const notScheduled = t.schedule_status === "NOT_SCHEDULED";

                  return (
                    <button
                      key={t.train_name}
                      type="button"
                      disabled={isSuspended}
                      onClick={() => handleTrainToggle(t.train_name)}
                      className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                        isSuspended
                          ? "bg-rose-950/40 text-rose-400/80 border-rose-900/50 cursor-not-allowed opacity-60"
                          : notScheduled
                          ? "bg-amber-950/30 text-amber-300 border-amber-800/40"
                          : isSelected
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                      }`}
                    >
                      <span>{t.train_name}</span>
                      {t.departure_time && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ({t.departure_time})
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-[9px] font-bold uppercase text-rose-400 bg-rose-900/40 px-1 rounded">
                          Suspended
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
          {allTrains && (
            <p className="text-xs text-zinc-400 italic">
              Monitoring will trigger an instant alert if seats become available on <b>ANY</b> matching train for {routeLabel}.
            </p>
          )}
        </div>

        {/* Seat Class Selection */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-300">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Seat Classes ({allClasses ? "All Classes" : selectedClasses.join(", ")})</span>
            </span>
            <button
              type="button"
              onClick={() => setAllClasses(!allClasses)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                allClasses
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {allClasses ? "✓ ALL CLASSES" : "Select Specific Classes"}
            </button>
          </div>

          {!allClasses && (
            <div className="flex flex-wrap gap-1.5">
              {discoveredClasses.map((cls) => {
                const isSelected = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassToggle(cls)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                      isSelected
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          )}
          {allClasses && (
            <p className="text-xs text-zinc-400 italic">
              Monitoring will check all available classes ({discoveredClasses.join(", ")}) on official results.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
        <div className="text-xs text-zinc-500">
          Source of truth: <span className="text-zinc-300 font-mono">eticket.railway.gov.bd</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            disabled={loading || discovering}
            onClick={() => onSearchOnce(getPayload())}
            className="flex items-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            <Search className="h-4 w-4 text-zinc-400" />
            <span>Search Once</span>
          </button>

          <button
            type="button"
            disabled={loading || discovering}
            onClick={() => onStartMonitoring(getPayload())}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>START MONITORING</span>
          </button>
        </div>
      </div>
    </div>
  );
};
