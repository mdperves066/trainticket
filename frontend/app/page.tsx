"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/monitor/Header";
import { WatchForm } from "@/components/monitor/WatchForm";
import { AlertCenter, ActiveAlert } from "@/components/monitor/AlertCenter";
import { LiveAvailabilityTable, LiveItem } from "@/components/monitor/LiveAvailabilityTable";
import { WatchList, WatchJob } from "@/components/monitor/WatchList";
import { EventTimeline, TimelineEvent } from "@/components/monitor/EventTimeline";
import { DiagnosticsModal } from "@/components/monitor/DiagnosticsModal";
import { alarmController } from "@/lib/alarm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_ENDPOINT || "http://localhost:8000";

export default function Home() {
  const [mode, setMode] = useState<"LIVE" | "MOCK">("MOCK");
  const [sessionStatus, setSessionStatus] = useState("ACTIVE");
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveItems, setLiveItems] = useState<LiveItem[]>([]);
  const [liveSource, setLiveSource] = useState<string>("MOCK");
  const [lastChecked, setLastChecked] = useState<string>("");
  const [nextCheckSeconds, setNextCheckSeconds] = useState<number | undefined>(undefined);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [watchJobs, setWatchJobs] = useState<WatchJob[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);

  // Tab Title Flashing Ref
  const titleIntervalRef = useRef<any>(null);
  const originalTitleRef = useRef<string>("BD Railway Ticket Monitor");

  // Load initial data
  const fetchData = async () => {
    try {
      // 1. Session status
      const sessRes = await fetch(`${API_BASE}/api/session/status`);
      if (sessRes.ok) {
        const sess = await sessRes.json();
        setSessionStatus(sess.status);
        if (sess.mode) setMode(sess.mode);
      }

      // 2. Watch jobs
      const watchRes = await fetch(`${API_BASE}/api/watches`);
      if (watchRes.ok) {
        const watches = await watchRes.json();
        setWatchJobs(watches);
        const hasRunning = watches.some((w: any) => w.monitoring_enabled || w.current_status === "RUNNING");
        setIsMonitoring(hasRunning);
      }

      // 3. Alerts
      const alertRes = await fetch(`${API_BASE}/api/alerts?active_only=true`);
      if (alertRes.ok) {
        const alerts = await alertRes.json();
        setActiveAlerts(alerts);
        if (alerts.length > 0) {
          triggerAlarmSound();
        }
      }
    } catch (err) {
      console.warn("Initial data load failed:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      originalTitleRef.current = document.title;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    fetchData();

    // Server-Sent Events (SSE) Live Stream
    const eventSource = new EventSource(`${API_BASE}/api/events/stream`);

    eventSource.onopen = () => {
      console.log("SSE live connection established.");
    };

    eventSource.addEventListener("seat_alert", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        const alertData = payload.data;

        // Add to active alerts
        setActiveAlerts((prev) => {
          const exists = prev.some((a) => a.alert_id === alertData.alert_id);
          return exists ? prev : [alertData, ...prev];
        });

        // Add to timeline
        setTimelineEvents((prev) => [
          {
            train: alertData.train,
            class_name: alertData.class_name,
            previous_availability: alertData.previous_availability,
            current_availability: alertData.current_availability,
            event_type: "SEAT_AVAILABLE",
            detected_at: alertData.detected_at,
            details: alertData.message,
          },
          ...prev,
        ]);

        // Trigger alarm siren and notifications
        triggerAlarmSound();
        triggerDesktopNotification(alertData);
        startFlashingTitle(alertData.train, alertData.class_name, alertData.current_availability);
      } catch (err) {
        console.warn("Error parsing seat_alert:", err);
      }
    });

    eventSource.addEventListener("opportunity_closed", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data;

        // Remove from active alerts
        setActiveAlerts((prev) =>
          prev.filter(
            (a) => !(a.train === data.train && a.class_name === data.class_name)
          )
        );

        // Add to timeline
        setTimelineEvents((prev) => [
          {
            train: data.train,
            class_name: data.class_name,
            previous_availability: 1,
            current_availability: 0,
            event_type: "SEAT_SOLD_OUT",
            detected_at: data.detected_at,
            details: data.message,
          },
          ...prev,
        ]);

        stopFlashingTitle();
      } catch (err) {
        console.warn("Error parsing opportunity_closed:", err);
      }
    });

    eventSource.addEventListener("availability_update", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data;
        setLiveItems(data.items || []);
        setLiveSource(data.source || "OFFICIAL");
        setLastChecked(data.timestamp || new Date().toISOString());
      } catch (err) {
        console.warn("Error parsing availability_update:", err);
      }
    });

    eventSource.addEventListener("watch_countdown", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setNextCheckSeconds(Math.round(payload.data.sleep_duration));
      } catch (err) {
        // Ignored
      }
    });

    eventSource.addEventListener("watch_status", () => {
      fetchData();
    });

    eventSource.addEventListener("stop_alarm", () => {
      stopAlarmLocal();
    });

    eventSource.addEventListener("mode_change", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setMode(payload.data.mode);
      } catch (err) {
        // Ignored
      }
    });

    return () => {
      eventSource.close();
      stopAlarmLocal();
      stopFlashingTitle();
    };
  }, []);

  // Alarm Helpers
  const triggerAlarmSound = () => {
    alarmController.startSiren();
    setIsAlarmPlaying(true);
  };

  const stopAlarmLocal = () => {
    alarmController.stopSiren();
    setIsAlarmPlaying(false);
    stopFlashingTitle();
  };

  const handleStopAlarm = async () => {
    stopAlarmLocal();
    try {
      await fetch(`${API_BASE}/api/alerts/stop-alarm`, { method: "POST" });
    } catch (err) {
      // Ignored
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    alarmController.setMuted(nextMuted);
  };

  const handleTestAlarm = async () => {
    try {
      await fetch(`${API_BASE}/api/alerts/test`, { method: "POST" });
    } catch (err) {
      alarmController.testBeep();
    }
  };

  const triggerDesktopNotification = (alertData: any) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(`🚨 BD Railway Ticket Available!`, {
        body: `${alertData.train} [${alertData.class_name}]: ${alertData.current_availability} seats available!`,
        icon: "/favicon.ico",
      });
    }
  };

  const startFlashingTitle = (train: string, cls: string, count: number) => {
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
    let toggle = false;
    titleIntervalRef.current = setInterval(() => {
      document.title = toggle
        ? `🚨 ${count} SEATS! ${train} (${cls})`
        : `⚡ TICKET AVAILABLE NOW!`;
      toggle = !toggle;
    }, 700);
  };

  const stopFlashingTitle = () => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    document.title = originalTitleRef.current;
  };

  // User Actions
  const handleSearchOnce = async (params: any) => {
    setLoading(true);
    try {
      // Create watch and search once
      const createRes = await fetch(`${API_BASE}/api/watches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (createRes.ok) {
        const watch = await createRes.json();
        const searchRes = await fetch(`${API_BASE}/api/watches/${watch.id}/search-once`, {
          method: "POST",
        });
        if (searchRes.ok) {
          const sData = await searchRes.json();
          setLiveItems(sData.items || []);
          setLiveSource(sData.source || "OFFICIAL");
          setLastChecked(sData.timestamp);
        }
        fetchData();
      }
    } catch (err) {
      alert(`Search failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async (params: any) => {
    setLoading(true);
    try {
      const createRes = await fetch(`${API_BASE}/api/watches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (createRes.ok) {
        const watch = await createRes.json();
        await fetch(`${API_BASE}/api/watches/${watch.id}/start`, { method: "POST" });
        setIsMonitoring(true);
        fetchData();
      }
    } catch (err) {
      alert(`Start monitoring failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopWatch = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/watches/${id}/stop`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.warn("Stop watch failed:", err);
    }
  };

  const handleStartWatch = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/watches/${id}/start`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.warn("Start watch failed:", err);
    }
  };

  const handleDeleteWatch = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/watches/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.warn("Delete watch failed:", err);
    }
  };

  const handleSearchOnceExisting = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/watches/${id}/search-once`, { method: "POST" });
      if (res.ok) {
        const sData = await res.json();
        setLiveItems(sData.items || []);
        setLiveSource(sData.source || "OFFICIAL");
        setLastChecked(sData.timestamp);
      }
    } catch (err) {
      console.warn("Search once failed:", err);
    }
  };

  const handleExportHistory = (id: string, format: "csv" | "json") => {
    window.open(`${API_BASE}/api/watches/${id}/export?format=${format}`, "_blank");
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/acknowledge`, { method: "POST" });
      setActiveAlerts((prev) =>
        prev.map((a) => (a.alert_id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a))
      );
      stopAlarmLocal();
    } catch (err) {
      // Ignored
    }
  };

  const handleOpenOfficialBooking = (alert: any) => {
    const from = alert.from_station ? encodeURIComponent(alert.from_station) : "";
    const to = alert.to_station ? encodeURIComponent(alert.to_station) : "";
    const doj = alert.journey_date ? encodeURIComponent(alert.journey_date) : "";
    const url = `https://eticket.railway.gov.bd/booking/train/search?fromcity=${from}&tocity=${to}&doj=${doj}`;
    window.open(url, "_blank");
  };

  const handleOpenBrowserLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/session/open-login`, { method: "POST" });
      const data = await res.json();
      alert(data.message || "Opening official Railway login window...");
      fetchData();
    } catch (err) {
      alert(`Could not open browser login: ${err}`);
    }
  };

  const handleSwitchMode = async (newMode: "LIVE" | "MOCK") => {
    try {
      await fetch(`${API_BASE}/api/dev/mode?mode=${newMode}`, { method: "POST" });
      setMode(newMode);
      fetchData();
    } catch (err) {
      console.warn("Switch mode failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <Header
        mode={mode}
        sessionStatus={sessionStatus}
        isAlarmPlaying={isAlarmPlaying}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStopAlarm={handleStopAlarm}
        onTestAlarm={handleTestAlarm}
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
        onOpenLogin={handleOpenBrowserLogin}
        onToggleMode={() => handleSwitchMode(mode === "LIVE" ? "MOCK" : "LIVE")}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* High-Priority Active Alert Center */}
        <AlertCenter
          alerts={activeAlerts}
          isAlarmPlaying={isAlarmPlaying}
          onStopAlarm={handleStopAlarm}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onOpenOfficialBooking={handleOpenOfficialBooking}
        />

        {/* Watch Setup Form */}
        <WatchForm
          onSearchOnce={handleSearchOnce}
          onStartMonitoring={handleStartMonitoring}
          loading={loading}
        />

        {/* Live Availability Table */}
        <LiveAvailabilityTable
          items={liveItems}
          lastChecked={lastChecked}
          nextCheckSeconds={nextCheckSeconds}
          source={liveSource}
          isMonitoring={isMonitoring}
          onOpenBooking={(train, cls) => handleOpenOfficialBooking({ train, class_name: cls })}
        />

        {/* Watch Jobs List & Event Timeline */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WatchList
              watches={watchJobs}
              onStart={handleStartWatch}
              onStop={handleStopWatch}
              onSearchOnce={handleSearchOnceExisting}
              onDelete={handleDeleteWatch}
              onExport={handleExportHistory}
            />
          </div>

          <div>
            <EventTimeline
              events={timelineEvents}
              onClearHistory={() => setTimelineEvents([])}
            />
          </div>
        </div>
      </main>

      {/* Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        mode={mode}
        onSwitchMode={handleSwitchMode}
        apiUrl={API_BASE}
      />
    </div>
  );
}