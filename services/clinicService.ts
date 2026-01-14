/**
 * Clinic Management Service - Complete Supabase Integration
 * Handles: Clinic CRUD, Doctors, Patients, Queue Management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Clinic, Doctor, Patient, PatientStatus, DoctorStatus, Staff } from '../types';

interface ClinicQueryOptions {
  city?: string;
  specialty?: string;
  rating?: number;
  limit?: number;
  offset?: number;
}

class ClinicService {
  private supabase: SupabaseClient | null = null;
  private clinicListeners: ((clinics: Clinic[]) => void)[] = [];
  private clinicSubscriptions: { [key: string]: any } = {};
  private clinicListSubscription: any = null;

  /**
   * Initialize with Supabase client
   */
  initialize(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get all clinics (with optional filters)
   */
  async getAllClinics(options?: ClinicQueryOptions): Promise<Clinic[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('clinics')
        .select('*');

      // Apply filters
      if (options?.city) {
        query = query.eq('city', options.city);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map clinic rows to Clinic objects
      const clinics = (data || []).map((clinic: any) => this.mapClinicData(clinic));

      // Fetch doctors for all clinics in one query and attach them
      try {
        const clinicIds = clinics.map(c => c.id).filter(Boolean);
        if (clinicIds.length > 0) {
          const { data: docsData, error: docsError } = await this.supabase
            .from('doctors')
            .select('*')
            .in('clinic_id', clinicIds);

          if (!docsError && docsData) {
            const grouped: { [key: string]: any[] } = {};
            docsData.forEach((d: any) => {
              const cid = d.clinic_id || d.clinicId || null;
              if (!cid) return;
              grouped[cid] = grouped[cid] || [];
              grouped[cid].push(d);
            });

            clinics.forEach(c => {
              const docs = grouped[c.id] || [];
              c.doctors = docs.map((doc: any) => ({
                id: doc.id,
                masterId: doc.master_id || doc.id,
                clinicId: doc.clinic_id,
                name: doc.name,
                mobile: doc.mobile,
                email: doc.email,
                specialty: doc.specialty,
                registrationNumber: doc.registration_number,
                roomNumber: doc.room_number,
                isAvailable: doc.is_available,
                status: doc.status,
                delayMinutes: doc.delay_minutes,
                avatarUrl: doc.avatar_url,
                weeklySchedule: doc.weekly_schedule,
                consultationFee: doc.consultation_fee,
                consultationTime: doc.consultation_time,
                rating: doc.rating,
                reviewCount: doc.review_count,
                bio: doc.bio,
                education: doc.education,
                languages: doc.languages,
                experience: doc.experience,
                gender: doc.gender
              } as Doctor));
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch doctors for clinics:', e);
      }

      // Fetch patients for all clinics in one query and attach them
      try {
        const clinicIds = clinics.map(c => c.id).filter(Boolean);
        if (clinicIds.length > 0) {
          const { data: patientsData, error: patientsError } = await this.supabase
            .from('patients')
            .select('*')
            .in('clinic_id', clinicIds);

          if (!patientsError && patientsData) {
            const grouped: { [key: string]: any[] } = {};
            patientsData.forEach((p: any) => {
              const cid = p.clinic_id || p.clinicId || null;
              if (!cid) return;
              grouped[cid] = grouped[cid] || [];
              grouped[cid].push(p);
            });

            clinics.forEach(c => {
              const patients = grouped[c.id] || [];
              c.patients = patients.map((patient: any) => ({
                id: patient.id,
                tokenNumber: patient.queue_order || 0,
                queueOrder: patient.queue_order,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                isVerified: patient.is_verified,
                status: patient.status,
                doctorId: patient.doctor_id,
                timeAdded: new Date(patient.time_added || patient.created_at).getTime(),
                timeStarted: patient.time_started ? new Date(patient.time_started).getTime() : undefined,
                timeCompleted: patient.time_completed ? new Date(patient.time_completed).getTime() : undefined,
                notes: patient.notes,
                diagnosis: patient.diagnosis,
                visitType: patient.visit_type,
                appointmentDate: patient.appointment_date,
                appointmentTime: patient.appointment_time,
                isEmergency: patient.is_emergency,
                isCheckedIn: patient.is_checked_in,
                vitals: patient.vitals,
                painPoints: patient.pain_points,
                rating: patient.rating,
                feedback: patient.feedback,
                age: patient.age,
                gender: patient.gender,
                symptoms: patient.symptoms,
                nextOfKin: patient.next_of_kin,
                address: patient.address,
                city: patient.city,
                country: patient.country,
                location: patient.location
              } as Patient));
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch patients for clinics:', e);
      }

      return clinics;
    } catch (error) {
      console.error('Error fetching clinics:', error);
      return [];
    }
  }

  /**
   * Get clinic by ID with all relations
   */
  async getClinicById(clinicId: string): Promise<Clinic | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) throw error;

      return this.mapClinicData(data);
    } catch (error) {
      console.error(`Error fetching clinic ${clinicId}:`, error);
      return null;
    }
  }

  /**
   * Search clinics by name, city, or specialty
   */
  async searchClinics(query: string): Promise<Clinic[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('clinics')
        .select('*')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`);

      if (error) throw error;

      return data.map(clinic => this.mapClinicData(clinic)) || [];
    } catch (error) {
      console.error('Error searching clinics:', error);
      return [];
    }
  }

  /**
   * Get nearby clinics (by geolocation)
   */
  async getNearByClinics(lat: number, lng: number, radiusKm: number = 5): Promise<Clinic[]> {
    if (!this.supabase) return [];

    try {
      // Using Supabase PostGIS distance calculation
      const { data, error } = await this.supabase.rpc(
        'get_nearby_clinics',
        {
          lat,
          lng,
          radius_km: radiusKm
        }
      );

      if (error) throw error;

      return data.map((clinic: any) => this.mapClinicData(clinic)) || [];
    } catch (error) {
      console.error('Error finding nearby clinics:', error);
      return [];
    }
  }

  /**
   * Create new clinic
   */
  async createClinic(clinic: Clinic): Promise<{ success: boolean; clinicId?: string; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { data, error } = await this.supabase
        .from('clinics')
        .insert([{
          id: clinic.id,
          name: clinic.name,
          slug: clinic.slug,
          city: clinic.city,
          address: clinic.address,
          pincode: clinic.pincode,
          type: clinic.type,
          plan: clinic.plan,
          operation_mode: clinic.operationMode,
          enable_advance_booking: clinic.enableAdvanceBooking,
          timezone: clinic.timezone,
          operating_hours: clinic.operatingHours,
          image_url: clinic.imageUrl,
          contact_phone: clinic.contactPhone,
          about: clinic.about,
          amenities: clinic.amenities,
          subscription_status: clinic.subscriptionStatus,
          geo_location: clinic.geoLocation,
          working_hours: clinic.workingHours,
          metadata: {}
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        clinicId: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Clinic creation failed'
      };
    }
  }

  /**
   * Update clinic details
   */
  async updateClinic(clinicId: string, updates: Partial<Clinic>): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('clinics')
        .update({
          name: updates.name,
          slug: updates.slug,
          city: updates.city,
          address: updates.address,
          pincode: updates.pincode,
          type: updates.type,
          plan: updates.plan,
          operation_mode: updates.operationMode,
          enable_advance_booking: updates.enableAdvanceBooking,
          timezone: updates.timezone,
          operating_hours: updates.operatingHours,
          image_url: updates.imageUrl,
          contact_phone: updates.contactPhone,
          about: updates.about,
          amenities: updates.amenities,
          subscription_status: updates.subscriptionStatus,
          geo_location: updates.geoLocation,
          working_hours: updates.workingHours
        })
        .eq('id', clinicId);

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
   * Delete clinic (soft delete)
   */
  async deleteClinic(clinicId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('clinics')
        .update({ subscription_status: 'SUSPENDED' })
        .eq('id', clinicId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Deletion failed'
      };
    }
  }

  /**
   * Subscribe to clinic updates (realtime)
   */
  subscribeToClinic(clinicId: string, callback: (clinic: Clinic) => void): () => void {
    if (!this.supabase) return () => {};

    if (this.clinicSubscriptions[clinicId]) {
      this.clinicSubscriptions[clinicId].unsubscribe();
    }

    this.clinicSubscriptions[clinicId] = this.supabase
      .channel(`clinic:${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinics',
          filter: `id=eq.${clinicId}`
        },
        async (payload) => {
          const clinic = this.mapClinicData(payload.new);
          callback(clinic);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      if (this.clinicSubscriptions[clinicId]) {
        this.clinicSubscriptions[clinicId].unsubscribe();
        delete this.clinicSubscriptions[clinicId];
      }
    };
  }

  /**
   * Get clinic stats (patients today, avg wait time, etc.)
   */
  async getClinicStats(clinicId: string): Promise<any> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase.rpc(
        'get_clinic_stats',
        { clinic_id: clinicId }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching clinic stats:', error);
      return null;
    }
  }

  /**
   * Helper: Map clinic data from database to TypeScript type
   */
  private mapClinicData(data: any): Clinic {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
      type: data.type,
      plan: data.plan,
      operationMode: data.operation_mode,
      enableAdvanceBooking: data.enable_advance_booking || false,
      city: data.city,
      address: data.address,
      pincode: data.pincode,
      coordinates: data.coordinates,
      geoLocation: data.geo_location,
      timezone: data.timezone,
      operatingHours: data.operating_hours,
      imageUrl: data.image_url,
      contactPhone: data.contact_phone,
      about: data.about,
      amenities: data.amenities || [],
      subscriptionStatus: data.subscription_status || 'ACTIVE',
      joinedDate: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      workingHours: data.working_hours || [],
      leaveDays: data.leave_days || [],
      appointmentConfig: data.appointment_config,
      doctors: [],
      patients: [],
      staff: []
    };
  }

  /**
   * Subscribe to clinic list changes
   */
  onClinicsChange(callback: (clinics: Clinic[]) => void): () => void {
    this.clinicListeners.push(callback);
    return () => {
      this.clinicListeners = this.clinicListeners.filter(l => l !== callback);
    };
  }

  /**
   * Subscribe to all clinic list changes (realtime). Fetches full list on any change and notifies listeners.
   */
  subscribeToAllClinics(callback: (clinics: Clinic[]) => void): () => void {
    // Register the listener
    const unsubscribeListener = this.onClinicsChange(callback);

    if (!this.supabase) return unsubscribeListener;

    // If subscription already exists, just return the listener unsubscribe
    if (this.clinicListSubscription) return unsubscribeListener;

    this.clinicListSubscription = this.supabase
      .channel('public:clinics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinics' },
        async () => {
          try {
            const clinics = await this.getAllClinics();
            this.notifyListeners(clinics);
          } catch (e) {
            console.warn('Failed to refresh clinics on realtime event', e);
          }
        }
      )
      .subscribe();

    // Return combined unsubscribe
    return () => {
      // Remove listener
      unsubscribeListener();

      // If no more listeners, teardown subscription
      if (this.clinicListeners.length === 0 && this.clinicListSubscription) {
        try {
          this.clinicListSubscription.unsubscribe();
        } catch (e) {
          console.warn('Error unsubscribing clinic list subscription', e);
        }
        this.clinicListSubscription = null;
      }
    };
  }

  /**
   * Notify listeners of clinic changes
   */
  private notifyListeners(clinics: Clinic[]) {
    this.clinicListeners.forEach(listener => listener(clinics));
  }
}

export const clinicService = new ClinicService();

export type { ClinicQueryOptions };
