
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
    X,
    LayoutGrid,
    Clock
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
    showOpenOnly: boolean;
    setShowOpenOnly: (show: boolean) => void;
    selectedDoctorGender: string;
    setSelectedDoctorGender: (gender: string) => void;
    selectedMinExperience: number;
    setSelectedMinExperience: (exp: number) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    CATEGORIES: { id: string; label: string; icon: React.ElementType }[];
    bookingView: 'LIST' | 'CLINIC_DETAILS' | 'DOCTOR_PROFILE' | 'FORM';
    pinnedAddress: string | null;
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
    showOpenOnly,
    setShowOpenOnly,
    selectedDoctorGender,
    setSelectedDoctorGender,
    selectedMinExperience,
    setSelectedMinExperience,
    selectedCategory,
    setSelectedCategory,
    CATEGORIES,
    bookingView,
    pinnedAddress
}) => {
    return (
        <div className="px-4 lg:px-0 py-0 shrink-0">
            {/* Integrated Filters for Desktop and Mobile */}
            {bookingView === 'LIST' && (
                <>
                    {/* Desktop Filters */}
                    <div className="hidden lg:flex items-center gap-4 flex-wrap px-4 py-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">Filter by:</span>
                        <div className="relative min-w-[140px] h-11 bg-white rounded-2xl border-2 border-slate-100 shadow-sm px-4 flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:border-primary-400 transition-all">
                            <ArrowUpDown className="h-3.5 w-3.5 text-primary-500" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={sortBy} onChange={(e) => { const val = e.target.value as any; setSortBy(val); }}>
                                <option value="NEAR">Nearest</option><option value="WAIT">Shortest Wait</option><option value="FEE">Lowest Fee</option>
                            </select>
                            <span className="truncate">{sortBy === 'NEAR' ? 'Nearest' : sortBy === 'WAIT' ? 'Shortest Wait' : 'Lowest Fee'}</span>
                            <ChevronDown className="h-3 w-3 ml-auto opacity-40" />
                        </div>

                        <button
                            onClick={() => setShowOpenOnly(!showOpenOnly)}
                            className={`h-11 px-5 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${showOpenOnly ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-400'}`}
                        >
                            <Clock className={`h-3.5 w-3.5 ${showOpenOnly ? 'fill-current' : ''}`} />
                            Open Now
                        </button>

                        <div className={`relative h-11 rounded-2xl border-2 px-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all shadow-sm ${selectedDoctorGender !== 'ALL' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-100 text-slate-600 hover:border-primary-400'}`}>
                            <User className="h-3.5 w-3.5" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedDoctorGender} onChange={(e) => setSelectedDoctorGender(e.target.value)}>
                                <option value="ALL">All Genders</option>
                                <option value="Male">Male Doctor</option>
                                <option value="Female">Female Doctor</option>
                            </select>
                            <span className="truncate">{selectedDoctorGender === 'ALL' ? 'Gender' : `${selectedDoctorGender}`}</span>
                            <ChevronDown className="h-3 w-3 ml-1 opacity-40" />
                        </div>

                        <div className={`relative h-11 rounded-2xl border-2 px-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all shadow-sm ${selectedMinExperience > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-600 hover:border-primary-400'}`}>
                            <Award className={`h-4 w-4 ${selectedMinExperience > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedMinExperience} onChange={(e) => setSelectedMinExperience(Number(e.target.value))}>
                                <option value={0}>Any Experience</option>
                                <option value={2}>2+ Years</option>
                                <option value={5}>5+ Years</option>
                                <option value={10}>10+ Years</option>
                                <option value={15}>15+ Years</option>
                                <option value={20}>20+ Years</option>
                            </select>
                            <span className="truncate whitespace-nowrap">
                                {selectedMinExperience === 0 ? 'Experience' : `${selectedMinExperience}+ Yrs Exp`}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-40" />
                        </div>
                        
                        {(selectedDoctorGender !== 'ALL' || selectedMinExperience > 0 || selectedCategory !== 'ALL' || showOpenOnly) && (
                            <button
                                onClick={() => { setSelectedDoctorGender('ALL'); setSelectedMinExperience(0); setSelectedCategory('ALL'); setShowOpenOnly(false); }}
                                className="h-11 px-4 rounded-2xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                            >
                                <X className="h-3 w-3" /> Clear
                            </button>
                        )}

                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`h-11 px-6 flex items-center gap-2.5 rounded-2xl border-2 transition-all shrink-0 ml-auto shadow-md ${showMap ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-indigo-600 border-indigo-600 text-white'}`}
                        >
                            {showMap ? <ListIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
                                {showMap ? 'List View' : (pinnedAddress || 'Map View')}
                            </span>
                        </button>
                    </div>

                    {/* Mobile Filters: ALL IN ONE LINE (Scrollable) */}
                    <div className="lg:hidden flex flex-nowrap overflow-x-auto no-scrollbar gap-2 mt-3 pb-3 -mx-2 px-2 scroll-smooth">
                        <div className="relative flex-shrink-0 h-10 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase shadow-sm">
                            <ArrowUpDown className="h-3 w-3 text-primary-500" />
                            <select className="absolute inset-0 opacity-0" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}><option value="NEAR">Near</option><option value="WAIT">Wait</option><option value="FEE">Fee</option></select>
                            <span>{sortBy === 'NEAR' ? 'Near' : sortBy === 'WAIT' ? 'Wait' : 'Fee'}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </div>

                        <button
                            onClick={() => setShowOpenOnly(!showOpenOnly)}
                            className={`flex-shrink-0 h-10 px-3 rounded-xl border transition-all text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm ${showOpenOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            <Clock className={`h-3 w-3 ${showOpenOnly ? 'fill-current' : ''}`} /> Open
                        </button>

                        <div className="relative flex-shrink-0 h-10 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase shadow-sm">
                            <User className="h-3 w-3 text-primary-500" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedDoctorGender} onChange={(e) => setSelectedDoctorGender(e.target.value)}>
                                <option value="ALL">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <span>{selectedDoctorGender === 'ALL' ? 'Gender' : selectedDoctorGender}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </div>

                        <div className="relative flex-shrink-0 h-10 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase shadow-sm">
                            <Award className="h-3.5 w-3.5 text-primary-500" />
                            <select className="absolute inset-0 opacity-0 cursor-pointer" value={selectedMinExperience} onChange={(e) => setSelectedMinExperience(Number(e.target.value))}>
                                <option value={0}>Exp</option>
                                <option value={5}>5+ Yrs</option>
                                <option value={10}>10+ Yrs</option>
                            </select>
                            <span className="truncate">{selectedMinExperience === 0 ? 'Exp' : `${selectedMinExperience}+ Yrs`}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </div>
                    </div>
                </>
            )}

            {/* Specialization Category row */}
            {bookingView === 'LIST' && (
                <div className="mt-3 pb-2 md:pb-0">
                    <div className="flex gap-2 flex-nowrap overflow-x-auto no-scrollbar pt-1 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                            >
                                <cat.icon className={`h-3.5 w-3.5 ${selectedCategory === cat.id ? 'text-white' : 'text-primary-500'}`} /> {cat.label.replace(' Specializations', '')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Filter;
