// src/components/Sidebar.jsx

export default function Sidebar({ section, setSection, role }) {
  return (
    <div className="w-60 min-h-screen bg-gray-100 p-4">
      <div className="font-bold text-lg mb-4">
        {role === "SuperAdmin" ? "SuperAdmin Panel" : "Admin Panel"}
      </div>
      <ul className="space-y-3">
        {/* Dashboard is visible for all */}
        <li>
          <button
            className={`w-full text-left ${section === "dashboard" ? "font-bold text-blue-700" : ""}`}
            onClick={() => setSection("dashboard")}
          >
            Dashboard
          </button>
        </li>
        {/* Only show these to SuperAdmin */}
        {role === "SuperAdmin" && (
          <>
            <li>
              <button
                className={`w-full text-left ${section === "user" ? "font-bold text-blue-700" : ""}`}
                onClick={() => setSection("user")}
              >
                User Management
              </button>
            </li>
          </>
        )}
        {/* Both Admin and SuperAdmin see these */}
        <li>
          <button
            className={`w-full text-left ${section === "submitted" ? "font-bold text-blue-700" : ""}`}
            onClick={() => setSection("submitted")}
          >
            View Submitted Forms
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left ${section === "approved" ? "font-bold text-blue-700" : ""}`}
            onClick={() => setSection("approved")}
          >
            View Approved Forms
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left ${section === "rejected" ? "font-bold text-blue-700" : ""}`}
            onClick={() => setSection("rejected")}
          >
            View Rejected Forms
          </button>
          </li>
        {/* Summary tab for SuperAdmin */}
        {role === "SuperAdmin" && (
          <li>
            <button
              className={`w-full text-left ${section === "summary" ? "font-bold text-blue-700" : ""}`}
              onClick={() => setSection("summary")}
            >
              Summary
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}