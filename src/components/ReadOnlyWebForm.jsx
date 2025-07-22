import React, { useRef, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Simulated API function - replace with your actual implementation
const updateForm = (formId, updates) => {
  console.log('Updating form:', formId, updates);
  // Your actual API call here
};

// A4 px size at 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Add MONTHS constant (same as in WebForm)
const MONTHS = [
  "Janua", "Febru", "March", "April", "Mayyy", "Junes",
  "Julys", "Augus", "Septe", "Octob", "Novem", "Decem"
];

// Dynamic input style function
const getInputStyle = (canEdit) => ({
  padding: "12px 15px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  background: canEdit ? "#f9fafb" : "#f1f5f9",
  fontSize: "14px",
  boxSizing: "border-box",
  width: "100%",
  flex: 1,
  minHeight: "45px",
  cursor: canEdit ? "text" : "not-allowed"
});

const labelStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  minWidth: "140px",
  marginRight: "-30px",
  whiteSpace: "nowrap",
};

const fieldContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0px",
  width: "100%",
  position: "relative",
};

const checkboxLabel = {
  display: "inline-flex",
  alignItems: "center",
  marginRight: "20px",
  fontSize: "14px",
  marginBottom: "4px",
};

const sectionTitle = {
  fontWeight: "bold",
  margin: "10px 0 7px 0",
  fontSize: "15px"
};

function onlyDate(dtStr) {
  if (!dtStr) return "-";
  
  // If already in DD/MM/YYYY format, just format it to DD-MM-YYYY
  if (typeof dtStr === 'string' && dtStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dtStr.replace(/\//g, '-');
  }
  
  // Try to parse different date formats
  let dt = new Date(dtStr);
  
  // If invalid date, try to parse DD/MM/YYYY format
  if (isNaN(dt.getTime()) && typeof dtStr === 'string') {
    // Check if it's in DD/MM/YYYY format
    const parts = dtStr.split('/');
    if (parts.length === 3) {
      // Try DD/MM/YYYY format
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        // Month is 0-indexed in JavaScript Date
        dt = new Date(year, month - 1, day);
      }
    }
  }
  
  if (isNaN(dt.getTime())) return "-";
  
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}-${month}-${year}`;
}

function onlyDateForApproved(dtStr) {
  if (!dtStr) return "";
  
  // If already in DD/MM/YYYY format, just format it to DD-MM-YYYY
  if (typeof dtStr === 'string' && dtStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dtStr.replace(/\//g, '-');
  }
  
  const dt = new Date(dtStr);
  if (isNaN(dt.getTime())) return "";
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}-${month}-${year}`;
}

// Sample data for demonstration
const sampleData = {
  id: "",
  firstName: "",
  lastName: "",
  department: "",
  designation: "",
  employeeCode: "",
  emailAddress: "",
  officeLocation: "",
  reportedTo: "",
  factUserId: "",
  entityName: [],
  noOfDaysBackdated: "",
  year: "",
  securityDept: [],
  securityCat: [],
  securityGroupOther: "",
  moduleName: "",
  featuresName: "",
  reason: "",
  requestedName: "",
  requestedDesignation: "",
  timestamp: "",
  submissionDate: "",
  sivaStatus: "",
  sivaStatusDate: "",
  sivaStatusApprover: "",
  gunaseelanStatus: "",
  gunaseelanStatusDate: "",
  gunaseelanStatusApprover: "",
  naraStatusDate: ""
};

export default function ReadOnlyWebForm({ 
  data = sampleData, 
  onClose = () => console.log('Close clicked'), 
}) {
  const formRef = useRef();
  const entityBoxRef = useRef(null);
  
  // Add state for entity dropdown
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  
  // Enhanced data handling to ensure all fields are properly extracted
  let d = {};
  
  // First, check if data has a nested 'data' property
  if (data && typeof data === 'object') {
    // Create a flat object that includes all possible approval fields
    const flatData = {
      ...sampleData, // Start with default structure
    };
    
    // Helper function to extract all fields from nested objects
    const extractAllFields = (obj, target) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined && obj[key] !== null) {
          // If it's an object but not an array, check for nested fields
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            extractAllFields(obj[key], target);
          }
          // Always set the value at the top level
          target[key] = obj[key];
        }
      });
    };
    
    // Extract fields from data
    extractAllFields(data, flatData);
    
    // If data has a nested 'data' property, extract from that too
    if (data.data && typeof data.data === 'object') {
      extractAllFields(data.data, flatData);
    }
    
    d = flatData;
  } else {
    d = { ...sampleData };
  }
  
  // Initialize arrays with empty arrays if not already arrays
  d.securityDept = Array.isArray(d.securityDept) ? d.securityDept : [];
  d.securityCat = Array.isArray(d.securityCat) ? d.securityCat : [];
  d.entityName = Array.isArray(d.entityName) ? d.entityName : [];

  // FIXED: Consistent role checking logic
  const userRole = localStorage.getItem("role") || "Normal";
  
  // Helper function to check if user can edit (case-insensitive)
  const canEdit = () => {
    const role = userRole?.toLowerCase();
    return role === "admin" || role === "superadmin";
  };
  
  const canEditFields = canEdit();
  
  // Initialize state with the data
  const [editedData, setEditedData] = useState({
    ...d,
    securityDept: d.securityDept || [],
    securityCat: d.securityCat || [],
    entityName: d.entityName || []
  });

  // Load data from localStorage on mount
  useEffect(() => {
    if (d.id) {
      // Load form data
      const formDataKey = `formData_${d.id}`;
      const storedData = localStorage.getItem(formDataKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setEditedData(prev => ({
            ...prev,
            ...parsedData,
            // Ensure arrays are arrays
            securityDept: Array.isArray(parsedData.securityDept) ? parsedData.securityDept : [],
            securityCat: Array.isArray(parsedData.securityCat) ? parsedData.securityCat : [],
            entityName: Array.isArray(parsedData.entityName) ? parsedData.entityName : []
          }));
        } catch (e) {
          console.error('Error parsing stored form data:', e);
        }
      } else {
        // If no stored form data, check for individual security group
        const securityGroupKey = `securityGroupOther_${d.id}`;
        const storedSecurityGroup = localStorage.getItem(securityGroupKey);
        if (storedSecurityGroup !== null) {
          setEditedData(prev => ({
            ...prev,
            securityGroupOther: storedSecurityGroup
          }));
        }
      }
    }
  }, [d.id]);

  // Close entity dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (entityBoxRef.current && !entityBoxRef.current.contains(e.target)) {
        setEntityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Save to localStorage helper function
  const saveToLocalStorage = (dataToSave) => {
    if (!d.id) return;
    
    const formDataKey = `formData_${d.id}`;
    const securityGroupKey = `securityGroupOther_${d.id}`;
    
    try {
      // Save complete form data
      localStorage.setItem(formDataKey, JSON.stringify(dataToSave));
      
      // Also save security group separately for backward compatibility
      if (dataToSave.securityGroupOther !== undefined) {
        localStorage.setItem(securityGroupKey, dataToSave.securityGroupOther);
      }
      
      console.log('Data saved to localStorage:', dataToSave);
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  const handleSave = () => {
    if (d.id && canEditFields) {
      // Save all edited data to API
      updateForm(d.id, editedData);
      
      // Save all edited data to localStorage
      saveToLocalStorage(editedData);
      
      console.log('Saved edited data:', editedData);
      
      // Show save notification
      setSaveNotification(true);
      setTimeout(() => {
        setSaveNotification(false);
        onClose();
      }, 1500);
    } else {
      onClose();
    }
  };
  
  const [showSecurityGroupHint, setShowSecurityGroupHint] = useState(false);
  const [saveNotification, setSaveNotification] = useState(false);

  // Handle field changes
  const handleFieldChange = (fieldName, value) => {
    if (!canEditFields) return;
    
    setEditedData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      
      return newData;
    });
    
    // If it's the security group field, also update API immediately
    if (fieldName === 'securityGroupOther' && d.id) {
      updateForm(d.id, { [fieldName]: value });
    }
  };

  // Handle checkbox changes for arrays
  const handleCheckboxChange = (fieldName, value) => {
    if (!canEditFields) return;
    
    setEditedData(prev => {
      const currentArray = prev[fieldName] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(x => x !== value)
        : [...currentArray, value];
      
      const newData = {
        ...prev,
        [fieldName]: newArray
      };
      
      return newData;
    });
  };

  // Entity multi-select logic (copied from WebForm)
  const handleEntitySelect = (val) => {
    if (!canEditFields) return;
    if (editedData.entityName.includes(val)) return;
    if (editedData.entityName.length >= 5) return;
    
    setEditedData((prev) => ({
      ...prev,
      entityName: [...prev.entityName, val],
    }));
  };
  
  const handleEntityRemove = (val) => {
    if (!canEditFields) return;
    
    setEditedData((prev) => ({
      ...prev,
      entityName: prev.entityName.filter((item) => item !== val),
    }));
  };

  // Enhanced PDF download function
  const handleDownloadPDF = async () => {
    try {
      const element = formRef.current;
      if (!element) {
        alert("Form element not found");
        return;
      }

      // Create a clone of the element to modify for PDF
      const clonedElement = element.cloneNode(true);
      
      // Remove any scroll bars from cloned element
      clonedElement.style.overflow = 'visible';
      clonedElement.style.height = 'auto';
      clonedElement.style.maxHeight = 'none';
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${A4_WIDTH}px`;
      tempContainer.style.background = '#ffffff';
      tempContainer.style.overflow = 'visible';
      tempContainer.appendChild(clonedElement);
      
      document.body.appendChild(tempContainer);

      // Method 1: Try using html2pdf if available
      if (window.html2pdf) {
        const opt = {
          margin: [0, 0, 0, 0],
          filename: `Form-${d?.firstName || 'User'}-${d?.id || 'Form'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: A4_WIDTH,
            removeContainer: true
          },
          jsPDF: { 
            unit: 'px', 
            format: [A4_WIDTH, A4_HEIGHT], 
            orientation: 'portrait',
            compress: true
          }
        };
        
        await window.html2pdf().set(opt).from(clonedElement).save();
        document.body.removeChild(tempContainer);
        return;
      }

      // Method 2: Try using jsPDF with html2canvas
      if (window.jsPDF && window.html2canvas) {
        const canvas = await window.html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          width: A4_WIDTH,
          height: A4_HEIGHT
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new window.jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [A4_WIDTH, A4_HEIGHT],
          compress: true
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
        pdf.save(`Form-${d?.firstName || 'User'}-${d?.id || 'Form'}.pdf`);
        document.body.removeChild(tempContainer);
        return;
      }

      // Method 3: Fallback - create a new window for clean printing
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Access Request Form</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
              .no-print {
                display: none !important;
              }
              button {
                display: none !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${clonedElement.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      document.body.removeChild(tempContainer);

    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    }
  };

  return (
    <div style={{
      position: "fixed",
      zIndex: 2000,
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "auto"
    }}>
      <div
        style={{
          position: "relative",
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          maxWidth: "99vw",
          maxHeight: "99vh",
          background: "#fff",
          border: "1.5px solid #000",
          borderRadius: "5px",
          boxShadow: "0 6px 24px #0002",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Download button header */}
        <div style={{
          position: "absolute",
          top: 10,
          right: 18,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <button 
            type="button"
            onClick={handleDownloadPDF}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2563eb",
              padding: "2px",
              fontSize: "22px"
            }}
            title="Download as PDF"
            aria-label="Download as PDF"
          >
            📥
          </button>
          {canEditFields && (
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#059669",
                padding: "2px",
                fontSize: "22px",
                marginRight: "8px"
              }}
              title="Save changes"
              aria-label="Save changes"
            >
              💾
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 32,
              lineHeight: "1"
            }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Save notification */}
        {saveNotification && (
          <div style={{
            position: "absolute",
            top: "60px",
            right: "20px",
            background: "#10b981",
            color: "white",
            padding: "10px 20px",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            ✓ Changes saved successfully!
          </div>
        )}

        <div
          ref={formRef}
          style={{
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
            overflowY: "auto",
            padding: "15px 22px 20px 22px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff"
          }}
        >
          {/* Header */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
            <tbody>
              <tr>
                <td style={{ width: "20%", padding: "2px", textAlign: "left", verticalAlign: "middle" }}>
                  <img src="/logo.png" alt="SMH Rail Logo" style={{ width: "120px" }} />
                </td>
                <td style={{
                  textAlign: "center", fontWeight: "bold", color: "#15429f", fontSize: "20px", verticalAlign: "middle"
                }}>
                  SMH RAIL SDN BHD
                </td>
                <td style={{ width: "20%" }}></td>
              </tr>
              <tr>
                <td colSpan="3" style={{
                  textAlign: "center", fontWeight: "bold", fontSize: "16px", padding: "8px"
                }}>
                  User Access Request Form – FACT ERP.NG
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontSize: "12px", marginBottom: "15px", lineHeight: "1.5" }}>
            This form should be completed when requesting authorisation for new access, additional access, for modification of any existing access, removal of access (permanent/dormant) if a user leaves the department or any other matters related to <strong>FACT ERP.NG</strong>
          </p>

          {/* PART A */}
          <div style={sectionTitle}>PART A : EMPLOYEE DETAILS (User must fill)</div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px"
          }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>First Name: *</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.firstName || ""}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                placeholder="Enter your First Name"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Last Name: *</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.lastName || ""}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                placeholder="Enter your Last Name"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Department: *</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.department || ""}
                onChange={(e) => handleFieldChange('department', e.target.value)}
                placeholder="Enter your Department Name"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Designation: *</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.designation || ""}
                onChange={(e) => handleFieldChange('designation', e.target.value)}
                placeholder="Enter your Designation"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Employee Code:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.employeeCode || ""}
                onChange={(e) => handleFieldChange('employeeCode', e.target.value)}
                placeholder="Enter your Employee Code"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Email Address: *</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.emailAddress || ""}
                onChange={(e) => handleFieldChange('emailAddress', e.target.value)}
                placeholder="Enter your Email address"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Office Location:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.officeLocation || ""}
                onChange={(e) => handleFieldChange('officeLocation', e.target.value)}
                placeholder="Enter your Office Location"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Reported To:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.reportedTo || ""}
                onChange={(e) => handleFieldChange('reportedTo', e.target.value)}
                placeholder="Reported To"
              />
            </div>
          </div>

          {/* PART B */}
          <div style={sectionTitle}>PART B : FACT USER DETAILS (HOD must fill)</div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px"
          }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>FACT User ID: *</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.factUserId || ""}
                onChange={(e) => handleFieldChange('factUserId', e.target.value)}
                placeholder="Max 10 characters only"
              />
            </div>
            {/* Entity Multi-Select - Updated for Admin/SuperAdmin */}
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Entity Name: *</label>
              {canEditFields ? (
                <div ref={entityBoxRef} style={{ position: "relative", flex: 1 }}>
                  <div
                    style={{
                      ...getInputStyle(canEditFields),
                      minHeight: 43,
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 6,
                      cursor: "pointer",
                      padding: "4px 36px 4px 8px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    tabIndex={0}
                    onClick={() => setEntityDropdownOpen((v) => !v)}
                  >
                    {editedData.entityName.length === 0 && (
                      <span style={{ color: "#aaa", fontSize: 14 }}>Select Entity Name</span>
                    )}
                    {editedData.entityName.map((item) => (
                      <span key={item}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: "#e2e8f0",
                          borderRadius: "10px",
                          padding: "1px 7px",
                          fontSize: 12,
                          marginRight: 2,
                        }}
                      >
                        {item}
                        {entityDropdownOpen && (
                          <button type="button"
                            style={{
                              border: "none",
                              background: "none",
                              color: "#e11d48",
                              marginLeft: 4,
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: 12,
                              lineHeight: 1,
                              padding: 0,
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleEntityRemove(item);
                            }}
                            tabIndex={-1}
                            aria-label={`Remove ${item}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {/* Chevron icon */}
                    <span
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 20,
                        color: "#888",
                        cursor: "pointer",
                        zIndex: 12,
                        userSelect: "none",
                        background: "transparent",
                        padding: "0 2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setEntityDropdownOpen(v => !v);
                      }}
                      tabIndex={0}
                      aria-label={entityDropdownOpen ? "Collapse dropdown" : "Expand dropdown"}
                    >
                      {entityDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </div>
                  {entityDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "110%",
                        left: 0,
                        right: 0,
                        zIndex: 11,
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderTop: "none",
                        boxShadow: "0 6px 16px #0002",
                        maxHeight: 130,
                        overflowY: "auto",
                      }}
                    >
                      {MONTHS.filter((item) => !editedData.entityName.includes(item)).map((item) => (
                        <div
                          key={item}
                          onClick={() => handleEntitySelect(item)}
                          style={{
                            padding: "8px 15px",
                            cursor: editedData.entityName.length >= 5 ? "not-allowed" : "pointer",
                            color: editedData.entityName.length >= 5 ? "#aaa" : "#222",
                            fontSize: 14,
                            userSelect: "none",
                          }}
                          tabIndex={0}
                        >
                          {item}
                        </div>
                      ))}
                      {editedData.entityName.length >= 5 && (
                        <div
                          style={{
                            padding: "8px 15px",
                            color: "#aaa",
                            fontSize: 13,
                            textAlign: "center",
                            userSelect: "none",
                          }}
                        >
                          Max 5 selected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  ...getInputStyle(canEditFields),
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {Array.isArray(editedData.entityName) ? editedData.entityName.join(", ") : editedData.entityName || "Select Entity Name"}
                </div>
              )}
            </div>
            <div style={fieldContainerStyle}>
              <label style={{...labelStyle, display: "flex", flexDirection: "column", lineHeight: "1.2"}}>
                <span>No. of Days: *</span>
                <span style={{ marginTop: "2px" }}>Backdated</span>
              </label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.noOfDaysBackdated || ""}
                onChange={(e) => handleFieldChange('noOfDaysBackdated', e.target.value)}
                placeholder="Enter number of days backdated"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Year:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.year || ""}
                onChange={(e) => handleFieldChange('year', e.target.value)}
                placeholder="Enter year"
              />
            </div>
          </div>

          {/* PART C */}
          <div style={sectionTitle}>PART C : SECURITY GROUPING - DEPARTMENT (HOD must tick, only 1 allowed)</div>
          <div style={{
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: "15px"
          }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
              {["Accounts", "Warehouse", "Procurement", "Finance", "Others"].map(item => (
                <label key={item} style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "14px",
                  whiteSpace: "nowrap"
                }}>
                  <input
                    type="checkbox"
                    disabled={!canEditFields}
                    checked={editedData.securityDept.includes(item)}
                    onChange={() => handleCheckboxChange('securityDept', item)}
                    style={{ marginRight: 5, verticalAlign: "middle" }}
                  />
                  {item}
                </label>
              ))}
            </div>
            <label style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0px",
              flexShrink: 0
            }}>
              Security Group:
              <input
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  background: canEditFields ? "#f9fafb" : "#f1f5f9",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  width: "100px",
                  height: "28px",
                  marginLeft: "0px",
                  cursor: canEditFields ? "text" : "not-allowed"
                }}
                type="text"
                value={editedData.securityGroupOther || ""}
                readOnly={!canEditFields}
                onChange={(e) => handleFieldChange('securityGroupOther', e.target.value)}
                placeholder="Security Group"
                onFocus={!canEditFields ? () => setShowSecurityGroupHint(true) : undefined}
                onBlur={!canEditFields ? () => setShowSecurityGroupHint(false) : undefined}
              />
            </label>
          </div>
          
          {/* Professional small hint shown just under the input */}
          {showSecurityGroupHint && !canEditFields && (
            <div style={{
              marginLeft: "auto",
              marginRight: 0,
              marginTop: "4px",
              width: 140,
              position: "relative",
              fontSize: "12px",
              color: "#6b7280",
              background: "#f5f6fa",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "5px 8px",
              boxShadow: "0 2px 8px #0001",
              display: "flex",
              alignItems: "center",
              gap: 7
            }}>
              <span style={{ color: "#eab308", fontSize: 15, flexShrink: 0 }}>ℹ️</span>
              Only Admin can edit
            </div>
          )}

          {/* PART D */}
          <div style={sectionTitle}>PART D : SECURITY GROUPING - CATEGORY (HOD must tick, only 1 allowed)</div>
          <div style={{ marginBottom: "12px", display: "flex", flexWrap: "wrap" }}>
            {["HOD/Manager", "Division", "Executive", "Project Accountant", "Others"].map(item => (
              <label key={item} style={checkboxLabel}>
                <input
                  type="checkbox"
                  disabled={!canEditFields}
                  checked={editedData.securityCat.includes(item)}
                  onChange={() => handleCheckboxChange('securityCat', item)}
                  style={{ marginRight: 5, verticalAlign: "middle" }}
                /> {item}
              </label>
            ))}
          </div>

          {/* PART E */}
          <div style={sectionTitle}>PART E : ADDITIONAL REQUEST (Fill if available)</div>
          <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Module Name:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.moduleName || ""}
                onChange={(e) => handleFieldChange('moduleName', e.target.value)}
                placeholder="Module name"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Features Name:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.featuresName || ""}
                onChange={(e) => handleFieldChange('featuresName', e.target.value)}
                placeholder="Features name"
              />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Reason:</label>
              <input
                style={getInputStyle(canEditFields)}
                readOnly={!canEditFields}
                value={editedData.reason || ""}
                onChange={(e) => handleFieldChange('reason', e.target.value)}
                placeholder="Reason for request"
              />
            </div>
          </div>

          {/* Reduced spacer to move signature section up */}
          <div style={{ flex: 0.4 }}></div>


        {/* Dynamic Signature Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginTop: "10px",
          marginBottom: "30px",
          fontSize: "12px"
        }}>
          {["Requested by", "Validated by", "Recommended by", "Approved by"].map((title) => {
            // Enhanced stamp status logic with better field checking
            let stampStatus = null;
            let stampApprover = "";
            let stampDate = "";
            let designation = "-";
            let approverName = "-";
            let showFinalStatusStamp = false;
            let finalStatus = null;

            if (title === "Requested by") {
              // Check multiple possible fields for submission status
              if (d.timestamp || d.submissionDate || d.requestedName) {
                stampStatus = "Submitted";
              }
              stampApprover = d.requestedName || 
                            (d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : "") ||
                            "-";
              stampDate = d.timestamp || d.submissionDate || "";
              designation = d.requestedDesignation || d.designation || "-";
              approverName = stampApprover;
            } else if (title === "Validated by") {
              stampStatus = d.sivaStatus || null;
              stampApprover = d.sivaStatusApprover || "Mr Siva";
              stampDate = d.sivaStatusDate || "";
              designation = "IT Manager";
              approverName = stampApprover;
            } else if (title === "Recommended by") {
              stampStatus = d.gunaseelanStatus || null;
              stampApprover = d.gunaseelanStatusApprover || "Mr Gunaseelan";
              stampDate = d.gunaseelanStatusDate || "";
              designation = "Head of Accounts";
              approverName = stampApprover;
            } else if (title === "Approved by") {
              // Check for final status and show appropriate stamp
              finalStatus = d.finalStatus;
              showFinalStatusStamp = finalStatus === "Approved" || finalStatus === "Rejected";
              stampDate = d.naraStatusDate || d.finalStatusDate || "";
              designation = "CMD";
              approverName = "Datuk PK Nara";
            }

            const getStampStyle = (status) => {
              let color = "#999";
              if (status === "Approved" || status === "Submitted") color = "green";
              else if (status === "Rejected") color = "red";
              else if (status === "Pending") color = "#eab308";
              return {
                display: "inline-block",
                padding: "4px 11px",
                border: `1.5px solid ${color}`,
                color: color,
                fontWeight: "bold",
                fontSize: "12px",
                textAlign: "center",
                letterSpacing: "1px"
              };
            };

            const getFinalStampStyle = (status) => {
              const isApproved = status === "Approved";
              return {
                display: "inline-block",
                border: `2px solid ${isApproved ? "#16a34a" : "#dc2626"}`,
                borderRadius: "6px",
                padding: "6px 14px",
                backgroundColor: isApproved ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
                transform: "rotate(-3deg)",
              };
            };

            const shouldShowStamp = stampStatus && (
              title === "Requested by" || 
              title === "Validated by" || 
              title === "Recommended by"
            );

            return (
              <div key={title} style={{ minHeight: "140px", textAlign: "left" }}>
                {/* Title aligned left */}
                <div style={{ fontWeight: "bold", marginBottom: "12px" }}>
                  {title},
                </div>
                
                {/* Centered stamp */}
                <div style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  height: "32px",
                  marginBottom: "8px",
                  marginLeft: "25px"
                }}>
                  {shouldShowStamp && (
                    <div style={getStampStyle(stampStatus)}>
                      {stampStatus.toUpperCase()}
                    </div>
                  )}
                  {title === "Approved by" && showFinalStatusStamp && (
                    <div style={getFinalStampStyle(finalStatus)}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: finalStatus === "Approved" ? "#16a34a" : "#dc2626",
                        textAlign: "center",
                        letterSpacing: "1.5px"
                      }}>
                        {finalStatus.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Line */}
                <div style={{ marginBottom: "12px" }}>
                  ________________________
                </div>
                
                {/* Name / Designation / Date */}
                <div style={{ marginTop: "10px", lineHeight: "1.4" }}>
                  <div>Name: {approverName}</div>
                  <div>Designation: {designation}</div>
                  <div>Date: {title === "Approved by" ? onlyDateForApproved(stampDate) : onlyDate(stampDate)}</div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}