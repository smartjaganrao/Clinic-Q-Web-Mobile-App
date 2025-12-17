import React, { useState } from 'react';
import { Doctor, ClinicOperationMode, Review } from '../../../types';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Star, Clock, GraduationCap, Languages, Calendar, User, MessageSquare, Zap } from 'lucide-react';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  operationMode?: ClinicOperationMode;
  onBook: () => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({ isOpen, onClose, doctor, operationMode, onBook }) => {
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'REVIEWS'>('ABOUT');

  if (!doctor) return null;

  const canQueue = operationMode && [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(operationMode);

  // Safely access arrays with fallbacks
  const education = doctor.education || [];
  const languages = doctor.languages || [];
  const reviews: Review[] = doctor.reviews || [];

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
          <h2 className="text-2xl font-bold text-slate-900">{doctor.name}</h2>
          <p className="text-lg text-slate-600 mb-2">{doctor.specialty}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
            <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-100">
              <Star className="h-4 w-4 fill-current" /> {doctor.rating} ({doctor.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
              <Clock className="h-4 w-4" /> {doctor.experience || 5}+ Years Exp.
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button 
          className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'ABOUT' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('ABOUT')}
        >
          About & Credentials
        </button>
        <button 
          className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'REVIEWS' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('REVIEWS')}
        >
          Patient Reviews
        </button>
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'ABOUT' && (
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
        )}

        {activeTab === 'REVIEWS' && (
          <div className="space-y-4 animate-in fade-in">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {review.patientName?.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-slate-900">{review.patientName}</span>
                    </div>
                    <span className="text-xs text-slate-400">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No reviews yet.</p>
              </div>
            )}
          </div>
        )}
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