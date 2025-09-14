import React from 'react';
import { NavLink } from 'react-router-dom';
import { Video, History, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const NavItem = ({ to, icon, children }) => {
    const navLinkClasses = ({ isActive }) =>
        `w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300 ` +
        (isActive
            ? 'bg-slate-700 text-white shadow-lg'
            : 'text-slate-500 hover:bg-white/30 hover:text-slate-700');

    return (
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <NavLink to={to} end className={navLinkClasses}>
                {icon}
            </NavLink>
        </motion.div>
    );
};

const Sidebar = () => {
  return null;
};

export default Sidebar;
