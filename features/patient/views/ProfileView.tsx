import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { LogOut, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

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
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState(userProfile);

    const onSave = () => {
        handleUpdateProfile(editedProfile);
        setIsEditing(false);
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-0">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">

                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm border-2 border-white/30">
                            {userName.charAt(0)}
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold">{userName}</h2>
                            <p className="opacity-80 font-mono">{userPhone}</p>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isEditing ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            <Input
                                label="Full Name"
                                value={editedProfile?.name}
                                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                            />
                            <Input
                                label="Mobile Number"
                                value={editedProfile?.phone}
                                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                            />
                            <Input
                                label="Age"
                                value={editedProfile?.age}
                                onChange={(e) => setEditedProfile({ ...editedProfile, age: e.target.value })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                <select 
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                                    value={editedProfile?.gender}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    Full Name
                                </label>
                                <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">
                                    {userProfile?.name}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    Mobile Number
                                </label>
                                <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">
                                    {userProfile?.phone}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    Age
                                </label>
                                <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">
                                    {userProfile?.age || '-'}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    Gender
                                </label>
                                <div className="font-medium text-slate-900 border-b border-slate-100 pb-2">
                                    {userProfile?.gender || '-'}
                                </div>
                            </div>
                        </div>
                    )}
                     <div className="pt-6 flex justify-end gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button onClick={onSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditedProfile(userProfile);
                                    setIsEditing(true);
                                }}
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </div>

            </div>

            {/* Family Members */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                <div className="p-6 border-b border-slate-100 flex justify-between items-center">

                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Family Members</h3>
                        <p className="text-sm text-slate-500">Manage profiles for your family</p>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => {
                            setNewMember({ name: '', age: '', gender: 'Male', relation: '' });
                            setEditingMemberIndex(null);
                            setIsCustomRelation(false);
                            setShowAddMember(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                    </Button>

                </div>

                <div className="divide-y divide-slate-100">

                    {userProfile?.familyMembers && userProfile.familyMembers.length > 0 ? (
                        userProfile.familyMembers.map((member, idx) => (
                            <div
                                key={idx}
                                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                        {member.name.charAt(0)}
                                    </div>

                                    <div>
                                        <div className="font-bold text-slate-900">{member.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {member.relation} • {member.age} Yrs • {member.gender}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditMember(idx)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => setMemberToDeleteIndex(idx)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 italic">
                            No family members added.
                        </div>
                    )}

                </div>

            </div>

        </div>
    )
}