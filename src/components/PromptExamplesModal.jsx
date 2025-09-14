import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const promptExamples = [
  {
    id: 'np-dialogue-street-food',
    tag: 'Nepali • Dialogue',
    title: 'काठमाडौँ स्ट्रीट फुड - १५ सेकेन्ड एड',
    prompt:
      'क्यामेरा ठमेलको सडकमा प्यान हुन्छ। स्ट्रीट फुडको तातो बाफ, सिजलिङ आवाज। ग्राहक भन्छ: "दाइ, यो मोमोको चट्नी त्यति झर्को छैन है?" दुकानदार हाँस्दै: "काठमाडौंको स्वाद नै यस्तो, एकचोटि चाख्नुस् त!" स्लो-मोशन बाइट, सन्तुष्ट अनुहार। अन्त्यमा ट्यागलाइन: "Local Taste, Global Love."',
  },
  {
    id: 'mix-travel-himalaya',
    tag: 'Mixed • Travel Reel',
    title: 'Himalayan Sunrise Travel Reel',
    prompt:
      'Drone rises above a sleepy village. Golden hour paints snow peaks. VO (soft): "सूर्य निस्कँदा हिमाल बोल्छ।" Super quick cuts: prayer flags, tea steam, boots crunching frost. On-beat text: "Breathe • Hike • Repeat". End with Nepali tagline: "हिमालसँग साँच्चै भेट हुदैछ।"',
  },
  {
    id: 'product-earbuds-explainer',
    tag: 'Product • Explainer',
    title: 'Wireless Earbuds — Hero Shot',
    prompt:
      'Clean studio table. Earbuds levitate with soft spin. Macro close-ups: matte texture, LED glow. Nepali VO: "नाजुक तर शक्तिशाली धुनहरू।" UI overlay shows 24h battery, IPX rating. Beat-drop color change. Tagline: "Tune In. Drop Out."',
  },
  {
    id: 'music-visualizer',
    tag: 'Music • Visualizer',
    title: 'Lo‑fi Visualizer with Nepali Hook',
    prompt:
      'A cozy desk at night. Vinyl spins, waveform pulses to the beat. Text in Nepali appears line-by-line: "मेरो शहर सधैं बिउँझिएर…" Warm peach/rose palette, grain, vignette, slow camera dolly.',
  },
  {
    id: 'image-edit-object-swap',
    tag: 'Image • Edit',
    title: 'Replace Object + Add Nepali Text',
    prompt:
      'Input photo: a boy holding a red apple. Replace apple with a football; keep hand pose, lighting. Add Nepali headline on top-left: "खेलको जोश!" Use clean geometric font, white text with black outline.',
  },
  {
    id: 'scenario-rainy-kathmandu',
    tag: 'Cinematic • Scene',
    title: 'Rainy Kathmandu Alley',
    prompt:
      'Steady cam follows footsteps in a wet alley; neon reflections on puddles. Ambient rain, distant bike horn. A character whispers in Nepali: "आज सब ठीक होला है।" Soft rack focus to prayer wheels turning.',
  },
];

const PromptExamplesModal = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [order, setOrder] = useState(promptExamples.map(p => p.id));
  const remix = () => setOrder(prev => [...prev].sort(() => Math.random() - 0.5));
  const [current, setCurrent] = useState(0);
  const scrollToIndex = (i) => setCurrent(i);

  const copy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Prompt copied');
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-8 relative border border-white/20"
            style={{
              background: `
                radial-gradient(900px 560px at -10% -10%, #F9D7C9 0%, rgba(249,215,201,0) 60%),
                radial-gradient(800px 520px at 110% 10%, #F4E2CE 0%, rgba(244,226,206,0) 55%),
                linear-gradient(180deg, #F7ECE3 0%, #F3DECF 100%)
              `
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background elements behind content */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute -top-8 -left-8 w-[300px] h-[200px] rounded-[28px]"
                style={{ background: '#F7C9B9', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A', opacity: 0.15 }}
                animate={{ x: [0, 6, 0], rotate: [0, 0.6, -0.6, 0] }}
                transition={{ duration: 24, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -right-10 top-24 w-[340px] h-[220px] rounded-[28px]"
                style={{ background: '#F8E8DB', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A', opacity: 0.12 }}
                animate={{ y: [0, -6, 0], rotate: [0.5, -0.5, 0.5] }}
                transition={{ duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              />
              <motion.svg
                className="absolute bottom-6 left-8 opacity-20"
                width="360" height="120" viewBox="0 0 480 140" fill="none"
                animate={{ x: [0, -8, 0] }} transition={{ duration: 26, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M0 70 C 80 10, 140 130, 220 70 S 360 10, 480 70" stroke="#1A1A1A" strokeWidth="4" fill="none"/>
              </motion.svg>
              <motion.svg
                className="absolute top-10 left-1/2 -translate-x-1/2 opacity-15"
                width="120" height="120" viewBox="0 0 140 140" fill="none"
                animate={{ rotate: [0, 8, 0] }} transition={{ duration: 32, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M34 56c-8-18 12-30 24-14 12-16 32-4 24 14-6 14-24 22-24 22s-17-8-24-22z" fill="#FAD9C9" stroke="#1A1A1A" strokeWidth="4"/>
              </motion.svg>
              <div className="absolute inset-0" style={{ background: 'rgba(26,26,26,0.06)' }} />
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-slate-800 font-heading flex items-center">
                <Sparkles className="w-8 h-8 mr-3 text-amber-500" />
                Prompt Studio
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={remix}
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ background: '#F8D5C7', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                >
                  Remix
                </button>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800 transition-colors rounded-full p-2 -mr-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Spotlight + Thumbnail Rail */}
            <div className="relative">
              {/* Spotlight controls */}
              <button
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full"
                style={{ background: '#F8D5C7', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                aria-label="Previous"
                onClick={() => scrollToIndex((current - 1 + order.length) % order.length)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full"
                style={{ background: '#F8D5C7', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                aria-label="Next"
                onClick={() => scrollToIndex((current + 1) % order.length)}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Spotlight card */}
              {(() => {
                const ex = promptExamples.find(p => p.id === order[current]);
                if (!ex) return null;
                return (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="mx-auto w-[94%] md:w-[80%] xl:w-[70%]"
                  >
                    <div className="rounded-2xl p-6" style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '12px 12px 0 #1A1A1A' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold px-2 py-1 rounded-full" style={{ background: '#F8E8DB', border: '3px solid #1A1A1A' }}>{ex.tag}</div>
                        <button
                          onClick={() => copy(ex.prompt, ex.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
                          style={{ background: '#F8D5C7', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                        >
                          {copiedId === ex.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm font-semibold">{copiedId === ex.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <h3 className="text-2xl font-bold font-heading mt-3">{ex.title}</h3>
                      <div className="relative rounded-[14px] p-4 mt-4" style={{ background: '#F8E8DB', border: '3px solid #1A1A1A' }}>
                        <p className="leading-relaxed font-body" lang="ne">{ex.prompt}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Thumbnails rail */}
              <div className="mt-6 flex gap-4 overflow-x-auto px-1 pb-2">
                {order.map((id, i) => {
                  const ex = promptExamples.find(p => p.id === id);
                  if (!ex) return null;
                  const active = i === current;
                  return (
                    <button
                      key={id}
                      onClick={() => scrollToIndex(i)}
                      className="shrink-0 w-[220px] text-left"
                      aria-label={`Show ${ex.title}`}
                    >
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="rounded-xl p-3"
                        style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: active ? '8px 8px 0 #1A1A1A' : '4px 4px 0 #1A1A1A' }}
                      >
                        <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1" style={{ background: '#F8E8DB', border: '3px solid #1A1A1A' }}>{ex.tag}</div>
                        <div className="text-sm font-bold line-clamp-2">{ex.title}</div>
                        <div className="text-xs opacity-70 mt-1 line-clamp-3" lang="ne">{ex.prompt}</div>
                      </motion.div>
                    </button>
                  );
                })}
              </div>

              {/* Dots */}
              <div className="mt-3 flex justify-center gap-2">
                {order.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToIndex(i)}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: i === current ? '#1A1A1A' : '#E5D6C9', border: '2px solid #1A1A1A' }}
                    aria-label={`Go to card ${i+1}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-slate-700 mt-8">
              You can write in Nepali, English, or mix both. Prompts work for videos, images, and smart edits.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromptExamplesModal;
