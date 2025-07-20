import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { addForm } from "../utils/api"; // <-- Import the latest API

// Styles
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

const errorInputStyle = {
  ...inputStyle,
  border: "2px solid #ef4444",
  background: "#fef2f2",
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
  position: "relative",
};

const checkboxLabel = {
  display: "inline-flex",
  alignItems: "center",
  marginRight: "20px",
  fontSize: "14px",
};

const popupStyle = {
  position: "absolute",
  top: "-40px",
  right: "10px",
  background: "#ef4444",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "500",
  zIndex: 1000,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  whiteSpace: "nowrap",
  animation: "fadeInDown 0.3s ease-out",
};

const popupArrowStyle = {
  position: "absolute",
  bottom: "-5px",
  right: "20px",
  width: "0",
  height: "0",
  borderLeft: "5px solid transparent",
  borderRight: "5px solid transparent",
  borderTop: "5px solid #ef4444",
};

const MONTHS = [
  "Janua", "Febru", "March", "April", "Mayyy", "Junes",
  "Julys", "Augus", "Septe", "Octob", "Novem", "Decem"
];

const initialState = {
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
  moduleName: "",
  featuresName: "",
  reason: "",
};

const ValidationPopup = ({ message, show }) => {
  if (!show) return null;
  
  return (
    <div style={popupStyle}>
      {message}
      <div style={popupArrowStyle}></div>
    </div>
  );
};

const WebForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState(initialState);
  const [requestedName, setRequestedName] = useState("");
  const [requestedDesignation, setRequestedDesignation] = useState("");
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const entityBoxRef = useRef(null);

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

  // Hide error popups after 3 seconds
  useEffect(() => {
    if (showErrors) {
      const timer = setTimeout(() => {
        setShowErrors(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showErrors]);

  // Handle field changes with validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Validation rules
    let validatedValue = value;
    
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked ? [value] : [],
      }));
    } else {
      // Apply validation based on field type
      switch (name) {
        case 'firstName':
        case 'lastName':
        case 'department':
        case 'designation':
        case 'officeLocation':
        case 'reportedTo':
          // Only allow letters and spaces
          validatedValue = value.replace(/[^a-zA-Z\s]/g, '');
          break;
        case 'noOfDaysBackdated':
        case 'year':
          // Only allow numbers
          validatedValue = value.replace(/[^0-9]/g, '');
          break;
        case 'factUserId':
          // Only allow letters, max 10 characters
          validatedValue = value.replace(/[^a-zA-Z]/g, '').slice(0, 10);
          break;
        default:
          validatedValue = value;
      }
      
      setFormData((prev) => ({ ...prev, [name]: validatedValue }));
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Entity multi-select logic
  const handleEntitySelect = (val) => {
    if (formData.entityName.includes(val)) return;
    if (formData.entityName.length >= 5) return;
    setFormData((prev) => ({
      ...prev,
      entityName: [...prev.entityName, val],
    }));
    setTouched((prev) => ({ ...prev, entityName: true }));
    
    // Clear error when user selects entity
    if (errors.entityName) {
      setErrors((prev) => ({ ...prev, entityName: null }));
    }
  };
  
  const handleEntityRemove = (val) => {
    setFormData((prev) => ({
      ...prev,
      entityName: prev.entityName.filter((item) => item !== val),
    }));
    setTouched((prev) => ({ ...prev, entityName: true }));
  };

  // Handle requested name/designation changes
  const handleRequestedNameChange = (e) => {
    setRequestedName(e.target.value);
    if (errors.requestedName) {
      setErrors((prev) => ({ ...prev, requestedName: null }));
    }
  };

  const handleRequestedDesignationChange = (e) => {
    setRequestedDesignation(e.target.value);
    if (errors.requestedDesignation) {
      setErrors((prev) => ({ ...prev, requestedDesignation: null }));
    }
  };

  // Validation
  const validate = () => {
    let e = {};
    if (!formData.firstName) e.firstName = "First name is required";
    if (!formData.lastName) e.lastName = "Last name is required";
    if (!formData.department) e.department = "Department is required";
    if (!formData.designation) e.designation = "Designation is required";
    if (!formData.emailAddress) e.emailAddress = "Email address is required";
    if (!formData.factUserId) e.factUserId = "FACT User ID is required";
    if (!formData.entityName || formData.entityName.length === 0) e.entityName = "Entity name is required";
    if (!formData.noOfDaysBackdated) e.noOfDaysBackdated = "Number of days is required";
    if (formData.securityDept.length !== 1) e.securityDept = "Select exactly one department";
    if (formData.securityCat.length !== 1) e.securityCat = "Select exactly one category";
    if (!requestedName) e.requestedName = "Requested name is required";
    if (!requestedDesignation) e.requestedDesignation = "Requested designation is required";
    return e;
  };

  const submitForm = (e) => {
    e.preventDefault();
    const eObj = validate();
    setErrors(eObj);
    setTouched((prev) => ({
      ...prev,
      ...Object.keys(eObj).reduce((a, b) => ({ ...a, [b]: true }), {}),
    }));
    
    if (Object.keys(eObj).length > 0) {
      setShowErrors(true);
      return;
    }
    
    if (onSubmit) {
      onSubmit({
        ...formData,
        requestedName,
        requestedDesignation,
      });
    }
  };

  // Remove all background (white only)
  useEffect(() => {
    document.body.style.background = "white";
    return () => {
      document.body.style.background = null;
    };
  }, []);

  // Add keyframe animation for popup
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInDown {
        0% {
          opacity: 0;
          transform: translateY(-10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div
      className="form-container"
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        padding: "20px 0",
      }}
    >
      <form
        className="form-content"
        style={{
          width: "794px",
          minHeight: "1123px",
          maxWidth: "calc(100vw - 40px)",
          margin: "0 auto",
          padding: "24px 32px 32px 32px",
          background: "#fff",
          border: "1.5px solid #000",
          borderRadius: "5px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.13)",
          boxSizing: "border-box",
          fontSize: "15px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          position: "relative",
        }}
        onSubmit={submitForm}
        autoComplete="off"
      >
        {/* Top Section */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td style={{ width: "20%", padding: "5px", textAlign: "left", verticalAlign: "middle" }}>
                <img src="/logo.png" alt="SMH Rail Logo" style={{ width: "140px", maxWidth: "100%" }} />
              </td>
              <td
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#15429f",
                  fontSize: "22px",
                  verticalAlign: "middle",
                }}
              >
                SMH RAIL SDN BHD
              </td>
              <td style={{ width: "20%" }}></td>
            </tr>
            <tr>
              <td colSpan="3" style={{ textAlign: "center", fontWeight: "bold", fontSize: "18px", padding: "8px" }}>
                User Access Request Form – FACT ERP.NG
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: "12px", marginBottom: "20px", lineHeight: "1.5" }}>
          This form should be completed when requesting authorisation for new access, additional access, for modification of any existing access, removal of access (permanent/dormant) if a user leaves the department or any other matters related to <strong>FACT ERP.NG</strong>
        </p>

        {/* Employee Details */}
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>PART A : EMPLOYEE DETAILS (User must fill)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>First Name: *</label>
            <input 
              style={errors.firstName ? errorInputStyle : inputStyle} 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange} 
              placeholder="Enter your First Name" 
            />
            <ValidationPopup message={errors.firstName} show={showErrors && errors.firstName} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Last Name: *</label>
            <input 
              style={errors.lastName ? errorInputStyle : inputStyle} 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange} 
              placeholder="Enter your Last Name" 
            />
            <ValidationPopup message={errors.lastName} show={showErrors && errors.lastName} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Department: *</label>
            <input 
              style={errors.department ? errorInputStyle : inputStyle} 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              placeholder="Enter your Department Name" 
            />
            <ValidationPopup message={errors.department} show={showErrors && errors.department} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Designation: *</label>
            <input 
              style={errors.designation ? errorInputStyle : inputStyle} 
              name="designation" 
              value={formData.designation} 
              onChange={handleChange} 
              placeholder="Enter your Designation" 
            />
            <ValidationPopup message={errors.designation} show={showErrors && errors.designation} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Employee Code:</label>
            <input style={inputStyle} name="employeeCode" value={formData.employeeCode} onChange={handleChange} placeholder="Enter your Employee Code" />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Email Address: *</label>
            <input 
              style={errors.emailAddress ? errorInputStyle : inputStyle} 
              name="emailAddress" 
              type="email" 
              value={formData.emailAddress} 
              onChange={handleChange} 
              placeholder="Enter your Email address" 
            />
            <ValidationPopup message={errors.emailAddress} show={showErrors && errors.emailAddress} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Office Location:</label>
            <input style={inputStyle} name="officeLocation" value={formData.officeLocation} onChange={handleChange} placeholder="Enter your Office Location" />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Reported To:</label>
            <input style={inputStyle} name="reportedTo" value={formData.reportedTo} onChange={handleChange} placeholder="Reported To" />
          </div>
        </div>

        {/* FACT User Details */}
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>PART B : FACT USER DETAILS (HOD must fill)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>FACT User ID: *</label>
            <input 
              style={errors.factUserId ? errorInputStyle : inputStyle} 
              name="factUserId" 
              value={formData.factUserId} 
              onChange={handleChange} 
              placeholder="Max 10 characters only" 
            />
            <ValidationPopup message={errors.factUserId} show={showErrors && errors.factUserId} />
          </div>
          {/* Entity Multi-Select */}
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Entity Name: *</label>
            <div ref={entityBoxRef} style={{ position: "relative", flex: 1 }}>
              <div
                style={{
                  ...inputStyle,
                  ...(errors.entityName ? { border: "2px solid #ef4444", background: "#fef2f2" } : {}),
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
                {formData.entityName.length === 0 && (
                  <span style={{ color: "#aaa", fontSize: 14 }}>Select Entity Name</span>
                )}
                {formData.entityName.map((item) => (
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
                  {MONTHS.filter((item) => !formData.entityName.includes(item)).map((item) => (
                    <div
                      key={item}
                      onClick={() => handleEntitySelect(item)}
                      style={{
                        padding: "8px 15px",
                        cursor: formData.entityName.length >= 5 ? "not-allowed" : "pointer",
                        color: formData.entityName.length >= 5 ? "#aaa" : "#222",
                        fontSize: 14,
                        userSelect: "none",
                      }}
                      tabIndex={0}
                    >
                      {item}
                    </div>
                  ))}
                  {formData.entityName.length >= 5 && (
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
            <ValidationPopup message={errors.entityName} show={showErrors && errors.entityName} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={{...labelStyle, display: "flex", flexDirection: "column", lineHeight: "1.2"}}>
              <span>No. of Days *</span>
              <span style={{ marginTop: "2px" }}>Backdated:</span>
            </label>
            <input 
              style={errors.noOfDaysBackdated ? errorInputStyle : inputStyle} 
              name="noOfDaysBackdated" 
              value={formData.noOfDaysBackdated} 
              onChange={handleChange} 
              placeholder="Enter number of days backdated" 
            />
            <ValidationPopup message={errors.noOfDaysBackdated} show={showErrors && errors.noOfDaysBackdated} />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Year:</label>
            <input style={inputStyle} name="year" value={formData.year} onChange={handleChange} placeholder="Enter year" />
          </div>
        </div>

        {/* Security Department */}
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>PART C : SECURITY GROUPING - DEPARTMENT (HOD must tick)</div>
        <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", position: "relative" }}>
          {["Accounts", "Warehouse", "Procurement", "Finance", "Others"].map((item) => (
            <label key={item} style={checkboxLabel}>
              <input type="checkbox" name="securityDept" value={item} onChange={handleChange} checked={formData.securityDept.includes(item)} style={{ marginRight: "5px" }} />{" "}
              {item}
            </label>
          ))}
          {showErrors && errors.securityDept && (
            <div style={{
              position: "absolute",
              top: "-40px",
              left: "480px",
              background: "#ef4444",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              whiteSpace: "nowrap",
              animation: "fadeInDown 0.3s ease-out",
            }}>
              {errors.securityDept}
              <div style={{
                position: "absolute",
                bottom: "-5px",
                left: "10px",
                width: "0",
                height: "0",
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #ef4444",
              }}></div>
            </div>
          )}
        </div>

        {/* Security Category */}
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>PART D : SECURITY GROUPING - CATEGORY (HOD must tick)</div>
        <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", position: "relative" }}>
          {["HOD/Manager", "Division", "Executive", "Project Accountant", "Others"].map((item) => (
            <label key={item} style={checkboxLabel}>
              <input type="checkbox" name="securityCat" value={item} onChange={handleChange} checked={formData.securityCat.includes(item)} style={{ marginRight: "5px" }} />{" "}
              {item}
            </label>
          ))}
          {showErrors && errors.securityCat && (
            <div style={{
              position: "absolute",
              top: "-40px",
              left: "500px",
              background: "#ef4444",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              whiteSpace: "nowrap",
              animation: "fadeInDown 0.3s ease-out",
            }}>
              {errors.securityCat}
              <div style={{
                position: "absolute",
                bottom: "-5px",
                left: "20px",
                width: "0",
                height: "0",
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #ef4444",
              }}></div>
            </div>
          )}
        </div>

        {/* Additional Request */}
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>PART E : ADDITIONAL REQUEST (Fill if available)</div>
        <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Module Name:</label>
            <input style={inputStyle} name="moduleName" value={formData.moduleName} onChange={handleChange} placeholder="Module name" />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Features Name:</label>
            <input style={inputStyle} name="featuresName" value={formData.featuresName} onChange={handleChange} placeholder="Features name" />
          </div>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Reason:</label>
            <input style={inputStyle} name="reason" value={formData.reason} onChange={handleChange} placeholder="Reason for request" />
          </div>
        </div>

        {/* Spacer to push signature section down */}
        <div style={{ flexGrow: 1 }}></div>

        {/* Signature Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          textAlign: "left",
          gap: "10px",
          marginTop: "auto",
          paddingTop: "40px",
          fontSize: "12px",
        }}>
          {["Requested by", "Validated by", "Recommended by", "Approved by"].map((title) => (
            <div key={title}>
              <div style={{ fontSize: "11px" }}>
                {title},<br />
                <br />
                <br />
                <br />
                ________________________<br />
                {title === "Requested by" ? (
                  <div style={{ position: "relative" }}>
                    <div style={{ marginBottom: "3px" }}>
                      Name:{" "}
                      <input
                        style={{
                          ...(errors.requestedName ? {
                            border: "2px solid #ef4444",
                            background: "#fef2f2",
                          } : {
                            border: "1px solid #d1d5db",
                            background: "#f9fafb",
                          }),
                          borderRadius: 3,
                          fontSize: 11,
                          padding: "2px 6px",
                          width: 112,
                          height: 18,
                          margin: "0 0 2px -2px",
                          verticalAlign: "middle",
                        }}
                        value={requestedName}
                        onChange={handleRequestedNameChange}
                      />
                      {showErrors && errors.requestedName && (
                        <div style={{
                          position: "absolute",
                          top: "-40px",
                          left: "40px",
                          background: "#ef4444",
                          color: "white",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          zIndex: 1000,
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          whiteSpace: "nowrap",
                          animation: "fadeInDown 0.3s ease-out",
                        }}>
                          {errors.requestedName}
                          <div style={{
                            position: "absolute",
                            bottom: "-5px",
                            left: "50px",
                            width: "0",
                            height: "0",
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #ef4444",
                          }}></div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: "3px" }}>
                      Designation:{" "}
                      <input
                        style={{
                          ...(errors.requestedDesignation ? {
                            border: "2px solid #ef4444",
                            background: "#fef2f2",
                          } : {
                            border: "1px solid #d1d5db",
                            background: "#f9fafb",
                          }),
                          borderRadius: 3,
                          fontSize: 11,
                          padding: "2px 6px",
                          width: 80,
                          height: 18,
                          margin: "0 0 2px -2px",
                          verticalAlign: "middle",
                        }}
                        value={requestedDesignation}
                        onChange={handleRequestedDesignationChange}
                      />
                      {showErrors && errors.requestedDesignation && (
                        <div style={{
                          position: "absolute",
                          top: "50px",
                          left: "70px",
                          background: "#ef4444",
                          color: "white",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          zIndex: 1000,
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          whiteSpace: "nowrap",
                          animation: "fadeInDown 0.3s ease-out",
                        }}>
                          {errors.requestedDesignation}
                          <div style={{
                            position: "absolute",
                            top: "-5px",
                            left: "50px",
                            width: "0",
                            height: "0",
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderBottom: "5px solid #ef4444",
                          }}></div>
                        </div>
                      )}
                    </div>
                    <div>Date:</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: "3px" }}>
                      Name:{" "}
                      {title === "Validated by"
                        ? "Mr Siva"
                        : title === "Recommended by"
                        ? "Mr Gunaseelan"
                        : title === "Approved by"
                        ? "Datuk PK Nara"
                        : ""}
                    </div>
                    <div style={{ marginBottom: "3px" }}>
                      Designation:{" "}
                      {title === "Validated by"
                        ? "IT Manager"
                        : title === "Recommended by"
                        ? "Head of Accounts"
                        : title === "Approved by"
                        ? "CMD"
                        : ""}
                    </div>
                    <div>Date:</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="no-print" style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            type="submit"
            style={{
              background: "#15429f",
              color: "#fff",
              border: "none",
              padding: "10px 25px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Submit Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default WebForm;