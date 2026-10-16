/**
 * User Dropdown Menu - Top-right header component
 * Displays user avatar, name, and dropdown menu with options
 * Mobile: Hidden when hamburger menu is active
 */

import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';

interface UserDropdownMenuProps {
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  onViewProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  className?: string;
}

export const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({
  userName = 'Guest',
  userAvatar,
  userEmail = 'user@example.com',
  onViewProfile,
  onSettings,
  onLogout,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
        )}

        {/* Name + Chevron */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500 hidden md:block">{userEmail}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">{userEmail}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* View Profile */}
            <button
              onClick={() => {
                onViewProfile?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
              <User className="h-4 w-4 text-slate-400" />
              View Profile
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                onSettings?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </button>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1" />

            {/* Logout */}
            <button
              onClick={() => {
                onLogout?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdownMenu;
