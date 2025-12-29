import React from 'react';
import { DoctorSearchCard } from '../../components/DoctorSearchCard';
import { Stethoscope } from 'lucide-react';

export const DoctorListView = ({ groupedDoctors, navigateToView, showMap }) => {
    return (
        groupedDoctors.length > 0 ? (
            <div className={`w-full grid gap-6 mb-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                {groupedDoctors.map(({ masterDoc, locations }) => {
                    return (
                        <DoctorSearchCard
                            key={masterDoc.masterId}
                            doctor={masterDoc}
                            locations={locations}
                            onBook={(clinic, doc) => navigateToView(null, clinic, doc)}
                            onClick={() => navigateToView('DOCTOR_PROFILE', null, masterDoc)}
                        />
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-slate-400">
                <p className="font-black uppercase tracking-[0.2em] text-sm mb-2">No doctors found</p>
                <p className="text-xs font-bold text-slate-400 mb-8">Try adjusting your filters or location.</p>
                <Stethoscope className="h-16 w-16 opacity-10" />
            </div>
        )
    )
}