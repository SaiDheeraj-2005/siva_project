import { useState } from "react";
import { getUsers, addUser, removeUser, updateUser } from "../utils/api";

// If not already imported, add this function:
function getDepartments() {
  return JSON.parse(localStorage.getItem("departments") || '[{"name":"HR","pdf":"/hr_form.pdf"},{"name":"Procurement","pdf":"/procurement_form.pdf"}]');
}

function generatePassword(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function UserManagement() {
  const [users, setUsers] = useState(getUsers());
  const [departments] = useState(getDepartments());
  const [newUser, setNewUser] = useState({ username: "", password: "", department: "" });
  const [editUser, setEditUser] = useState(null);

  const handleAdd = () => {
    if (!newUser.username || !newUser.password || !newUser.department) return;
    addUser({ ...newUser, role: "Normal" });
    setUsers(getUsers());
    setNewUser({ username: "", password: "", department: "" });
  };

  const handleRemove = (username) => {
    removeUser(username);
    setUsers(getUsers());
  };

  const handleEdit = (username) => {
    setEditUser(users.find(u => u.username === username));
  };

  const handleUpdate = () => {
    updateUser(editUser.username, editUser);
    setUsers(getUsers());
    setEditUser(null);
  };

  return (
    <div className="p-4">
      <div className="font-bold text-lg mb-2">Add New User</div>
      <div className="flex gap-2 mb-4">
        <input className="border p-1" placeholder="Username" value={newUser.username} onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))} />
        <input className="border p-1" placeholder="Password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
        {/* --- Department Dropdown --- */}
        <select
          className="border p-1"
          value={newUser.department}
          onChange={e => setNewUser(u => ({ ...u, department: e.target.value }))}
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
        <button className="bg-gray-300 px-2 rounded" type="button"
          onClick={() => setNewUser(u => ({ ...u, password: generatePassword() }))}>
          Generate Password
        </button>
        <button className="bg-blue-600 text-white px-2 rounded" type="button" onClick={handleAdd}>Add</button>
      </div>
      <div className="font-bold text-lg mb-2">All Users</div>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-2">Username</th>
            <th className="p-2">Department</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.username}>
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.department || "-"}</td>
              <td className="p-2">
                <button className="bg-yellow-400 px-2 rounded mr-2" onClick={() => handleEdit(u.username)}>Edit</button>
                <button className="bg-red-500 text-white px-2 rounded" onClick={() => handleRemove(u.username)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editUser && (
        <div className="mt-6 bg-gray-100 p-3 rounded">
          <div className="font-bold">Edit User: {editUser.username}</div>
          <input className="border p-1 mr-2" value={editUser.password} onChange={e => setEditUser(u => ({ ...u, password: e.target.value }))} />
          {/* --- Department Dropdown for Edit --- */}
          <select
            className="border p-1 mr-2"
            value={editUser.department}
            onChange={e => setEditUser(u => ({ ...u, department: e.target.value }))}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button className="bg-green-600 text-white px-2 rounded" onClick={handleUpdate}>Update</button>
          <button className="bg-gray-300 px-2 rounded ml-2" onClick={() => setEditUser(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}