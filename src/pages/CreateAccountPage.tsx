import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/UI';
import { Mail, Lock, Chrome, ChevronLeft, User } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function CreateAccountPage() {
    const { signUpWithGoogle, signUpWithEmail } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignUp = async () => {
        setError(null);
        setLoadingGoogle(true);
        try {
            await signUpWithGoogle();
        } catch (e: any) {
            setError(e?.message || 'Google sign-up failed.');
        } finally {
            setLoadingGoogle(false);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Please enter your name.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoadingEmail(true);
        try {
            await signUpWithEmail(email, password, name.trim());
        } catch (e: any) {
            setError(e?.message || 'Email sign-up failed.');
        } finally {
            setLoadingEmail(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-between px-8 py-14 overflow-hidden">
            {/* Background orbs */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50" />
                <motion.div className="absolute -top-32 -right-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)' }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} />
                <motion.div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} animate={{ scale: [1, 0.85, 1] }} transition={{ duration: 10, repeat: Infinity }} />
            </div>

            <div className="w-full max-w-sm">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium mb-8 hover:text-blue-600 transition-colors"
                >
                    <ChevronLeft size={18} />
                    Back
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 w-full max-w-sm">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 rounded-[2.25rem] overflow-hidden shadow-2xl shadow-blue-300/40"
                >
                    <img src="/logo.png" alt="WortHain" className="w-full h-full object-cover" />
                </motion.div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        Create Account
                    </h1>
                    <p className="text-slate-400 font-medium tracking-wide">
                        Start syncing your vocabulary across devices.
                    </p>
                </div>

                <div className="w-full space-y-4 text-left">
                    <Button
                        onClick={handleGoogleSignUp}
                        size="lg"
                        className="w-full bg-white text-slate-900 border border-slate-100 shadow-sm hover:bg-slate-50"
                        disabled={loadingGoogle}
                    >
                        <Chrome size={18} className="mr-2" />
                        {loadingGoogle ? 'Creating...' : 'Continue with Google'}
                    </Button>

                    <form onSubmit={handleEmailSignUp} className="space-y-3">
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
                            <Input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-11 h-14 bg-white shadow-sm border-blue-100/60 rounded-2xl"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-11 h-14 bg-white shadow-sm border-blue-100/60 rounded-2xl"
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
                                className="pl-11 h-14 bg-white shadow-sm border-blue-100/60 rounded-2xl"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-11 h-14 bg-white shadow-sm border-blue-100/60 rounded-2xl"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:via-blue-700 hover:to-indigo-700 border-none text-white shadow-lg shadow-blue-300/30"
                            disabled={loadingEmail}
                        >
                            {loadingEmail ? 'Creating...' : 'Create with Email'}
                        </Button>
                    </form>

                    {error && (
                        <p className="text-sm text-rose-500 font-medium px-1">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}