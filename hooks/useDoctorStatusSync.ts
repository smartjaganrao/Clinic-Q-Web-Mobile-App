import { useEffect, useState } from 'react';
import { Doctor, DoctorStatus } from '../types';
import { getSupabase } from '../services/supabaseClient';

/**
 * Real-time doctor status synchronization hook
 */
export const useDoctorStatusSync = (doctorId: string, initialStatus: DoctorStatus) => {
  const [status, setStatus] = useState<DoctorStatus>(initialStatus);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!doctorId) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setIsConnected(true);

    // Subscribe to doctor status changes
    const channel = supabase
      .channel(`doctor_status:${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'doctors',
          filter: `id=eq.${doctorId}`
        },
        (payload) => {
          const newData = payload.new as any;
          setStatus(newData.status);
          setDelayMinutes(newData.delay_minutes || 0);
        }
      )
      .subscribe();

    return () => {
      setIsConnected(false);
      channel.unsubscribe();
    };
  }, [doctorId]);

  const updateStatus = async (newStatus: DoctorStatus, newDelayMinutes: number = 0) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const updateData: any = {
        status: newStatus,
        delay_minutes: newDelayMinutes,
        status_update_time: new Date().toISOString()
      };

      if (newDelayMinutes > 0) {
        updateData.delay_start_time = new Date().toISOString();
      }

      await supabase
        .from('doctors')
        .update(updateData)
        .eq('id', doctorId);

      // Update local state immediately for optimistic updates
      setStatus(newStatus);
      setDelayMinutes(newDelayMinutes);
    } catch (error) {
      console.error('Failed to update doctor status:', error);
    }
  };

  return { status, delayMinutes, isConnected, updateStatus };
};