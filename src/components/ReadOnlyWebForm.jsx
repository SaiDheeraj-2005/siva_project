// src/components/ReadOnlyWebForm.jsx

import React, { useRef, useState, useEffect } from "react";

// Simulated API function - replace with your actual implementation
const updateForm = (formId, updates) => {
  console.log('Updating form:', formId, updates);
  // Your actual API call here
};

// A4 px size at 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const inputStyle = {
  padding: "12px 15px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  background: "#f9fafb",
  fontSize: "14px",
  boxSizing: "border-box",
  width: "100%",
  flex: 1,
  minHeight: "45px",
};

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
  const dt = new Date(dtStr);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}-${month}-${year}`;
}

function onlyDateForApproved(dtStr) {
  if (!dtStr) return "";
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
  const d = data || {};
  const securityDept = d.securityDept || [];
  const securityCat = d.securityCat || [];
  const entityName = d.entityName || [];

  // Ensure role is correctly set
  const userRole = localStorage.getItem("role") || "Normal";
  
  // Role-based permissions
  const canEditSecurityGroup = userRole === "Admin" || userRole === "SuperAdmin";
  
  const [securityGroupOther, setSecurityGroupOther] = useState(d.securityGroupOther || "");
  const [showSecurityGroupHint, setShowSecurityGroupHint] = useState(false);

  useEffect(() => {
    // Create form-specific localStorage key using the form ID
    const formSpecificKey = d.id ? `securityGroupOther_${d.id}` : null;
    
    if (formSpecificKey) {
      const stored = localStorage.getItem(formSpecificKey);
      if (stored !== null) {
        setSecurityGroupOther(stored);
      } else {
        setSecurityGroupOther(d.securityGroupOther || "");
      }
    } else {
      // If no form ID, just use the data value
      setSecurityGroupOther(d.securityGroupOther || "");
    }
  }, [d.id, d.securityGroupOther]);

  const handleGroupOtherChange = (e) => {
    // Only allow changes if user has permission
    if (!canEditSecurityGroup) return;
    
    const newValue = e.target.value;
    setSecurityGroupOther(newValue);
    
    if (d.id) {
      // Update the form via API
      updateForm(d.id, { securityGroupOther: newValue });
      
      // Store in form-specific localStorage key
      const formSpecificKey = `securityGroupOther_${d.id}`;
      localStorage.setItem(formSpecificKey, newValue);
    }
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

  const displayEntityNames = Array.isArray(entityName)
    ? entityName.join(", ")
    : entityName || "";

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
              <input style={inputStyle} disabled value={d.firstName || ""} placeholder="Enter your First Name" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Last Name: *</label>
              <input style={inputStyle} disabled value={d.lastName || ""} placeholder="Enter your Last Name" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Department: *</label>
              <input style={inputStyle} disabled value={d.department || ""} placeholder="Enter your Department Name" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Designation: *</label>
              <input style={inputStyle} disabled value={d.designation || ""} placeholder="Enter your Designation" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Employee Code:</label>
              <input style={inputStyle} disabled value={d.employeeCode || ""} placeholder="Enter your Employee Code" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Email Address: *</label>
              <input style={inputStyle} disabled value={d.emailAddress || ""} placeholder="Enter your Email address" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Office Location:</label>
              <input style={inputStyle} disabled value={d.officeLocation || ""} placeholder="Enter your Office Location" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Reported To:</label>
              <input style={inputStyle} disabled value={d.reportedTo || ""} placeholder="Reported To" />
            </div>
          </div>

          {/* PART B */}
          <div style={sectionTitle}>PART B : FACT USER DETAILS (HOD must fill)</div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px"
          }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>FACT User ID: *</label>
              <input style={inputStyle} disabled value={d.factUserId || ""} placeholder="Max 10 characters only" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Entity Name: *</label>
              <div style={{
                ...inputStyle,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                fontSize: "12px",
                lineHeight: "1.4",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {displayEntityNames || "Select Entity Name"}
              </div>
            </div>
            <div style={fieldContainerStyle}>
              <label style={{...labelStyle, display: "flex", flexDirection: "column", lineHeight: "1.2"}}>
                <span>No. of Days: *</span>
                <span style={{ marginTop: "2px" }}>Backdated</span>
              </label>
              <input style={inputStyle} disabled value={d.noOfDaysBackdated || ""} placeholder="Enter number of days backdated" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Year:</label>
              <input style={inputStyle} disabled value={d.year || ""} placeholder="Enter year" />
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
                    disabled
                    checked={securityDept.includes(item)}
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
                  background: canEditSecurityGroup ? "#f9fafb" : "#f1f5f9",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  width: "100px",
                  height: "28px",
                  marginLeft: "0px",
                  cursor: canEditSecurityGroup ? "text" : "not-allowed"
                }}
                type="text"
                value={securityGroupOther}
                readOnly={!canEditSecurityGroup}
                onChange={canEditSecurityGroup ? handleGroupOtherChange : undefined}
                placeholder="Security Group"
                onFocus={!canEditSecurityGroup ? () => setShowSecurityGroupHint(true) : undefined}
                onBlur={!canEditSecurityGroup ? () => setShowSecurityGroupHint(false) : undefined}
              />
            </label>
          </div>
          
          {/* Professional small hint shown just under the input */}
          {showSecurityGroupHint && !canEditSecurityGroup && (
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
              Only Admin can set the security group
            </div>
          )}

          {/* PART D */}
          <div style={sectionTitle}>PART D : SECURITY GROUPING - CATEGORY (HOD must tick, only 1 allowed)</div>
          <div style={{ marginBottom: "12px", display: "flex", flexWrap: "wrap" }}>
            {["HOD/Manager", "Division", "Executive", "Project Accountant", "Others"].map(item => (
              <label key={item} style={checkboxLabel}>
                <input type="checkbox" disabled checked={securityCat.includes(item)} style={{ marginRight: 5 }} /> {item}
              </label>
            ))}
          </div>

          {/* PART E */}
          <div style={sectionTitle}>PART E : ADDITIONAL REQUEST (Fill if available)</div>
          <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Module Name:</label>
              <input style={inputStyle} disabled value={d.moduleName || ""} placeholder="Module name" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Features Name:</label>
              <input style={inputStyle} disabled value={d.featuresName || ""} placeholder="Features name" />
            </div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Reason:</label>
              <input style={inputStyle} disabled value={d.reason || ""} placeholder="Reason for request" />
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
              const stampStatus =
                title === "Requested by" && d.timestamp
                  ? "Submitted"
                  : title === "Validated by" && d.sivaStatus
                  ? d.sivaStatus
                  : title === "Recommended by" && d.gunaseelanStatus
                  ? d.gunaseelanStatus
                  : null;

              const stampApprover =
                title === "Requested by"
                  ? d.requestedName
                  : title === "Validated by"
                  ? d.sivaStatusApprover
                  : title === "Recommended by"
                  ? d.gunaseelanStatusApprover
                  : "";

              const stampDate =
                title === "Requested by"
                  ? d.timestamp
                  : title === "Validated by"
                  ? d.sivaStatusDate
                  : title === "Recommended by"
                  ? d.gunaseelanStatusDate
                  : title === "Approved by"
                  ? d.naraStatusDate
                  : "";

              const designation =
                title === "Requested by"
                  ? d.requestedDesignation || d.designation || "-"
                  : title === "Validated by"
                  ? "IT Manager"
                  : title === "Recommended by"
                  ? "Head of Accounts"
                  : title === "Approved by"
                  ? "CMD"
                  : "-";

              const approverName =
                title === "Requested by"
                  ? d.requestedName || (d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : "-")
                  : title === "Validated by"
                  ? stampApprover || "Mr Siva"
                  : title === "Recommended by"
                  ? "Mr Gunaseelan"
                  : title === "Approved by"
                  ? "Datuk PK Nara"
                  : "-";

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

              const shouldShowStamp = 
                title === "Requested by" || 
                title === "Validated by" || 
                title === "Recommended by";

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
                    {shouldShowStamp && stampStatus && (
                      <div style={getStampStyle(stampStatus)}>
                        {stampStatus.toUpperCase()}
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