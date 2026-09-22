"use client";

import React, { useState } from "react";
import { Search, Play, Train, MapPin, Calendar, Users, CheckSquare, Layers } from "lucide-react";
import { BD_STATIONS, BD_TRAINS, BD_CLASSES } from "@/lib/stations";

interface WatchFormProps {
  onSearchOnce: (params: any) => void;
  onStartMonitoring: (params: any) => void;
  loading: boolean;
}

export const WatchForm: React.FC<WatchFormProps> = ({
  onSearchOnce,
  onStartMonitoring,
  loading,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [fromStation, setFromStation] = useState("DHAKA");
  const [toStation, setToStation] = useState("SYLHET");
  const [journeyDate, setJourneyDate] = useState(defaultDateStr);
  const [passengerCount, setPassengerCount] = useState(1);
  const [allTrains, setAllTrains] = useState(true);
  const [selectedTrains, setSelectedTrains] = useState<string[]>(["Parabat Express"]);
  const [allClasses, setAllClasses] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Snigdha"]);

  const handleTrainToggle = (train: string) => {
    if (train === "ALL MATCHING TRAINS") {
      setAllTrains(true);
      return;
    }
    setAllTrains(false);
    setSelectedTrains((prev) =>
      prev.includes(train) ? prev.filter((t) => t !== train) : [...prev, train]
    );
  };

  const handleClassToggle = (cls: string) => {
    if (cls === "ALL MATCHING CLASSES") {
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
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <Train className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Availability Search & Watch Setup
          </h2>
        </div>
        <span className="text-xs text-zinc-400">
          Official Bangladesh Railway e-Ticket Portal
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* From Station */}
        <div>
          <label className="mb-1.5 flex items-center space-x-1.5 text-xs font-medium text-zinc-300">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>From Station</span>
          </label>
          <input
            list="from-stations"
            type="text"
            value={fromStation}
            onChange={(e) => setFromStation(e.target.value.toUpperCase())}
            placeholder="e.g. DHAKA"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <datalist id="from-stations">
            {BD_STATIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* To Station */}
        <div>
          <label className="mb-1.5 flex items-center space-x-1.5 text-xs font-medium text-zinc-300">
            <MapPin className="h-3.5 w-3.5 text-rose-400" />
            <span>To Station</span>
          </label>
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
            <span>Passenger Count</span>
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

      {/* Train & Class Filtering Sections */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Train Selection */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-300">
              <Train className="h-3.5 w-3.5 text-emerald-400" />
              <span>Preferred Trains</span>
            </span>
            <button
              type="button"
              onClick={() => setAllTrains(!allTrains)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                allTrains
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {allTrains ? "✓ ALL MATCHING TRAINS" : "Custom Train Filter"}
            </button>
          </div>

          {!allTrains && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {BD_TRAINS.filter((t) => t !== "ALL MATCHING TRAINS").map((train) => (
                <button
                  key={train}
                  type="button"
                  onClick={() => handleTrainToggle(train)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                    selectedTrains.includes(train)
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                  }`}
                >
                  {train}
                </button>
              ))}
            </div>
          )}
          {allTrains && (
            <p className="text-xs text-zinc-500 italic">
              Monitoring will trigger an alert if seats become available on ANY matching train for this route.
            </p>
          )}
        </div>

        {/* Seat Class Selection */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-300">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Preferred Classes</span>
            </span>
            <button
              type="button"
              onClick={() => setAllClasses(!allClasses)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                allClasses
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {allClasses ? "✓ ALL CLASSES" : "Custom Class Filter"}
            </button>
          </div>

          {!allClasses && (
            <div className="flex flex-wrap gap-1.5">
              {BD_CLASSES.filter((c) => c !== "ALL MATCHING CLASSES").map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleClassToggle(cls)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                    selectedClasses.includes(cls)
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          )}
          {allClasses && (
            <p className="text-xs text-zinc-500 italic">
              Monitoring will check all classes (Snigdha, AC_S, AC_B, Shovon Chair, Shovon).
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-zinc-800/80 pt-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => onSearchOnce(getPayload())}
          className="flex items-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
        >
          <Search className="h-4 w-4 text-zinc-400" />
          <span>Search Once</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onStartMonitoring(getPayload())}
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>START MONITORING</span>
        </button>
      </div>
    </div>
  );
};
