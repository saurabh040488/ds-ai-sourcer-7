import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, Building, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, signUp } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('');

    try {
      if (isLogin) {
        console.log('🔐 Attempting login for:', email);
        setDebugInfo(`Signing in ${email}...`);
        
        const { data, error } = await signIn(email, password);
        
        if (error) {
          console.error('❌ Login error:', error);
          setDebugInfo(`Login failed: ${error.message}`);
          
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.');
          } else if (error.message.includes('too_many_requests')) {
            setError('Too many login attempts. Please wait a moment and try again.');
          } else {
            setError(error.message);
          }
        } else {
          console.log('✅ Login successful:', data);
          setDebugInfo('Login successful! Loading profile...');
          // Don't set loading to false here - let AuthWrapper handle the flow
          return; // Exit early to prevent setting loading to false
        }
      } else {
        console.log('📝 Attempting signup for:', email);
        setDebugInfo(`Creating account for ${email}...`);
        
        const { data, error } = await signUp(email, password, fullName);
        
        if (error) {
          console.error('❌ Signup error:', error);
          setDebugInfo(`Signup failed: ${error.message}`);
          
          if (error.message.includes('User already registered')) {
            setError('This email is already registered. Please sign in instead.');
            setIsLogin(true);
          } else {
            setError(error.message);
          }
        } else {
          console.log('✅ Signup successful:', data);
          setDebugInfo('Account created successfully!');
          
          if (data.user && !data.user.email_confirmed_at) {
            setError('Account created! Please check your email to confirm your account before signing in.');
          } else {
            setError('Account created successfully! You can now sign in.');
            setIsLogin(true);
          }
        }
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      setDebugInfo(`Unexpected error: ${err}`);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      // Only set loading to false if we're not in a successful login flow
      if (!isLogin || error) {
        setLoading(false);
      }
    }
  };

  const handleCreateMasterUser = async () => {
    setLoading(true);
    setError('');
    setDebugInfo('Creating master user...');
    
    try {
      console.log('👑 Creating master user account...');
      const { data, error } = await signUp('saurabh.agrawal@joveo.com', 'joveo123', 'Saurabh Agrawal');
      
      if (error) {
        console.error('❌ Master user creation error:', error);
        setDebugInfo(`Master user creation failed: ${error.message}`);
        
        if (error.message.includes('User already registered')) {
          setError('Master user already exists! You can login directly.');
          setEmail('saurabh.agrawal@joveo.com');
          setPassword('joveo123');
          setIsLogin(true);
        } else {
          setError(`Master user creation failed: ${error.message}`);
        }
      } else {
        console.log('✅ Master user created successfully:', data);
        setDebugInfo('Master user created successfully!');
        setError('Master user created successfully! You can now login.');
        setEmail('saurabh.agrawal@joveo.com');
        setPassword('joveo123');
        setIsLogin(true);
      }
    } catch (err) {
      console.error('❌ Master user creation error:', err);
      setDebugInfo(`Master user creation exception: ${err}`);
      setError('Failed to create master user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterLogin = () => {
    setEmail('saurabh.agrawal@joveo.com');
    setPassword('joveo123');
    setIsLogin(true);
    setError('');
    setDebugInfo('Master credentials filled');
  };

  const handleQuickLogin = async () => {
    setEmail('saurabh.agrawal@joveo.com');
    setPassword('joveo123');
    setIsLogin(true);
    setError('');
    setDebugInfo('Starting quick login...');
    
    // Auto-submit the form
    setLoading(true);
    try {
      console.log('🚀 Quick login attempt...');
      const { data, error } = await signIn('saurabh.agrawal@joveo.com', 'joveo123');
      
      if (error) {
        console.error('❌ Quick login error:', error);
        setDebugInfo(`Quick login failed: ${error.message}`);
        setError('Quick login failed. Please try manual login.');
        setLoading(false);
      } else {
        console.log('✅ Quick login successful');
        setDebugInfo('Quick login successful! Loading app...');
        // Don't set loading to false - let AuthWrapper handle it
      }
    } catch (err) {
      console.error('❌ Quick login error:', err);
      setDebugInfo(`Quick login exception: ${err}`);
      setError('Quick login failed. Please try manual login.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Sourcing Tool</h1>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600">
                  🔍 {debugInfo}
                </p>
              </div>
            )}

            {error && (
              <div className={`p-3 rounded-lg ${
                error.includes('created') || error.includes('successfully') || error.includes('exists')
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  error.includes('created') || error.includes('successfully') || error.includes('exists')
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  <Building className="w-5 h-5" />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Master User Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <button
                onClick={handleQuickLogin}
                disabled={loading}
                className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                🚀 Quick Login (Auto-fill & Submit)
              </button>
              
              <button
                onClick={handleCreateMasterUser}
                disabled={loading}
                className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                👑 Create Master User Account
              </button>
              
              <button
                onClick={handleMasterLogin}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                🔑 Fill Master User Credentials
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Master User: saurabh.agrawal@joveo.com • Password: joveo123
            </p>
          </div>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setDebugInfo('');
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Powered by AI for intelligent candidate sourcing</p>
          <div className="flex justify-center gap-6 text-xs text-gray-500">
            <span>🤖 AI-Powered Search</span>
            <span>📊 Smart Analytics</span>
            <span>🔒 Secure & Private</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Open console (F12) for detailed debugging logs</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;