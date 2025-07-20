export function login(username, password) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  // Built-in users
  const defaultUsers = [
    { username: "user", password: "pass", role: "Normal", department: "Default" },
    { username: "admin", password: "admin", role: "Admin", department: "Admin" },
    { username: "master", password: "master", role: "Master", department: "Master" },
    { username: "superadmin", password: "superadmin", role: "SuperAdmin", department: "SuperAdmin" }
  ];
  const allUsers = [...defaultUsers, ...users.filter(u => !defaultUsers.some(d => d.username === u.username))];
  const user = allUsers.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem("role", user.role);
    localStorage.setItem("username", user.username);
    return user.role;
  }
  return null;
}

export function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("username");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUsername() {
  return localStorage.getItem("username");
}