// src/pages/SuperAdminDashboard.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ReadOnlyWebForm from "../components/ReadOnlyWebForm";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import {Trash2, Search, Edit2, Download, X, FileText } from "lucide-react";
import DashboardPage from "../pages/DashboardPage";
import { userManagementService } from '../services/authService';

// ----- LocalStorage helpers -----
const getDepartments = () => JSON.parse(localStorage.getItem("departments") || '[]');
const setDepartments = (depts) => localStorage.setItem("departments", JSON.stringify(depts));
const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
const setUsers = (users) => localStorage.setItem("users", JSON.stringify(users));
const getForms = () => JSON.parse(localStorage.getItem("forms") || "[]");
const setForms = (forms) => localStorage.setItem("forms", JSON.stringify(forms));
const getSummaryData = () => JSON.parse(localStorage.getItem("summaryFact") || "[]");
const setSummaryData = (data) => localStorage.setItem("summaryFact", JSON.stringify(data));

// Global formatDate function
const formatDate = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Function to convert DD/MM/YYYY string to Date object
const convertToDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

// ============= DATE PICKER MODAL =============
function DatePickerModal({ isOpen, onClose, onSubmit, title, defaultDate = "" }) {
  const [selectedDate, setSelectedDate] = useState(defaultDate || formatDate());

  const handleSubmit = () => {
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }
    onSubmit(selectedDate);
    onClose();
  };

  if (!isOpen) return null;

  // Convert DD/MM/YYYY to YYYY-MM-DD for input
  const convertToInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const convertFromInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0, right: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "24px",
        width: "400px",
        maxWidth: "90vw"
      }}>
        <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "bold" }}>
          {title}
        </h3>
        <input
          type="date"
          value={convertToInputFormat(selectedDate)}
          onChange={(e) => setSelectedDate(convertFromInputFormat(e.target.value))}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "16px"
          }}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "#f5f5f5",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer"
            }}
          >
            Confirm Date
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= APPROVAL STAMP COMPONENT =============
function ApprovalStamp({ status, date }) {
  if (!status || status === "Pending") return null;

  const isApproved = status === "Approved";
  
  return (
    <div style={{
      display: "inline-block",
      border: `3px solid ${isApproved ? "#16a34a" : "#dc2626"}`,
      borderRadius: "8px",
      padding: "12px 20px",
      margin: "10px 0",
      transform: "rotate(-5deg)",
      backgroundColor: isApproved ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"
    }}>
      <div style={{
        fontSize: "24px",
        fontWeight: "bold",
        color: isApproved ? "#16a34a" : "#dc2626",
        textAlign: "center",
        letterSpacing: "2px"
      }}>
        {isApproved ? "APPROVED" : "REJECTED"}
      </div>
      <div style={{
        fontSize: "12px",
        color: isApproved ? "#16a34a" : "#dc2626",
        textAlign: "center",
        marginTop: "4px"
      }}>
        <div>Designation: CMD</div>
        <div>Date: {date || formatDate()}</div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [section, setSection] = useState("dashboard");
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    function syncAuth() {
      setRole(localStorage.getItem("role") || "");
      setUsername(localStorage.getItem("username") || "");
    }
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    if (role !== "SuperAdmin") navigate("/");
  }, [role, navigate]);

  const handleLogout = () => {
    ["role", "userLoggedIn", "username", "department"].forEach(field => localStorage.removeItem(field));
    setRole("");
    setUsername("");
    navigate("/");
  };

  function renderSection() {
    switch (section) {
      case "dashboard": return <DashboardPage onQuickAction={setSection} />;
      case "user": return <UserManagement />;
      case "submitted": return <SubmittedForms />;
      case "approved": return <ApprovedForms />;
      case "rejected": return <RejectedForms />;
      case "summary": return <SummaryFact />;
      default: return <div>Welcome, select a section.</div>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <Header onLogout={handleLogout} />
      <div className="flex flex-1">
        <Sidebar section={section} setSection={setSection} role={role} />
        <div className="flex-1 p-8 w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            Welcome <span className="text-blue-700">{username}</span>
          </h2>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}


// ============= USER MANAGEMENT ==============
function generateRandomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; ++i) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Password Display Modal Component
function PasswordModal({ isOpen, onClose, username, password, action }) {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    alert("Password copied to clipboard!");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0, right: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "32px",
        width: "450px",
        maxWidth: "90vw",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#111", margin: 0 }}>
            {action === "create" ? "User Created Successfully!" : "Password Reset Successfully!"}
          </h3>
        </div>

        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>Username:</label>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#111", marginTop: "4px" }}>{username}</div>
          </div>
          
          <div>
            <label style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>Password:</label>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginTop: "4px",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "8px 12px"
            }}>
              <code style={{
                flex: 1,
                fontSize: "16px",
                fontWeight: "600",
                color: "#111",
                letterSpacing: "1px"
              }}>{password}</code>
              <button
                onClick={handleCopy}
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>

        <div style={{
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "start",
          gap: "8px"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p style={{ fontSize: "14px", color: "#92400e", margin: 0 }}>
            Please save this password securely. For security reasons, it cannot be retrieved later.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Reset Password Modal Component
function ResetPasswordModal({ isOpen, onClose, onSubmit, username }) {
  const [newPassword, setNewPassword] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);

  const handleSubmit = () => {
    if (!autoGenerate && !newPassword.trim()) {
      alert("Please enter a password or choose to auto-generate.");
      return;
    }
    
    const password = autoGenerate ? generateRandomString(10) : newPassword;
    onSubmit(password);
    setNewPassword("");
    setAutoGenerate(true);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0, right: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "32px",
        width: "450px",
        maxWidth: "90vw",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
      }}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
          Reset Password
        </h3>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          Reset password for user: <strong>{username}</strong>
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
            cursor: "pointer"
          }}>
            <input
              type="radio"
              checked={autoGenerate}
              onChange={() => setAutoGenerate(true)}
              style={{ marginRight: "8px" }}
            />
            <span style={{ fontSize: "16px" }}>Auto-generate secure password</span>
          </label>
          
          <label style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer"
          }}>
            <input
              type="radio"
              checked={!autoGenerate}
              onChange={() => setAutoGenerate(false)}
              style={{ marginRight: "8px" }}
            />
            <span style={{ fontSize: "16px" }}>Set custom password</span>
          </label>
        </div>

        {!autoGenerate && (
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value.slice(0, 10))}
            placeholder="Enter new password (max 10 characters)"
            maxLength={10}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "16px"
            }}
          />
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsersState] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "Normal" });
  const [editIdx, setEditIdx] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalData, setPasswordModalData] = useState({ username: "", password: "", action: "create" });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetUserId, setResetUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // Load users from Supabase on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await userManagementService.getAllUsers();
      if (result.success) {
        const mappedUsers = result.data.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }));
        setUsersState(mappedUsers);
      } else {
        setError("Failed to load users: " + result.error);
      }
    } catch (err) {
      setError("Error loading users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function validateUserForm() {
    if (!form.username || form.username.length > 10) {
      setError("Username must be maximum 10 characters.");
      return false;
    }
    if (form.password && form.password.length > 10) {
      setError("Password must be maximum 10 characters.");
      return false;
    }
    setError("");
    return true;
  }

  async function handleAddOrUpdateUser(e) {
    e.preventDefault();
    if (!validateUserForm()) return;
    
    setLoading(true);
    setError("");

    try {
      const password = form.password || generateRandomString(10);
      
      if (editIdx !== null) {
        // Update existing user (username and role only)
        const result = await userManagementService.updateUser(editUserId, {
          username: form.username,
          role: form.role
        });

        if (result.success) {
          await loadUsers();
          setForm({ username: "", password: "", role: "Normal" });
          setEditIdx(null);
          setEditUserId(null);
        } else {
          setError("Failed to update user: " + result.error);
        }
      } else {
        // Check if username already exists
        const exists = await userManagementService.checkUsernameExists(form.username);
        if (exists) {
          setError("Username already exists");
          setLoading(false);
          return;
        }

        // Create new user
        const result = await userManagementService.createUser({
          username: form.username,
          password: password,
          role: form.role
        });

        if (result.success) {
          await loadUsers();
          setForm({ username: "", password: "", role: "Normal" });
          
          // Show password modal
          setPasswordModalData({
            username: form.username,
            password: password,
            action: "create"
          });
          setShowPasswordModal(true);
        } else {
          setError("Failed to create user: " + result.error);
        }
      }
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  function handleEdit(idx) {
    const user = users[idx];
    setEditIdx(idx);
    setEditUserId(user.id);
    setForm({
      username: user.username,
      password: "",
      role: user.role
    });
    setError("");
  }
  
  async function removeUser() {
    if (!deleteUser) return;
    
    setLoading(true);
    setError("");
    setShowDeleteModal(false);
    
    try {
      const result = await userManagementService.deleteUser(deleteUser.id);
      
      if (result.success) {
        await loadUsers();
        
        // Clear edit state if we're deleting the user being edited
        if (editUserId === deleteUser.id) {
          setEditIdx(null);
          setEditUserId(null);
          setForm({ username: "", password: "", role: "Normal" });
        }
        
        // Show success message (optional)
        console.log(`User ${deleteUser.username} deleted successfully`);
      } else {
        setError("Failed to delete user: " + result.error);
      }
    } catch (err) {
      setError("Error deleting user: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteUser(null);
      setDeleteIndex(null);
    }
  }

  function handleDeleteClick(user, idx) {
    setDeleteUser(user);
    setDeleteIndex(idx);
    setShowDeleteModal(true);
  }
  
  function handleCancelEdit() {
    setEditIdx(null);
    setEditUserId(null);
    setForm({ username: "", password: "", role: "Normal" });
    setError("");
  }

  function handleResetPassword(user) {
    setResetUsername(user.username);
    setResetUserId(user.id);
    setShowResetModal(true);
  }

  async function handleResetPasswordSubmit(newPassword) {
    setLoading(true);
    setError("");
    
    try {
      // Use resetPassword method from userManagementService
      const result = await userManagementService.resetPassword(resetUserId, newPassword);

      if (result.success) {
        setShowResetModal(false);
        setPasswordModalData({
          username: resetUsername,
          password: newPassword,
          action: "reset"
        });
        setShowPasswordModal(true);
      } else {
        setError("Failed to reset password: " + result.error);
        setShowResetModal(false);
      }
    } catch (err) {
      setError("Error resetting password");
      console.error(err);
      setShowResetModal(false);
    } finally {
      setLoading(false);
    }
  }

  // Delete Confirmation Modal Component
  function DeleteConfirmationModal({ isOpen, onClose, onConfirm, username }) {
    if (!isOpen) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0, right: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "32px",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
              </svg>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#111", marginBottom: "8px" }}>
              Delete User Account
            </h3>
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Are you sure you want to delete <strong>{username}</strong>?
            </p>
          </div>

          <div style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "start",
            gap: "8px"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style={{ fontSize: "14px", color: "#92400e", margin: 0 }}>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "#dc2626",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add/Edit User Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {editIdx !== null ? "Edit User" : "Add New User"}
        </h3>
        
        <form className="space-y-4" onSubmit={handleAddOrUpdateUser}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter username (maximum 10 characters)"
              value={form.username}
              maxLength={10}
              onChange={e => setForm({ ...form, username: e.target.value.slice(0,10) })}
              required
              disabled={loading}
            />
          </div>
          
          {editIdx === null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Leave blank to auto-generate (maximum 10 characters)"
                value={form.password}
                maxLength={10}
                onChange={e => setForm({ ...form, password: e.target.value.slice(0,10) })}
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">If left empty, a secure password will be generated automatically</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              disabled={loading}
            >
              <option value="Normal">Normal User</option>
              <option value="Admin">Admin User</option>
              <option value="SuperAdmin">Super Admin User</option>
            </select>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400" 
              type="submit"
              disabled={loading}
            >
              {loading ? "Processing..." : (editIdx !== null ? "Update User" : "Add User")}
            </button>
            {editIdx !== null && (
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Users Table Card */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Existing Users</h3>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u, idx) => (
                <tr key={u.id || (u.username + idx)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-gray-600 font-medium text-sm">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      u.role === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                      u.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => handleEdit(idx)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-800 px-3 py-2 text-sm font-medium hover:bg-purple-50 rounded-lg transition-colors"
                        onClick={() => handleResetPassword(u)}
                        disabled={loading}
                      >
                        Reset Password
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 px-3 py-2 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDeleteClick(u, idx)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No users found. Add your first user above.</p>
            </div>
          )}
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4 text-blue-600 border-t">
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        username={passwordModalData.username}
        password={passwordModalData.password}
        action={passwordModalData.action}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSubmit={handleResetPasswordSubmit}
        username={resetUsername}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteUser(null);
          setDeleteIndex(null);
        }}
        onConfirm={removeUser}
        username={deleteUser?.username}
      />
    </div>
  );
}

// ============ SUMMARY FACT TAB ================
function SummaryFact() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterSecurityGroup, setFilterSecurityGroup] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({ id: '', companyList: '', securityGroup: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const syncApprovedForms = () => {
    const allForms = getForms();
    const approvedForms = allForms.filter(form => form.finalStatus === "Approved");
    
    const existingSummaryData = getSummaryData();
    const existingIds = new Set(existingSummaryData.map(item => item.id));
    
    const newSummaryEntries = approvedForms
      .filter(form => {
        const formId = form.factUserId || form.data?.factUserId || '';
        return formId && !existingIds.has(formId);
      })
      .map(form => {
        const formData = form.data || form;
        const factUserId = form.factUserId || formData.factUserId || '';
        
        const entityNames = Array.isArray(form.entityName || formData.entityName) 
          ? (form.entityName || formData.entityName).join(', ') 
          : form.entityName || formData.entityName || '';
        
        const securityGroup = form.securityGroupOther || 
                            formData.securityGroupOther || 
                            form.data?.securityGroupOther ||
                            '';
        
        const formSpecificKey = form.id ? `securityGroupOther_${form.id}` : null;
        const storedSecurityGroup = formSpecificKey ? localStorage.getItem(formSpecificKey) : null;
        
        return {
          id: factUserId,
          companyList: entityNames,
          securityGroup: storedSecurityGroup || securityGroup || ''
        };
      });
    
    const combinedData = [...existingSummaryData, ...newSummaryEntries];
    
    setSummaryData(combinedData);
    setData(combinedData);
  };

  useEffect(() => {
    const existingData = getSummaryData();
    setData(existingData);
    
    syncApprovedForms();
    
    const handleStorageChange = (e) => {
      if (e.key === 'forms') {
        syncApprovedForms();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const uniqueCompanies = useMemo(
    () => Array.from(new Set(data.map(item => item.companyList).filter(Boolean))).sort(),
    [data]
  );
  const uniqueSecurityGroups = useMemo(
    () => Array.from(new Set(data.map(item => item.securityGroup).filter(Boolean))).sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const search = searchTerm.trim().toLowerCase();
      
      const matchesSearch = !search || [
        item.id,
        item.companyList,
        item.securityGroup
      ].some(field => 
        field && field.toString().toLowerCase().includes(search)
      );
      
      const matchesCompany = !filterCompany || item.companyList === filterCompany;
      const matchesGroup = !filterSecurityGroup || item.securityGroup === filterSecurityGroup;
      
      return matchesSearch && matchesCompany && matchesGroup;
    });
  }, [data, searchTerm, filterCompany, filterSecurityGroup]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterSecurityGroup]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    const exportData = sortedData.map(item => ({
      'ID': item.id || '',
      'Company List': item.companyList || '',
      'Security Group': item.securityGroup || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SummaryFact");
    XLSX.writeFile(wb, `SummaryFact_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const importedRaw = XLSX.utils.sheet_to_json(ws);

        const imported = importedRaw.map((row, index) => ({
          id: row['ID'] || row['id'] || `AUTO_${Date.now()}_${index}`,
          companyList: row['Company List'] || row['companyList'] || '',
          securityGroup: row['Security Group'] || row['securityGroup'] || '',
        }));

        if (imported.length === 0) {
          alert('No data found in the imported file');
          return;
        }

        setSummaryData(imported);
        setData(imported);
        alert(`Successfully imported ${imported.length} records`);
      } catch (error) {
        alert('Error reading file. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsBinaryString(file);
    
    e.target.value = '';
  };

  const handleEdit = (idx) => {
    const actualIndex = startIndex + idx;
    setEditIdx(actualIndex);
    setEditRow({ ...sortedData[actualIndex] });
  };

  const handleEditChange = (field, val) => {
    setEditRow(row => ({ ...row, [field]: val.trim() }));
  };

  const saveEditRow = () => {
    if (!editRow.id.trim()) {
      alert('ID field is required');
      return;
    }

    const realIdx = data.findIndex(row =>
      row.id === sortedData[editIdx].id &&
      row.companyList === sortedData[editIdx].companyList &&
      row.securityGroup === sortedData[editIdx].securityGroup
    );
    
    if (realIdx !== -1) {
      const updated = [...data];
      updated[realIdx] = { ...editRow };
      setSummaryData(updated);
      setData(updated);
    }
    
    setEditIdx(null);
    setEditRow({ id: '', companyList: '', securityGroup: '' });
  };

  const handleDelete = (idx) => {
    const actualIndex = startIndex + idx;
    const itemToDelete = sortedData[actualIndex];
    
    if (!window.confirm(`Delete entry "${itemToDelete.id}"?`)) return;
    
    const realIdx = data.findIndex(row =>
      row.id === itemToDelete.id &&
      row.companyList === itemToDelete.companyList &&
      row.securityGroup === itemToDelete.securityGroup
    );
    
    if (realIdx !== -1) {
      const newData = [...data];
      newData.splice(realIdx, 1);
      setSummaryData(newData);
      setData(newData);
      
      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleAddNew = () => {
    const newEntry = {
      id: `NEW_${Date.now()}`,
      companyList: '',
      securityGroup: ''
    };
    
    const updated = [...data, newEntry];
    setSummaryData(updated);
    setData(updated);
    
    const newTotalPages = Math.ceil(updated.length / itemsPerPage);
    setCurrentPage(newTotalPages);
    
    setTimeout(() => {
      const newEntryIndex = updated.length - 1;
      setEditIdx(newEntryIndex);
      setEditRow({ ...newEntry });
    }, 100);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCompany('');
    setFilterSecurityGroup('');
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  };

  const handleSyncApprovedForms = () => {
    syncApprovedForms();
    alert('Summary data synced with approved forms');
  };

  const hasActiveFilters = searchTerm || filterCompany || filterSecurityGroup;
  const noResults = sortedData.length === 0;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Summary Fact Management</h2>
            <p className="text-gray-600 mt-2">Manage security groups and company listings with advanced filtering</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Total: {data.length} records
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Filtered: {sortedData.length} records
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Page: {currentPage} of {totalPages || 1}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleSyncApprovedForms}
              title="Sync with approved forms"
            >
              <span>🔄</span>
              <span>Sync Approved</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleAddNew}
            >
              <span className="text-lg">+</span>
              <span>Add New</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleExport}
            >
              <Download size={16} />
              <span>Export ({sortedData.length})</span>
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer">
              <span>📁 Import</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => {
                if (window.confirm("⚠️ This will permanently delete all summary data. Are you sure?")) {
                  setSummaryData([]);
                  setData([]);
                  setCurrentPage(1);
                }
              }}
            >
              <span>🗑️ Clear All</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              ✕ Clear all filters
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search ID, Company, or Security Group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
            >
              <option value="">🏢 All Companies ({uniqueCompanies.length})</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>
                  {company} ({data.filter(item => item.companyList === company).length})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={filterSecurityGroup}
              onChange={e => setFilterSecurityGroup(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
            >
              <option value="">🔒 All Security Groups ({uniqueSecurityGroups.length})</option>
              {uniqueSecurityGroups.map(group => (
                <option key={group} value={group}>
                  {group} ({data.filter(item => item.securityGroup === group).length})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
            >
              <option value={5}>📄 Show 5 per page</option>
              <option value={10}>📄 Show 10 per page</option>
              <option value={25}>📄 Show 25 per page</option>
              <option value={50}>📄 Show 50 per page</option>
              <option value={100}>📄 Show 100 per page</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <div className="text-blue-600 font-medium">Active filters:</div>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
              </span>
            )}
            {filterCompany && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Company: {filterCompany}
              </span>
            )}
            {filterSecurityGroup && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Security: {filterSecurityGroup}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {noResults ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-6 max-w-sm text-center">
              {hasActiveFilters 
                ? "No records match your current filter criteria. Try adjusting your search terms or filters."
                : "No data available. Import some data or add new entries to get started."
              }
            </p>
            <div className="flex gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Add new entry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      { key: 'id', label: 'ID' },
                      { key: 'companyList', label: 'Company List' },
                      { key: 'securityGroup', label: 'Security Group' }
                    ].map(({ key, label }) => (
                      <th 
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      >
                        <div className="flex items-center gap-2">
                          {label}
                          <div className="flex flex-col">
                            <span className={`text-xs ${sortConfig.key === key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}>▲</span>
                            <span className={`text-xs ${sortConfig.key === key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}>▼</span>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item, i) => (
                    <tr key={`${item.id}-${i}`} className="hover:bg-gray-50 transition-colors">
                      {editIdx === (startIndex + i) ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              value={editRow.id}
                              onChange={e => handleEditChange('id', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter ID"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              value={editRow.companyList}
                              onChange={e => handleEditChange('companyList', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter company name"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              value={editRow.securityGroup}
                              onChange={e => handleEditChange('securityGroup', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter security group"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={saveEditRow}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                title="Save changes"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={() => {
                                  setEditIdx(null);
                                  setEditRow({ id: '', companyList: '', securityGroup: '' });
                                }}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                title="Cancel editing"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{item.companyList}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.securityGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(i)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                title="Edit entry"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(i)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedData.length)}</span> of{' '}
                    <span className="font-medium">{sortedData.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">📋</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Import Instructions</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>Upload an Excel file (.xlsx/.xls) with the following column headers:</p>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs">
                  <div className="bg-blue-100 p-2 rounded">ID</div>
                  <div className="bg-blue-100 p-2 rounded">Company List</div>
                  <div className="bg-blue-100 p-2 rounded">Security Group</div>
                </div>
              </div>
              <p><strong>Example data:</strong></p>
              <div className="bg-white rounded-lg p-3 border border-blue-200 font-mono text-xs">
                <div>SF001 | TechCorp Industries | Admin</div>
                <div>SF002 | GlobalSoft Solutions | Developer</div>
                <div>SF003 | DataFlow Systems | Manager</div>
              </div>
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold mb-1">Auto-Sync Feature:</p>
                <p className="text-green-700 text-xs">This table automatically syncs with approved forms. When a form's Final Status is set to "Approved", it will appear here with:</p>
                <ul className="text-green-700 text-xs mt-1 ml-4 list-disc">
                  <li>ID: The FACT User ID from the form</li>
                  <li>Company List: The selected entity names</li>
                  <li>Security Group: The value entered by admin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ WEB FORM SUBMISSIONS ===========
function SubmittedForms() {
  const [forms, setFormsState] = useState([]);
  useEffect(() => {
    function syncForms() {
      const pendingForms = getForms().filter(f => f.finalStatus === "Pending");
      
      const sortedForms = pendingForms.sort((a, b) => {
        if (a.submissionDate && b.submissionDate) {
          const dateObjA = convertToDate(a.submissionDate);
          const dateObjB = convertToDate(b.submissionDate);
          
          if (dateObjA && dateObjB) {
            return dateObjB - dateObjA;
          }
        }
        
        return (b.id || 0) - (a.id || 0);
      });
      
      setFormsState(sortedForms);
    }
    window.addEventListener("storage", syncForms);
    syncForms();
    return () => window.removeEventListener("storage", syncForms);
  }, []);
  const updateForm = (idx, updates) => {
    const allForms = getForms();
    const formToUpdate = forms[idx];
    const globalIdx = allForms.findIndex(f => f.id === formToUpdate.id);
    if (globalIdx === -1) return;
    const updatedForm = { ...allForms[globalIdx], ...updates };
    allForms[globalIdx] = updatedForm;
    setForms(allForms);
    
    const pendingForms = allForms.filter(f => f.finalStatus === "Pending");
    const sortedForms = pendingForms.sort((a, b) => {
      if (a.submissionDate && b.submissionDate) {
        const dateObjA = convertToDate(a.submissionDate);
        const dateObjB = convertToDate(b.submissionDate);
        
        if (dateObjA && dateObjB) {
          return dateObjB - dateObjA;
        }
      }
      
      return (b.id || 0) - (a.id || 0);
    });
    
    setFormsState(sortedForms);
  };
  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="font-bold mb-4">Pending Web Form Submissions</h3>
      {forms.length === 0
        ? <div>No pending forms.</div>
        : forms.map((form, idx) => (
            <FormItem key={form.id || idx} form={form} idx={idx} updateForm={updateForm} />
        ))}
    </div>
  );
}

const ApprovedForms = () => <FilteredForms status="Approved" title="Approved Web Forms" />;
const RejectedForms = () => <FilteredForms status="Rejected" title="Rejected Web Forms" />;

function FilteredForms({ status, title }) {
  const [forms, setFormsState] = useState([]);
  useEffect(() => {
    function syncForms() {
      const filteredForms = getForms().filter(f => f.finalStatus === status);
      
      const sortedForms = filteredForms.sort((a, b) => {
        let dateA, dateB;
        
        if (status === "Approved") {
          dateA = a.finalApprovedDate;
          dateB = b.finalApprovedDate;
        } else if (status === "Rejected") {
          dateA = a.finalRejectedDate;
          dateB = b.finalRejectedDate;
        }
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        const dateObjA = convertToDate(dateA);
        const dateObjB = convertToDate(dateB);
        
        if (!dateObjA || !dateObjB) return 0;
        
        return dateObjB - dateObjA;
      });
      
      setFormsState(sortedForms);
    }
    window.addEventListener("storage", syncForms);
    syncForms();
    return () => window.removeEventListener("storage", syncForms);
  }, [status]);
  const updateForm = (idx, updates) => {
    const allForms = getForms();
    const formToUpdate = forms[idx];
    const globalIdx = allForms.findIndex(f => f.id === formToUpdate.id);
    if (globalIdx === -1) return;
    const updatedForm = { ...allForms[globalIdx], ...updates };
    allForms[globalIdx] = updatedForm;
    setForms(allForms);
    
    const filteredForms = allForms.filter(f => f.finalStatus === status);
    const sortedForms = filteredForms.sort((a, b) => {
      let dateA, dateB;
      
      if (status === "Approved") {
        dateA = a.finalApprovedDate;
        dateB = b.finalApprovedDate;
      } else if (status === "Rejected") {
        dateA = a.finalRejectedDate;
        dateB = b.finalRejectedDate;
      }
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      const dateObjA = convertToDate(dateA);
      const dateObjB = convertToDate(dateB);
      
      if (!dateObjA || !dateObjB) return 0;
      
      return dateObjB - dateObjA;
    });
    
    setFormsState(sortedForms);
  };
  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="font-bold mb-4">{title}</h3>
      {forms.length === 0 ? <div>No {status.toLowerCase()} forms.</div>
        : forms.map((form, idx) => (
          <FormItem key={form.id || idx} form={form} idx={idx} updateForm={updateForm} readonly />
        ))}
    </div>
  );
}

// ============= REJECTION COMMENT MODAL =============
function RejectionCommentModal({ isOpen, onClose, onSubmit, title }) {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!comment.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    onSubmit(comment);
    setComment("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0, right: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "24px",
        width: "500px",
        maxWidth: "90vw"
      }}>
        <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "bold" }}>
          {title}
        </h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Please provide a reason for rejection..."
          style={{
            width: "100%",
            height: "120px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px",
            marginBottom: "16px",
            resize: "vertical"
          }}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "#f5f5f5",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              background: "#dc2626",
              color: "white",
              cursor: "pointer"
            }}
          >
            Submit Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= FILE VIEWER MODAL =============
function FileViewerModal({ isOpen, onClose, fileName, onRemove }) {
  const handleDownload = () => {
    const sampleContent = `This is the approved file: ${fileName}\nDownloaded on: ${new Date().toLocaleString()}`;
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0, right: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "24px",
        width: "400px",
        maxWidth: "90vw"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>Uploaded File</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          marginBottom: "16px"
        }}>
          <FileText size={48} style={{ color: "#666", margin: "0 auto 8px" }} />
          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>{fileName}</p>
          <p style={{ color: "#666", fontSize: "14px" }}>Approved file with boss signature</p>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={handleDownload}
            style={{
              padding: "8px 16px",
              border: "1px solid #2563eb",
              borderRadius: "4px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer"
            }}
          >
            Download
          </button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to remove this file?")) {
                onRemove();
                onClose();
              }
            }}
            style={{
              padding: "8px 16px",
              border: "1px solid #dc2626",
              borderRadius: "4px",
              background: "#dc2626",
              color: "white",
              cursor: "pointer"
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= SINGLE FORM ITEM (View, Approve, Upload, Comment) ============
function FormItem({ form, idx, updateForm, readonly }) {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const isSiva = ["Siva", "HOD"].includes(username);
  const isGuna = username === "Gunaseelan";
  const isAdmin = role === "Admin";
  const isSuperAdmin = role === "SuperAdmin";
  const canEditSiva = !readonly && isSiva;
  const canEditGuna = !readonly && isGuna;
  const canEditFinal = !readonly && (username === "Siva" || username === "Gunaseelan");

  const [showFormModal, setShowFormModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionType, setRejectionType] = useState("");
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showFileDatePicker, setShowFileDatePicker] = useState(false);
  const [showFinalDatePicker, setShowFinalDatePicker] = useState(false);
  const [showUserAccessDatePicker, setShowUserAccessDatePicker] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
    const [pendingFinalStatus, setPendingFinalStatus] = useState(null);
  const formRef = useRef();

  // Check if final status can be changed
  const canChangeFinalStatus = form.sivaStatus === "Approved" && 
                               form.gunaseelanStatus === "Approved" && 
                               form.approvedFile;

  const handleStatusChange = (field, value) => {
    if (field === "finalStatus" && !canChangeFinalStatus) {
      alert("Cannot change final status: Both Siva/HOD and Gunaseelan must approve, and approved file must be uploaded.");
      return;
    }

    if (value === "Rejected" && (field === "sivaStatus" || field === "gunaseelanStatus")) {
      setRejectionType(field);
      setShowRejectionModal(true);
      return;
    }

    // For final status changes (Approved/Rejected), show date picker
    if (field === "finalStatus" && (value === "Approved" || value === "Rejected")) {
      // Store the pending status value in state instead of in the form
      setPendingFinalStatus(value);
      setShowFinalDatePicker(true);
      return;
    }

    const currentDate = formatDate();
    const currentTimestamp = Date.now();
    
    let updates = {
      [field]: value,
      [`${field}Approver`]: username,
      [`${field}Date`]: currentDate,
      [`${field}Timestamp`]: currentTimestamp,
    };

    updateForm(idx, updates);
  };

  const handleRejectionSubmit = (comment) => {
    const currentDate = formatDate();
    const currentTimestamp = Date.now();
    
    const updates = {
      [rejectionType]: "Rejected",
      [`${rejectionType}Approver`]: username,
      [`${rejectionType}Date`]: currentDate,
      [`${rejectionType}Timestamp`]: currentTimestamp,
      [`${rejectionType}Comment`]: comment,
    };
    updateForm(idx, updates);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store file temporarily and show date picker
      setPendingFile(file);
      setShowFileDatePicker(true);
    }
  };

  const handleFileUploadWithDate = (selectedDate) => {
    if (pendingFile) {
      updateForm(idx, { 
        approvedFile: pendingFile.name,
        approvedFileUploadDate: selectedDate
      });
      setPendingFile(null);
    }
  };

  const handleFinalStatusDate = (selectedDate) => {
    if (pendingFinalStatus) {
      const updates = {
        finalStatus: pendingFinalStatus,
        finalStatusApprover: username,
        finalStatusDate: selectedDate,
        [`final${pendingFinalStatus}Date`]: selectedDate,
        [`final${pendingFinalStatus}Timestamp`]: Date.now(),
        naraStatusDate: selectedDate // For the approval stamp in the form
      };
      
      updateForm(idx, updates);
      setPendingFinalStatus(null);
    }
  };

  const handleUserAccessDate = (selectedDate) => {
    updateForm(idx, { 
      userAccessDate: selectedDate 
    });
  };

  const handleFileRemove = () => {
    updateForm(idx, { 
      approvedFile: null,
      approvedFileUploadDate: null
    });
  };

  const handleDownloadPDF = () => {
    const element = formRef.current;
    html2pdf().set({
      margin: 1,
      filename: `Form-${form.username}-${form.id}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    }).from(element).save();
  };

  return (
    <>
      <div className="border rounded-lg p-6 mb-6 bg-white shadow-sm">
        {/* User Info with User Access Date */}
        <div className="mb-6">
        <div className="flex items-center justify-between">
            <div>
            <h4 className="text-lg font-semibold text-gray-900">User: {form.username}</h4>
            <p className="text-sm text-gray-500">Form ID: {form.id}</p>
            </div>
            <div className="flex items-center gap-8">
            {/* User Access Date */}
            <div className="flex items-center gap-2">
                <strong className="text-gray-700">User Access Date:</strong>
                {!form.userAccessDate ? (
                <button
                    onClick={() => setShowUserAccessDatePicker(true)}
                    disabled={readonly}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-50"
                >
                    Select Date
                </button>
                ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{form.userAccessDate}</span>
                    {!readonly && (
                    <button
                        onClick={() => setShowUserAccessDatePicker(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Change
                    </button>
                    )}
                </div>
                )}
            </div>
            <div className="text-right">
                <strong className="text-gray-700">Submitted Form:</strong>
                <button 
                className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => setShowFormModal(true)}
                >
                View Form
                </button>
            </div>
            </div>
        </div>
        </div>

        {/* Status Grid - Professional Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Final Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Status</label>
              <select
                disabled={readonly || !canChangeFinalStatus || !canEditFinal}
                value={form.finalStatus || "Pending"}
                onChange={e => handleStatusChange("finalStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            {/* Display both approved and rejected dates with appropriate colors */}
            {form.finalStatus === "Approved" && (
              <div className="text-xs text-green-600 font-medium">
                Approved: {form.finalApprovedDate}
              </div>
            )}
            {form.finalStatus === "Rejected" && (
              <div className="text-xs text-red-600 font-medium">
                Rejected: {form.finalRejectedDate}
              </div>
            )}
          </div>
          
          {/* Siva/HOD Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Siva/HOD Status</label>
              <select
                disabled={!canEditSiva}
                value={form.sivaStatus || "Pending"}
                onChange={e => handleStatusChange("sivaStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            {form.sivaStatusDate && (
              <div className="text-xs text-gray-500">
                Updated: {form.sivaStatusDate}
              </div>
            )}
            {form.sivaStatusComment && (
              <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded">
                <strong>Rejection:</strong> {form.sivaStatusComment}
              </div>
            )}
          </div>
          
          {/* Gunaseelan Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mr Gunaseelan Status</label>
              <select
                disabled={!canEditGuna}
                value={form.gunaseelanStatus || "Pending"}
                onChange={e => handleStatusChange("gunaseelanStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            {form.gunaseelanStatusDate && (
              <div className="text-xs text-gray-500">
                Updated: {form.gunaseelanStatusDate}
              </div>
            )}
            {form.gunaseelanStatusComment && (
              <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded">
                <strong>Rejection:</strong> {form.gunaseelanStatusComment}
              </div>
            )}
          </div>
        </div>
        
        {/* File Upload Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Approved File (with boss signature)
          </label>
          {!form.approvedFile ? (
            <input
              type="file"
              disabled={readonly}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          ) : (
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-green-500" />
                <div>
                  <div className="text-sm font-medium text-green-700">
                    ✓ {form.approvedFile}
                  </div>
                  {form.approvedFileUploadDate && (
                    <div className="text-xs text-gray-500">
                      Uploaded: {form.approvedFileUploadDate}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFileViewer(true)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  View
                </button>
                {!readonly && (
                  <button
                    onClick={handleFileRemove}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form View Modal */}
      {showFormModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0, right: 0,
          background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 9999,
        }}>
          <div ref={formRef} style={{ background: "#fff", borderRadius: "8px", padding: "20px", position: "relative", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" }}>
            <button
              style={{ position: "absolute", top: "8px", right: "12px", fontSize: "28px", cursor: "pointer" }}
              onClick={() => setShowFormModal(false)}
            >×</button>
            <ReadOnlyWebForm data={form.data || form} onClose={() => setShowFormModal(false)} />
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button
                onClick={handleDownloadPDF}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Download PDF
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <div style={{ color: form.sivaStatus === "Approved" ? "green" : form.sivaStatus === "Rejected" ? "red" : "orange", fontWeight: "bold" }}>
                Validated by (Siva/HOD): {form.sivaStatus}
              </div>
              <div style={{ color: form.gunaseelanStatus === "Approved" ? "green" : form.gunaseelanStatus === "Rejected" ? "red" : "orange", fontWeight: "bold" }}>
                Recommended by (Mr Gunaseelan): {form.gunaseelanStatus}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Comment Modal */}
      <RejectionCommentModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onSubmit={handleRejectionSubmit}
        title={`Rejection Reason - ${rejectionType === "sivaStatus" ? "Siva/HOD" : "Mr Gunaseelan"}`}
      />

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={showFileViewer}
        onClose={() => setShowFileViewer(false)}
        fileName={form.approvedFile}
        onRemove={handleFileRemove}
      />

      {/* File Upload Date Picker Modal */}
      <DatePickerModal
        isOpen={showFileDatePicker}
        onClose={() => {
          setShowFileDatePicker(false);
          setPendingFile(null);
        }}
        onSubmit={handleFileUploadWithDate}
        title="Select File Upload Date"
      />

      {/* Final Status Date Picker Modal */}
      <DatePickerModal
        isOpen={showFinalDatePicker}
        onClose={() => setShowFinalDatePicker(false)}
        onSubmit={handleFinalStatusDate}
        title="Select Approval/Rejection Date"
      />

      {/* User Access Date Picker Modal */}
      <DatePickerModal
        isOpen={showUserAccessDatePicker}
        onClose={() => setShowUserAccessDatePicker(false)}
        onSubmit={handleUserAccessDate}
        title="Select User Access Date"
      />
    </>
  );
}