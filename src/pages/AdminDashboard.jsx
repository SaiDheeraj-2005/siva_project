import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ReadOnlyWebForm from "../components/ReadOnlyWebForm";
import html2pdf from "html2pdf.js";
import { FileText, Eye, X } from "lucide-react";
import DashboardPage from "../pages/DashboardPage";

// ----- LocalStorage helpers -----
const getForms = () => JSON.parse(localStorage.getItem("forms") || "[]");
const setForms = (forms) => localStorage.setItem("forms", JSON.stringify(forms));

export default function AdminDashboard() {
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
    if (role !== "Admin") navigate("/");
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
      case "submitted": return <SubmittedForms />;
      case "approved": return <ApprovedForms />;
      case "rejected": return <RejectedForms />;
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
            Welcome, <span className="text-blue-700">{username}</span> ({role})
          </h2>
          {renderSection()}
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
      setFormsState(getForms().filter(f => f.finalStatus === "Pending"));
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
    setFormsState(allForms.filter(f => f.finalStatus === "Pending"));
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
      setFormsState(getForms().filter(f => f.finalStatus === status));
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
    setFormsState(allForms.filter(f => f.finalStatus === status));
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
  // Function to handle actual file download
  const handleDownload = () => {
    // Create a blob with some sample content (in real app, this would be the actual file data)
    const sampleContent = `This is the approved file: ${fileName}\nDownloaded on: ${new Date().toLocaleString()}`;
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element and click it to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
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
  const canEditSiva = !readonly && isSiva;
  const canEditGuna = !readonly && isGuna;
  const canEditFinal = !readonly && (isAdmin || role === "SuperAdmin");

  const [showFormModal, setShowFormModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionType, setRejectionType] = useState("");
  const [showFileViewer, setShowFileViewer] = useState(false);
  const formRef = useRef();

  // Check if final status can be changed to Approved
  const canApprove = form.sivaStatus === "Approved" && 
                     form.gunaseelanStatus === "Approved" && 
                     form.approvedFile;

  const handleStatusChange = (field, value) => {
    if (field === "finalStatus" && value === "Approved" && !canApprove) {
      alert("Cannot approve: Both Siva/HOD and Gunaseelan must approve, and approved file must be uploaded.");
      return;
    }

    if (value === "Rejected" && (field === "sivaStatus" || field === "gunaseelanStatus")) {
      setRejectionType(field);
      setShowRejectionModal(true);
      return;
    }

    let updates = {
      [field]: value,
      [`${field}Approver`]: username,
      [`${field}Date`]: new Date().toLocaleDateString(),
    };

    // Add final approved date when final status is set to Approved
    if (field === "finalStatus" && value === "Approved") {
      updates.finalApprovedDate = new Date().toLocaleDateString();
    }

    updateForm(idx, updates);
  };

  const handleRejectionSubmit = (comment) => {
    const updates = {
      [rejectionType]: "Rejected",
      [`${rejectionType}Approver`]: username,
      [`${rejectionType}Date`]: new Date().toLocaleDateString(),
      [`${rejectionType}Comment`]: comment,
    };
    updateForm(idx, updates);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateForm(idx, { 
        approvedFile: file.name,
        approvedFileUploadDate: new Date().toLocaleDateString()
      });
    }
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
        {/* User Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">User: {form.username}</h4>
              <p className="text-sm text-gray-500">Form ID: {form.id}</p>
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

        {/* Status Grid - Professional Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Final Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Status</label>
              <select
                disabled={!canEditFinal}
                value={form.finalStatus || "Pending"}
                onChange={e => handleStatusChange("finalStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Pending">Pending</option>
                <option value="Approved" disabled={!canApprove}>Approved</option>
                <option value="Rejected"disabled={!canApprove}>Rejected</option>
              </select>
            </div>
            {form.finalApprovedDate && (
              <div className="text-xs text-green-600 font-medium">
                Approved: {form.finalApprovedDate}
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
    </>
  );
}