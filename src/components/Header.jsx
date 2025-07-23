// src/components/Header.jsx - Updated with Supabase logout

import React from 'react';
import { authService } from '../services/authService';

export default function Header({ onLogout }) {
  const handleLogout = async () => {
    // Call the auth service logout
    await authService.logout();
    
    // Call the parent's onLogout handler
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-10" />
          <h1 className="text-xl font-bold text-gray-800">Fact Form Management System</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}