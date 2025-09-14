import React from 'react';
import { motion } from 'framer-motion';
import FeatherIcon from './FeatherIcon';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';

const DashboardHeader = () => {
  const { subscription } = useAuth();

  return (
    <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
      <div className="flex items-center">
        <motion.div
          initial={{ y: -60, opacity: 0, rotate: -8 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
        >
          <FeatherIcon className="h-10 w-10 -mr-2" />
        </motion.div>
        <motion.h1
          className="text-2xl font-bold text-slate-800 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <span className="font-script text-5xl">K</span>
          <span className="-ml-1">atha AI</span>
        </motion.h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-slate-700">
          Credits: <span className="font-bold text-slate-900">{subscription?.videosRemaining ?? 0}</span>
        </div>
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default DashboardHeader;
