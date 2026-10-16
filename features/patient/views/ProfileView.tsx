
import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import {
    LogOut, Plus, Edit2, Trash2, Save, X, User, Phone, Calendar, Users,
    ShieldCheck, ChevronRight,
} from 'lucide-react';

export const ProfileView = ({
    userName,
    userPhone,
    userProfile,
    onBack,
    setNewMember,
    setEditingMemberIndex,
    setIsCustomRelation,
    setShowAddMember,
    handleEditMember,
    setMemberToDeleteIndex,
    handleUpdateProfile,
}: {
    userName: string;
    userPhone: string;
    userProfile: any;
    onBack: () => void;
    setNewMember: (m: any) => void;
    setEditingMemberIndex: (i: number | null) => void;
    setIsCustomRelation: (v: boolean) => void;
    setShowAddMember: (v: boolean) => void;
    handleEditMember: (i: number) => void;
    setMemberToDeleteIndex: (i: number | null) => void;
    handleUpdateProfile: (profile: any) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState(userProfile);

    const onSave = () => {
        handleUpdateProfile(editedProfile);
        setIsEditing(false);
    };

    const initials = userName
        .split(' ')
        .map(n => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-4 animate-in fade-in duration-300">

            {/* ── Profile Hero ────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Gradient banner */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-6 pb-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 rounded-full bg-primary-800/30 blur-xl" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner">
                                {initials}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-tight">{userName}</h2>
                                <p className="text-white/60 text-sm font-medium font-mono">{userPhone}</p>
                            </div>
                        </div>
                        <button
                            onClick={onBack}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Verified badge overlapping */}
                <div className="relative -mt-6 px-6 mb-5 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-primary-100 px-3 py-1.5 rounded-full shadow-sm text-[11px] font-black text-primary-700">
                        <ShieldCheck className="h-3.5 w-3.5 fill-current" />
                        Verified Patient
                    </div>
                </div>

                {/* Profile fields */}
                <div className="px-6 pb-6">
                    {isEditing ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                value={editedProfile?.name || ''}
                                onChange={e => setEditedProfile({ ...editedProfile, name: e.target.value })}
                            />
                            <Input
                                label="Mobile Number"
                                value={editedProfile?.phone || ''}
                                onChange={e => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                            />
                            <Input
                                label="Age"
                                type="number"
                                value={editedProfile?.age || ''}
                                onChange={e => setEditedProfile({ ...editedProfile, age: e.target.value })}
                            />
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                                    Gender
                                </label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={editedProfile?.gender || ''}
                                    onChange={e =>
                                        setEditedProfile({ ...editedProfile, gender: e.target.value })
                                    }
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: User, label: 'Name', value: userProfile?.name || userName },
                                { icon: Phone, label: 'Phone', value: userProfile?.phone || userPhone },
                                { icon: Calendar, label: 'Age', value: userProfile?.age ? `${userProfile.age} years` : '—' },
                                { icon: User, label: 'Gender', value: userProfile?.gender || '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-slate-50 rounded-xl px-3 py-3 border border-slate-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Icon className="h-3 w-3 text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {label}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                                >
                                    <X className="h-4 w-4" /> Cancel
                                </button>
                                <button
                                    onClick={onSave}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-sm"
                                >
                                    <Save className="h-4 w-4" /> Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditedProfile(userProfile);
                                    setIsEditing(true);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                            >
                                <Edit2 className="h-4 w-4" /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Family Members ───────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            Family Members
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Book appointments for your family
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setNewMember({ name: '', age: '', gender: 'Male', relation: '' });
                            setEditingMemberIndex(null);
                            setIsCustomRelation(false);
                            setShowAddMember(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </button>
                </div>

                {userProfile?.familyMembers && userProfile.familyMembers.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {userProfile.familyMembers.map((member: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center text-primary-700 font-black text-sm flex-shrink-0">
                                    {member.name.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">{member.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {member.relation} · {member.age} yrs · {member.gender}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditMember(idx)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setMemberToDeleteIndex(idx)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                            <Users className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 mb-1">No family members yet</p>
                        <p className="text-xs text-slate-400">
                            Add members to book appointments on their behalf.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Logout ─────────────────────────────── */}
            <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-rose-600 border border-rose-100 hover:bg-rose-50 font-bold text-sm transition-all active:scale-95"
            >
                <LogOut className="h-4 w-4" />
                Sign Out
            </button>
        </div>
    );
};
