import { useState, useCallback } from 'react';
import { PatientStatus, DoctorStatus } from '../types';
import { statusSyncService } from '../services/statusSyncService';

/**
 * Hook for optimistic updates with rollback on failure
 */
export const useOptimisticUpdates = () => {
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const updatePatientStatus = useCallback(async (
    patientId: string,
    newStatus: PatientStatus,
    currentStatus: PatientStatus,
    onOptimisticUpdate: (id: string, status: PatientStatus) => void,
    onRollback: (id: string, status: PatientStatus) => void,
    clinicId?: string
  ) => {
    // Optimistic update
    onOptimisticUpdate(patientId, newStatus);
    setPendingUpdates(prev => new Set(prev).add(patientId));

    try {
      const result = await statusSyncService.updatePatientStatus(patientId, newStatus, clinicId);
      
      if (!result.success) {
        // Rollback on failure
        onRollback(patientId, currentStatus);
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      // Rollback on error
      onRollback(patientId, currentStatus);
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    }
  }, []);

  const updateDoctorStatus = useCallback(async (
    doctorId: string,
    newStatus: DoctorStatus,
    delayMinutes: number,
    currentStatus: DoctorStatus,
    currentDelayMinutes: number,
    onOptimisticUpdate: (id: string, status: DoctorStatus, delay: number) => void,
    onRollback: (id: string, status: DoctorStatus, delay: number) => void
  ) => {
    // Optimistic update
    onOptimisticUpdate(doctorId, newStatus, delayMinutes);
    setPendingUpdates(prev => new Set(prev).add(doctorId));

    try {
      const result = await statusSyncService.updateDoctorStatus(doctorId, newStatus, delayMinutes);
      
      if (!result.success) {
        // Rollback on failure
        onRollback(doctorId, currentStatus, currentDelayMinutes);
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      // Rollback on error
      onRollback(doctorId, currentStatus, currentDelayMinutes);
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(doctorId);
        return newSet;
      });
    }
  }, []);

  const updateCheckInStatus = useCallback(async (
    patientId: string,
    isCheckedIn: boolean,
    currentCheckedIn: boolean,
    onOptimisticUpdate: (id: string, checkedIn: boolean) => void,
    onRollback: (id: string, checkedIn: boolean) => void
  ) => {
    // Optimistic update
    onOptimisticUpdate(patientId, isCheckedIn);
    setPendingUpdates(prev => new Set(prev).add(patientId));

    try {
      const result = await statusSyncService.updateCheckInStatus(patientId, isCheckedIn);
      
      if (!result.success) {
        // Rollback on failure
        onRollback(patientId, currentCheckedIn);
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      // Rollback on error
      onRollback(patientId, currentCheckedIn);
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    }
  }, []);

  const isPending = useCallback((id: string) => pendingUpdates.has(id), [pendingUpdates]);

  return {
    updatePatientStatus,
    updateDoctorStatus,
    updateCheckInStatus,
    isPending
  };
};