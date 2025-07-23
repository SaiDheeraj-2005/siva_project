// src/pages/AdminDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ReadOnlyWebForm from "../components/ReadOnlyWebForm";
import html2pdf from "html2pdf.js";
import { FileText} from "lucide-react";
import DashboardPage from "../pages/DashboardPage";

// ----- LocalStorage helpers -----
const getForms = () => JSON.parse(localStorage.getItem("forms") || "[]");
const setForms = (forms) => localStorage.setItem("forms", JSON.stringify(forms));

const formatDate = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

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
    case "staffRejected": return <StaffRejectedForms />;
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
            Welcome <span className="text-blue-700">{username}</span>
          </h2>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

// ============ WEB FORM SUBMISSIONS ===========
// ============ WEB FORM SUBMISSIONS ===========
function SubmittedForms() {
  const [forms, setFormsState] = useState([]);
  useEffect(() => {
    function syncForms() {
      // Only show forms that are pending AND not rejected by staff
      const pendingForms = getForms().filter(f => 
        f.finalStatus === "Pending" && 
        f.sivaStatus !== "Rejected" && 
        f.gunaseelanStatus !== "Rejected"
      );
      setFormsState(pendingForms);
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
    
    // Re-apply the same filter when updating
    const pendingForms = allForms.filter(f => 
      f.finalStatus === "Pending" && 
      f.sivaStatus !== "Rejected" && 
      f.gunaseelanStatus !== "Rejected"
    );
    setFormsState(pendingForms);
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

// Updated StaffRejectedForms component for both SuperAdminDashboard.jsx and AdminDashboard.jsx

function StaffRejectedForms() {
  const [forms, setFormsState] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'siva', 'gunaseelan'
  
  useEffect(() => {
    function syncForms() {
      // Get forms where either Siva or Gunaseelan rejected
      let staffRejectedForms = getForms().filter(f => 
        f.sivaStatus === "Rejected" || f.gunaseelanStatus === "Rejected"
      );
      
      // Apply filter
      if (filterBy === 'siva') {
        staffRejectedForms = staffRejectedForms.filter(f => f.sivaStatus === "Rejected");
      } else if (filterBy === 'gunaseelan') {
        staffRejectedForms = staffRejectedForms.filter(f => f.gunaseelanStatus === "Rejected");
      }
      
      // Apply search
      if (searchTerm) {
        staffRejectedForms = staffRejectedForms.filter(f => 
          f.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.id?.toString().includes(searchTerm) ||
          f.sivaStatusComment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.gunaseelanStatusComment?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Sort by the most recent rejection date
      const sortedForms = staffRejectedForms.sort((a, b) => {
        const getLatestRejectionDate = (form) => {
          const dates = [];
          if (form.sivaStatus === "Rejected" && form.sivaStatusTimestamp) {
            dates.push(form.sivaStatusTimestamp);
          }
          if (form.gunaseelanStatus === "Rejected" && form.gunaseelanStatusTimestamp) {
            dates.push(form.gunaseelanStatusTimestamp);
          }
          return dates.length > 0 ? Math.max(...dates) : 0;
        };
        
        const dateA = getLatestRejectionDate(a);
        const dateB = getLatestRejectionDate(b);
        
        return dateB - dateA;
      });
      
      setFormsState(sortedForms);
    }
    
    window.addEventListener("storage", syncForms);
    syncForms();
    return () => window.removeEventListener("storage", syncForms);
  }, [searchTerm, filterBy]);
  
  const updateForm = (idx, updates) => {
    const allForms = getForms();
    const formToUpdate = forms[idx];
    const globalIdx = allForms.findIndex(f => f.id === formToUpdate.id);
    if (globalIdx === -1) return;
    const updatedForm = { ...allForms[globalIdx], ...updates };
    allForms[globalIdx] = updatedForm;
    setForms(allForms);
    
    // Re-sync forms
    const event = new Event('storage');
    window.dispatchEvent(event);
  };
  
  // Get rejection stats
  const rejectionStats = {
    total: forms.length,
    sivaRejected: forms.filter(f => f.sivaStatus === "Rejected").length,
    gunaseelanRejected: forms.filter(f => f.gunaseelanStatus === "Rejected").length,
    bothRejected: forms.filter(f => f.sivaStatus === "Rejected" && f.gunaseelanStatus === "Rejected").length
  };
  
  return (
    <div className="space-y-6">
      {/* Header Card with Stats */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Staff Rejected Forms</h3>
            <p className="text-gray-600 mt-1">Forms rejected by Siva or Mr. Gunaseelan pending final decision</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">
              <span className="font-semibold">{rejectionStats.total}</span> Total Rejected
            </div>
            <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
              <span className="font-semibold">{rejectionStats.sivaRejected}</span> by Siva
            </div>
            <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">
              <span className="font-semibold">{rejectionStats.gunaseelanRejected}</span> by Gunaseelan
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by username, ID, or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filter by Rejector */}
          <div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Rejections</option>
              <option value="siva">Rejected by Siva</option>
              <option value="gunaseelan">Rejected by Gunaseelan</option>
            </select>
          </div>
          
          {/* Clear Filters */}
          {(searchTerm || filterBy !== 'all') && (
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="w-full px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Forms List */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Rejected Forms</h3>
            <p className="text-gray-500">
              {searchTerm || filterBy !== 'all' 
                ? "No forms match your filter criteria." 
                : "No forms have been rejected by staff members yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map((form, idx) => (
              <div key={form.id || idx} className="border-l-4 border-red-400 bg-red-50 rounded-lg">
                {/* Rejection Header */}
                <div className="p-4 bg-white rounded-t-lg border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900">Form ID: {form.id}</span>
                      <span className="text-gray-600">User: {form.username}</span>
                      {form.submissionDate && (
                        <span className="text-sm text-gray-500">Submitted: {form.submissionDate}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.sivaStatus === "Rejected" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Siva: Rejected
                        </span>
                      )}
                      {form.gunaseelanStatus === "Rejected" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Gunaseelan: Rejected
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        form.finalStatus === "Approved" ? "bg-green-100 text-green-800" :
                        form.finalStatus === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        Final: {form.finalStatus || "Pending"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rejection Details */}
                  <div className="mt-3 space-y-2">
                    {form.sivaStatus === "Rejected" && form.sivaStatusComment && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700">Siva's Comment:</span>
                        <span className="text-sm text-gray-600 italic">"{form.sivaStatusComment}"</span>
                        {form.sivaStatusDate && (
                          <span className="text-xs text-gray-500">({form.sivaStatusDate})</span>
                        )}
                      </div>
                    )}
                    {form.gunaseelanStatus === "Rejected" && form.gunaseelanStatusComment && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700">Gunaseelan's Comment:</span>
                        <span className="text-sm text-gray-600 italic">"{form.gunaseelanStatusComment}"</span>
                        {form.gunaseelanStatusDate && (
                          <span className="text-xs text-gray-500">({form.gunaseelanStatusDate})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Form Item Component */}
                <div className="p-4">
                  <FormItem form={form} idx={idx} updateForm={updateForm} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Summary Card */}
      {forms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">About Staff Rejected Forms</h4>
              <p className="text-sm text-blue-800">
                These forms have been rejected by either Siva or Mr. Gunaseelan but are still pending final decision. 
                The final status can be changed to Approved only after both staff members approve and the signed document is uploaded.
              </p>
            </div>
          </div>
        </div>
      )}
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
      alert("Cannot approve: Both Siva and Gunaseelan must approve, and approved file must be uploaded.");
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
      [`${field}Date`]: formatDate(),
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
      [`${rejectionType}Date`]: formatDate(),
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
          
          {/* Siva Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Siva Status</label>
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
                Validated by (Siva): {form.sivaStatus}
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
        title={`Rejection Reason - ${rejectionType === "sivaStatus" ? "Siva" : "Mr Gunaseelan"}`}
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