import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import ChatGenerator from './pages/ChatGenerator'
import ImageGenerator from './pages/ImageGenerator'
import ImageEditor from './pages/ImageEditor'
import Profile from './pages/Profile'
import About from './pages/About'
import Blog from './pages/Blog'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Video generation temporarily disabled */}
                {/* <Route path="/dashboard" element={<ChatGenerator />} /> */}
                <Route path="/dashboard" element={<Navigate to="/dashboard/image" replace />} />
                <Route path="/dashboard/image" element={<ImageGenerator />} />
                <Route path="/dashboard/editor" element={<ImageEditor />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
