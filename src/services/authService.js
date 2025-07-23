// src/services/authService.js

import { supabase } from '../lib/supabaseClient'; // Adjust the import path as necessary

export const authService = {
  // Login function
  async login(username, password) {
    try {
      // Call the authenticate_user function
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          p_username: username,
          p_password: password
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const user = data[0];
        
        // Store user info in localStorage for compatibility with existing code
        localStorage.setItem('role', user.role);
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('username', user.username);
        localStorage.setItem('userId', user.id);
        localStorage.removeItem('department');
        
        // Store user data for session
        localStorage.setItem('userData', JSON.stringify(user));
        
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid username or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout function
  async logout() {
    try {
      // Clear localStorage
      localStorage.removeItem('role');
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      localStorage.removeItem('department');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return localStorage.getItem('userLoggedIn') === 'true';
  },

  // Get user role
  getUserRole() {
    return localStorage.getItem('role') || '';
  }
};

// User management service (for SuperAdmin functionality)
export const userManagementService = {
  // Get all users
  async getAllUsers() {
    try {
      const role = localStorage.getItem('role');
      if (role !== 'SuperAdmin') {
        return { success: false, error: 'Unauthorized. Only SuperAdmin can manage users.' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const role = localStorage.getItem('role');
      if (role !== 'SuperAdmin') {
        return { success: false, error: 'Unauthorized. Only SuperAdmin can create users.' };
      }

      const { data, error } = await supabase
        .rpc('create_user_with_password', {
          p_username: userData.username,
          p_password: userData.password,
          p_level: userData.role || 'Normal'
        });

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user
  async updateUser(userId, updates) {
    try {
      const role = localStorage.getItem('role');
      if (role !== 'SuperAdmin') {
        return { success: false, error: 'Unauthorized. Only SuperAdmin can update users.' };
      }

      // If only updating username and role (not password)
      if (!updates.password) {
        const { data, error } = await supabase
          .from('users')
          .update({
            username: updates.username,
            role: updates.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      } else {
        // If updating password as well
        const { data, error } = await supabase
          .rpc('update_user_with_password', {
            p_user_id: userId,
            p_password: updates.password,
            p_level: updates.role || null
          });

        if (error) throw error;
        return { success: true, data };
      }
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete user
  async deleteUser(userId) {
  try {
    const role = localStorage.getItem('role');
    if (role !== 'SuperAdmin') {
      return { success: false, error: 'Unauthorized. Only SuperAdmin can delete users.' };
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .select(); // Add select() to get the deleted record back

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
},

  // Reset user password
  // In src/services/authService.js - Update the resetPassword method

async resetPassword(userId, newPassword) {
  try {
    const role = localStorage.getItem('role');
    if (role !== 'SuperAdmin') {
      return { success: false, error: 'Unauthorized. Only SuperAdmin can reset passwords.' };
    }

    // Call the RPC function that handles password hashing
    const { data, error } = await supabase.rpc('update_user_password', {
      p_user_id: userId,
      p_new_password: newPassword
    });

    if (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Reset password exception:', err);
    return { success: false, error: err.message };
  }
},

  // Check if username exists
  async checkUsernameExists(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Check username error:', error);
      return false;
    }
  }
};