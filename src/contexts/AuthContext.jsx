import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

// Auth Context Provider Component
export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Initialize new user if they just signed up
      if (session?.user) {
        initializeNewUser(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Initialize new user on sign up
      if (_event === 'SIGNED_IN' && session?.user) {
        await initializeNewUser(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Initialize default folders and settings for new users
   */
  const initializeNewUser = async (userId) => {
    try {
      // Check if user already has folders
      const { data: existingFolders } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId);

      // Create default folders if none exist
      if (!existingFolders || existingFolders.length === 0) {
        const { error: foldersError } = await supabase.from('folders').insert([
          { user_id: userId, name: 'Work' },
          { user_id: userId, name: 'Personal' },
          { user_id: userId, name: 'Shopping' },
        ]);

        if (foldersError) {
          console.error('Error creating default folders:', foldersError);
        } else {
          console.log('✅ Default folders created for new user');
        }
      }

      // Check if user already has settings
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create default settings if none exist
      if (!existingSettings) {
        const { error: settingsError } = await supabase.from('settings').insert([
          {
            user_id: userId,
            notifications: true,
            desktop_notifications: true,
            sound_alerts: true,
            theme: 'light',
            default_timing: 'tomorrow_morning',
          },
        ]);

        if (settingsError) {
          console.error('Error creating default settings:', settingsError);
        } else {
          console.log('✅ Default settings created for new user');
        }
      }
    } catch (error) {
      console.error('Error initializing new user:', error);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');

      // Clear local state first
      setSession(null);
      setUser(null);

      // Try to sign out with Supabase (with timeout)
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );

      try {
        await Promise.race([signOutPromise, timeoutPromise]);
        console.log('✅ Signed out successfully');
      } catch (error) {
        console.warn('⚠️ Sign out timed out or failed, forcing logout:', error);
      }

      // Force clear all Supabase session data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('🧹 Clearing storage key:', key);
        localStorage.removeItem(key);
      });

      // Also clear sessionStorage
      sessionStorage.clear();

      console.log('✅ Session cleared, redirecting to login...');

      // Force page reload to clear everything
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Error signing out:', error);
      // Force clear storage anyway
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // Context value
  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
