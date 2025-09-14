import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-warm-50 to-secondary-50">
      <motion.div
        className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.p
        className="mt-4 text-gray-600 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.p>
    </div>
  )
}

export default LoadingSpinner
