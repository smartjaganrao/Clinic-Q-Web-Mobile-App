import React from 'react';
import { DoctorSearchCard } from '../../components/DoctorSearchCard';
import { DoctorCardSkeleton } from '../../../../components/Skeleton';
import { Stethoscope, Search, MapPin, Filter } from 'lucide-react';

export const DoctorListView = ({ groupedDoctors, navigateToView, showMap, loading = false, searchQuery = '', onQuickSearch }) => {
    if (loading) {
        return (
            <div className={`w-full grid gap-6 mb-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                {Array.from({ length: 8 }).map((_, index) => (
                    <DoctorCardSkeleton key={index} className="animate-in fade-in duration-300" />
                ))}
            </div>
        );
    }

    return (
        groupedDoctors.length > 0 ? (
            <div className={`w-full grid gap-6 mb-4 ${showMap ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                {groupedDoctors.map(({ masterDoc, locations }, index) => {
                    return (
                        <div
                            key={masterDoc.masterId}
                            className="animate-in slide-in-from-bottom-2 duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <DoctorSearchCard
                                doctor={masterDoc}
                                locations={locations}
                                onBook={(clinic, doc) => navigateToView(null, clinic, doc)}
                                onClick={() => navigateToView('DOCTOR_PROFILE', null, masterDoc)}
                                searchQuery={searchQuery}
                            />
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-slate-400 animate-in fade-in duration-500">
                <div className="text-center max-w-md">
                    <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Stethoscope className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="font-black uppercase tracking-[0.2em] text-sm mb-2 text-slate-500">No doctors found</h3>
                    <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">
                        {searchQuery ? `No doctors match "${searchQuery}". Try different keywords or adjust your filters.` : 'No doctors available in your area. Try changing your location or search criteria.'}
                    </p>

                    {/* Quick Suggestions */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Try these popular searches:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {[
                                { term: 'Fever', emoji: '🤒' },
                                { term: 'Cold & Cough', emoji: '🤧' },
                                { term: 'Child Doctor', emoji: '👶' },
                                { term: 'Heart Specialist', emoji: '❤️' }
                            ].map(search => (
                                <button
                                    key={search.term}
                                    onClick={() => onQuickSearch && onQuickSearch(search.term)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                >
                                    <span>{search.emoji}</span>
                                    <span>{search.term}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Additional Help */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex flex-col gap-2 text-[10px] text-slate-400">
                            <div className="flex items-center justify-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>Check your location settings</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Filter className="h-3 w-3" />
                                <span>Try adjusting specialty or experience filters</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    )
}