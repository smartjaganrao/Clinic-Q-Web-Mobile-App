
import React from 'react';
import { ClinicCard } from '../../components/ClinicCard';
import { Building2 } from 'lucide-react';
import { calculateDistance } from '../../../../utils/geolocation';
import { isClinicOpen } from '../../../../utils/time';

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
    return (
        filteredClinics.length > 0 ? (
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
        )
    )
}
