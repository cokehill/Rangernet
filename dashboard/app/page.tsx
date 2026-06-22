"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Radio,
  Users,
  Gift,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Siren,
  Leaf,
  Activity,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import dynamic from "next/dynamic";

// Leaflet must be client-only
const MapComponent = dynamic(() => import("../components/MapComponent"), { ssr: false });

type Incident = {
  id: string;
  type: string;
  zone: string;
  reporter: string;
  timestamp: string;
  status: "open" | "critical" | "resolved";
  rewarded: boolean;
};

const STATUS_COLOR: Record<string, string> = {
  critical: "#ef4444",
  open: "#f59e0b",
  resolved: "#22c55e",
};

const STATUS_LABEL: Record<string, string> = {
  critical: "Critical",
  open: "Open",
  resolved: "Resolved",
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTo, setBroadcastTo] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "err">("idle");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch("/api/incidents");
      const data = await res.json();
      setIncidents(data);
      setLastRefresh(new Date());
    } catch {
      // backend not up yet — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const stats = {
    total: incidents.length,
    critical: incidents.filter((i) => i.status === "critical").length,
    open: incidents.filter((i) => i.status === "open").length,
    rewarded: incidents.filter((i) => i.rewarded).length,
  };

  // Build bar chart data from incident types
  const typeMap: Record<string, number> = {};
  incidents.forEach((i) => {
    const label = i.type.replace(/^.{2} /, ""); // strip emoji
    typeMap[label] = (typeMap[label] || 0) + 1;
  });
  const chartData = Object.entries(typeMap).map(([name, count]) => ({ name, count }));

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !broadcastTo.trim()) return;
    setSending(true);
    setSendStatus("idle");
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: broadcastTo, message: broadcastMsg }),
      });
      setSendStatus(res.ok ? "ok" : "err");
      if (res.ok) { setBroadcastMsg(""); setBroadcastTo(""); }
    } catch {
      setSendStatus("err");
    } finally {
      setSending(false);
      setTimeout(() => setSendStatus("idle"), 3000);
    }
  };

  // Demo seed for judges if no backend
  const displayIncidents: Incident[] =
    incidents.length > 0
      ? incidents
      : [
          { id: "A1B2C3D4", type: "🔫 Suspected Poaching", zone: "North Zone (Igabi)", reporter: "+234801****000", timestamp: new Date(Date.now() - 120000).toISOString(), status: "critical", rewarded: false },
          { id: "E5F6G7H8", type: "🐘 Animal Near Crops", zone: "South Zone (Kachia)", reporter: "+234802****111", timestamp: new Date(Date.now() - 600000).toISOString(), status: "open", rewarded: true },
          { id: "I9J0K1L2", type: "🪓 Illegal Logging", zone: "East Zone (Kaura)", reporter: "+234803****222", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "resolved", rewarded: true },
        ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--forest-dark)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--forest-border)",
        background: "var(--forest-mid)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Leaf size={28} color="var(--ranger-green)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>RangerNet</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: -2 }}>Wildlife Conservation Command · Kaduna State</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ranger-green)", display: "inline-block" }} />
            Live · Updated {timeAgo(lastRefresh.toISOString())}
          </div>
          <button
            onClick={fetchIncidents}
            style={{ background: "transparent", border: "1px solid var(--forest-border)", borderRadius: 8, padding: "6px 12px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Reports", value: displayIncidents.length, icon: <Activity size={20} />, color: "#60a5fa" },
            { label: "Critical", value: displayIncidents.filter(i => i.status === "critical").length, icon: <Siren size={20} />, color: "#ef4444" },
            { label: "Open", value: displayIncidents.filter(i => i.status === "open").length, icon: <AlertTriangle size={20} />, color: "#f59e0b" },
            { label: "Rewards Sent", value: displayIncidents.filter(i => i.rewarded).length, icon: <Gift size={20} />, color: "#22c55e" },
          ].map((card) => (
            <div key={card.label} style={{
              background: "var(--forest-mid)",
              border: "1px solid var(--forest-border)",
              borderRadius: 12,
              padding: "20px 24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</span>
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Map + Feed row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, marginBottom: 24 }}>

          {/* Map */}
          <div style={{
            background: "var(--forest-mid)",
            border: "1px solid var(--forest-border)",
            borderRadius: 12,
            overflow: "hidden",
            minHeight: 380,
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--forest-border)", display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={16} color="var(--ranger-green)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Incident Map — Kaduna State</span>
            </div>
            <MapComponent incidents={displayIncidents} />
          </div>

          {/* Live Feed */}
          <div style={{
            background: "var(--forest-mid)",
            border: "1px solid var(--forest-border)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--forest-border)", display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} color="var(--ranger-green)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Live Incident Feed</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", maxHeight: 340 }}>
              {displayIncidents.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                  No incidents yet. Dial the USSD code to report.
                </div>
              ) : (
                displayIncidents.map((inc, i) => (
                  <div
                    key={inc.id}
                    className={i === 0 ? "animate-slide-in" : ""}
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid var(--forest-border)",
                      borderLeft: `3px solid ${STATUS_COLOR[inc.status]}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{inc.type}</span>
                      <span style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: STATUS_COLOR[inc.status] + "22",
                        color: STATUS_COLOR[inc.status],
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {STATUS_LABEL[inc.status]}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{inc.zone}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--text-dim)" }}>#{inc.id} · {timeAgo(inc.timestamp)}</span>
                      {inc.rewarded && (
                        <span style={{ fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 3 }}>
                          <Gift size={11} /> ₦50 sent
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chart + Broadcast row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 }}>

          {/* Chart */}
          <div style={{
            background: "var(--forest-mid)",
            border: "1px solid var(--forest-border)",
            borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Users size={16} color="var(--ranger-green)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Incidents by Type</span>
            </div>
            {chartData.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#86efac" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#86efac" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#112218", border: "1px solid #1e3a28", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#f0fdf4" }}
                    cursor={{ fill: "#1e3a2855" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={["#22c55e", "#f59e0b", "#ef4444", "#60a5fa"][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Broadcast SMS */}
          <div style={{
            background: "var(--forest-mid)",
            border: "1px solid var(--forest-border)",
            borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Send size={16} color="var(--ranger-green)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Broadcast Alert</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recipient Phone
                </label>
                <input
                  type="text"
                  placeholder="+2348012345678"
                  value={broadcastTo}
                  onChange={(e) => setBroadcastTo(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--forest-dark)",
                    border: "1px solid var(--forest-border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Type alert message to rangers..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--forest-dark)",
                    border: "1px solid var(--forest-border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastMsg.trim() || !broadcastTo.trim()}
                style={{
                  background: sending ? "var(--forest-border)" : "var(--ranger-green)",
                  color: sending ? "var(--text-muted)" : "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 20px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: sending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s",
                }}
              >
                {sending ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                {sending ? "Sending…" : "Send SMS Alert"}
              </button>
              {sendStatus === "ok" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#22c55e", fontSize: 13 }}>
                  <CheckCircle2 size={14} /> Alert sent successfully
                </div>
              )}
              {sendStatus === "err" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 13 }}>
                  <XCircle size={14} /> Failed — check AT credentials
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "var(--text-dim)" }}>
          RangerNet · Built with Africa's Talking APIs (USSD · SMS · Airtime) · Kaduna State Wildlife Conservation
        </div>
      </main>
    </div>
  );
}
