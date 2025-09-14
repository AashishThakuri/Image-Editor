import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateVideo } from '../lib/veoClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import PuzzleLoader from '../components/PuzzleLoader';

const promptSuggestions = [
    'काठमाडौँको गल्ली—झरी, गहिरो बास शीशीमा; स्लो डली‑इन, संवाद: “आज सपनाले साथ देओला”',
    'Patan tea stall at golden hour; bokeh steam; close‑ups of hands; soft Nepali VO about old days',
    'Dawn over snowy peaks; drone tilt‑up; prayer flags; VO: “सांस फेर, चाल चल, हिमाल बोल्छ”',
    'Studio hero: matte earbuds levitating; macro textures; UI overlay 24h battery, IPX; color beat‑switch',
    'Dusk football ground; slow‑mo volley; Nepali crowd chant; rain droplets flick on lens',
    'Night city drive; neon reflections on wet roads; lo‑fi; on‑screen Nepali lyrics line‑by‑line',
    'Thamel street food montage; sizzling momo, steam; quick whip‑pans; tag: “Local Taste, Global Love”',
    'Classroom explainer—clean whiteboard style; animated icons; Nepali VO teaching fractions',
    'Rainy alley—neon puddles; whisper: “आज सब ठीक होला है”; prayer wheels spin in soft rack focus',
    'Market morning in Asan; warm sun rays; vendors greet in Nepali; gentle handheld close‑ups',
    'Studio sneaker spin; top‑down light sweep; floating specs; final tag in Nepali bold type',
    'Festival night—diyas flicker; drone rise; kids laugh; VO: “उज्यालो यहाँबाटै सुरु”',
];

const ChatGenerator = () => {
    const { user, consumeVideo, subscription } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState(null);
    const textareaRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [cooldownLeft, setCooldownLeft] = useState(0);
    // UI-only animation states (do not affect logic)
    const [parallax, setParallax] = useState({ x: 0, y: 0 });
    const [reduceMotion, setReduceMotion] = useState(false);

    // Typed suggestion overlay states
    const [sIndex, setSIndex] = useState(0);
    const [typed, setTyped] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Typewriter effect for in-box suggestions
    useEffect(() => {
        if (prompt) return; // hide animation while user is typing
        const full = promptSuggestions[sIndex];
        let timeout;
        if (!isDeleting && typed.length < full.length) {
            timeout = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 55);
        } else if (!isDeleting && typed.length === full.length) {
            timeout = setTimeout(() => setIsDeleting(true), 1000);
        } else if (isDeleting && typed.length > 0) {
            timeout = setTimeout(() => setTyped(full.slice(0, typed.length - 1)), 35);
        } else {
            setIsDeleting(false);
            setSIndex((sIndex + 1) % promptSuggestions.length);
        }
        return () => clearTimeout(timeout);
    }, [typed, isDeleting, sIndex, prompt]);

    // Reset typed overlay when user starts typing
    useEffect(() => {
        if (!prompt) return;
        setTyped('');
        setIsDeleting(false);
    }, [prompt]);

    // Auto-resize the textarea height smoothly as the user types
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = '0px';
        const max = 200; // px
        const newHeight = Math.min(el.scrollHeight, max);
        el.style.height = newHeight + 'px';
    }, [prompt]);

    // Respect prefers-reduced-motion and enable subtle parallax like landing page
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setReduceMotion(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);
    useEffect(() => {
        if (reduceMotion) { setParallax({ x: 0, y: 0 }); return; }
        let raf = 0;
        const onMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 18;
            const y = (e.clientY / window.innerHeight - 0.5) * 18;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setParallax({ x, y }));
        };
        window.addEventListener('mousemove', onMove);
        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(raf);
        };
    }, [reduceMotion]);

    // Cooldown ticker
    useEffect(() => {
        if (cooldownUntil <= Date.now()) { setCooldownLeft(0); return; }
        const id = setInterval(() => {
            const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
            setCooldownLeft(left);
            if (left <= 0) clearInterval(id);
        }, 500);
        return () => clearInterval(id);
    }, [cooldownUntil]);

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;
        if (Date.now() < cooldownUntil) return;
        if (subscription.videosRemaining <= 0) {
            toast.error('No generations remaining. Please upgrade your plan.');
            return;
        }
        setIsGenerating(true);
        setGeneratedVideo(null);

        try {
            const video = await generateVideo({ prompt });
            setGeneratedVideo(video);
            consumeVideo();
            toast.success('Video generated successfully!');
        } catch (error) {
            console.error(error);
            const msg = error?.message || '';
            if (/429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(msg)) {
                // Apply a short client cooldown to avoid hammering the API further
                const cooldownMs = 15000; // 15s safe pause
                const until = Date.now() + cooldownMs;
                setCooldownUntil(until);
                setCooldownLeft(Math.ceil(cooldownMs / 1000));
                toast.error('Rate limit hit. Pausing for 15s before next try.');
            } else {
                toast.error(msg || 'Failed to generate video.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleGenerate();
    };

    // Fill the chatbox with a random curated prompt (UI only)
    const handleSurprise = () => {
        const next = promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)] || '';
        setPrompt(next);
    };

    return (
        <div 
            className="relative min-h-screen font-sans text-[#1A1A1A] overflow-hidden"
            style={{
                background: `
                  radial-gradient(900px 600px at -10% -10%, #F9D7C9 0%, rgba(249,215,201,0) 60%),
                  radial-gradient(800px 560px at 110% 15%, #F4E2CE 0%, rgba(244,226,206,0) 55%),
                  linear-gradient(180deg, #F7ECE3 0%, #F3DECF 100%)
                `
            }}
        >
            {/* Retro background elements like landing page */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div
                    className="hidden md:block absolute -top-10 -left-10 w-[360px] h-[260px] rounded-[32px]"
                    style={{ background: '#F7C9B9', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A', opacity: 0.25 }}
                    animate={reduceMotion ? {} : { x: parallax.x * 0.12, y: parallax.y * 0.06, rotate: [0, 0.8, -0.8, 0] }}
                    transition={{ duration: 24, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                />
                <motion.div
                    className="hidden md:block absolute top-40 -right-16 w-[420px] h-[300px] rounded-[32px]"
                    style={{ background: '#F3E2D3', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A', opacity: 0.22 }}
                    animate={reduceMotion ? {} : { x: parallax.x * -0.09, y: parallax.y * 0.07, rotate: [0, -0.6, 0.6, 0] }}
                    transition={{ duration: 26, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                />
                <motion.svg
                    className="absolute -bottom-8 right-8 opacity-20"
                    width="480" height="140" viewBox="0 0 480 140" fill="none"
                    animate={reduceMotion ? {} : { x: [0, -6, 0], y: [0, 3, 0] }} transition={{ duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                >
                    <path d="M0 70 C 80 10, 140 130, 220 70 S 360 10, 480 70" stroke="#1A1A1A" strokeWidth="4" fill="none"/>
                </motion.svg>
                <div className="absolute inset-0" style={{ background: 'rgba(26,26,26,0.12)' }} />
            </div>

            {/* Header removed - global DashboardHeader handles branding/profile */}

            <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-14 z-10 relative">
                <div className="w-full max-w-2xl md:max-w-3xl mx-auto flex flex-col items-center">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-3 font-heading">Create Nepali Videos from a Single Prompt</h2>
                        <p className="text-lg md:text-xl font-body opacity-90">Write in Nepali or English—add scene notes, camera moves, and dialogue.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full"
                    >
                        {/* Surprise button outside chatbox */}
                        <div className="mb-3 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleSurprise}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                                style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                            >
                                <motion.span
                                    className="inline-flex"
                                    animate={{ rotate: [0, 12, 0, -8, 0], y: [0, -1, 0, 1, 0], scale: [1, 1.05, 1, 1.08, 1] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                    aria-hidden="true"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                <span>Surprise me</span>
                            </button>
                        </div>
                        {/* Retro framed chatbox (smaller + responsive) */}
                        <div className="relative rounded-[18px] overflow-hidden" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
                            <div className="px-3 py-2 hidden sm:flex items-center gap-2" style={{ background: '#F2D8C8', borderBottom: '3px solid #1A1A1A' }}>
                                <div className="w-3 h-3 rounded-full" style={{ background: '#F87171', border: '2px solid #1A1A1A' }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: '#FBBF24', border: '2px solid #1A1A1A' }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: '#34D399', border: '2px solid #1A1A1A' }} />
                                <div className="ml-3 flex-1 h-5 rounded-full" style={{ background: '#E8D3C5', border: '2px solid #1A1A1A' }} />
                            </div>
                            <form onSubmit={handleSubmit} className='relative p-4 md:p-5'>
                                <div className='relative rounded-[12px] p-3 md:p-4' style={{ background: '#F8E8DB', border: '2px solid #1A1A1A' }}>
                                    <textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={''}
                                        className={`w-full bg-transparent text-sm md:text-base text-[#1A1A1A] focus:outline-none resize-none placeholder:text-[#1A1A1A]/50 min-h-[40px] md:min-h-[52px] max-h-52 overflow-y-auto leading-[1.35] transition-[height] duration-300 ease-in-out`}
                                        rows={1}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        style={{ caretColor: (!prompt.trim().length && !isFocused) ? 'transparent' : 'rgba(26,26,26,0.65)' }}
                                        disabled={isGenerating}
                                    />
                                    {/* Typed suggestion overlay */}
                                    {(!prompt || prompt.length === 0) && !isFocused && (
                                        <div className="pointer-events-none absolute inset-0 px-3 md:px-4 py-3 md:py-4 pr-16 text-[#1A1A1A]/70 flex items-center">
                                            <span className="italic">{typed}</span>
                                            <motion.span
                                                className="ml-1 text-xs md:text-sm select-none"
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ duration: 1.2, repeat: Infinity }}
                                            >
                                                …
                                            </motion.span>
                                        </div>
                                    )}
                                    {/* Send button */}
                                    <motion.button 
                                        type='submit' 
                                        aria-label='Generate'
                                        disabled={!prompt.trim() || isGenerating || cooldownLeft > 0}
                                        className='group absolute right-2 bottom-2 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full text-[#1A1A1A]'
                                        style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {isGenerating ? (
                                            <Loader className='w-5 h-5 animate-spin' />
                                        ) : cooldownLeft > 0 ? (
                                            <span className='text-xs font-bold'>{cooldownLeft}s</span>
                                        ) : (
                                            <Send className='w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5' />
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>

                <div className="w-full max-w-4xl mx-auto mt-16 flex-1 flex items-center justify-center">
                    <AnimatePresence>
                        {isGenerating && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                                <PuzzleLoader />
                            </motion.div>
                        )}
                        {generatedVideo && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                                <h2 className="text-2xl font-bold text-center mb-6">Your Generation</h2>
                                <div className="rounded-2xl overflow-hidden" style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '10px 10px 0 #1A1A1A' }}>
                                    <div className="px-4 py-3" style={{ background: '#F2D8C8', borderBottom: '4px solid #1A1A1A' }}>
                                        <div className="w-3 h-3 rounded-full inline-block mr-2" style={{ background: '#F87171', border: '2px solid #1A1A1A' }} />
                                        <div className="w-3 h-3 rounded-full inline-block mr-2" style={{ background: '#FBBF24', border: '2px solid #1A1A1A' }} />
                                        <div className="w-3 h-3 rounded-full inline-block" style={{ background: '#34D399', border: '2px solid #1A1A1A' }} />
                                    </div>
                                    <div className="p-4">
                                        <video src={generatedVideo.url} controls autoPlay muted loop className="w-full rounded-lg aspect-video bg-black/10" />
                                        <div className="relative rounded-[14px] p-3 mt-4" style={{ background: '#F8E8DB', border: '3px solid #1A1A1A' }}>
                                            <p className="font-medium" lang="ne">{generatedVideo.prompt}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default ChatGenerator;
