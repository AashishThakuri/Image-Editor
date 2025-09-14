import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const GoogleSignInButton = ({ variant = 'primary', size = 'medium' }) => {
  const { signInWithGoogle } = useAuth()

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-2.5 text-base',
    large: 'px-8 py-3 text-lg'
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg',
    white: 'bg-white text-gray-800 hover:bg-gray-100',
    // high-contrast outlined style for the retro landing page theme
    retro: 'bg-[#F8D5C7] text-[#1A1A1A] border-[3px] border-black shadow-[6px_6px_0_#1A1A1A] hover:shadow-[8px_8px_0_#1A1A1A]'
  }

  const handleSignIn = async () => {
    await signInWithGoogle()
    // Navigation is now handled by the onAuthStateChanged listener in AuthContext
  }

  return (
    <motion.button
      onClick={handleSignIn}
      className={`flex items-center justify-center space-x-3 font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${sizeClasses[size]} ${variantClasses[variant]}`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg className="w-6 h-6" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
      </svg>
      <span>Sign in with Google</span>
    </motion.button>
  )
}

export default GoogleSignInButton
