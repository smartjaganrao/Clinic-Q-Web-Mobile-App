import React, { useState } from 'react';
import { ClinicCard } from '../../components/ClinicCard';
import { Building2, X, Zap, Calendar } from 'lucide-react';
import { calculateDistance } from '../../../../utils/geolocation';
import { isClinicOpen } from '../../../../utils/time';

const HelperStrip = ({ onClose }: { onClose: () => void }) => (
    <div className="mb-4 bg-slate-900 text-white p-3 sm:px-4 rounded-xl flex items-center justify-between shadow-lg mx-1 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
            <span className="font-bold text-primary-300 uppercase tracking-wider text-[10px] sm:text-xs">New here?</span>
            <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5"><div className="p-0.5 bg-white/10 rounded"><Zap className="h-3 w-3 text-yellow-400 fill-current" /></div> <span className="font-medium">Get Token = Walk-in queue</span></span>
                <span className="w-px h-3 bg-slate-700 hidden sm:block"></span>
                <span className="flex items-center gap-1.5"><div className="p-0.5 bg-white/10 rounded"><Calendar className="h-3 w-3 text-indigo-400" /></div> <span className="font-medium">Book Appointment = Visit later</span></span>
            </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors ml-2 flex-shrink-0"><X className="h-4 w-4 text-slate-400" /></button>
    </div>
);

export const ClinicListView = ({
    filteredClinics,
    getClinicWaitStats,
    getRelevantDoctors,
    getFeeRange,
    userLocation,
    highlightedClinicId,
    clinicCardRefs,
    navigateToView,
    showMap
}) => {
    // Simple state for helper strip, defaults to true. In a real app, persist this to localStorage.
    const [showHelper, setShowHelper] = useState(true);

    return (
        <div className="flex flex-col h-full">
            {showHelper && <HelperStrip onClose={() => setShowHelper(false)} />}
            
            {filteredClinics.length > 0 ? (
                <div className={`w-full grid gap-4 mb-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                    {filteredClinics.map(clinic => {
                        const waitInfo = getClinicWaitStats(clinic);
                        const relevantDoctors = getRelevantDoctors(clinic);
                        const feeRange = getFeeRange(clinic);

                        let distLabel = undefined;
                        let travelTime = undefined;

                        if (userLocation && clinic.geoLocation) {
                            const dist = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);
                            distLabel = `${dist.toFixed(1)} km`;
                            // Estimate travel time: roughly 2.5 mins per km (24 km/h) for city traffic
                            const mins = Math.ceil(dist * 2.5);
                            travelTime = `~${mins} min`;
                        }

                        return (
                            <ClinicCard
                                key={clinic.id}
                                clinic={clinic}
                                waitInfo={waitInfo}
                                feeRange={feeRange}
                                distLabel={distLabel}
                                travelTime={travelTime}
                                gmapsLink={`https://www.google.com/maps/search/?api=1&query=${clinic.geoLocation?.lat},${clinic.geoLocation?.lng}`}
                                relevantDoctors={relevantDoctors}
                                isHighlighted={highlightedClinicId === clinic.id}
                                isOpen={isClinicOpen(clinic.operatingHours, clinic.timezone)}
                                cardRef={el => { clinicCardRefs.current[clinic.id] = el; }}
                                onSelect={() => navigateToView('CLINIC_DETAILS', clinic)}
                                onBook={() => navigateToView('CLINIC_DETAILS', clinic)}
                                onQueue={() => navigateToView('CLINIC_DETAILS', clinic)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-slate-400">
                    <p className="font-black uppercase tracking-[0.2em] text-sm mb-2">No clinics found</p>
                    <p className="text-xs font-bold text-slate-400 mb-8">Try adjusting your filters or location.</p>
                    <Building2 className="h-16 w-16 opacity-10" />
                </div>
            )}
        </div>
    )
}