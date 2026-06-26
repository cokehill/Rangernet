"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type Incident = {
  id: string;
  type: string;
  zone: string;
  reporter: string;
  timestamp: string;
  status: "open" | "critical" | "resolved";
  rewarded: boolean;
};

const ZONE_COORDS: Record<string, [number, number]> = {
  "North Zone (Igabi)": [10.8, 7.45],
  "South Zone (Kachia)": [9.85, 7.95],
  "East Zone (Kaura)": [10.0, 8.45],
  "West Zone (Birnin Gwari)": [11.0, 6.65],
  "Unknown": [10.52, 7.43],
};

const STATUS_COLOR: Record<string, string> = {
  critical: "#ef4444",
  open: "#f59e0b",
  resolved: "#22c55e",
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function MapComponent({ incidents }: { incidents: Incident[] }) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const mapCenter: LatLngExpression = [10.52, 7.43];

  return (
    <MapContainer
      center={mapCenter}
      zoom={8}
      style={{ height: 340, width: "100%", background: "#0a1a0f" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {incidents.map((inc) => {
        const coords = ZONE_COORDS[inc.zone] || ZONE_COORDS["Unknown"];
        const jitter = () => (Math.random() - 0.5) * 0.15;
        const markerCenter: LatLngExpression = [coords[0] + jitter(), coords[1] + jitter()];
        return (
          <CircleMarker
            key={inc.id}
            center={markerCenter}
            radius={inc.status === "critical" ? 12 : 8}
            pathOptions={{
              color: STATUS_COLOR[inc.status],
              fillColor: STATUS_COLOR[inc.status],
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "system-ui", fontSize: 13, lineHeight: 1.6, minWidth: 160 }}>
                <strong>{inc.type}</strong><br />
                {inc.zone}<br />
                <span style={{ color: "#888" }}>#{inc.id} · {timeAgo(inc.timestamp)}</span><br />
                <span style={{ color: STATUS_COLOR[inc.status], fontWeight: 600, textTransform: "capitalize" }}>
                  {inc.status}
                </span>
                {inc.rewarded && <span style={{ color: "#22c55e" }}> · ₦50 rewarded</span>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}