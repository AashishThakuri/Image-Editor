import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MiniSidebar from './MiniSidebar';
import MobileDock from './MobileDock';
import DashboardHeader from './DashboardHeader';
import { motion } from 'framer-motion';
const DashboardLayout = () => {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  return (
    <div className="relative flex h-screen app-gradient">
      <div className="hidden md:block"><MiniSidebar /></div>
      <DashboardHeader />
      <main className="relative flex-1 overflow-y-auto">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0"
          style={{ willChange: 'opacity' }}
        >
          <Outlet />
        </motion.div>
      </main>
      <MobileDock />
    </div>
  );
};

export default DashboardLayout;
