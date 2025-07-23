// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Get the environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if the environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// For now, we'll use the same client for both regular and admin operations
// In a production app, admin operations should be done through a secure backend
export const supabaseAdmin = supabase;