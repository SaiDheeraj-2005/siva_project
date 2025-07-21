// src/pages/SuperAdminDashboard.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ReadOnlyWebForm from "../components/ReadOnlyWebForm";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import { Pencil, Trash2, Search, Edit2, Download, Eye, EyeOff, X, FileText } from "lucide-react";
import DashboardPage from "../pages/DashboardPage";

// ----- LocalStorage helpers -----
const getDepartments = () => JSON.parse(localStorage.getItem("departments") || '[]');
const setDepartments = (depts) => localStorage.setItem("departments", JSON.stringify(depts));
const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
const setUsers = (users) => localStorage.setItem("users", JSON.stringify(users));
const getForms = () => JSON.parse(localStorage.getItem("forms") || "[]");
const setForms = (forms) => localStorage.setItem("forms", JSON.stringify(forms));
const getSummaryData = () => JSON.parse(localStorage.getItem("summaryFact") || "[]");
const setSummaryData = (data) => localStorage.setItem("summaryFact", JSON.stringify(data));

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

function UserManagement() {
  const [users, setUsersState] = useState(getUsers());
  const [form, setForm] = useState({ username: "", password: "", level: "Normal" });
  const [editIdx, setEditIdx] = useState(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState({}); // Track which passwords are visible

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

  function handleAddOrUpdateUser(e) {
    e.preventDefault();
    if (!validateUserForm()) return;
    const password = form.password || generateRandomString(10);
    const newUser = { username: form.username, password, level: form.level };
    let updatedUsers;
    if (editIdx !== null) {
      updatedUsers = users.map((u, idx) => (idx === editIdx ? newUser : u));
    } else {
      updatedUsers = [...users, newUser];
    }
    setUsers(updatedUsers);
    setUsersState(updatedUsers);
    setForm({ username: "", password: "", level: "Normal" });
    setEditIdx(null);
    setError("");
  }
  
  function handleEdit(idx) {
    setEditIdx(idx);
    setForm(users[idx]);
    setError("");
  }
  
  function removeUser(idx) {
    const updatedUsers = users.filter((_, i) => i !== idx);
    setUsers(updatedUsers);
    setUsersState(updatedUsers);
    setEditIdx(null);
    setForm({ username: "", password: "", level: "Normal" });
    setError("");
  }
  
  function handleCancelEdit() {
    setEditIdx(null);
    setForm({ username: "", password: "", level: "Normal" });
    setError("");
  }

  function togglePasswordVisibility(idx) {
    setShowPassword(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="font-bold mb-4">{editIdx !== null ? "Edit User" : "Add New User"}</h3>
      <form className="flex flex-col mb-6" onSubmit={handleAddOrUpdateUser}>
        <input
          className="mb-2 border px-2 py-1 rounded"
          placeholder="Username (maximum 10 characters)"
          value={form.username}
          maxLength={10}
          onChange={e => setForm({ ...form, username: e.target.value.slice(0,10) })}
          required
        />
        <input
          className="mb-2 border px-2 py-1 rounded"
          placeholder="Password (leave blank to auto-generate, maximum 10 chars)"
          value={form.password}
          maxLength={10}
          onChange={e => setForm({ ...form, password: e.target.value.slice(0,10) })}
        />
        <select
          className="mb-2 border px-2 py-1 rounded"
          value={form.level}
          onChange={e => setForm({ ...form, level: e.target.value })}
        >
          <option value="Normal">Normal User</option>
          <option value="Admin">Admin User</option>
          <option value="SuperAdmin">Super Admin User</option>
        </select>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button className="bg-blue-600 text-white px-3 py-1 rounded mt-2" type="submit">
          {editIdx !== null ? "Update User" : "Add User"}
        </button>
        {editIdx !== null && (
          <button
            className="bg-gray-400 text-white px-3 py-1 rounded mt-2"
            type="button"
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
        )}
      </form>
      
      <h3 className="font-bold mb-4">Existing Users</h3>
      
      {/* Table Format for Users */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Role</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">User Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Password</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.username + idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    u.level === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                    u.level === 'Admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {u.level}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2 font-medium">{u.username}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {showPassword[idx] ? u.password : '••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(idx)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title={showPassword[idx] ? "Hide password" : "Show password"}
                    >
                      {showPassword[idx] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      className="text-green-600 hover:text-green-800 px-2 py-1 rounded border border-green-300 hover:bg-green-50 transition-colors"
                      onClick={() => handleEdit(idx)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                      onClick={() => removeUser(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found. Add your first user above.
          </div>
        )}
      </div>
    </div>
  );
}

// ============ SUMMARY FACT TAB ================
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

  // Function to sync approved forms to summary data
  const syncApprovedForms = () => {
    const allForms = getForms();
    const approvedForms = allForms.filter(form => form.finalStatus === "Approved");
    
    // Get existing summary data
    const existingSummaryData = getSummaryData();
    
    // Create a map of existing IDs for quick lookup
    const existingIds = new Set(existingSummaryData.map(item => item.id));
    
    // Process approved forms
    const newSummaryEntries = approvedForms
      .filter(form => {
        // Check if this form's factUserId is already in summary
        const formId = form.factUserId || form.data?.factUserId || '';
        return formId && !existingIds.has(formId);
      })
      .map(form => {
        // Extract data from form - handle both direct properties and nested data
        const formData = form.data || form;
        const factUserId = form.factUserId || formData.factUserId || '';
        
        // Get entity names (company list)
        const entityNames = Array.isArray(form.entityName || formData.entityName) 
          ? (form.entityName || formData.entityName).join(', ') 
          : form.entityName || formData.entityName || '';
        
        // Get security group from form - check multiple possible locations
        const securityGroup = form.securityGroupOther || 
                            formData.securityGroupOther || 
                            form.data?.securityGroupOther ||
                            '';
        
        // Also check if there's a form-specific localStorage key for security group
        const formSpecificKey = form.id ? `securityGroupOther_${form.id}` : null;
        const storedSecurityGroup = formSpecificKey ? localStorage.getItem(formSpecificKey) : null;
        
        return {
          id: factUserId,
          companyList: entityNames,
          securityGroup: storedSecurityGroup || securityGroup || ''
        };
      });
    
    // Combine existing and new data
    const combinedData = [...existingSummaryData, ...newSummaryEntries];
    
    // Update both state and localStorage
    setSummaryData(combinedData);
    setData(combinedData);
  };

  // Initial load and sync
  useEffect(() => {
    // Load existing summary data
    const existingData = getSummaryData();
    setData(existingData);
    
    // Sync approved forms on mount
    syncApprovedForms();
    
    // Set up event listener for form changes
    const handleStorageChange = (e) => {
      if (e.key === 'forms') {
        syncApprovedForms();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Unique filter lists, dynamic based on unfiltered data
  const uniqueCompanies = useMemo(
    () => Array.from(new Set(data.map(item => item.companyList).filter(Boolean))).sort(),
    [data]
  );
  const uniqueSecurityGroups = useMemo(
    () => Array.from(new Set(data.map(item => item.securityGroup).filter(Boolean))).sort(),
    [data]
  );

  // Enhanced filtering logic with better string matching
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const search = searchTerm.trim().toLowerCase();
      
      // Improved search logic - more precise matching
      const matchesSearch = !search || [
        item.id,
        item.companyList,
        item.securityGroup
      ].some(field => 
        field && field.toString().toLowerCase().includes(search)
      );
      
      // Exact matching for dropdown filters
      const matchesCompany = !filterCompany || item.companyList === filterCompany;
      const matchesGroup = !filterSecurityGroup || item.securityGroup === filterSecurityGroup;
      
      return matchesSearch && matchesCompany && matchesGroup;
    });
  }, [data, searchTerm, filterCompany, filterSecurityGroup]);

  // Sorting logic
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

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterSecurityGroup]);

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Export logic with filtered data
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

  // Import logic with better error handling
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
    
    // Reset file input
    e.target.value = '';
  };

  // Enhanced edit handlers
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

    // Find index in original data and replace
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
    
    // Find in original data
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
      
      // Adjust current page if necessary
      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Add new entry function
  const handleAddNew = () => {
    const newEntry = {
      id: `NEW_${Date.now()}`,
      companyList: '',
      securityGroup: ''
    };
    
    const updated = [...data, newEntry];
    setSummaryData(updated);
    setData(updated);
    
    // Go to last page and edit the new entry
    const newTotalPages = Math.ceil(updated.length / itemsPerPage);
    setCurrentPage(newTotalPages);
    
    // Wait for state update then start editing
    setTimeout(() => {
      const newEntryIndex = updated.length - 1;
      const pageIndex = (newEntryIndex % itemsPerPage);
      setEditIdx(newEntryIndex);
      setEditRow({ ...newEntry });
    }, 100);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCompany('');
    setFilterSecurityGroup('');
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  };

  // Sync approved forms button
  const handleSyncApprovedForms = () => {
    syncApprovedForms();
    alert('Summary data synced with approved forms');
  };

  // Check if filters are active
  const hasActiveFilters = searchTerm || filterCompany || filterSecurityGroup;
  const noResults = sortedData.length === 0;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Enhanced Header */}
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

      {/* Enhanced Filters */}
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
          {/* Enhanced Search */}
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

          {/* Company Filter */}
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

          {/* Security Group Filter */}
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

          {/* Items per page */}
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

        {/* Filter Summary */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {hasActiveFilters && (
            <div className="text-blue-600 font-medium">Active filters:</div>
          )}
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
      </div>

      {/* Enhanced Table */}
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
            {/* Table */}
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

            {/* Enhanced Pagination */}
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
                    
                    {/* Page numbers */}
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

      {/* Enhanced Import Instructions */}
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

// Global formatDate function used across components
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

// ============ WEB FORM SUBMISSIONS ===========
function SubmittedForms() {
  const [forms, setFormsState] = useState([]);
  useEffect(() => {
    function syncForms() {
      const pendingForms = getForms().filter(f => f.finalStatus === "Pending");
      
      // Sort by most recent submission (newest first)
      const sortedForms = pendingForms.sort((a, b) => {
        // If forms have submission dates, sort by those
        if (a.submissionDate && b.submissionDate) {
          const dateObjA = convertToDate(a.submissionDate);
          const dateObjB = convertToDate(b.submissionDate);
          
          if (dateObjA && dateObjB) {
            return dateObjB - dateObjA; // Newest first
          }
        }
        
        // Fallback to form ID or index for consistent ordering
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
    
    // Re-sync and sort forms after update
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
      
      // Sort by most recent date (newest first)
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
        
        // Convert DD/MM/YYYY to Date object for comparison
        const dateObjA = convertToDate(dateA);
        const dateObjB = convertToDate(dateB);
        
        if (!dateObjA || !dateObjB) return 0;
        
        return dateObjB - dateObjA; // Newest first
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
    
    // Re-sync and sort forms after update
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
  const isSiva = ["Siva", "HOD"].includes(username);
  const isGuna = username === "Gunaseelan";
  const canEditSiva = !readonly && isSiva;
  const canEditGuna = !readonly && isGuna;

  const [showFormModal, setShowFormModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionType, setRejectionType] = useState("");
  const [showFileViewer, setShowFileViewer] = useState(false);
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

    const currentDate = formatDate();
    const currentTimestamp = Date.now(); // Add timestamp for proper sorting
    
    let updates = {
      [field]: value,
      [`${field}Approver`]: username,
      [`${field}Date`]: currentDate,
      [`${field}Timestamp`]: currentTimestamp, // Add timestamp field
    };

    // Add final approved/rejected date and timestamp when final status is set
    if (field === "finalStatus") {
      if (value === "Approved") {
        updates.finalApprovedDate = currentDate;
        updates.finalApprovedTimestamp = currentTimestamp;
      } else if (value === "Rejected") {
        updates.finalRejectedDate = currentDate;
        updates.finalRejectedTimestamp = currentTimestamp;
      }
    }

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
      const uploadDate = formatDate();
      
      updateForm(idx, { 
        approvedFile: file.name,
        approvedFileUploadDate: uploadDate
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
                disabled={readonly || !canChangeFinalStatus}
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
    </>
  );
}