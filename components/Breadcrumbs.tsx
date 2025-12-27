
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Ticket,
    History,
    User,
    Stethoscope,
    Building2,
    Home,
    ChevronRight
} from 'lucide-react';
import { Clinic, Doctor } from '../types';

interface BreadcrumbsProps {
    activeTab: 'ACTIVE' | 'BOOK' | 'HISTORY' | 'PROFILE';
    bookingView: 'LIST' | 'CLINIC_DETAILS' | 'DOCTOR_PROFILE' | 'FORM';
    selectedClinic?: Clinic;
    selectedDoctor?: Doctor;
    selectedProfileDoctor?: Doctor;
    navigateToView: (view: 'CLINIC_DETAILS', clinic: Clinic) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    activeTab,
    bookingView,
    selectedClinic,
    selectedDoctor,
    selectedProfileDoctor,
    navigateToView
}) => {
    const navigate = useNavigate();

    const items = useMemo(() => {
        const list = [{ label: 'Find Care', action: () => navigate('/patient/find'), icon: Search }];

        if (activeTab === 'ACTIVE') {
            return [{ label: 'My Active Visits', action: null, icon: Ticket }];
        }
        if (activeTab === 'HISTORY') {
            return [{ label: 'Visit History', action: null, icon: History }];
        }
        if (activeTab === 'PROFILE') {
            return [{ label: 'My Health Profile', action: null, icon: User }];
        }

        // Booking Workflow
        if (bookingView === 'DOCTOR_PROFILE' && selectedProfileDoctor) {
            list.push({ label: selectedProfileDoctor.name, action: null, icon: Stethoscope });
        } else if (bookingView === 'CLINIC_DETAILS' && selectedClinic) {
            list.push({ label: selectedClinic.name, action: null, icon: Building2 });
        } else if (bookingView === 'FORM' && selectedClinic && selectedDoctor) {
            list.push({ label: selectedClinic.name, action: () => navigateToView('CLINIC_DETAILS', selectedClinic), icon: Building2 });
            list.push({ label: `Book ${selectedDoctor.name}`, action: null, icon: Stethoscope });
        }

        return list;
    }, [activeTab, bookingView, selectedClinic, selectedDoctor, selectedProfileDoctor, navigate, navigateToView]);

    return (
        <nav className="flex items-center gap-2 mb-4 px-1" aria-label="Breadcrumb">
            <button
                onClick={() => navigate('/')}
                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-primary-600 transition-colors"
                title="Exit to Main Site"
            >
                <Home className="h-3 w-3" />
            </button>

            {items.map((item, idx) => (
                <React.Fragment key={idx}>
                    <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                    {item.action ? (
                        <button
                            onClick={item.action}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 transition-colors py-1 px-1.5 hover:bg-primary-50 rounded"
                        >
                            {item.icon && <item.icon className="h-2.5 w-2.5" />}
                            {item.label}
                        </button>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 py-1 px-1.5">
                            {item.icon && <item.icon className="h-2.5 w-2.5" />}
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
