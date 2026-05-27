import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/UI';
import { Mail, Lock, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function WelcomePage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Google sign-in failed.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingEmail(true);
    try {
      await signInWithEmail(email, password);
    } catch (e: any) {
      setError(e?.message || 'Email sign-in failed.');
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-between px-8 py-14 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50" />
        {/* Animated orbs */}
        <motion.div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)' }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
          animate={{
            x: [0, -25, 15, 0],
            y: [0, 15, -25, 0],
            scale: [1, 0.85, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-300/40">
            <img src="/logo.png" alt="WortHain" className="w-full h-full object-cover" />
          </div>
          {/* Glow ring */}
          <motion.div
            className="absolute -inset-2 rounded-[3rem] border-2 border-blue-300/30"
            animate={{ opacity: [0, 0.6, 0], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-5xl font-black tracking-tight leading-tight"
          >
            <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Wort
            </span>
            <span className="text-slate-800">Hain</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-slate-400 font-medium tracking-wide mx-auto"
          >
            Precision German learning.
            <br />
            Built for the modern mind.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-4 text-left"
        >
          <Button
            onClick={handleGoogleSignIn}
            size="lg"
            className="w-full bg-white text-slate-900 border border-slate-100 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all"
            disabled={loadingGoogle}
          >
            <Chrome size={18} className="mr-2" />
            {loadingGoogle ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-14 bg-white shadow-sm border-blue-100/60 rounded-2xl focus:border-blue-300 focus:ring-blue-200"
                required
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-14 bg-white shadow-sm border-blue-100/60 rounded-2xl focus:border-blue-300 focus:ring-blue-200"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:via-blue-700 hover:to-indigo-700 border-none text-white shadow-lg shadow-blue-300/30 transition-all"
              disabled={loadingEmail}
            >
              {loadingEmail ? 'Signing in...' : 'Sign in with Email'}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-rose-500 font-medium px-1">
              {error}
            </p>
          )}

          <div className="pt-2">
            <Link to="/create-account">
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-xs tracking-ultra bg-blue-50/60 text-blue-600 hover:bg-blue-100/60 border-blue-100/50"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}