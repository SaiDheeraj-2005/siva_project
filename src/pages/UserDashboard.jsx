// src/pages/UserDashboard.jsx

import React, { useState, useEffect } from "react";
import WebForm from "../components/WebForm";
import ReadOnlyWebForm from "../components/ReadOnlyWebForm";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getForms, addForm, updateForm } from "../utils/api"; // Added updateForm import

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

export default function UserDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalFormData, setModalFormData] = useState(null);

  const [resubmitData, setResubmitData] = useState(null);
  const [isResubmissionMode, setIsResubmissionMode] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, formData: null });

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

  // Function to check if a form has already been resubmitted
  const hasResubmittedForm = (formId) => {
    const allForms = getForms();
    return allForms.some(form => form.originalFormId === formId);
  };

  // Show confirmation modal on submit attempt
  const handleFormSubmit = (formData) => {
    // Check if this is a resubmission
    if (isResubmissionMode && resubmitData) {
      const isFinalRejection = resubmitData.finalStatus === "Rejected";
      
      if (isFinalRejection) {
        // For final rejection, check if already resubmitted
        if (hasResubmittedForm(resubmitData.id)) {
          alert("You have already resubmitted this form. No further resubmissions are allowed.");
          return;
        }
      }
    }
    
    setConfirmModal({ open: true, formData });
  };

  // When user confirms the modal, actually submit the form
  const confirmAndSubmit = () => {
    const formDataToSubmit = {
      ...confirmModal.formData,
      username,
    };

    if (isResubmissionMode && resubmitData) {
      const isFinalRejection = resubmitData.finalStatus === "Rejected";
      
      if (isFinalRejection) {
        // Final rejection: Create a new form with reference to original
        addForm({
          ...formDataToSubmit,
          originalFormId: resubmitData.id,
          resubmitted: true,
          resubmittedAt: new Date().toISOString(),
          // Reset all statuses for new form
          sivaStatus: "",
          sivaStatusDate: "",
          sivaStatusComment: "",
          sivaStatusApprover: "",
          gunaseelanStatus: "",
          gunaseelanStatusDate: "",
          gunaseelanStatusComment: "",
          gunaseelanStatusApprover: "",
          finalStatus: "Pending",
          finalStatusDate: "",
          naraStatusDate: "",
        });
      } else {
        // Siva/Gunaseelan rejection: Update existing form
        updateForm(resubmitData.id, {
          ...formDataToSubmit,
          // Reset statuses to pending
          sivaStatus: "Pending",
          sivaStatusDate: "",
          sivaStatusComment: "",
          gunaseelanStatus: "Pending",
          gunaseelanStatusDate: "",
          gunaseelanStatusComment: "",
          finalStatus: "Pending",
          finalStatusDate: "",
          naraStatusDate: "",
          resubmitted: true,
          resubmittedAt: new Date().toISOString(),
        });
      }
    } else {
      // Normal submission
      addForm(formDataToSubmit);
    }

    setShowForm(false);
    setShowRequests(true);
    setIsResubmissionMode(false);
    setResubmitData(null);
    setUserForms(getForms().filter(f => f.username === username));
    setConfirmModal({ open: false, formData: null });
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
    // Can only edit if Siva or Gunaseelan rejected (not final rejection)
    const isSivaOrGunaRejected = 
      (form.sivaStatus === "Rejected" || form.gunaseelanStatus === "Rejected") &&
      form.finalStatus !== "Rejected";
    
    const isFinalRejected = form.finalStatus === "Rejected";
    
    // For final rejection, check if already resubmitted
    if (isFinalRejected) {
      return !hasResubmittedForm(form.id);
    }
    
    return isSivaOrGunaRejected;
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
            onClick={() => { 
              setShowForm(true); 
              setShowRequests(false);
              setIsResubmissionMode(false);
              setResubmitData(null);
            }}
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
            onClick={() => { 
              setShowRequests(true); 
              setShowForm(false);
            }}
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
            <WebForm
              onSubmit={handleFormSubmit}
              initialData={resubmitData}
              isResubmission={isResubmissionMode}
              originalFormId={resubmitData?.id}
            />
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
                            {f.originalFormId && (
                              <div style={{ 
                                fontSize: "11px", 
                                color: "#2563eb", 
                                fontWeight: 500,
                                marginTop: "2px"
                              }}>
                                ↗ Resubmission of #{f.originalFormId}
                              </div>
                            )}
                            {f.finalStatus === "Rejected" && hasResubmittedForm(f.id) && (
                              <div style={{ 
                                fontSize: "11px", 
                                color: "#dc2626", 
                                fontWeight: 500,
                                marginTop: "2px"
                              }}>
                                ✓ Already resubmitted
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
                                    const isFinalRejection = f.finalStatus === "Rejected";
                                    
                                    if (isFinalRejection && hasResubmittedForm(f.id)) {
                                      alert("You have already resubmitted this form. No further resubmissions are allowed.");
                                      return;
                                    }
                                    
                                    setResubmitData(f);
                                    setShowForm(true);
                                    setShowRequests(false);
                                    setIsResubmissionMode(true);
                                  }}
                                >
                                  {f.finalStatus === "Rejected" ? "New Request" : "↻ Resubmit"}
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
                      data={modalFormData}
                      onClose={() => setShowFormModal(false)}
                    />
                  )}
                  
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

        </div>
      </div>
    </div>
  );
}