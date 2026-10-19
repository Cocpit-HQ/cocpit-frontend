"use client";

import { useEffect, useState } from "react";

export default function FeatureFlagTester() {
  const [flags, setFlags] = useState<any>(null);

  useEffect(() => {
    // Poll the backend config API every 2 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("https://cocpit-backend-staging.up.railway.app//api/config");
        const data = await res.json();
        setFlags(data.features || {});
      } catch (err) {
        console.error("Failed to fetch flags", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!flags) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "rgba(0,0,0,0.85)",
        color: "#00ff00",
        padding: "15px",
        borderRadius: "8px",
        zIndex: 9999,
        fontFamily: "monospace",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        minWidth: "250px",
        pointerEvents: "none"
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontSize: "14px", borderBottom: "1px solid #444", paddingBottom: "5px" }}>
        Live Feature Flags
      </h3>
      {Object.entries(flags).map(([key, value]) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
          <span style={{ color: "#aaa" }}>{key}:</span>
          <span style={{ color: value ? "#00ff00" : "#ff4444", fontWeight: "bold" }}>
            {value ? "TRUE" : "FALSE"}
          </span>
        </div>
      ))}
    </div>
  );
}
