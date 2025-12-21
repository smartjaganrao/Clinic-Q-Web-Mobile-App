import React from 'react';
import {
    MapPin,
    Search,
    ArrowUpDown,
    SlidersHorizontal,
    ChevronDown,
    LocateFixed,
    Building2,
    Stethoscope,
    Map as MapIcon,
    List as ListIcon,
    User,
    Award,
    X
} from 'lucide-react';

interface FilterProps {
    searchMode: 'CLINIC' | 'DOCTOR';
    setSearchMode: (mode: 'CLINIC' | 'DOCTOR') => void;
    sortBy: 'NEAR' | 'WAIT' | 'FEE';
    setSortBy: (sort: 'NEAR' | 'WAIT' | 'FEE') => void;
    userLocation: any;
    uniqueCities: string[];
    selectedCity: string;
    setSelectedCity: (city: string) => void;
    showMap: boolean;
    setShowMap: (show: boolean) => void;
    selectedDoctorGender: string;
    setSelectedDoctorGender: (gender: string) => void;
    selectedMinExperience: number;
    setSelectedMinExperience: (exp: number) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    CATEGORIES: { id: string; label: string; icon: React.ElementType }[];
    bookingView: 'LIST' | 'CLINIC_DETAILS' | 'FORM';
}

export const Filter: React.FC<FilterProps> = ({
    searchMode,
    setSearchMode,
    sortBy,
    setSortBy,
    userLocation,
    uniqueCities,
    selectedCity,
    setSelectedCity,
    showMap,
    setShowMap,
    selectedDoctorGender,
    setSelectedDoctorGender,
    selectedMinExperience,
    setSelectedMinExperience,
    selectedCategory,
    setSelectedCategory,
    CATEGORIES,
    bookingView
}) => {
    return (
        <>
            {/* Integrated Filters for Desktop and Mobile */}
            {bookingView === 'LIST' && (
                <>
                    <div className="hidden lg:flex items-center gap-2 flex-wrap px-1 pt-3">
                        <div className="relative min-w-[140px] h-11 bg-slate-50 rounded-2xl border-2 border-slate-200 px-3 flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:border-primary-400 transition-colors">
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={sortBy} onChange={(e) => { const val = e.target.value as any; setSortBy(val); }}>
                                <option value="NEAR">Nearest</option><option value="WAIT">Shortest Wait</option><option value="FEE">Lowest Fee</option>
                            </select>
                            <span className="truncate">{sortBy === 'NEAR' ? 'Nearest' : sortBy === 'WAIT' ? 'Shortest Wait' : 'Lowest Fee'}</span>
                            <ChevronDown className="h-3 w-3 ml-auto opacity-40" />
                        </div>

                        <div className="relative h-11 bg-slate-50 rounded-2xl border-2 border-slate-200 px-4 flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:border-primary-400 transition-colors">
                            <User className="h-3.5 w-3.5" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedDoctorGender} onChange={(e) => setSelectedDoctorGender(e.target.value)}>
                                <option value="ALL">All Genders</option>
                                <option value="Male">Male Doctor</option>
                                <option value="Female">Female Doctor</option>
                            </select>
                            <span className="truncate">{selectedDoctorGender === 'ALL' ? 'Gender' : `${selectedDoctorGender} Doctor`}</span>
                            <ChevronDown className="h-3 w-3 ml-1 opacity-40" />
                        </div>

                        <div className="relative h-11 bg-slate-50 rounded-2xl border-2 border-slate-200 px-4 flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:border-primary-400 transition-colors">
                            <Award className="h-3.5 w-3.5" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedMinExperience} onChange={(e) => setSelectedMinExperience(Number(e.target.value))}>
                                <option value={0}>Any Experience</option>
                                <option value={5}>5+ Years</option>
                                <option value={10}>10+ Years</option>
                                <option value={15}>15+ Years</option>
                                <option value={20}>20+ Years</option>
                            </select>
                            <span className="truncate">{selectedMinExperience === 0 ? 'Experience' : `${selectedMinExperience}+ Years`}</span>
                            <ChevronDown className="h-3 w-3 ml-1 opacity-40" />
                        </div>
                        
                        {(selectedDoctorGender !== 'ALL' || selectedMinExperience > 0 || selectedCategory !== 'ALL') && (
                            <button
                                onClick={() => { setSelectedDoctorGender('ALL'); setSelectedMinExperience(0); setSelectedCategory('ALL'); }}
                                className="h-11 px-4 rounded-2xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                            >
                                <X className="h-3 w-3" /> Clear Filters
                            </button>
                        )}

                        <button onClick={() => setShowMap(!showMap)} className={`w-11 h-11 flex items-center justify-center rounded-2xl border-2 transition-all shrink-0 ml-auto ${showMap ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-primary-400'}`}>
                            {showMap ? <ListIcon className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="lg:hidden flex flex-wrap gap-2 mt-4">
                        <div className="relative h-9 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                            <select className="absolute inset-0 opacity-0" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}><option value="NEAR">Near</option><option value="WAIT">Wait</option><option value="FEE">Fee</option></select>
                            <span>{sortBy === 'NEAR' ? 'Near' : sortBy === 'WAIT' ? 'Wait' : 'Fee'}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </div>
                        <div className="relative h-9 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedDoctorGender} onChange={(e) => setSelectedDoctorGender(e.target.value)}>
                                <option value="ALL">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <span>{selectedDoctorGender === 'ALL' ? 'Gender' : selectedDoctorGender}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </div>
                        <div className="relative h-9 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedMinExperience} onChange={(e) => setSelectedMinExperience(Number(e.target.value))}>
                                <option value={0}>Any Exp</option>
                                <option value={5}>5+ Yrs</option>
                                <option value={10}>10+ Yrs</option>
                            </select>
                            <span className="truncate">{selectedMinExperience === 0 ? 'Experience' : `${selectedMinExperience}+ Yrs`}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </div>
                        <button onClick={() => setShowMap(!showMap)} className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${showMap ? 'bg-primary-600 text-white' : 'bg-white text-slate-400'}`}>
                            {showMap ? <ListIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                        </button>
                         {(selectedDoctorGender !== 'ALL' || selectedMinExperience > 0 || selectedCategory !== 'ALL') && (
                            <button
                                onClick={() => { setSelectedDoctorGender('ALL'); setSelectedMinExperience(0); setSelectedCategory('ALL'); }}
                                className="h-9 px-3 rounded-xl bg-slate-200 text-slate-600 transition-all text-[9px] font-black uppercase flex items-center gap-1.5"
                            >
                                <X className="h-3 w-3" /> Clear
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Specialization Pills (Always visible below main bar as per typical healthcare SaaS design) */}
            {bookingView === 'LIST' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1 border-t border-slate-50 mt-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 h-9 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                        >
                            <cat.icon className="h-3.5 w-3.5" /> {cat.label.replace(' Specializations', '')}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};

export default Filter;