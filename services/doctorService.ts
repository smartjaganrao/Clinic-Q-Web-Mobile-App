/**
 * Doctor Management Service - Complete Supabase Integration
 * Handles: Doctor Profiles, Schedules, Availability, Appointments
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Doctor, DoctorStatus, DaySchedule, Review } from '../types';

interface DoctorQueryOptions {
  clinicId?: string;
  specialty?: string;
  rating?: number;
  limit?: number;
  offset?: number;
}

interface DoctorAvailability {
  doctorId: string;
  date: string;
  availableSlots: { time: string; capacity: number; booked: number }[];
}

class DoctorService {
  private supabase: SupabaseClient | null = null;
  private doctorListeners: { [key: string]: ((doctors: Doctor[]) => void)[] } = {};
  private doctorSubscriptions: { [key: string]: any } = {};

  /**
   * Initialize with Supabase client
   */
  initialize(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get all doctors (with optional filters)
   */
  async getDoctors(options?: DoctorQueryOptions): Promise<Doctor[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('doctors')
        .select('*');

      if (options?.clinicId) {
        query = query.eq('clinic_id', options.clinicId);
      }

      if (options?.specialty) {
        query = query.eq('specialty', options.specialty);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(doctor => this.mapDoctorData(doctor)) || [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId: string): Promise<Doctor | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (error) throw error;

      return this.mapDoctorData(data);
    } catch (error) {
      console.error(`Error fetching doctor ${doctorId}:`, error);
      return null;
    }
  }

  /**
   * Get doctors by specialty
   */
  async getDoctorsBySpecialty(clinicId: string, specialty: string): Promise<Doctor[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('specialty', specialty)
        .order('rating', { ascending: false });

      if (error) throw error;

      return data.map(doctor => this.mapDoctorData(doctor)) || [];
    } catch (error) {
      console.error('Error fetching doctors by specialty:', error);
      return [];
    }
  }

  /**
   * Search doctors by name or specialty
   */
  async searchDoctors(query: string): Promise<Doctor[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .or(`name.ilike.%${query}%,specialty.ilike.%${query}%`);

      if (error) throw error;

      return data.map(doctor => this.mapDoctorData(doctor)) || [];
    } catch (error) {
      console.error('Error searching doctors:', error);
      return [];
    }
  }

  /**
   * Create new doctor profile
   */
  async createDoctor(doctor: Doctor): Promise<{ success: boolean; doctorId?: string; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .insert([
          {
            id: doctor.id,
            master_id: doctor.masterId,
            clinic_id: doctor.clinicId,
            name: doctor.name,
            mobile: doctor.mobile,
            email: doctor.email,
            specialty: doctor.specialty,
            registration_number: doctor.registrationNumber,
            room_number: doctor.roomNumber,
            is_available: doctor.isAvailable,
            status: doctor.status,
            delay_minutes: doctor.delayMinutes,
            avatar_url: doctor.avatarUrl,
            weekly_schedule: doctor.weeklySchedule,
            consultation_fee: doctor.consultationFee,
            consultation_time: doctor.consultationTime,
            rating: doctor.rating,
            review_count: doctor.reviewCount,
            bio: doctor.bio,
            education: doctor.education,
            languages: doctor.languages,
            experience: doctor.experience,
            gender: doctor.gender,
            reviews: doctor.reviews,
            metadata: {}
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        doctorId: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Doctor creation failed'
      };
    }
  }

  /**
   * Update doctor profile
   */
  async updateDoctor(doctorId: string, updates: Partial<Doctor>): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('doctors')
        .update({
          name: updates.name,
          email: updates.email,
          mobile: updates.mobile,
          specialty: updates.specialty,
          room_number: updates.roomNumber,
          is_available: updates.isAvailable,
          status: updates.status,
          delay_minutes: updates.delayMinutes,
          avatar_url: updates.avatarUrl,
          weekly_schedule: updates.weeklySchedule,
          consultation_fee: updates.consultationFee,
          consultation_time: updates.consultationTime,
          bio: updates.bio,
          education: updates.education,
          languages: updates.languages,
          experience: updates.experience
        })
        .eq('id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed'
      };
    }
  }

  /**
   * Delete a doctor by id and clear doctor reference in patients
   */
  async deleteDoctor(doctorId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      // Remove doctor record
      const { error: delErr } = await this.supabase.from('doctors').delete().eq('id', doctorId);
      if (delErr) throw delErr;

      // Clear doctor_id references from patients (set to null)
      const { error: updErr } = await this.supabase.from('patients').update({ doctor_id: null }).eq('doctor_id', doctorId);
      if (updErr) console.warn('Failed to clear patients for deleted doctor:', updErr);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Delete failed' };
    }
  }

  /**
   * Update doctor status (AVAILABLE, ON_BREAK, OFF_DUTY)
   */
  async updateDoctorStatus(doctorId: string, status: DoctorStatus): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('doctors')
        .update({
          status,
          status_update_time: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Status update failed'
      };
    }
  }

  /**
   * Update doctor delay
   */
  async updateDoctorDelay(doctorId: string, delayMinutes: number): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('doctors')
        .update({
          delay_minutes: delayMinutes,
          delay_start_time: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Delay update failed'
      };
    }
  }

  /**
   * Update doctor schedule
   */
  async updateDoctorSchedule(
    doctorId: string,
    schedule: DaySchedule[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('doctors')
        .update({
          weekly_schedule: schedule
        })
        .eq('id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Schedule update failed'
      };
    }
  }

  /**
   * Add review for doctor
   */
  async addReview(doctorId: string, review: Review): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      // Insert review
      const { error: insertError } = await this.supabase
        .from('doctor_reviews')
        .insert([
          {
            id: review.id,
            doctor_id: doctorId,
            patient_name: review.patientName,
            rating: review.rating,
            comment: review.comment,
            date: review.date
          }
        ]);

      if (insertError) throw insertError;

      // Update doctor rating
      const { data: reviewsData, error: fetchError } = await this.supabase
        .from('doctor_reviews')
        .select('rating')
        .eq('doctor_id', doctorId);

      if (fetchError) throw fetchError;

      const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;

      await this.supabase
        .from('doctors')
        .update({
          rating: parseFloat(avgRating.toFixed(1)),
          review_count: reviewsData.length
        })
        .eq('id', doctorId);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Review submission failed'
      };
    }
  }

  /**
   * Get doctor availability for date
   */
  async getDoctorAvailability(
    doctorId: string,
    date: string
  ): Promise<DoctorAvailability | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase.rpc(
        'get_doctor_availability',
        { doctor_id: doctorId, appointment_date: date }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      return null;
    }
  }

  /**
   * Subscribe to doctor updates
   */
  subscribeToDoctor(doctorId: string, callback: (doctor: Doctor) => void): () => void {
    if (!this.supabase) return () => {};

    if (this.doctorSubscriptions[doctorId]) {
      this.doctorSubscriptions[doctorId].unsubscribe();
    }

    this.doctorSubscriptions[doctorId] = this.supabase
      .channel(`doctor:${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `id=eq.${doctorId}`
        },
        async (payload) => {
          const doctor = this.mapDoctorData(payload.new);
          callback(doctor);
        }
      )
      .subscribe();

    return () => {
      if (this.doctorSubscriptions[doctorId]) {
        this.doctorSubscriptions[doctorId].unsubscribe();
        delete this.doctorSubscriptions[doctorId];
      }
    };
  }

  /**
   * Subscribe to clinic doctors
   */
  subscribeToClinicDoctors(
    clinicId: string,
    callback: (doctors: Doctor[]) => void
  ): () => void {
    if (!this.supabase) return () => {};

    if (!this.doctorListeners[clinicId]) {
      this.doctorListeners[clinicId] = [];
    }
    this.doctorListeners[clinicId].push(callback);

    if (this.doctorSubscriptions[`clinic:${clinicId}`]) {
      return () => this.unsubscribeFromClinicDoctors(clinicId, callback);
    }

    this.doctorSubscriptions[`clinic:${clinicId}`] = this.supabase
      .channel(`clinic-doctors:${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `clinic_id=eq.${clinicId}`
        },
        async () => {
          const doctors = await this.getDoctors({ clinicId });
          this.notifyDoctorListeners(clinicId, doctors);
        }
      )
      .subscribe();

    return () => this.unsubscribeFromClinicDoctors(clinicId, callback);
  }

  /**
   * Unsubscribe from clinic doctors
   */
  private unsubscribeFromClinicDoctors(
    clinicId: string,
    callback: (doctors: Doctor[]) => void
  ) {
    if (this.doctorListeners[clinicId]) {
      this.doctorListeners[clinicId] = this.doctorListeners[clinicId].filter(
        listener => listener !== callback
      );
    }

    if (
      this.doctorListeners[clinicId]?.length === 0 &&
      this.doctorSubscriptions[`clinic:${clinicId}`]
    ) {
      this.doctorSubscriptions[`clinic:${clinicId}`].unsubscribe();
      delete this.doctorSubscriptions[`clinic:${clinicId}`];
    }
  }

  /**
   * Notify doctor listeners
   */
  private notifyDoctorListeners(clinicId: string, doctors: Doctor[]) {
    if (this.doctorListeners[clinicId]) {
      this.doctorListeners[clinicId].forEach(listener => listener(doctors));
    }
  }

  /**
   * Helper: Map doctor data from database
   */
  private mapDoctorData(data: any): Doctor {
    return {
      id: data.id,
      masterId: data.master_id,
      clinicId: data.clinic_id,
      name: data.name,
      mobile: data.mobile,
      registrationNumber: data.registration_number,
      email: data.email,
      specialty: data.specialty,
      roomNumber: data.room_number,
      isAvailable: data.is_available,
      status: data.status,
      statusUpdateTime: data.status_update_time,
      delayStartTime: data.delay_start_time,
      delayMinutes: data.delay_minutes,
      avatarUrl: data.avatar_url,
      weeklySchedule: data.weekly_schedule,
      consultationFee: data.consultation_fee,
      consultationTime: data.consultation_time,
      rating: data.rating,
      reviewCount: data.review_count,
      bio: data.bio,
      education: data.education,
      languages: data.languages,
      experience: data.experience,
      gender: data.gender,
      reviews: data.reviews
    };
  }
}

export const doctorService = new DoctorService();

export type { DoctorQueryOptions, DoctorAvailability };
