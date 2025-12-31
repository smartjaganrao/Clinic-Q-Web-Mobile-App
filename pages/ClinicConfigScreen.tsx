import React, { useState, useEffect } from 'react';
import { Clinic, ClinicDayConfig, Shift } from '../types';
import { Button } from '../components/Button';

interface ClinicConfigScreenProps {
  clinic: Clinic;
  onSave: (updates: Partial<Clinic>) => Promise<void>;
  onBack: () => void;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const ClinicConfigScreen: React.FC<ClinicConfigScreenProps> = ({ clinic, onSave, onBack }) => {
  const [configs, setConfigs] = useState<ClinicDayConfig[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clinic.workingHours && clinic.workingHours.length > 0) {
      setConfigs(clinic.workingHours);
    } else {
      // Initialize default structure if empty
      setConfigs(DAYS.map(day => ({
        dayOfWeek: day,
        isOpen: false,
        shifts: []
      })));
    }
  }, [clinic]);

  const handleToggleOpen = (index: number) => {
    const newConfigs = [...configs];
    newConfigs[index].isOpen = !newConfigs[index].isOpen;
    // Add default shift if opening and no shifts exist
    if (newConfigs[index].isOpen && newConfigs[index].shifts.length === 0) {
      newConfigs[index].shifts.push({ start: '09:00', end: '17:00' });
    }
    setConfigs(newConfigs);
  };

  const handleShiftChange = (dayIndex: number, shiftIndex: number, field: keyof Shift, value: string) => {
    const newConfigs = [...configs];
    newConfigs[dayIndex].shifts[shiftIndex][field] = value;
    setConfigs(newConfigs);
  };

  const addShift = (dayIndex: number) => {
    const newConfigs = [...configs];
    newConfigs[dayIndex].shifts.push({ start: '18:00', end: '21:00' });
    setConfigs(newConfigs);
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    const newConfigs = [...configs];
    newConfigs[dayIndex].shifts.splice(shiftIndex, 1);
    setConfigs(newConfigs);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ workingHours: configs });
    setSaving(false);
    onBack();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-sm rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Clinic Working Hours</h2>
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
      </div>
      
      <p className="mb-6 text-slate-600 bg-blue-50 p-4 rounded border border-blue-100">
        Define your clinic's outer boundary. Doctor schedules must fall within these hours.
      </p>

      <div className="space-y-4">
        {configs.map((config, dayIndex) => (
          <div key={config.dayOfWeek} className={`p-4 rounded border ${config.isOpen ? 'border-slate-300 bg-white' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 font-bold text-slate-700">{config.dayOfWeek}</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.isOpen} 
                  onChange={() => handleToggleOpen(dayIndex)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-600">{config.isOpen ? 'Open' : 'Closed'}</span>
              </label>
              
              {config.isOpen && (
                <Button size="sm" variant="ghost" onClick={() => addShift(dayIndex)} className="text-blue-600 text-xs">
                  + Add Shift
                </Button>
              )}
            </div>

            {config.isOpen && (
              <div className="mt-3 ml-20 space-y-2">
                {config.shifts.map((shift, sIndex) => (
                  <div key={sIndex} className="flex items-center gap-2">
                    <input type="time" value={shift.start} onChange={(e) => handleShiftChange(dayIndex, sIndex, 'start', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                    <span className="text-slate-400">-</span>
                    <input type="time" value={shift.end} onChange={(e) => handleShiftChange(dayIndex, sIndex, 'end', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                    <button onClick={() => removeShift(dayIndex, sIndex)} className="text-red-500 hover:text-red-700 ml-2">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</Button>
      </div>
    </div>
  );
};