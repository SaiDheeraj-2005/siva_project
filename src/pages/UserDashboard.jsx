// src/pages/UserDashboard.jsx

import React, { useState, useEffect } from "react";
import WebForm from "../components/WebForm";
import ReadOnlyWebForm from "../components/ReadOnlyWebForm";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getForms, setForms } from "../utils/api";
import { addForm } from "../utils/api"; // at top

// ---- Simple Modal UI ----
function ConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl p-7 w-full max-w-sm border border-slate-200">
        <div className="text-xl font-semibold text-slate-800 mb-4">Submit Request?</div>
        <div className="text-slate-600 mb-7">
          Are you sure you want to submit this request? You will not be able to edit it after submission.
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            Yes, Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Edit Confirmation Modal ----
function EditConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl p-7 w-full max-w-sm border border-slate-200">
        <div className="text-xl font-semibold text-slate-800 mb-4">Resubmit Form?</div>
        <div className="text-slate-600 mb-7">
          Are you sure you want to resubmit this form? This will reset the status to pending.
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            Yes, Resubmit
          </button>
        </div>
      </div>
    </div>
  );
}
function EditFormModal({ open, onClose, formData, onSubmit }) {
  if (!open) return null;
  
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl p-7 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-semibold text-slate-800">Edit and Resubmit Form</div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="text-slate-600 mb-7">
          Please make changes based on the admin remarks.
        </div>
        <WebForm 
          initialData={formData.data || formData} 
          onSubmit={onSubmit}
          isResubmission={true}
          originalFormId={formData.id}
        />
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalFormData, setModalFormData] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, formData: null });
  const [editConfirmModal, setEditConfirmModal] = useState({ open: false, formData: null });

  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [department, setDepartment] = useState(localStorage.getItem("department") || "");
  const [userForms, setUserForms] = useState([]);

  const navigate = useNavigate();

  // Live updates for user session
  useEffect(() => {
    function syncUser() {
      setUsername(localStorage.getItem("username") || "");
      setRole(localStorage.getItem("role") || "");
      setDepartment(localStorage.getItem("department") || "");
    }
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // Reload user's own forms whenever username/requests/forms change
  useEffect(() => {
    setUserForms(getForms().filter(f => f.username === username));
  }, [username, showRequests, showForm]);

  // Redirect non-normal users
  useEffect(() => {
    if (role !== "Normal") navigate("/");
  }, [role, navigate]);

  // Show confirmation modal on submit attempt
  const handleFormSubmit = (formData) => {
    setConfirmModal({ open: true, formData }); // Show confirm modal with data
  };

  // When user confirms the modal, actually submit the form
  const confirmAndSubmit = () => {
    addForm({
      ...confirmModal.formData,
      username,
      // requestedName and requestedDesignation are included via formData already
    });
    setShowForm(false);
    setShowRequests(true);
    setUserForms(getForms().filter(f => f.username === username));
    setConfirmModal({ open: false, formData: null }); // Hide modal
    setModalFormData(null);
  };

  // Handle edit form resubmission
  const handleEditFormSubmit = (formData) => {
    setEditConfirmModal({ open: true, formData });
  };

  // Confirm and resubmit edit form
  const confirmEditResubmit = () => {
    const formData = editConfirmModal.formData;
    // Find the original form and update it
    const allForms = getForms();
    const formIndex = allForms.findIndex(f => f.id === editFormData.id);
    
    if (formIndex !== -1) {
      // Update the form with new data and reset status to pending
      allForms[formIndex] = {
        ...allForms[formIndex],
        data: formData,
        ...formData, // spread the form data at the top level too
        finalStatus: "Pending",
        sivaStatus: "Pending",
        gunaseelanStatus: "Pending",
        sivaStatusComment: null,
        gunaseelanStatusComment: null,
        sivaStatusDate: null,
        gunaseelanStatusDate: null,
        timestamp: new Date().toISOString(),
        resubmitted: true,
        resubmissionDate: new Date().toISOString()
      };
      
      setForms(allForms);
      setUserForms(allForms.filter(f => f.username === username));
    }
    
    setShowEditModal(false);
    setEditFormData(null);
    setEditConfirmModal({ open: false, formData: null });
  };

  // Cancel edit confirmation
  const cancelEditConfirmModal = () => {
    setEditConfirmModal({ open: false, formData: null });
  };

  // If user cancels, just close modal
  const cancelConfirmModal = () => {
    setConfirmModal({ open: false, formData: null });
  };

  // Get rejection remarks from either siva or gunaseelan
  const getRejectionRemarks = (form) => {
    if (form.sivaStatusComment) return form.sivaStatusComment;
    if (form.gunaseelanStatusComment) return form.gunaseelanStatusComment;
    return form.comments || "-";
  };

  // Check if form can be edited (if it's rejected)
  const canEditForm = (form) => {
    return form.finalStatus === "Rejected" || 
           form.sivaStatus === "Rejected" || 
           form.gunaseelanStatus === "Rejected";
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("department");
    setUsername("");
    setRole("");
    setDepartment("");
    navigate("/");
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      <div
        style={{
          width: "100vw",
          margin: 0,
          padding: "32px 0 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Welcome and Dept */}
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1B275A",
          marginBottom: 8,
          width: "90vw",
          maxWidth: 1400,
        }}>
          Welcome <span style={{ fontWeight: 900 }}>{username}</span>
        </div>
        {department && (
          <div style={{
            fontSize: 22,
            marginBottom: 24,
            color: "#1B275A",
            fontWeight: 600,
            width: "90vw",
            maxWidth: 1400,
          }}>
            Department: {department}
          </div>
        )}

        {/* User menu */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 32,
            width: "90vw",
            maxWidth: 1400,
            justifyContent: "left"
          }}
        >
          <button
            onClick={() => { setShowForm(true); setShowRequests(false); }}
            style={{
              background: showForm ? "#1B275A" : "#2563eb",
              color: "white",
              padding: "12px 48px",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              boxShadow: showForm ? "0 2px 8px #1B275A22" : "",
              cursor: "pointer"
            }}
          >
            Fill Web Form
          </button>
          <button
            onClick={() => { setShowRequests(true); setShowForm(false); }}
            style={{
              background: showRequests ? "#1B275A" : "#2563eb",
              color: "white",
              padding: "12px 48px",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              boxShadow: showRequests ? "0 2px 8px #1B275A22" : "",
              cursor: "pointer"
            }}
          >
            View Submitted Requests
          </button>
        </div>

        {/* Main panel */}
        <div style={{
          minHeight: 500,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 2px 12px #0001",
          padding: 36,
          width: "90vw",
          maxWidth: 1400,
          marginBottom: 64,
        }}>
          {/* Web Form */}
          {showForm && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%"
            }}>
              <WebForm onSubmit={handleFormSubmit} />
            </div>
          )}

          {/* Requests Table */}
          {showRequests && (
            <div>
              <h2 style={{ fontWeight: 700, color: "#1B275A", marginBottom: 20 }}>
                My Submitted Requests
              </h2>
              {userForms.length === 0 ? (
                <div style={{ color: "#888", fontStyle: "italic" }}>No forms submitted yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                  }}>
                    <thead>
                      <tr style={{ 
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                        color: "white" 
                      }}>
                        <th style={{ 
                          padding: "14px 12px", 
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          Submitted At
                        </th>
                        <th style={{ 
                          padding: "14px 12px", 
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          Final Status
                        </th>
                        <th style={{ 
                          padding: "14px 12px", 
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          Siva
                        </th>
                        <th style={{ 
                          padding: "14px 12px", 
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          Mr Gunaseelan
                        </th>
                        <th style={{ 
                          padding: "14px 12px", 
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          Remarks
                        </th>
                        <th style={{ 
                          padding: "14px 12px", 
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "14px"
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {userForms.map((f, idx) => (
                        <tr key={f.id || idx} style={{ 
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                          transition: "background-color 0.2s ease"
                        }}>
                          <td style={{ 
                            padding: "12px", 
                            fontSize: "13px",
                            color: "#374151",
                            borderRight: "1px solid #e5e7eb"
                          }}>
                            {new Date(f.timestamp).toLocaleString()}
                            {f.resubmitted && (
                              <div style={{ 
                                fontSize: "11px", 
                                color: "#059669", 
                                fontWeight: 500,
                                marginTop: "2px"
                              }}>
                                ↻ Resubmitted
                              </div>
                            )}
                          </td>
                          <td style={{ 
                            padding: "12px", 
                            textAlign: "center",
                            borderRight: "1px solid #e5e7eb"
                          }}>
                            <span style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: f.finalStatus === "Approved" ? "#065f46" : 
                                     f.finalStatus === "Rejected" ? "#dc2626" : "#b45309",
                              backgroundColor: f.finalStatus === "Approved" ? "#d1fae5" : 
                                               f.finalStatus === "Rejected" ? "#fee2e2" : "#fef3c7"
                            }}>
                              {f.finalStatus}
                            </span>
                          </td>
                          <td style={{ 
                            padding: "12px", 
                            textAlign: "center",
                            borderRight: "1px solid #e5e7eb"
                          }}>
                            <span style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: f.sivaStatus === "Approved" ? "#065f46" : 
                                     f.sivaStatus === "Rejected" ? "#dc2626" : "#6b7280",
                              backgroundColor: f.sivaStatus === "Approved" ? "#d1fae5" : 
                                               f.sivaStatus === "Rejected" ? "#fee2e2" : "#f3f4f6"
                            }}>
                              {f.sivaStatus || "Pending"}
                            </span>
                          </td>
                          <td style={{ 
                            padding: "12px", 
                            textAlign: "center",
                            borderRight: "1px solid #e5e7eb"
                          }}>
                            <span style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: f.gunaseelanStatus === "Approved" ? "#065f46" : 
                                     f.gunaseelanStatus === "Rejected" ? "#dc2626" : "#6b7280",
                              backgroundColor: f.gunaseelanStatus === "Approved" ? "#d1fae5" : 
                                               f.gunaseelanStatus === "Rejected" ? "#fee2e2" : "#f3f4f6"
                            }}>
                              {f.gunaseelanStatus || "Pending"}
                            </span>
                          </td>
                          <td style={{ 
                            padding: "12px", 
                            color: "#374151",
                            fontSize: "13px",
                            maxWidth: "200px",
                            wordWrap: "break-word",
                            borderRight: "1px solid #e5e7eb"
                          }}>
                            {getRejectionRemarks(f)}
                          </td>
                          <td style={{ 
                            padding: "12px", 
                            textAlign: "center"
                          }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button
                                style={{
                                  background: "#2563eb",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "6px 12px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: 500
                                }}
                                onClick={() => {
                                  setModalFormData(f);
                                  setShowFormModal(true);
                                }}
                              >
                                View
                              </button>
                              {canEditForm(f) && (
                                <button
                                  style={{
                                    background: "#059669",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "6px 12px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 500
                                  }}
                                  onClick={() => {
                                    setEditFormData(f);
                                    setShowEditModal(true);
                                  }}
                                >
                                  ↻ Resubmit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* View Form Modal */}
                  {showFormModal && modalFormData && (
                    <ReadOnlyWebForm
                      data={modalFormData.data || modalFormData}
                      onClose={() => setShowFormModal(false)}
                    />
                  )}
                  
                  {/* Edit Form Modal */}
                  <EditFormModal
                    open={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    formData={editFormData}
                    onSubmit={handleEditFormSubmit}
                  />
                </div>
              )}
            </div>
          )}

          {/* --- Confirmation Modal --- */}
          <ConfirmModal
            open={confirmModal.open}
            onConfirm={confirmAndSubmit}
            onCancel={cancelConfirmModal}
          />

          {/* --- Edit Confirmation Modal --- */}
          <EditConfirmModal
            open={editConfirmModal.open}
            onConfirm={confirmEditResubmit}
            onCancel={cancelEditConfirmModal}
          />
        </div>
      </div>
    </div>
  );
}