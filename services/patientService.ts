/**
 * Patient Management Service - Complete Supabase Integration
 * Handles: Patient Queue, Check-ins, Medical Records, Appointments
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Patient, PatientStatus, Vitals } from '../types';

interface PatientQueryOptions {
  clinicId: string;
  doctorId?: string;
  status?: PatientStatus;
  visitType?: 'WALK_IN' | 'APPOINTMENT';
  limit?: number;
  offset?: number;
}

interface QueueStats {
  total: number;
  waiting: number;
  withDoctor: number;
  completed: number;
  avgWaitTime: number;
}

class PatientService {
  private supabase: SupabaseClient | null = null;
  private queueListeners: { [key: string]: ((patients: Patient[]) => void)[] } = {};
  private queueSubscriptions: { [key: string]: any } = {};
  private statusChannel: any = null;

  /**
   * Initialize with Supabase client
   */
  initialize(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.setupStatusChannel();
  }

  /**
   * Setup real-time status broadcasting channel
   */
  private setupStatusChannel() {
    if (!this.supabase) return;
    this.statusChannel = this.supabase.channel('status_updates');
    this.statusChannel.subscribe();
  }

  /**
   * Add patient to queue (Walk-in or Appointment)
   */
  async addPatient(
    clinicId: string,
    patient: Omit<Patient, 'id' | 'tokenNumber' | 'queueOrder'>
  ): Promise<{ success: boolean; patientId?: string; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      // Get next token number
      const { data: queueData, error: queueError } = await this.supabase.rpc(
        'get_next_token_number',
        { clinic_id: clinicId, doctor_id: patient.doctorId }
      );

      if (queueError) throw queueError;

      const tokenNumber = queueData || 1;

      // Insert patient
      const { data, error } = await this.supabase
        .from('patients')
        .insert([
          {
            id: (patient as any).id,
            clinic_id: clinicId,
            doctor_id: patient.doctorId,
            name: patient.name,
            phone: patient.phone,
            email: patient.email,
            age: patient.age,
            gender: patient.gender && ['Male', 'Female', 'Other'].includes(patient.gender) ? patient.gender : null,
            token_number: tokenNumber,
            status: patient.status,
            visit_type: patient.visitType,
            appointment_date: patient.appointmentDate,
            appointment_time: patient.appointmentTime,
            is_checked_in: patient.isCheckedIn || false,
            is_emergency: patient.isEmergency || false,
            symptoms: patient.symptoms,
            notes: patient.notes,
            vitals: patient.vitals,
            time_added: new Date(patient.timeAdded).toISOString(),
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        patientId: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add patient'
      };
    }
  }

  /**
   * Get patients in clinic queue
   */
  async getClinicQueue(options: PatientQueryOptions): Promise<Patient[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', options.clinicId)
        .order('token_number', { ascending: true });

      if (options.doctorId) {
        query = query.eq('doctor_id', options.doctorId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.visitType) {
        query = query.eq('visit_type', options.visitType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        const limit = options.limit || 10;
        query = query.range(options.offset, options.offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(patient => this.mapPatientData(patient)) || [];
    } catch (error) {
      console.error('Error fetching queue:', error);
      return [];
    }
  }

  /**
   * Get single patient by ID
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;

      return this.mapPatientData(data);
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      return null;
    }
  }

  /**
   * Get patient medical history
   */
  async getPatientHistory(patientId: string, clinicId?: string): Promise<Patient[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('status', PatientStatus.COMPLETED)
        .order('time_completed', { ascending: false })
        .limit(50);

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(patient => this.mapPatientData(patient)) || [];
    } catch (error) {
      console.error('Error fetching patient history:', error);
      return [];
    }
  }

  /**
   * Update patient status (WAITING -> WITH_DOCTOR -> COMPLETED)
   */
  async updatePatientStatus(
    patientId: string,
    status: PatientStatus
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const updateData: any = {
        status
      };

      // Track timestamps
      if (status === PatientStatus.WITH_DOCTOR) {
        updateData.time_started = new Date().toISOString();
      } else if (status === PatientStatus.COMPLETED) {
        updateData.time_completed = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId);

      if (error) throw error;

      // Broadcast status change to all connected clients
      this.broadcastStatusChange(patientId, status);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed'
      };
    }
  }

  /**
   * Broadcast status changes to all connected clients
   */
  private broadcastStatusChange(patientId: string, status: PatientStatus) {
    if (this.statusChannel) {
      this.statusChannel.send({
        type: 'broadcast',
        event: 'status_change',
        payload: { patientId, status, timestamp: Date.now() }
      });
    }
  }

  /**
   * Check-in patient (mark arrival)
   */
  async checkInPatient(patientId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('patients')
        .update({
          is_checked_in: true,
          time_checked_in: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Check-in failed'
      };
    }
  }

  /**
   * Update patient vitals
   */
  async updatePatientVitals(
    patientId: string,
    vitals: Vitals
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('patients')
        .update({ vitals })
        .eq('id', patientId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Vitals update failed'
      };
    }
  }

  /**
   * Add patient notes (Diagnosis, feedback, etc.)
   */
  async addPatientNotes(
    patientId: string,
    notes: string,
    diagnosis?: string,
    rating?: number
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('patients')
        .update({
          notes,
          diagnosis,
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Notes update failed'
      };
    }
  }

  /**
   * Search patients by name or phone
   */
  async searchPatients(clinicId: string, query: string): Promise<Patient[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return data.map(patient => this.mapPatientData(patient)) || [];
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(clinicId: string, doctorId?: string): Promise<QueueStats | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase.rpc(
        'get_queue_stats',
        { clinic_id: clinicId, doctor_id: doctorId || null }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      return null;
    }
  }

  /**
   * Subscribe to clinic queue (realtime updates)
   */
  subscribeToQueue(clinicId: string, callback: (patients: Patient[]) => void): () => void {
    if (!this.supabase) return () => {};

    if (!this.queueListeners[clinicId]) {
      this.queueListeners[clinicId] = [];
    }
    this.queueListeners[clinicId].push(callback);

    if (this.queueSubscriptions[clinicId]) {
      return () => this.unsubscribeFromQueue(clinicId, callback);
    }

    this.queueSubscriptions[clinicId] = this.supabase
      .channel(`queue:${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `clinic_id=eq.${clinicId}`
        },
        async () => {
          // Fetch updated queue
          const patients = await this.getClinicQueue({ clinicId });
          this.notifyQueueListeners(clinicId, patients);
        }
      )
      .subscribe();

    return () => this.unsubscribeFromQueue(clinicId, callback);
  }

  /**
   * Unsubscribe from queue
   */
  private unsubscribeFromQueue(
    clinicId: string,
    callback: (patients: Patient[]) => void
  ) {
    if (this.queueListeners[clinicId]) {
      this.queueListeners[clinicId] = this.queueListeners[clinicId].filter(
        listener => listener !== callback
      );
    }

    if (
      this.queueListeners[clinicId]?.length === 0 &&
      this.queueSubscriptions[clinicId]
    ) {
      this.queueSubscriptions[clinicId].unsubscribe();
      delete this.queueSubscriptions[clinicId];
    }
  }

  /**
   * Notify queue listeners
   */
  private notifyQueueListeners(clinicId: string, patients: Patient[]) {
    if (this.queueListeners[clinicId]) {
      this.queueListeners[clinicId].forEach(listener => listener(patients));
    }
  }

  /**
   * Standardized queue sorting logic for consistency across all apps
   */
  static standardQueueSort(a: Patient, b: Patient): number {
    // 1. Queue Order (manual reordering)
    if (a.queueOrder !== undefined || b.queueOrder !== undefined) {
      const orderA = a.queueOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.queueOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
    }
    // 2. Emergency patients first
    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    // 3. Status priority (WAITING before ON_HOLD)
    const getStatusPriority = (s: PatientStatus) => {
      if (s === PatientStatus.WAITING) return 0;
      if (s === PatientStatus.ON_HOLD) return 1;
      return 2;
    };
    const pA = getStatusPriority(a.status);
    const pB = getStatusPriority(b.status);
    if (pA !== pB) return pA - pB;
    // 4. Time-based sorting
    const getSortTime = (p: Patient) => {
      if (p.visitType === 'APPOINTMENT' && p.appointmentDate && p.appointmentTime) {
        return new Date(`${p.appointmentDate}T${p.appointmentTime}:00`).getTime();
      }
      return p.timeAdded;
    };
    return getSortTime(a) - getSortTime(b);
  }

  /**
   * Helper: Map patient data from database
   */
  private mapPatientData(data: any): Patient {
    return {
      id: data.id,
      tokenNumber: data.token_number,
      name: data.name,
      phone: data.phone,
      email: data.email,
      status: data.status,
      doctorId: data.doctor_id,
      timeAdded: new Date(data.time_added).getTime(),
      timeStarted: data.time_started ? new Date(data.time_started).getTime() : undefined,
      timeCompleted: data.time_completed ? new Date(data.time_completed).getTime() : undefined,
      visitType: data.visit_type,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      isEmergency: data.is_emergency,
      isCheckedIn: data.is_checked_in,
      vitals: data.vitals,
      notes: data.notes,
      diagnosis: data.diagnosis,
      rating: data.rating,
      age: data.age,
      gender: data.gender,
      symptoms: data.symptoms,
      queueOrder: data.queue_order
    };
  }
}

export const patientService = new PatientService();

export type { PatientQueryOptions, QueueStats };
