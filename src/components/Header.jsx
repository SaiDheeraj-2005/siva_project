import React from "react";

export default function Header({ onLogout }) {
  return (
    <header
      style={{
        width: "100%",
        background: "#1B275A", // Matches the SMH Rail logo blue
        minHeight: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px 0 24px",
        boxSizing: "border-box",
        boxShadow: "0 2px 8px #0001",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src="/logo.png"
          alt="SMH Rail Logo"
          style={{
            height: 48,
            marginRight: 16,
            background: "#fff",
            borderRadius: 8,
            padding: 6,
            boxShadow: "0 1px 6px #0002"
          }}
        />
        <span
          style={{
            color: "#8ba1c5",
            fontStyle: "italic",
            fontSize: 13,
            letterSpacing: 1,
            marginTop: 8,
          }}
        >
          {/* You can add the company subtitle here if needed */}
        </span>
      </div>
      {onLogout && (
        <button
        onClick={onLogout}
        style={{
            background: "#ef4444",
            color: "#fff",
            fontWeight: 600,
            padding: "6px 18px",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            boxShadow: "0 1px 4px #0001",
            cursor: "pointer",
            transition: "background 0.2s"
        }}
        >
        Logout
        </button>
      )}
    </header>
  );
}