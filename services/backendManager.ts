/**
 * Unified Backend Service Manager
 * Initializes and manages all Supabase integrations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authService } from './authService';
import { clinicService } from './clinicService';
import { patientService } from './patientService';
import { doctorService } from './doctorService';

class BackendServiceManager {
  private supabase: SupabaseClient | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize all services with Supabase credentials
   * Call this once on app startup
   */
  async initialize(supabaseUrl: string, supabaseKey: string): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization(supabaseUrl, supabaseKey);
    await this.initializationPromise;
  }

  /**
   * Perform actual initialization
   */
  private async performInitialization(
    supabaseUrl: string,
    supabaseKey: string
  ): Promise<void> {
    try {
      // Validate credentials
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and Key are required');
      }

      // Create Supabase client
      this.supabase = createClient(supabaseUrl, supabaseKey);

      // Test connection
      const { data, error } = await this.supabase.from('clinics').select('count', { count: 'exact' });
      if (error) {
        console.warn('Supabase connection test returned non-critical error:', error.message);
        // Continue anyway, might be permissions issue
      }

      // Initialize all services
      authService.initialize(supabaseUrl, supabaseKey);
      clinicService.initialize(this.supabase);
      patientService.initialize(this.supabase);
      doctorService.initialize(this.supabase);

      this.isInitialized = true;
      console.log('✓ Backend services initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize backend services:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Check if services are initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Supabase client instance
   */
  getSupabase(): SupabaseClient | null {
    return this.supabase;
  }

  /**
   * Get auth service
   */
  getAuthService() {
    return authService;
  }

  /**
   * Get clinic service
   */
  getClinicService() {
    return clinicService;
  }

  /**
   * Get patient service
   */
  getPatientService() {
    return patientService;
  }

  /**
   * Get doctor service
   */
  getDoctorService() {
    return doctorService;
  }

  /**
   * Test backend connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase.from('clinics').select('count', { count: 'exact' });
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get initialization status for UI
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasSupabaseClient: !!this.supabase
    };
  }
}

// Export singleton instance
export const backendManager = new BackendServiceManager();

export {
  authService,
  clinicService,
  patientService,
  doctorService
};
