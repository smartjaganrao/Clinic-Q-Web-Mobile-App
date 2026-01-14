import { PatientStatus, DoctorStatus } from '../types';
import { patientService } from './patientService';
import { getSupabase } from './supabaseClient';

/**
 * Centralized service for synchronized status updates across all apps
 */
class StatusSyncService {
  private supabase = getSupabase();
  private statusChannel: any = null;

  constructor() {
    this.setupStatusChannel();
  }

  private setupStatusChannel() {
    if (!this.supabase) return;
    
    this.statusChannel = this.supabase.channel('global_status_sync');
    this.statusChannel.subscribe();
  }

  /**
   * Update patient status with real-time broadcasting
   */
  async updatePatientStatus(
    patientId: string, 
    status: PatientStatus,
    clinicId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update via patient service (includes broadcasting)
      const result = await patientService.updatePatientStatus(patientId, status);
      
      if (result.success && this.statusChannel) {
        // Additional broadcast for immediate UI updates
        this.statusChannel.send({
          type: 'broadcast',
          event: 'patient_status_change',
          payload: { 
            patientId, 
            status, 
            clinicId,
            timestamp: Date.now() 
          }
        });
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update doctor status with real-time broadcasting
   */
  async updateDoctorStatus(
    doctorId: string,
    status: DoctorStatus,
    delayMinutes: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const updateData: any = {
        status,
        delay_minutes: delayMinutes,
        status_update_time: new Date().toISOString()
      };

      if (delayMinutes > 0) {
        updateData.delay_start_time = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('doctors')
        .update(updateData)
        .eq('id', doctorId);

      if (error) throw error;

      // Broadcast doctor status change
      if (this.statusChannel) {
        this.statusChannel.send({
          type: 'broadcast',
          event: 'doctor_status_change',
          payload: { 
            doctorId, 
            status, 
            delayMinutes,
            timestamp: Date.now() 
          }
        });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update patient check-in status
   */
  async updateCheckInStatus(
    patientId: string,
    isCheckedIn: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const updateData: any = {
        is_checked_in: isCheckedIn
      };

      if (isCheckedIn) {
        updateData.time_checked_in = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId);

      if (error) throw error;

      // Broadcast check-in status change
      if (this.statusChannel) {
        this.statusChannel.send({
          type: 'broadcast',
          event: 'checkin_status_change',
          payload: { 
            patientId, 
            isCheckedIn,
            timestamp: Date.now() 
          }
        });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update emergency status
   */
  async updateEmergencyStatus(
    patientId: string,
    isEmergency: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('patients')
        .update({ is_emergency: isEmergency })
        .eq('id', patientId);

      if (error) throw error;

      // Broadcast emergency status change
      if (this.statusChannel) {
        this.statusChannel.send({
          type: 'broadcast',
          event: 'emergency_status_change',
          payload: { 
            patientId, 
            isEmergency,
            timestamp: Date.now() 
          }
        });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to status changes
   */
  subscribeToStatusChanges(callback: (event: string, payload: any) => void): () => void {
    if (!this.statusChannel) return () => {};

    const unsubscribe = this.statusChannel.on('broadcast', callback);
    
    return () => {
      if (this.statusChannel) {
        this.statusChannel.off('broadcast', unsubscribe);
      }
    };
  }
}

export const statusSyncService = new StatusSyncService();