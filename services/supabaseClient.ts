import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Clinic } from '../types';

// AI Studio / Production fallback credentials
const FALLBACK_SUPABASE_URL = 'https://vifytjbuhnbcfyuxxqhe.supabase.co';
const FALLBACK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZnl0amJ1aG5iY2Z5dXh4cWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MjI0NTMsImV4cCI6MjA4Mjk5ODQ1M30.NLyfnqQCuhT-7FDUVoJi_ToLEHHiBxtSZF04Zmv4Wbc';

// Prefer environment variables injected by Vite (from .env.local)
// Fallback to values stored in browser localStorage for runtime overrides
// Final fallback to hardcoded credentials for AI Studio deployment
const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_URL) || (process.env as any).VITE_SUPABASE_URL || '';
const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_ANON_KEY) || (process.env as any).VITE_SUPABASE_ANON_KEY || '';

let supabaseUrl = envUrl || localStorage.getItem('sb_url') || FALLBACK_SUPABASE_URL;
let supabaseKey = envKey || localStorage.getItem('sb_key') || FALLBACK_SUPABASE_KEY;
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseKey) return null;
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  supabaseUrl = url;
  supabaseKey = key;
  supabaseInstance = null; // Reset instance
  window.location.reload(); // Reload to initialize
};

export const fetchClinics = async (): Promise<Clinic[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.from('clinics').select('*');
  if (error) {
    console.error("Supabase Fetch Error:", error);
    return [];
  }

  // Unwrap the JSONB data
  return data.map((row: any) => row.data as Clinic);
};