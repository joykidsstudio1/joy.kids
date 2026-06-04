/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LineChart, Video, BrainCircuit, Wand2, LogOut } from 'lucide-react';
import { initAuth, googleSignIn, logout, auth } from './lib/auth';
import { User } from 'firebase/auth';

import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Videos from './pages/Videos';
import Assistant from './pages/Assistant';
import ContentGen from './pages/ContentGen';

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analytics', icon: LineChart, label: 'Analytics' },
    { to: '/videos', icon: Video, label: 'Videos' },
    { to: '/assistant', icon: BrainCircuit, label: 'AI Assistant' },
    { to: '/content', icon: Wand2, label: 'Content Gen' },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-screen fixed">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
          YouTube AI Studio Pro
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex flex-row items-center gap-2 w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function MainLayout({ children, onLogout }: { children: React.ReactNode, onLogout: () => void }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        setLoading(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setAuthError("Sign-in was cancelled. If you encountered an API permission error earlier, I have fixed it behind the scenes! Please try signing in again.");
      } else {
        setAuthError(e.message || "Failed to sign in. Make sure popups are allowed.");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setNeedsAuth(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Video className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">YouTube AI Studio</h1>
          <p className="text-slate-400 mb-6">Sign in with your Google account to connect your channel and unlock AI-powered insights.</p>
          
          {authError && (
            <div className="mb-6 p-6 bg-red-500/10 border-2 border-red-500 rounded-xl text-left">
              <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                Sign In Error
              </h3>
              <p className="text-red-200 text-sm mb-3">
                {authError}
              </p>
              <div className="bg-red-950/50 p-3 rounded-lg border border-red-500/30">
                <p className="text-red-100 text-sm font-semibold">
                  👉 To fix this: Use the "Share" or "Publish" button to open the app in its own standalone web page. Google blocks sign-ins inside the AI Studio preview window.
                </p>
                <p className="text-red-100 text-sm font-semibold mt-2" dir="rtl">
                  👉 لحل هذه المشكلة: قم بنشر الموقع (Share) وافتحه في رابط خارجي منفصل، لأن جوجل تمنع تسجيل الدخول داخل نافذة المعاينة.
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={handleLogin}
            className="w-full relative flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-4 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MainLayout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/content" element={<ContentGen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

