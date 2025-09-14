import React from 'react';
import { NavLink } from 'react-router-dom';
import { Image as ImageIcon, Brush } from 'lucide-react';

const Item = ({ to, icon, label }) => {
  const base = 'flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium';
  const cls = ({ isActive }) =>
    `${base} ${isActive ? 'text-white' : 'text-slate-900'} `;
  return (
    <NavLink to={to} end className={cls} aria-label={label}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1 ${
        // active styling done via parent container background
        ''
      }`} style={{ background: '#F8D5C7', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}>
        {icon}
      </div>
      <span className="hidden sm:block">{label}</span>
    </NavLink>
  );
};

const MobileDock = () => {
  return (
    <nav className="md:hidden fixed bottom-3 left-0 right-0 z-40">
      <div className="mx-auto max-w-md px-3">
        <div className="rounded-2xl" style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
          <div className="grid grid-cols-2 text-center">
            {/* Video tab hidden temporarily */}
            {/* <Item to="/dashboard" icon={<Video className="w-5 h-5" />} label="Video" /> */}
            <Item to="/dashboard/image" icon={<ImageIcon className="w-5 h-5" />} label="Image" />
            <Item to="/dashboard/editor" icon={<Brush className="w-5 h-5" />} label="Edit" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MobileDock;
