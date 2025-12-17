
import React, { useState } from 'react';
import { Doctor, ClinicOperationMode, Review } from '../../../types';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Clock, GraduationCap, Languages, Calendar, User, MessageSquare, Zap, ShieldCheck } from 'lucide-react';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  operationMode?: ClinicOperationMode;
  onBook: () => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({ isOpen, onClose, doctor, operationMode, onBook }) => {
  if (!doctor) return null;

  const canQueue = operationMode && [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(operationMode);

  // Safely access arrays with fallbacks
  const education = doctor.education || [];
  const languages = doctor.languages || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Doctor Profile" maxWidth="max-w-2xl">
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <img 
            src={doctor.avatarUrl} 
            alt={doctor.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-100 shadow-md" 
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
             <h2 className="text-2xl font-bold text-slate-900">{doctor.name}</h2>
             <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary-100 uppercase tracking-wide">Verified</span>
          </div>
          <p className="text-lg text-slate-600 mb-2">{doctor.specialty}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
              <Clock className="h-4 w-4" /> {doctor.experience || 5}+ Years Exp.
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-sm font-bold border border-slate-200">
              <ShieldCheck className="h-4 w-4" /> Registration Verified
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <div className="pb-3 text-sm font-bold text-primary-600 border-b-2 border-primary-600 px-4">
          About & Credentials
        </div>
      </div>

      <div className="min-h-[200px]">
        <div className="space-y-6 animate-in fade-in">
          {doctor.bio && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-primary-600" /> Biography
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary-600" /> Education
              </h4>
              <ul className="space-y-2">
                {education.map((edu, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></span>
                    {edu}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary-600" /> Languages Spoken
              </h4>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button onClick={onBook} className="shadow-lg shadow-primary-200 px-8">
          {canQueue ? <Zap className="h-4 w-4 mr-2 fill-current" /> : <Calendar className="h-4 w-4 mr-2" />}
          {canQueue ? "Get Token / Join Queue" : "Book Appointment"}
        </Button>
      </div>
    </Modal>
  );
};
