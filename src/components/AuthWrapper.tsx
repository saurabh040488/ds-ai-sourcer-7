import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUser, getProfile, createProfile } from '../lib/supabase';
import LoginPage from './LoginPage';
import { User } from '@supabase/supabase-js';

interface AuthWrapperProps {
  children: React.ReactNode;
}

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  company?: string;
  role?: string;
}

export const AuthContext = React.createContext<{
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  signOut: async () => {},
});

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Starting...');

  useEffect(() => {
    console.log('🔄 AuthWrapper: Starting authentication initialization...');
    setDebugInfo('Initializing authentication...');
    
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthWrapper: Checking for existing session...');
        setDebugInfo('Checking for existing session...');
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted && !authInitialized) {
            console.warn('⚠️ AuthWrapper: Auth initialization timeout, forcing login page');
            setDebugInfo('Authentication timeout - showing login');
            setLoading(false);
            setAuthInitialized(true);
          }
        }, 8000); // Increased to 8 seconds
        
        const { user: currentUser, error } = await getCurrentUser();
        
        clearTimeout(timeoutId);
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ AuthWrapper: Error getting current user:', error);
          setDebugInfo(`Error getting user: ${error.message}`);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        if (currentUser) {
          console.log('👤 AuthWrapper: Found existing user:', currentUser.email);
          setDebugInfo(`Found user: ${currentUser.email}`);
          await loadUserProfile(currentUser);
        } else {
          console.log('🔍 AuthWrapper: No existing user found');
          setDebugInfo('No existing user - showing login');
          setLoading(false);
        }
        
        setAuthInitialized(true);
        
      } catch (error) {
        console.error('❌ AuthWrapper: Auth initialization failed:', error);
        setDebugInfo(`Auth init failed: ${error}`);
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 AuthWrapper: Auth state changed:', event, session?.user?.email || 'no user');
      setDebugInfo(`Auth event: ${event}`);
      
      if (!mounted) return;
      
      try {
        if (event === 'SIGNED_OUT') {
          console.log('🚪 AuthWrapper: User signed out');
          setDebugInfo('User signed out');
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 AuthWrapper: User signed in:', session.user.email);
          setDebugInfo(`Signed in: ${session.user.email}`);
          await loadUserProfile(session.user);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 AuthWrapper: Token refreshed for:', session.user.email);
          setDebugInfo(`Token refreshed: ${session.user.email}`);
          // Don't reload profile on token refresh if we already have user data
          if (!user) {
            await loadUserProfile(session.user);
          }
        } else if (!session?.user) {
          console.log('🚪 AuthWrapper: No user session');
          setDebugInfo('No user session');
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ AuthWrapper: Error handling auth state change:', error);
        setDebugInfo(`Auth state error: ${error}`);
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 AuthWrapper: Cleaning up auth listener');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('👤 AuthWrapper: Loading profile for:', authUser.email);
      setDebugInfo(`Loading profile for: ${authUser.email}`);
      
      // Set a basic user object first to prevent getting stuck
      const basicUser = {
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        company: 'Joveo',
        role: 'Recruiter',
      };
      
      // Try to get existing profile with timeout
      const profilePromise = getProfile(authUser.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      );
      
      try {
        const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
        
        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('📝 AuthWrapper: Creating new profile for:', authUser.email);
          setDebugInfo(`Creating profile for: ${authUser.email}`);
          
          try {
            const { data: createdProfile, error: createError } = await createProfile(basicUser);
            
            if (createError) {
              console.error('❌ AuthWrapper: Error creating profile:', createError);
              setDebugInfo(`Profile creation error: ${createError.message}`);
              // Use basic user data
              setUser(basicUser);
            } else {
              setUser(createdProfile);
              console.log('✅ AuthWrapper: Profile created successfully');
              setDebugInfo('Profile created successfully');
            }
          } catch (createErr) {
            console.error('❌ AuthWrapper: Profile creation exception:', createErr);
            setDebugInfo(`Profile creation failed: ${createErr}`);
            setUser(basicUser);
          }
        } else if (profile) {
          setUser(profile);
          console.log('✅ AuthWrapper: Profile loaded successfully');
          setDebugInfo('Profile loaded successfully');
        } else {
          console.error('❌ AuthWrapper: Error loading profile:', error);
          setDebugInfo(`Profile load error: ${error?.message || 'Unknown error'}`);
          // Use basic user data
          setUser(basicUser);
        }
      } catch (timeoutError) {
        console.warn('⚠️ AuthWrapper: Profile load timeout, using basic user data');
        setDebugInfo('Profile load timeout - using basic data');
        setUser(basicUser);
      }
    } catch (error) {
      console.error('❌ AuthWrapper: Error in loadUserProfile:', error);
      setDebugInfo(`Profile load failed: ${error}`);
      // Always set basic user data to prevent getting stuck
      setUser({
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        company: 'Joveo',
        role: 'Recruiter',
      });
    } finally {
      setLoading(false);
      setDebugInfo('Authentication complete');
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 AuthWrapper: Starting sign out process...');
    setDebugInfo('Signing out...');
    
    try {
      // Clear user state immediately
      setUser(null);
      setLoading(true);
      
      // Call Supabase sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ AuthWrapper: Supabase sign out error:', error);
        setDebugInfo(`Sign out error: ${error.message}`);
      } else {
        console.log('✅ AuthWrapper: Supabase sign out successful');
        setDebugInfo('Signed out successfully');
      }
      
    } catch (error) {
      console.error('❌ AuthWrapper: Sign out process failed:', error);
      setDebugInfo(`Sign out failed: ${error}`);
    } finally {
      // Always ensure we end up in a clean state
      setUser(null);
      setLoading(false);
      setDebugInfo('Ready for login');
      console.log('✅ AuthWrapper: Sign out complete');
    }
  };

  // Show loading only if we haven't initialized auth yet
  if (loading && !authInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
          <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
          <p className="text-xs text-gray-400 mt-1">Check console (F12) for detailed logs</p>
        </div>
      </div>
    );
  }

  // Show loading during sign out
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing out...</p>
          <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AuthContext.Provider value={{ user, loading: false, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;