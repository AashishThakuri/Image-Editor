import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GoogleSignInButton from '../components/GoogleSignInButton';
import PromptExamplesModal from '../components/PromptExamplesModal';
import { Star, Clapperboard, Image as ImageIcon, Wand2, Twitter, Instagram, Linkedin, X } from 'lucide-react'
import FeatherIcon from '../components/FeatherIcon';

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [hoveredLink, setHoveredLink] = useState(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [reduceMotion, setReduceMotion] = useState(false)
  const landingArtUrl = import.meta.env.VITE_LANDING_BG_IMAGE || '/11073598.png'
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduceMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Subtle parallax for background shapes
  useEffect(() => {
    if (reduceMotion) { setParallax({ x: 0, y: 0 }); return }
    let raf = 0
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18 // reduced amplitude
      const y = (e.clientY / window.innerHeight - 0.5) * 18
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setParallax({ x, y }))
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduceMotion])

  const handleSmoothScroll = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const features = [
    {
      icon: <Clapperboard className="w-8 h-8" />,
      title: 'Text → Video',
      description: 'Create cinematic videos with authentic Nepali dialogue, stunning scenes, and natural motion.'
    },
    {
      icon: <ImageIcon className="w-8 h-8" />,
      title: 'Text → Image',
      description: 'Generate beautiful high-resolution images from a single prompt or your references.'
    },
    {
      icon: <Wand2 className="w-8 h-8" />,
      title: 'Edit & Place Anything',
      description: 'Add, replace, or move objects and text in any image with precise region boxes and masks.'
    }
  ]

  const testimonials = [
    {
      name: "Sunita Rai",
      role: "Travel Vlogger",
      content: "This tool is a game-changer for my travel vlogs. I can create beautiful shorts of Everest right from my base camp!",
      rating: 5
    },
    {
      name: "Aarav Shrestha",
      role: "Digital Marketer",
      content: "We've boosted our ad campaigns with culturally relevant videos made in minutes. The Nepali language support is perfect.",
      rating: 5
    },
    {
      name: "Priya Gurung",
      role: "Teacher",
      content: "I use this to create engaging educational videos about Nepali history for my students. It's so easy to use!",
      rating: 5
    }
  ]

  return (
    <div 
        id="home"
        className="relative min-h-screen font-sans overflow-x-hidden"
        style={{
          background: `
            radial-gradient(900px 600px at -10% -10%, #F9D7C9 0%, rgba(249,215,201,0) 60%),
            radial-gradient(800px 560px at 110% 15%, #F4E2CE 0%, rgba(244,226,206,0) 55%),
            linear-gradient(180deg, #F7ECE3 0%, #F3DECF 100%)
          `,
          color: '#1A1A1A'
        }}
    >
        <PromptExamplesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        {/* Auth Modal: shows Google button instead of signing in directly */}
        <AnimatePresence>
          {isAuthOpen && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
            >
              <motion.div
                className="w-full max-w-md rounded-2xl p-6 relative"
                style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '12px 12px 0 #1A1A1A' }}
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Sign in"
              >
                <button
                  className="absolute top-3 right-3 inline-flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ background: '#F8D5C7', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                  onClick={() => setIsAuthOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mb-5">
                  <h3 className="text-2xl font-bold font-heading">Welcome</h3>
                  <p className="opacity-80">Continue with Google to start creating.</p>
                </div>
                <div className="flex justify-center">
                  <GoogleSignInButton size="large" variant="retro" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Animated retro background (behind content) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          {/* Background art image */}
          <div className="hidden sm:flex absolute inset-0 items-center justify-center">
            <img
              src={landingArtUrl}
              alt=""
              aria-hidden="true"
              draggable="false"
              className="w-[92%] md:w-[80%] max-w-[1280px] object-contain opacity-20 select-none"
              style={{ filter: 'saturate(0.85) contrast(0.95) grayscale(0.05)' }}
            />
          </div>
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
          <motion.div
            className="hidden md:block absolute bottom-10 left-1/4 w-[280px] h-[180px] rounded-[28px]"
            style={{ background: '#F8D5C7', border: '4px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A', opacity: 0.22 }}
            animate={reduceMotion ? {} : { x: parallax.x * 0.06, y: parallax.y * -0.06, rotate: [0, 0.5, -0.5, 0] }}
            transition={{ duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
          {/* Decorative squiggle line */}
          <motion.svg
            className="absolute -bottom-8 right-8 opacity-20"
            width="480" height="140" viewBox="0 0 480 140" fill="none"
            animate={reduceMotion ? {} : { x: [0, -6, 0], y: [0, 3, 0] }} transition={{ duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <path d="M0 70 C 80 10, 140 130, 220 70 S 360 10, 480 70" stroke="#1A1A1A" strokeWidth="4" fill="none"/>
          </motion.svg>

          {/* Stacked browser-style frames inspired by template */}
          <motion.div
            className="hidden xl:block absolute -left-24 top-28 w-[540px] h-[360px] rounded-[24px] overflow-hidden"
            style={{ background: '#F8E8DB', border: '4px solid #1A1A1A', boxShadow: '12px 12px 0 #1A1A1A', opacity: 0.25 }}
            animate={reduceMotion ? {} : { x: parallax.x * 0.07, y: parallax.y * 0.05, rotate: [-0.6, 0.25, -0.6] }}
            transition={{ duration: 30, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#F2D8C8', borderBottom: '4px solid #1A1A1A' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#F87171', border: '2px solid #1A1A1A' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#FBBF24', border: '2px solid #1A1A1A' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#34D399', border: '2px solid #1A1A1A' }} />
              <div className="ml-3 flex-1 h-6 rounded-full" style={{ background: '#E8D3C5', border: '3px solid #1A1A1A' }} />
            </div>
            <div className="p-5 space-y-3">
              <div className="h-6 w-3/5 rounded-full" style={{ background: '#ECD9CC', border: '3px solid #1A1A1A' }} />
              <div className="h-4 w-4/5 rounded-full" style={{ background: '#F4E4D8', border: '3px solid #1A1A1A' }} />
              <div className="grid grid-cols-3 gap-4 pt-3">
                <div className="h-24 rounded-[16px]" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }} />
                <div className="h-24 rounded-[16px]" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }} />
                <div className="h-24 rounded-[16px]" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:block absolute -right-16 bottom-20 w-[500px] h-[340px] rounded-[24px] overflow-hidden"
            style={{ background: '#F7DCCD', border: '4px solid #1A1A1A', boxShadow: '12px 12px 0 #1A1A1A', opacity: 0.2 }}
            animate={reduceMotion ? {} : { x: parallax.x * -0.08, y: parallax.y * -0.05, rotate: [0.6, -0.3, 0.6] }}
            transition={{ duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#F3D0C1', borderBottom: '4px solid #1A1A1A' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#F87171', border: '2px solid #1A1A1A' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#FBBF24', border: '2px solid #1A1A1A' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#34D399', border: '2px solid #1A1A1A' }} />
              <div className="ml-3 flex-1 h-6 rounded-full" style={{ background: '#E8D3C5', border: '3px solid #1A1A1A' }} />
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="h-40 rounded-[16px]" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }} />
              <div className="h-40 rounded-[16px]" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }} />
            </div>
          </motion.div>

          {/* Doodle hearts & stars */}
          <motion.svg
            className="absolute left-6 top-1/2 -translate-y-1/2 opacity-15"
            width="140" height="140" viewBox="0 0 140 140" fill="none"
            animate={reduceMotion ? {} : { rotate: [0, 1.5, -1.5, 0] }} transition={{ duration: 32, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <path d="M34 56c-8-18 12-30 24-14 12-16 32-4 24 14-6 14-24 22-24 22s-17-8-24-22z" fill="#FAD9C9" stroke="#1A1A1A" strokeWidth="4"/>
            <path d="M102 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10z" fill="#F7C9B9" stroke="#1A1A1A" strokeWidth="4"/>
          </motion.svg>

          {/* Edge label chips */}
          <motion.div
            className="hidden md:flex items-center gap-2 absolute left-8 bottom-16 px-3 py-1 rounded-full text-sm"
            style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A', opacity: 0.35 }}
            animate={reduceMotion ? {} : { x: [0, 4, 0] }} transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <span className="font-semibold">scene_01.mp4</span>
          </motion.div>
          <motion.div
            className="hidden md:flex items-center gap-2 absolute right-10 top-24 px-3 py-1 rounded-full text-sm"
            style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A', opacity: 0.35 }}
            animate={reduceMotion ? {} : { y: [0, 3, 0] }} transition={{ duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <span className="font-semibold">poster.png</span>
          </motion.div>
          <motion.div
            className="hidden lg:flex items-center gap-2 absolute right-1/3 -bottom-6 px-3 py-1 rounded-full text-sm"
            style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A', opacity: 0.35 }}
            animate={reduceMotion ? {} : { x: [0, -4, 0] }} transition={{ duration: 24, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <span className="font-semibold">mask.svg</span>
          </motion.div>

          {/* Subtle dim overlay above all background elements */}
          <div className="absolute inset-0" style={{ background: 'rgba(26,26,26,0.2)' }} />
        </div>
        <motion.header 
          className="fixed top-0 w-full z-30"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <div className="flex-1 flex justify-start">
                <div className="flex items-center">
                  <motion.div
                    initial={{ y: -100, x: 20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.4, 
                      duration: 1.5, 
                      type: 'spring', 
                      stiffness: 50,
                      // Add a little wobble
                      rotate: { duration: 1, ease: 'easeInOut', times: [0, 0.2, 0.5, 0.8, 1], repeat: 0, repeatDelay: 1 },
                      x: { duration: 1, ease: 'easeInOut', times: [0, 0.2, 0.5, 0.8, 1], repeat: 0, repeatDelay: 1 }
                    }}
                  >
                    <FeatherIcon className="h-10 w-10 -mr-2" />
                  </motion.div>
                  <motion.h1 
                    className="text-2xl font-bold font-heading flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="font-script text-5xl">E</span><span className="-ml-1">ikona</span>
                  </motion.h1>
                </div>
              </div>

              {/* Centered Navigation */}
              <div className="flex-1 flex justify-center">
                <nav className="hidden md:block">
                  <ul className="relative flex items-center space-x-3 px-3 py-2 rounded-full whitespace-nowrap" style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }} onMouseLeave={() => setHoveredLink(null)}>
                    {['Home', 'Features', 'Testimonials', 'Pricing'].map((item) => (
                      <li
                        key={item}
                        className="relative"
                        onMouseEnter={() => setHoveredLink(item)}
                      >
                        <a href={`#${item.toLowerCase()}`} onClick={handleSmoothScroll} className="relative z-10 block rounded-full px-4 py-2 font-semibold transition-colors duration-300">
                          {item}
                        </a>
                        {hoveredLink === item && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ background: '#F8D5C7', border: '3px solid #1A1A1A' }}
                            layoutId="hover-pill"
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          />
                        )}
                      </li>
                    ))}
                    {/* Get Started button (triggers Google sign-in) with same hover pill effect */}
                    <li className="ml-1 relative" onMouseEnter={() => setHoveredLink('Get Started')}>
                      <button
                        type="button"
                        onClick={() => setIsAuthOpen(true)}
                        className="relative z-10 inline-flex items-center justify-center rounded-full px-4 py-2 font-semibold whitespace-nowrap"
                        style={{ color: '#1A1A1A' }}
                        aria-label="Get Started"
                      >
                        Get Started
                      </button>
                      {hoveredLink === 'Get Started' && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ background: '#F8D5C7', border: '3px solid #1A1A1A' }}
                          layoutId="hover-pill"
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        />
                      )}
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Right Navigation */}
              <div className="flex-1 flex justify-end items-center gap-2">
                <button
                  className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full"
                  style={{ background: '#F8D5C7', border: '4px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <span className="block w-5 h-0.5 bg-black" />
                  <span className="block w-5 h-0.5 bg-black mt-1.5" />
                  <span className="block w-5 h-0.5 bg-black mt-1.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Mobile nav overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <motion.div
                className="absolute top-0 right-0 h-full w-[88%] max-w-sm p-5"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                style={{ background: '#FDF5EC', borderLeft: '4px solid #1A1A1A', boxShadow: '-8px 0 0 #1A1A1A' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FeatherIcon className="h-8 w-8 -mr-1" />
                    <span className="text-xl font-bold"><span className="font-script text-3xl">E</span>ikona</span>
                  </div>
                  <button
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full"
                    style={{ background: '#F8D5C7', border: '4px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav>
                  <ul className="space-y-3">
                    {['Home', 'Features', 'Testimonials', 'Pricing'].map((item) => (
                      <li key={item}>
                        <a
                          href={`#${item.toLowerCase()}`}
                          onClick={(e) => { handleSmoothScroll(e); setMobileOpen(false); }}
                          className="block w-full text-lg font-semibold px-4 py-3 rounded-xl"
                          style={{ background: '#F8E8DB', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="mt-6">
                  <GoogleSignInButton size="large" variant="retro" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-6 font-heading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Create Videos & Images
                  <span className="block">Edit Anything in a Single Prompt</span>
                </motion.h1>
                
                <motion.p 
                  className="text-lg sm:text-xl mb-8 leading-relaxed font-body"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Generate videos and images, and make smart edits to any picture. Place objects, swap items, and typeset Nepali text precisely—all with one prompt.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <GoogleSignInButton size="large" variant="retro" />
                  <motion.button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 font-semibold rounded-full transition-transform duration-300"
                    style={{ background: '#F8D5C7', border: '4px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Prompt Examples
                  </motion.button>
                </motion.div>

                {/* Use‑case chips (on-brand retro pills) */}
                <motion.ul
                  className="mt-5 flex flex-wrap gap-2 text-sm"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  {['Ad Creatives', 'Travel Vlogs', 'Education', 'E‑commerce', 'Music Visualizer', 'Posters'].map((item, idx) => (
                    <motion.li
                      key={item}
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 5 + idx * 0.3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    >
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full"
                        style={{ background: '#F8E8DB', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                      >
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div 
                  className="relative rounded-[22px] p-6"
                  style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '10px 10px 0 #1A1A1A' }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="bg-slate-700/20 rounded-xl p-6 text-slate-800 mb-6">
                    <h3 className="text-xl font-semibold mb-2">✨ AI Creation Studio</h3>
                    <p className="opacity-90">Type: "Pink hat on the child, add paper cranes in the sky"</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <motion.div className="w-4 h-4 rounded-full" style={{ background: '#3CB371', border: '2px solid #1A1A1A' }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
                      <span>Understanding your prompt & references...</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <motion.div className="w-4 h-4 rounded-full" style={{ background: '#F4A460', border: '2px solid #1A1A1A' }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
                      <span>Generating images and video scenes...</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <motion.div className="w-4 h-4 rounded-full" style={{ background: '#F08080', border: '2px solid #1A1A1A' }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
                      <span>Placing objects and refining edits...</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <motion.div className="w-4 h-4 rounded-full" style={{ background: '#8AA6FF', border: '2px solid #1A1A1A' }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
                      <span>Rendering final outputs...</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 scroll-mt-28 md:scroll-mt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-4 font-heading">
              All‑in‑One: Video, Image, Edit
            </h2>
            <p className="text-xl max-w-3xl mx-auto font-body">
              Generate videos and images, then edit any photo with precise object placement and Nepali typesetting—built for creators in Nepal.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative p-6 text-center group rounded-[20px] overflow-hidden"
                style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-2 rounded-[16px]"
                  style={{ border: '3px dashed #1A1A1A' }}
                  animate={{ opacity: [0.5, 0.85, 0.5] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                />
                <motion.div className="mb-4 rounded-full p-4 inline-flex items-center justify-center" style={{ background: '#F8D5C7', border: '3px solid #1A1A1A' }} animate={{ rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}>
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 scroll-mt-28 md:scroll-mt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-4 font-heading">
              What Our Users Say
            </h2>
            <p className="text-xl font-body">
              Join thousands of creators who are already transforming their content
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="relative p-6 rounded-[20px] overflow-hidden"
                style={{ background: '#FDF5EC', border: '4px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-2 rounded-[16px]"
                  style={{ border: '3px dashed #1A1A1A' }}
                  animate={{ opacity: [0.45, 0.8, 0.45] }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: index * 0.25 }}
                />
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className="mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="opacity-80">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 scroll-mt-28 md:scroll-mt-36">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-6 font-heading">
              Start Creating Videos, Images & Edits
            </h2>
            <p className="text-xl mb-8 font-body">
              Sign in with Google to generate videos and images, and make photorealistic edits with precise control. Get 3 free generations on us!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-[#1A1A1A]" style={{ background: '#F5EAE1', borderTop: '4px solid #1A1A1A' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div className="md:col-span-1">
              <div className="flex items-center">
                <motion.div
                  initial={{ y: -100, x: 20, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.4, 
                    duration: 1.5, 
                    type: 'spring', 
                    stiffness: 50,
                    // Add a little wobble
                    rotate: { duration: 1, ease: 'easeInOut', times: [0, 0.2, 0.5, 0.8, 1], repeat: 0, repeatDelay: 1 },
                    x: { duration: 1, ease: 'easeInOut', times: [0, 0.2, 0.5, 0.8, 1], repeat: 0, repeatDelay: 1 }
                  }}
                >
                  <FeatherIcon className="h-10 w-10 -mr-2" />
                </motion.div>
                <motion.h2 
                  className="text-2xl font-bold font-heading flex items-center mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="font-script text-4xl">E</span><span className="-ml-1">ikona</span>
                </motion.h2>
              </div>
              <p className="text-sm">Create Videos & Images in a Single Prompt.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 col-span-1 md:col-span-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><Link to="/about" className="hover:underline">About</Link></li>
                  <li><Link to="/blog" className="hover:underline">Blog</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#features" onClick={handleSmoothScroll} className="hover:underline">Features</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm" style={{ borderTop: '4px solid #1A1A1A' }}>
            <p>&copy; {new Date().getFullYear()} Eikona. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="https://x.com/Lyrical62785503" target="_blank" rel="noopener noreferrer" className="hover:opacity-80"><Twitter size={20} /></a>
              <a href="https://www.instagram.com/aashish_thakuri7?igsh=ZzQwbWtwd3p6cjRn&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:opacity-80"><Instagram size={20} /></a>
              <a href="https://www.linkedin.com/in/aashish-bam-435505351/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80"><Linkedin size={20} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )

}

export default LandingPage
