import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Clinic } from '../types';

// These will be set dynamically from the UI
let supabaseUrl = localStorage.getItem('sb_url') || '';
let supabaseKey = localStorage.getItem('sb_key') || '';
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