import React from 'react';
import {
    Star,
    Stethoscope,
    Award,
    Languages,
    GraduationCap,
    FileText,
    Clock,
    MapPin,
    Navigation,
    ChevronLeft,
    Calendar,
    Users,
    MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IndianRupeeIcon } from '../../../../components/icons';
import { ClinicOperationMode, DoctorStatus } from '../../../../types';
import { isClinicOpen, isDoctorShiftActive, hasAvailableSlotsTomorrow, getDoctorTodayShift } from '../../../../utils/time';
import { StarRating } from '../../../../components/StarRating';

export const DoctorProfileView = ({ selectedProfileDoctor, clinics, navigateToView, onBack }) => {
    const navigate = useNavigate();

    // Use provided onBack or default to navigate back
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1); // Go back to previous page
        }
    };
    // Calculate doctor statistics
    const totalReviews = selectedProfileDoctor.reviewCount || 0;
    const avgRating = selectedProfileDoctor.rating || 4.5;
    const experienceYears = selectedProfileDoctor.experience || 5;
    const totalClinics = clinics.filter(clinic => 
        clinic.doctors.some(d => d.masterId === selectedProfileDoctor.masterId)
    ).length;

    // Get availability summary
    const getAvailabilitySummary = () => {
        const availableClinics = clinics.filter(clinic => {
            const docInstance = clinic.doctors.find(d => d.masterId === selectedProfileDoctor.masterId);
            if (!docInstance) return false;
            
            const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
            const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
            const isClinicOpenNow = isClinicOpen(clinic.operatingHours, clinic.timezone);
            const isDoctorShiftActiveNow = isDoctorShiftActive(docInstance, clinic);
            const hasSlotsTomorrow = hasAvailableSlotsTomorrow(docInstance, clinic);
            
            return (canQueueOnline && isClinicOpenNow && isDoctorShiftActiveNow) || 
                   (canBookAppointments && hasSlotsTomorrow);
        });

        return {
            total: availableClinics.length,
            hasLiveAvailability: availableClinics.some(clinic => {
                const docInstance = clinic.doctors.find(d => d.masterId === selectedProfileDoctor.masterId);
                const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                const isClinicOpenNow = isClinicOpen(clinic.operatingHours, clinic.timezone);
                const isDoctorShiftActiveNow = isDoctorShiftActive(docInstance, clinic);
                return canQueueOnline && isClinicOpenNow && isDoctorShiftActiveNow;
            }),
            hasTomorrowAvailability: availableClinics.some(clinic => {
                const docInstance = clinic.doctors.find(d => d.masterId === selectedProfileDoctor.masterId);
                const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                const hasSlotsTomorrow = hasAvailableSlotsTomorrow(docInstance, clinic);
                return canBookAppointments && hasSlotsTomorrow;
            })
        };
    };

    const availability = getAvailabilitySummary();

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Doctor Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full">
                            {/* Hero Section */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-indigo-600/20"></div>
                                <div className="relative h-40 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-600">
                                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                        <div className="relative">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl blur opacity-50"></div>
                                            <div className="relative p-1 bg-white rounded-xl shadow-xl ring-4 ring-white">
                                                <img
                                                    src={selectedProfileDoctor.avatarUrl}
                                                    className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-lg"
                                                    alt={selectedProfileDoctor.name}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Content */}
                            <div className="pt-12 px-4 pb-4">
                                {/* Error handling for missing doctor data */}
                                {!selectedProfileDoctor && (
                                    <div className="text-center py-8">
                                        <div className="text-slate-500 mb-4">Doctor information not available</div>
                                        <button
                                            onClick={handleBack}
                                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                                        >
                                            Back to Search
                                        </button>
                                    </div>
                                )}
                                
                                {/* Name and Rating */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h1 className="text-xl font-bold text-slate-900 mb-1 leading-tight" title={selectedProfileDoctor.name}>
                                            {selectedProfileDoctor.name}
                                        </h1>
                                        <p className="text-sm text-slate-600 font-medium" title={selectedProfileDoctor.specialty}>
                                            {selectedProfileDoctor.specialty}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                            <Star className="h-3 w-3 fill-current" />
                                            <span className="font-bold text-sm">{avgRating.toFixed(1)}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500">Based on</div>
                                            <div className="font-bold text-slate-900 text-xs">{totalReviews} reviews</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-slate-50 rounded-md p-2 border border-slate-200">
                                        <div className="flex items-center gap-1">
                                            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                                                <Award className="h-3 w-3 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">Exp</div>
                                                <div className="font-bold text-slate-900 text-xs">{experienceYears}+ Y</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-md p-2 border border-slate-200">
                                        <div className="flex items-center gap-1">
                                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                                                <Stethoscope className="h-3 w-3 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">At</div>
                                                <div className="font-bold text-slate-900 text-xs">{totalClinics} Clinics</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {selectedProfileDoctor.languages && selectedProfileDoctor.languages.length > 0 && (
                                        <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                                            <Languages className="h-2.5 w-2.5 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">
                                                {selectedProfileDoctor.languages.slice(0, 2).join(', ')}
                                            </span>
                                        </span>
                                    )}
                                    {selectedProfileDoctor.education && selectedProfileDoctor.education.length > 0 && (
                                        <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                                            <GraduationCap className="h-2.5 w-2.5 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">
                                                {selectedProfileDoctor.education[0]}
                                            </span>
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                                        <span className="w-1 h-1 bg-white rounded-full"></span>
                                        <span className="text-xs font-medium">Verified</span>
                                    </span>
                                </div>

                                {/* About Section */}
                                {selectedProfileDoctor.bio && (
                                    <div className="border-t border-slate-200 pt-3">
                                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-primary-600" />
                                            About Doctor
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed text-sm">
                                            {selectedProfileDoctor.bio}
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* Clinics List */}
                    <div className="lg:col-span-2">
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Available at Clinics</h2>
                                        <p className="text-slate-600 text-sm">Book an appointment at any of these locations</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {availability.hasLiveAvailability && (
                                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-xs font-bold">Live</span>
                                            </span>
                                        )}
                                        {availability.hasTomorrowAvailability && (
                                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                                                <Calendar className="h-3 w-3" />
                                                <span className="text-xs font-bold">Tomorrow</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Clinic Cards */}
                            <div className="grid gap-6">
                                {clinics
                                    .filter(clinic => clinic.doctors.some(d => d.masterId === selectedProfileDoctor.masterId))
                                    .map(clinic => {
                                        const docInstance = clinic.doctors.find(d => d.masterId === selectedProfileDoctor.masterId)!;
                                        const canQueueOnline = [ClinicOperationMode.ONLINE_WALK_IN, ClinicOperationMode.BOTH_WALK_IN, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                                        const canBookAppointments = [ClinicOperationMode.HYBRID_DIRECT_APPT, ClinicOperationMode.HYBRID_FULL].includes(clinic.operationMode);
                                        const isClinicOpenNow = isClinicOpen(clinic.operatingHours, clinic.timezone);
                                        const isDoctorShiftActiveNow = isDoctorShiftActive(docInstance, clinic);
                                        const hasSlotsTomorrow = hasAvailableSlotsTomorrow(docInstance, clinic);
                                        const canGetToken = canQueueOnline && isClinicOpenNow && isDoctorShiftActiveNow;
                                        const canBookForTomorrow = canBookAppointments && hasSlotsTomorrow;
                                        const todayShift = getDoctorTodayShift(docInstance);

                                        return (
                                            <div key={clinic.id} className="bg-white rounded-xl shadow-md border border-slate-200 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                                                    {/* Clinic Info */}
                                                    <div className="lg:col-span-2">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-slate-900 mb-1 truncate" title={clinic.name}>
                                                                    {clinic.name}
                                                                </h4>
                                                                <p className="text-slate-600 flex items-center gap-2 text-xs">
                                                                    <MapPin className="h-3 w-3 text-slate-400" aria-hidden="true" />
                                                                    <span className="truncate" title={`${clinic.address}, ${clinic.city}`}>
                                                                        {clinic.address}, {clinic.city}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm ${
                                                                    isDoctorShiftActiveNow
                                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                                }`}>
                                                                    {isDoctorShiftActiveNow ? 'Active' : 'Offline'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Details */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                            <div className="bg-slate-50 rounded-md p-2 border border-slate-200">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3 w-3 text-primary-600" />
                                                                    <div>
                                                                        <div className="text-xs text-slate-500">Doctor's Shift</div>
                                                                        <div className="font-bold text-slate-900 text-xs">{todayShift}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-50 rounded-md p-2 border border-slate-200">
                                                                <div className="flex items-center gap-1">
                                                                    <IndianRupeeIcon className="h-3 w-3 text-blue-600" />
                                                                    <div>
                                                                        <div className="text-xs text-slate-500">Consultation Fee</div>
                                                                        <div className="font-bold text-slate-900 text-xs">₹{docInstance.consultationFee}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-50 rounded-md p-2 border border-slate-200">
                                                                <div className="flex items-center gap-1">
                                                                    <Navigation className="h-3 w-3 text-purple-600" />
                                                                    <div>
                                                                        <div className="text-xs text-slate-500">Clinic Hours</div>
                                                                        <div className="font-bold text-slate-900 text-xs">{clinic.operatingHours}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="lg:col-span-1 lg:flex lg:items-center lg:justify-center">
                                                        <button
                                                            disabled={!(canGetToken || canBookForTomorrow)}
                                                            onClick={() => navigateToView(null, clinic, docInstance)}
                                                            className={`w-full lg:w-auto h-10 px-4 rounded-lg font-semibold shadow-lg transition-all text-xs uppercase tracking-wide whitespace-nowrap active:scale-95 ${
                                                                (canGetToken || canBookForTomorrow)
                                                                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-700 hover:to-indigo-700 shadow-primary-200 hover:shadow-primary-300 transform hover:-translate-y-1 hover:shadow-lg'
                                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                                                            }`}
                                                            aria-label={canGetToken ? "Get token for this clinic" : canBookForTomorrow ? "Book appointment for tomorrow" : "No availability today"}
                                                        >
                                                            {canGetToken ? (
                                                                <span className="flex items-center justify-center gap-1">
                                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                                    GET TOKEN
                                                                </span>
                                                            ) : canBookForTomorrow ? (
                                                                <span className="flex items-center justify-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    BOOK TOMORROW
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center justify-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    BOOK TODAY
                                                                </span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
