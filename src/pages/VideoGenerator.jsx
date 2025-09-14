import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Download, 
  Share2, 
  Wand2,
  Film,
  Settings,
  Zap
} from 'lucide-react'

import { generateVideo } from '../lib/veoClient'

const VideoGenerator = () => {
  const { user, subscription, consumeVideo } = useAuth()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [duration, setDuration] = useState('15')
  const [style, setStyle] = useState('realistic')

  const promptSuggestions = [
    "A serene sunset over snow-capped mountains with golden light",
    "Ocean waves gently crashing on a tropical beach at dawn",
    "A bustling city street at night with neon lights",
    "A peaceful forest with sunlight filtering through trees"
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video description')
      return
    }

    if (subscription.videosRemaining <= 0) {
      toast.error('No generations remaining. Please upgrade your plan.')
      return
    }

    setIsGenerating(true)
    
    try {
      const video = await generateVideo({ prompt, duration, style })
      setGeneratedVideo(video)
      consumeVideo()
      toast.success('Video generated successfully!')
      
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Failed to generate video. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">Video Generator</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{subscription.videosRemaining}</span> generations remaining
              </div>
              <img 
                src={user?.picture || 'https://via.placeholder.com/32'} 
                alt={user?.name}
                className="w-8 h-8 rounded-full border-2 border-primary-200"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Prompt Input */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Wand2 className="w-6 h-6 mr-2 text-primary-600" />
                Describe Your Video
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                disabled={isGenerating}
              />
            </div>

            {/* Suggestions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggestions</h3>
              <div className="space-y-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(suggestion)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors text-sm"
                    disabled={isGenerating}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    disabled={isGenerating}
                  >
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    disabled={isGenerating}
                  >
                    <option value="realistic">Realistic</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="artistic">Artistic</option>
                    <option value="animated">Animated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || subscription.videosRemaining <= 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center space-x-2 ${
                isGenerating || !prompt.trim() || subscription.videosRemaining <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg'
              }`}
              whileHover={!isGenerating && prompt.trim() && subscription.videosRemaining > 0 ? { scale: 1.02 } : {}}
            >
              {isGenerating ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate Video</span>
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card h-fit"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Film className="w-6 h-6 mr-2 text-primary-600" />
              Preview
            </h2>

            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex flex-col items-center justify-center"
                >
                  <motion.div
                    className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-gray-600 font-medium">Generating your video...</p>
                </motion.div>
              ) : generatedVideo ? (
                <motion.div
                  key="generated"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative group">
                    <img 
                      src={generatedVideo.thumbnail} 
                      alt="Generated video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    
                    <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Your generated video will appear here</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default VideoGenerator
