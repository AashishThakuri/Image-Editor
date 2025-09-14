import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  User, 
  Crown, 
  Calendar, 
  Video, 
  CreditCard,
  Check,
  Zap,
  Star
} from 'lucide-react'

const Profile = () => {
  const { user, subscription, updateSubscription, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      videos: 3,
      features: ['3 videos per month', 'Basic quality', 'Standard support'],
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      videos: 50,
      features: ['50 videos per month', 'HD quality', 'Priority support', 'Advanced styles'],
      color: 'from-primary-500 to-primary-600',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49,
      videos: 200,
      features: ['200 videos per month', '4K quality', '24/7 support', 'All styles', 'API access'],
      color: 'from-secondary-500 to-secondary-600'
    }
  ]

  const handleUpgrade = (planId) => {
    const plan = plans.find(p => p.id === planId)
    const newSubscription = {
      plan: planId,
      videosRemaining: plan.videos,
      maxVideosPerMonth: plan.videos,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    updateSubscription(newSubscription)
    toast.success(`Upgraded to ${plan.name} plan!`)
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
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">Profile</span>
              </div>
            </div>
            
            <img 
              src={user?.picture || 'https://via.placeholder.com/32'} 
              alt={user?.name}
              className="w-8 h-8 rounded-full border-2 border-primary-200"
            />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-center space-x-6">
            <img 
              src={user?.picture || 'https://via.placeholder.com/80'} 
              alt={user?.name}
              className="w-20 h-20 rounded-full border-4 border-primary-200"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Crown className={`w-4 h-4 ${subscription.plan === 'free' ? 'text-gray-400' : 'text-yellow-500'}`} />
                  <span className="text-sm font-medium capitalize">{subscription.plan} Plan</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Video className="w-4 h-4 text-primary-600" />
                  <span className="text-sm">{subscription.videosRemaining} videos remaining</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'profile', name: 'Profile', icon: User },
            { id: 'subscription', name: 'Subscription', icon: Crown },
            { id: 'billing', name: 'Billing', icon: CreditCard }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <input
                  type="text"
                  value={new Date(user?.signInTime || Date.now()).toLocaleDateString()}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
              <button
                onClick={signOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'subscription' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Current Plan */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Plan</h2>
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 capitalize">{subscription.plan} Plan</h3>
                    <p className="text-gray-600">{subscription.videosRemaining} of {subscription.maxVideosPerMonth} videos remaining</p>
                  </div>
                  <Crown className="w-8 h-8 text-primary-600" />
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(subscription.videosRemaining / subscription.maxVideosPerMonth) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Available Plans */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      subscription.plan === plan.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={subscription.plan === plan.id}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        subscription.plan === plan.id
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg`
                      }`}
                    >
                      {subscription.plan === plan.id ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'billing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Information</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Next Billing Date</h3>
                <p className="text-gray-600">
                  {new Date(subscription.renewalDate || Date.now()).toLocaleDateString()}
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-600">Expires 12/25</p>
                  </div>
                </div>
                <button className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                  Update Payment Method
                </button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Billing History</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dec 2024 - Pro Plan</span>
                    <span className="font-medium">$19.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nov 2024 - Pro Plan</span>
                    <span className="font-medium">$19.00</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Profile
