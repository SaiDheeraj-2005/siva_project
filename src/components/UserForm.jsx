import React, { useState } from "react";

export default function UserForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    designation: "",
    employeeCode: "",
    emailAddress: "",
    officeLocation: "",
    reportedTo: "",
    factUserId: "",
    entityName: "",
    daysBackdated: "",
    year: "",
    departments: [],
    categories: [],
    moduleName: "",
    featuresName: "",
    reason: "",
  });

  const handleCheckboxChange = (section, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].includes(value)
        ? prev[section].filter((item) => item !== value)
        : [...prev[section], value],
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitForm = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="p-8 bg-white rounded shadow-md" onSubmit={submitForm}>
      <h2 className="font-bold mb-4">EMPLOYEE DETAILS</h2>
      <input name="firstName" placeholder="First Name" onChange={handleChange} required />
      <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
      <input name="department" placeholder="Department" onChange={handleChange} required />
      <input name="designation" placeholder="Designation" onChange={handleChange} required />
      <input name="employeeCode" placeholder="Employee Code" onChange={handleChange} required />
      <input name="emailAddress" placeholder="Email Address" onChange={handleChange} required />
      <input name="officeLocation" placeholder="Office Location" onChange={handleChange} required />
      <input name="reportedTo" placeholder="Reported To" onChange={handleChange} required />

      <h2 className="font-bold my-4">FACT USER DETAILS</h2>
      <input name="factUserId" placeholder="FACT User ID" onChange={handleChange} required />
      <input name="entityName" placeholder="Entity Name" onChange={handleChange} required />
      <input name="daysBackdated" placeholder="No of Days Backdated" onChange={handleChange} required />
      <input name="year" placeholder="Year" onChange={handleChange} required />

      <h2 className="font-bold my-4">SECURITY GROUPING - DEPARTMENT</h2>
      {["Accounts", "Warehouse", "Procurement", "Finance", "Others"].map((dept) => (
        <label key={dept}>
          <input
            type="checkbox"
            onChange={() => handleCheckboxChange("departments", dept)}
          /> {dept}
        </label>
      ))}

      <h2 className="font-bold my-4">SECURITY GROUPING - CATEGORY</h2>
      {["HOD / Manager", "Division", "Executive", "Project Accountant", "Others"].map((cat) => (
        <label key={cat}>
          <input
            type="checkbox"
            onChange={() => handleCheckboxChange("categories", cat)}
          /> {cat}
        </label>
      ))}

      <h2 className="font-bold my-4">ADDITIONAL REQUEST</h2>
      <input name="moduleName" placeholder="Module Name" onChange={handleChange} />
      <input name="featuresName" placeholder="Features Name" onChange={handleChange} />
      <input name="reason" placeholder="Reason" onChange={handleChange} />

      <button className="bg-blue-500 text-white py-2 px-4 rounded mt-4">Submit</button>
    </form>
  );
}