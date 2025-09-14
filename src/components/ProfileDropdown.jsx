import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

const ProfileDropdown = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none w-10 h-10 rounded-full border-2 border-slate-600 hover:border-slate-700 transition-colors flex items-center justify-center bg-slate-700 text-white font-bold text-lg">
                {user.picture ? (
                    <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="w-full h-full rounded-full"
                    />
                ) : (
                    <span>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 z-50 overflow-hidden"
                    >
                        <div className="p-2 border-b border-slate-300">
                            <p className="font-semibold text-slate-800 text-sm truncate">{user.name}</p>
                            <p className="text-xs text-slate-600 truncate">{user.email}</p>
                        </div>
                        <button 
                            onClick={signOut} 
                            className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDropdown;
