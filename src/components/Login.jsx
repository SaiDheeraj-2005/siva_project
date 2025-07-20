import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper: get users from localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- Role checks (hardcoded first) ---
    let role = "";

    if (username === "superadmin" && password === "2219") {
      role = "SuperAdmin";
    } else if (username === "admin" && password === "admin") {
      role = "Admin";
    } else if (username === "user" && password === "user") {
      role = "Normal";
    } else {
      // --- Check against localStorage users (dynamic) ---
      const users = getUsers();
      const found = users.find(
        (u) => u.username === username && u.password === password
      );
      if (found) {
        // Support for users table: add "SuperAdmin" if ever needed
        if (found.level === "SuperAdmin") {
          role = "SuperAdmin";
        } else if (found.level === "Admin") {
          role = "Admin";
        } else {
          role = "Normal";
        }
      }
    }

    if (role) {
      localStorage.setItem("role", role);
      localStorage.setItem("userLoggedIn", "true");
      localStorage.setItem("username", username);
      // --- REMOVE department (do NOT set it) ---
      localStorage.removeItem("department");
      // Route based on role
      if (role === "SuperAdmin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* --- Background image with low opacity --- */}
      <img
        src="/logo_2.png"
        alt="SMH Rail"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 1,
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />

      {/* --- Login card --- */}
      <form
        onSubmit={handleSubmit}
        style={{
          zIndex: 2,
          background: "rgba(255,255,255,0.98)",
          borderRadius: 16,
          boxShadow: "0 4px 40px #0003",
          minWidth: 350,
          maxWidth: 400,
          padding: "44px 32px 32px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Logo at the top */}
        <img
          src="/logo.png"
          alt="Company Logo"
          style={{
            width: 120,
            marginBottom: 14,
            marginTop: -36,
            filter: "drop-shadow(0 2px 4px #0001)",
          }}
        />

        <h2 style={{
          marginBottom: 18,
          fontWeight: "bold",
          letterSpacing: 1,
          color: "#23366b"
        }}>Sign In to Fact Form</h2>

        {error && (
          <div style={{ color: "#ef4444", marginBottom: 16, fontWeight: 500 }}>{error}</div>
        )}
        <input
          type="text"
          placeholder="Username"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          style={{
            marginBottom: 12,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1.2px solid #bcd",
            fontSize: 16,
            background: "#f9fafb",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            marginBottom: 18,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1.2px solid #bcd",
            fontSize: 16,
            background: "#f9fafb",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            background: "#15429f",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 8,
            fontSize: 17,
            boxShadow: "0 1px 8px #23366b14",
            letterSpacing: 0.5,
            marginBottom: 2,
            transition: "background 0.2s"
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}