// src/utils/api.js

// --- KEYS ---
const FORMS_KEY = "forms";
const USERS_KEY = "users";

// --- FORM TEMPLATE/CONFIG (for admin panel etc.) ---
export function getFormsForRole(role) {
  // Example: in real world you might return different forms per role
  return [
    {
      id: "form1",
      title: "User Access Request Form",
      pdfUrl: "/User Access Request Form – FACT ERP.NG V2.0 Main.pdf",
    }
  ];
}

// --- FORM SUBMISSIONS CRUD ---

// Get all forms (array)
export function getForms() {
  return JSON.parse(localStorage.getItem(FORMS_KEY) || "[]");
}

// Overwrite all forms
export function setForms(forms) {
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
}

// Add a new form, auto-fill all meta fields
export function addForm(form) {
  const forms = getForms();
  const username = localStorage.getItem("username") || "";
  const department = form.department || localStorage.getItem("department") || "";
  const requestedName = form.requestedName || "";
const requestedDesignation = form.requestedDesignation || "";

forms.unshift({
  ...form,
  id: Date.now(),
  username,
  department,
  requestedName,
  requestedDesignation,
  timestamp: new Date().toISOString(),
  finalStatus: "Pending",
  sivaStatus: "Pending",
  gunaseelanStatus: "Pending",
  comments: ""
});
  setForms(forms);
}

// Update a form by id (partial update)
export function updateForm(id, updates) {
  const forms = getForms().map(f => f.id === id ? { ...f, ...updates } : f);
  setForms(forms);
}

// Remove a form by id
export function removeForm(id) {
  const forms = getForms().filter(f => f.id !== id);
  setForms(forms);
}

// --- FILTERED GETTERS (by status/username etc.) ---
export function getFormsByStatus(status) {
  return getForms().filter(f => f.finalStatus === status);
}

export function getFormsByUsername(username) {
  return getForms().filter(f => f.username === username);
}

// --- USER MANAGEMENT ---
// All users array
export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function removeUser(username) {
  const users = getUsers().filter(u => u.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function updateUser(username, updates) {
  const users = getUsers().map(u =>
    u.username === username ? { ...u, ...updates } : u
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// --- EXPORT ALL ---
export default {
  getFormsForRole,
  getForms,
  setForms,
  addForm,
  updateForm,
  removeForm,
  getFormsByStatus,
  getFormsByUsername,
  getUsers,
  addUser,
  removeUser,
  updateUser
};