import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Brush } from 'lucide-react';

// Mini, floating sidebar that matches the site's warm amber theme
// Color reference from ChatGenerator background: #E0C58F
const PANEL_BG = '#FDF5EC';

const navVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: (i = 1) => ({ x: 0, opacity: 1, transition: { delay: i * 0.07, type: 'spring', stiffness: 260, damping: 20 } })
};

const IconButton = ({ to, icon, index = 1 }) => {
  const base = 'w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl text-[#1A1A1A]';
  const cls = ({ isActive }) => `${base} ${isActive ? '' : 'hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform duration-200'}`;
  return (
    <motion.div custom={index} variants={navVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
      <NavLink
        to={to}
        end
        className={cls}
        style={{
          background: '#F8E8DB',
          border: '2px solid #1A1A1A',
          boxShadow: '4px 4px 0 #1A1A1A'
        }}
      >
        {icon}
      </NavLink>
    </motion.div>
  );
};

const MiniSidebar = () => {
  return (
    <motion.aside
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      aria-label="Mini navigation"
    >
      <motion.div
        className="flex flex-col items-center gap-3 p-2 rounded-2xl"
        style={{ background: PANEL_BG, border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}
        whileHover={{ y: -2 }}
      >
        {/* Video entry hidden temporarily */}
        {/* <IconButton index={1} to="/dashboard" icon={<Video className="w-5 h-5" />} /> */}
        <IconButton index={1} to="/dashboard/image" icon={<ImageIcon className="w-5 h-5" />} />
        <IconButton index={2} to="/dashboard/editor" icon={<Brush className="w-5 h-5" />} />
      </motion.div>
    </motion.aside>
  );
};

export default MiniSidebar;
