import { useEffect, useState } from 'react';
import { Patient } from '../types';
import { patientService } from '../services/patientService';

/**
 * Real-time queue subscription hook for consistent updates across all apps
 */
export const useRealtimeQueue = (clinicId: string, initialPatients: Patient[] = []) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!clinicId) return;

    setIsConnected(true);
    
    // Subscribe to real-time queue updates
    const unsubscribe = patientService.subscribeToQueue(clinicId, (updatedPatients) => {
      setPatients(updatedPatients);
    });

    return () => {
      setIsConnected(false);
      unsubscribe();
    };
  }, [clinicId]);

  // Update local state when initial patients change
  useEffect(() => {
    setPatients(initialPatients);
  }, [initialPatients]);

  return { patients, isConnected };
};