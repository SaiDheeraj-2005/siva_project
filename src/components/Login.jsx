// src/components/Login.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First check hardcoded credentials for backward compatibility
      let hardcodedRole = "";

      if (hardcodedRole) {
        // Use hardcoded credentials
        localStorage.setItem("role", hardcodedRole);
        localStorage.setItem("userLoggedIn", "true");
        localStorage.setItem("username", username);
        localStorage.removeItem("department");
        
        navigate("/dashboard", { replace: true });
      } else {
        // Try Supabase authentication
        const result = await authService.login(username, password);
        
        if (result.success) {
          // Navigate based on role
          navigate("/dashboard", { replace: true });
        } else {
          setError(result.error || "Invalid username or password");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
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
      {/* Background image with low opacity */}
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

      {/* Login card */}
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
          disabled={loading}
          style={{
            marginBottom: 12,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1.2px solid #bcd",
            fontSize: 16,
            background: "#f9fafb",
            opacity: loading ? 0.7 : 1,
          }}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          style={{
            marginBottom: 18,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1.2px solid #bcd",
            fontSize: 16,
            background: "#f9fafb",
            opacity: loading ? 0.7 : 1,
          }}
        />
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: loading ? "#6b7280" : "#15429f",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 8,
            fontSize: 17,
            boxShadow: "0 1px 8px #23366b14",
            letterSpacing: 0.5,
            marginBottom: 2,
            transition: "background 0.2s",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {/* Status indicator for Supabase connection */}
        <div style={{
          marginTop: 16,
          fontSize: 12,
          color: "#6b7280",
          textAlign: "center"
        }}>
          {loading ? "Connecting to database..." : "Secure connection with Supabase"}
        </div>
      </form>
    </div>
  );
}