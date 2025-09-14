import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // A simple loading indicator while Firebase checks auth state.
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // If not loading, and user exists, render the child routes.
  // Otherwise, redirect to the landing page.
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
