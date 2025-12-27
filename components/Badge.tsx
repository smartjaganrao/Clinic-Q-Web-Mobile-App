
import React from 'react';
import { PatientStatus } from '../types';

interface BadgeProps {
  status: PatientStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles = {
    [PatientStatus.WAITING]: 'bg-yellow-100 text-yellow-800',
    [PatientStatus.WITH_DOCTOR]: 'bg-blue-100 text-blue-800 animate-pulse',
    [PatientStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [PatientStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [PatientStatus.SKIPPED]: 'bg-slate-100 text-slate-600',
    [PatientStatus.ON_HOLD]: 'bg-orange-100 text-orange-800 border border-orange-200',
  };

  const labels = {
    [PatientStatus.WAITING]: 'Waiting',
    [PatientStatus.WITH_DOCTOR]: 'In Consultation',
    [PatientStatus.COMPLETED]: 'Completed',
    [PatientStatus.CANCELLED]: 'Cancelled',
    [PatientStatus.SKIPPED]: 'Skipped',
    [PatientStatus.ON_HOLD]: 'On Hold',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
