import React, { useState, useEffect } from 'react';

// Mock service - replace with your actual service
const userManagementService = {
  getAllUsers: async () => ({ success: true, data: [] }),
  updateUser: async (id, data) => ({ success: true }),
  checkUsernameExists: async (username) => false,
  createUser: async (data) => ({ success: true }),
  deleteUser: async (id) => ({ success: true }),
  resetPassword: async (id, password) => ({ success: true }),
};

// Helper function - replace with your actual implementation
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Modal components - replace with your actual implementations
const PasswordModal = ({ isOpen, onClose, username, password, action }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px'
      }}>
        <h3>{action === 'create' ? 'User Created' : 'Password Reset'}</h3>
        <p>Username: {username}</p>
        <p>Password: {password}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ isOpen, onClose, onSubmit, username }) => {
  const [newPassword, setNewPassword] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px'
      }}>
        <h3>Reset Password for {username}</h3>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          maxLength={10}
        />
        <button onClick={() => onSubmit(newPassword)}>Reset</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

function UserManagement() {
  const [users, setUsersState] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "Normal" });
  const [editIdx, setEditIdx] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalData, setPasswordModalData] = useState({ username: "", password: "", action: "create" });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetUserId, setResetUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  // Removed deleteIndex as it was unused

  // Load users from Supabase on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await userManagementService.getAllUsers();
      if (result.success) {
        const mappedUsers = result.data.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }));
        setUsersState(mappedUsers);
      } else {
        setError("Failed to load users: " + result.error);
      }
    } catch (err) {
      setError("Error loading users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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

  async function handleAddOrUpdateUser(e) {
    e.preventDefault();
    if (!validateUserForm()) return;
    
    setLoading(true);
    setError("");

    try {
      const password = form.password || generateRandomString(10);
      
      if (editIdx !== null) {
        // Update existing user (username and role only)
        const result = await userManagementService.updateUser(editUserId, {
          username: form.username,
          role: form.role
        });

        if (result.success) {
          await loadUsers();
          setForm({ username: "", password: "", role: "Normal" });
          setEditIdx(null);
          setEditUserId(null);
        } else {
          setError("Failed to update user: " + result.error);
        }
      } else {
        // Check if username already exists
        const exists = await userManagementService.checkUsernameExists(form.username);
        if (exists) {
          setError("Username already exists");
          setLoading(false);
          return;
        }

        // Create new user
        const result = await userManagementService.createUser({
          username: form.username,
          password: password,
          role: form.role
        });

        if (result.success) {
          await loadUsers();
          setForm({ username: "", password: "", role: "Normal" });
          
          // Show password modal
          setPasswordModalData({
            username: form.username,
            password: password,
            action: "create"
          });
          setShowPasswordModal(true);
        } else {
          setError("Failed to create user: " + result.error);
        }
      }
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  function handleEdit(idx) {
    const user = users[idx];
    setEditIdx(idx);
    setEditUserId(user.id);
    setForm({
      username: user.username,
      password: "",
      role: user.role
    });
    setError("");
  }
  
  async function removeUser() {
    if (!deleteUser) return;
    
    setLoading(true);
    setError("");
    setShowDeleteModal(false);
    
    try {
      const result = await userManagementService.deleteUser(deleteUser.id);
      
      if (result.success) {
        await loadUsers();
        
        // Clear edit state if we're deleting the user being edited
        if (editUserId === deleteUser.id) {
          setEditIdx(null);
          setEditUserId(null);
          setForm({ username: "", password: "", role: "Normal" });
        }
        
        // Show success message (optional)
        console.log(`User ${deleteUser.username} deleted successfully`);
      } else {
        setError("Failed to delete user: " + result.error);
      }
    } catch (err) {
      setError("Error deleting user: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteUser(null);
    }
  }

  function handleDeleteClick(user, idx) {
    setDeleteUser(user);
    setShowDeleteModal(true);
  }
  
  function handleCancelEdit() {
    setEditIdx(null);
    setEditUserId(null);
    setForm({ username: "", password: "", role: "Normal" });
    setError("");
  }

  function handleResetPassword(user) {
    setResetUsername(user.username);
    setResetUserId(user.id);
    setShowResetModal(true);
  }

  async function handleResetPasswordSubmit(newPassword) {
    setLoading(true);
    setError("");
    
    try {
      // Use resetPassword method from userManagementService
      const result = await userManagementService.resetPassword(resetUserId, newPassword);

      if (result.success) {
        setShowResetModal(false);
        setPasswordModalData({
          username: resetUsername,
          password: newPassword,
          action: "reset"
        });
        setShowPasswordModal(true);
      } else {
        setError("Failed to reset password: " + result.error);
        setShowResetModal(false);
      }
    } catch (err) {
      setError("Error resetting password");
      console.error(err);
      setShowResetModal(false);
    } finally {
      setLoading(false);
    }
  }

  // Delete Confirmation Modal Component
  function DeleteConfirmationModal({ isOpen, onClose, onConfirm, username }) {
    if (!isOpen) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0, right: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "32px",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
              </svg>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#111", marginBottom: "8px" }}>
              Delete User Account
            </h3>
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Are you sure you want to delete <strong>{username}</strong>?
            </p>
          </div>

          <div style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "start",
            gap: "8px"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style={{ fontSize: "14px", color: "#92400e", margin: 0 }}>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "#dc2626",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add/Edit User Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {editIdx !== null ? "Edit User" : "Add New User"}
        </h3>
        
        <form className="space-y-4" onSubmit={handleAddOrUpdateUser}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter username (maximum 10 characters)"
              value={form.username}
              maxLength={10}
              onChange={e => setForm({ ...form, username: e.target.value.slice(0,10) })}
              required
              disabled={loading}
            />
          </div>
          
          {editIdx === null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Leave blank to auto-generate (maximum 10 characters)"
                value={form.password}
                maxLength={10}
                onChange={e => setForm({ ...form, password: e.target.value.slice(0,10) })}
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">If left empty, a secure password will be generated automatically</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              disabled={loading}
            >
              <option value="Normal">Normal User</option>
              <option value="Admin">Admin User</option>
              <option value="SuperAdmin">Super Admin User</option>
            </select>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400" 
              type="submit"
              disabled={loading}
            >
              {loading ? "Processing..." : (editIdx !== null ? "Update User" : "Add User")}
            </button>
            {editIdx !== null && (
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Users Table Card */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Existing Users</h3>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u, idx) => (
                <tr key={u.id || (u.username + idx)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-gray-600 font-medium text-sm">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      u.role === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                      u.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => handleEdit(idx)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-800 px-3 py-2 text-sm font-medium hover:bg-purple-50 rounded-lg transition-colors"
                        onClick={() => handleResetPassword(u)}
                        disabled={loading}
                      >
                        Reset Password
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 px-3 py-2 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDeleteClick(u, idx)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No users found. Add your first user above.</p>
            </div>
          )}
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4 text-blue-600 border-t">
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        username={passwordModalData.username}
        password={passwordModalData.password}
        action={passwordModalData.action}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSubmit={handleResetPasswordSubmit}
        username={resetUsername}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteUser(null);
        }}
        onConfirm={removeUser}
        username={deleteUser?.username}
      />
    </div>
  );
}

export default UserManagement;