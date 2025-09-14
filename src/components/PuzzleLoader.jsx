import React from 'react';
import { motion } from 'framer-motion';

const PuzzleLoader = () => {
  // Creative filmstrip ribbon with perforations and sliding frames
  const holes = Array.from({ length: 16 });
  return (
    <div className="flex flex-col items-center justify-center gap-1 md:gap-2">
      <motion.svg width="140" height="44" viewBox="0 0 140 44" initial={false} className="block">
        {/* Filmstrip ribbon */}
        <rect x="1.5" y="6" width="137" height="32" rx="8" fill="#F8E8DB" stroke="#1A1A1A" strokeWidth="3" />
        {/* Perforations */}
        {holes.map((_, i) => (
          <rect key={`t-${i}`} x={8 + i * 8} y={8} width="4" height="4" rx="1" fill="#1A1A1A" />
        ))}
        {holes.map((_, i) => (
          <rect key={`b-${i}`} x={8 + i * 8} y={32} width="4" height="4" rx="1" fill="#1A1A1A" />
        ))}
        {/* Sliding frames track */}
        <clipPath id="strip-clip"><rect x="16" y="10" width="108" height="24" rx="4" /></clipPath>
        <g clipPath="url(#strip-clip)">
          <motion.g
            animate={{ x: [-60, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* 4 frames for seamless loop */}
            {[0,1,2,3].map((i) => (
              <g key={i} transform={`translate(${16 + i*36}, 10)`}>
                <rect x="0" y="0" width="28" height="24" rx="4" fill="#FDF5EC" stroke="#1A1A1A" strokeWidth="3" />
                {/* Icon per frame */}
                {i % 3 === 0 && (
                  /* camera */
                  <g>
                    <motion.rect x="5" y="8" width="18" height="10" rx="2" fill="none" stroke="#1A1A1A" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    <motion.circle cx="17" cy="13" r="3" fill="none" stroke="#1A1A1A" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  </g>
                )}
                {i % 3 === 1 && (
                  /* mountain */
                  <motion.path d="M4 18 L10 10 L14 14 L18 12 L24 16" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                )}
                {i % 3 === 2 && (
                  /* play */
                  <g>
                    <motion.circle cx="14" cy="12" r="6" fill="none" stroke="#1A1A1A" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    <motion.path d="M12 9 L18 12 L12 15 Z" fill="none" stroke="#1A1A1A" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  </g>
                )}
              </g>
            ))}
          </motion.g>
        </g>
      </motion.svg>
      <motion.p className="text-xs md:text-sm" style={{ color: '#1A1A1A' }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }}>
        Generating...
      </motion.p>
    </div>
  );
};

export default PuzzleLoader;



