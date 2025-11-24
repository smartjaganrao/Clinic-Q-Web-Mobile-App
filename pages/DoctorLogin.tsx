import React from 'react';
import { Doctor, Clinic } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User, Stethoscope, ArrowLeft } from 'lucide-react';

interface DoctorLoginProps {
  clinic: Clinic;
  onSelectDoctor: (doctorId: string) => void;
  onBack: () => void;
}

export const DoctorLogin: React.FC<DoctorLoginProps> = ({ clinic, onSelectDoctor, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-4">
            <Stethoscope className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Login</h1>
          <p className="text-slate-500">Select your profile to continue to {clinic.name}</p>
        </div>

        <div className="space-y-3">
          {clinic.doctors.map((doc) => (
            <Card 
              key={doc.id} 
              className="p-4 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all group"
              onClick={() => onSelectDoctor(doc.id)}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-primary-200">
                  <img src={doc.avatarUrl} alt={doc.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-sm text-slate-500">{doc.specialty}</p>
                </div>
                <div className="text-slate-300 group-hover:text-primary-500">
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Button variant="ghost" className="w-full" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clinic Selection
          </Button>
        </div>
      </div>
    </div>
  );
};