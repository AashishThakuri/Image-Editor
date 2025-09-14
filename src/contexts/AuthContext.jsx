import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { auth } from '../lib/firebase' // Using your firebase config
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState({
    plan: 'free',
    videosRemaining: 3,
    maxVideosPerMonth: 3
  })

  const handleUser = (rawUser) => {
    if (rawUser) {
      const user = {
        uid: rawUser.uid,
        email: rawUser.email,
        name: rawUser.displayName,
        picture: rawUser.photoURL,
      };
      setUser(user);
      // Fetch or initialize subscription
      const savedSubscription = localStorage.getItem(`veo_subscription_${user.uid}`);
      if (savedSubscription) {
        setSubscription(JSON.parse(savedSubscription));
      } else {
        const initialSubscription = {
          plan: 'free',
          videosRemaining: 3,
          maxVideosPerMonth: 3,
        };
        setSubscription(initialSubscription);
        localStorage.setItem(`veo_subscription_${user.uid}`, JSON.stringify(initialSubscription));
      }
      return user;
    } else {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed. User object:', user);
      handleUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      handleUser(result.user);
      toast.success(`Welcome, ${result.user.displayName}!`);
      return true;
    } catch (error) {
      console.error('Firebase sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Google.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Firebase sign-out error:', error)
      toast.error('Failed to sign out.')
    }
  }

  const updateSubscription = (newSubscription) => {
    if (!user) return
    setSubscription(newSubscription)
    localStorage.setItem(`veo_subscription_${user.uid}`, JSON.stringify(newSubscription))
  }

  const consumeVideo = () => {
    if (subscription.videosRemaining > 0) {
      const updatedSubscription = {
        ...subscription,
        videosRemaining: subscription.videosRemaining - 1
      }
      updateSubscription(updatedSubscription)
      return true
    }
    return false
  }

  const value = {
    user,
    loading,
    subscription,
    signInWithGoogle,
    signOut,
    updateSubscription,
    consumeVideo
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
