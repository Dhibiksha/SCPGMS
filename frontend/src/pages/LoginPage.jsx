import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck, Lock, AlertCircle, CheckCircle2, ArrowRight, Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Token Response from GIS
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError('No credential received from Google. Please try again.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      setSuccessMessage('Verifying Google credentials with backend...');
      const user = await loginWithGoogle(response.credential);
      setSuccessMessage(`Welcome back, ${user.employee?.name || user.email}! Redirecting...`);
      
      setTimeout(() => {
        if (user.role === 'ADMIN') navigate('/admin/dashboard');
        else if (user.role === 'MANAGER') navigate('/manager/dashboard');
        else navigate('/employee/dashboard');
      }, 600);
    } catch (err) {
      setSuccessMessage('');
      const backendError = err.response?.data?.error || 'Google authentication failed';
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  // Initialize official Google Identity Services button if script is loaded & client ID configured
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 384,
            });
            setGoogleReady(true);
          }
        } catch (e) {
          console.warn('Google Identity Services initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      // Poll briefly for script load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  // Fallback handler when clicked without live Google Client ID
  const handleManualGoogleClick = () => {
    setError('');
    setSuccessMessage('');
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      setInfoMessage(
        'Google OAuth requires client credentials: add your GOOGLE_CLIENT_ID to backend/.env and VITE_GOOGLE_CLIENT_ID to frontend/.env. (See instructions in .env.example)'
      );
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Identity Services is loading. Please check your internet connection.');
    }
  };

  // Standard Email/Password login handler
  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setInfoMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const user = await login(email, password);
      setSuccessMessage(`Welcome back, ${user.employee?.name || user.email}! Redirecting...`);
      setTimeout(() => {
        if (user.role === 'ADMIN') navigate('/admin/dashboard');
        else if (user.role === 'MANAGER') navigate('/manager/dashboard');
        else navigate('/employee/dashboard');
      }, 500);
    } catch (err) {
      const backendError = err.response?.data?.error;
      if (backendError) {
        setError(backendError);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Network error: Unable to reach backend server on port 5000.');
      } else {
        setError('Authentication request failed. Please check server status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickSwitch = (eMail) => {
    setEmail(eMail);
    setPassword('password123');
    setError('');
    setInfoMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl space-y-5 relative z-10 border border-slate-800">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">SCPGMS Portal</h2>
          <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
            Smart Corporate Productivity & Goal System
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info notification */}
        {infoMessage && (
          <div className="p-3 bg-sky-500/15 border border-sky-500/30 rounded-xl text-sky-300 text-xs flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google Authentication Section */}
        <div className="space-y-3">
          <div className="flex justify-center w-full min-h-[44px]">
            {/* GIS Container */}
            <div
              ref={googleBtnRef}
              className={`w-full flex justify-center ${!googleReady ? 'hidden' : ''}`}
            />

            {/* Official Google branded button (displayed when GIS client is awaiting credentials) */}
            {!googleReady && (
              <button
                type="button"
                onClick={handleManualGoogleClick}
                disabled={loading}
                className="w-full h-11 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 font-medium text-sm rounded-full border border-slate-700 hover:border-slate-600 shadow-md flex items-center justify-center space-x-3 transition cursor-pointer"
                title="Continue with your corporate Google Account"
              >
                {/* Official 4-color Google G Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              or sign in with email
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager@corporate.com"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to SCPGMS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Login Helper */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Demo Persona Switcher
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickSwitch('admin@corporate.com')}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500 text-left transition cursor-pointer"
            >
              <div className="font-bold text-slate-200">ADMIN</div>
              <div className="text-[10px] text-slate-400">admin@corporate.com</div>
            </button>

            <button
              type="button"
              onClick={() => quickSwitch('manager@corporate.com')}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500 text-left transition cursor-pointer"
            >
              <div className="font-bold text-amber-300">MANAGER</div>
              <div className="text-[10px] text-slate-400">manager@corporate.com</div>
            </button>

            <button
              type="button"
              onClick={() => quickSwitch('alex@corporate.com')}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500 text-left transition cursor-pointer"
            >
              <div className="font-bold text-rose-300">EMPLOYEE A (Overloaded)</div>
              <div className="text-[10px] text-slate-400">alex@corporate.com</div>
            </button>

            <button
              type="button"
              onClick={() => quickSwitch('sarah@corporate.com')}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500 text-left transition cursor-pointer"
            >
              <div className="font-bold text-emerald-300">EMPLOYEE B (Available)</div>
              <div className="text-[10px] text-slate-400">sarah@corporate.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
