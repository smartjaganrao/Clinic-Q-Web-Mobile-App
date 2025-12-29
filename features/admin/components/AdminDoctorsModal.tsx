
import React, { useState } from 'react';
import { Clinic, Doctor, DoctorStatus } from '../../../types';
import { Modal } from '../../../components/Modal';
import { DoctorManager } from '../../reception/components/DoctorManager';
import { DoctorFormModal } from '../../reception/components/DoctorFormModal';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

interface AdminDoctorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    clinic: Clinic;
    onAddDoctor: (clinicId: string, doctor: Doctor) => void;
    onEditDoctor: (clinicId: string, doctorId: string, updates: Partial<Doctor>) => void;
    onDeleteDoctor: (clinicId: string, doctorId: string) => void;
    onCheckMasterDoctor: (mobile: string) => Doctor | null;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdminDoctorsModal: React.FC<AdminDoctorsModalProps> = ({
    isOpen, onClose, clinic, onAddDoctor, onEditDoctor, onDeleteDoctor, onCheckMasterDoctor, addToast
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);
    const [mode, setMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

    const handleSave = (data: any) => {
        if (mode === 'ADD') {
            const newDoc: Doctor = {
                id: `doc_${Date.now()}`,
                masterId: data.masterId || `master_${Date.now()}`,
                name: data.name,
                specialty: data.specialty,
                roomNumber: data.room,
                mobile: data.mobile,
                registrationNumber: data.regNo,
                weeklySchedule: data.schedule,
                isAvailable: true,
                status: DoctorStatus.AVAILABLE,
                delayMinutes: 0,
                consultationFee: parseFloat(data.fee),
                consultationTime: parseFloat(data.consultationTime),
                rating: 5.0,
                reviewCount: 0,
                avatarUrl: data.avatarUrl || `https://i.pravatar.cc/150?u=${data.masterId || Date.now()}`
            };
            onAddDoctor(clinic.id, newDoc);
            addToast('Doctor added successfully', 'success');
        } else if (editingDoctor) {
            onEditDoctor(clinic.id, editingDoctor.id, {
                name: data.name,
                specialty: data.specialty,
                roomNumber: data.room,
                weeklySchedule: data.schedule,
                consultationFee: parseFloat(data.fee),
                consultationTime: parseFloat(data.consultationTime),
                mobile: data.mobile,
                registrationNumber: data.regNo,
                masterId: data.masterId,
                avatarUrl: data.avatarUrl
            });
            addToast('Doctor updated', 'success');
        }
        setIsFormOpen(false);
    };

    const handleAddPresetSlot = (doctorId: string, day: string) => {
        const doc = clinic.doctors.find(d => d.id === doctorId);
        if (doc) {
            const newSchedule = doc.weeklySchedule.map(s => {
                if (s.day === day) {
                    return {
                        ...s,
                        isOff: false,
                        slots: [...(s.slots || []), { startTime: '09:00', endTime: '13:00', active: true, label: 'Morning' }]
                    };
                }
                return s;
            });
            onEditDoctor(clinic.id, doctorId, { weeklySchedule: newSchedule });
            addToast('Morning slot added', 'success');
        }
    };

    const handleConfirmDelete = () => {
        if (doctorToDelete) {
            onDeleteDoctor(clinic.id, doctorToDelete.id);
            setDoctorToDelete(null);
            addToast('Doctor profile removed', 'info');
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Manage Doctors - ${clinic.name}`} maxWidth="max-w-6xl">
                <div className="h-[600px] flex flex-col">
                    <DoctorManager 
                        doctors={clinic.doctors}
                        onAddDoctor={() => { setMode('ADD'); setEditingDoctor(undefined); setIsFormOpen(true); }}
                        onEditDoctor={(doc) => { setMode('EDIT'); setEditingDoctor(doc); setIsFormOpen(true); }}
                        onDeleteDoctor={(id) => { 
                            const doc = clinic.doctors.find(d => d.id === id);
                            if (doc) setDoctorToDelete(doc);
                        }}
                        onAddPresetSlot={handleAddPresetSlot}
                        onStatusChange={(id, status) => onEditDoctor(clinic.id, id, { status })}
                    />
                </div>
            </Modal>

            <DoctorFormModal 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                mode={mode}
                initialData={editingDoctor}
                onSave={handleSave}
                onCheckMasterDoctor={onCheckMasterDoctor}
                addToast={addToast}
                clinicOperatingHours={clinic.operatingHours} // Pass clinic operating hours
            />

            <ConfirmationModal 
                isOpen={!!doctorToDelete}
                onClose={() => setDoctorToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Remove Doctor?"
                message={`Are you sure you want to remove Dr. ${doctorToDelete?.name}? This will clear their assignment in this clinic.`}
                confirmLabel="Remove Doctor"
                variant="danger"
            />
        </>
    );
};
