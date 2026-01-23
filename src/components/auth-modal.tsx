'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, signup } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkEmail, setCheckEmail] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            let result;
            if (isLogin) {
                result = await login(formData);
            } else {
                result = await signup(formData);
            }

            if (result?.error) {
                setError(result.error);
            } else {
                if (!isLogin) {
                    setCheckEmail(true);
                } else {
                    if (onSuccess) onSuccess();
                    onClose();
                }
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
            // No need to onClose here as it redirects
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-border/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-2">
                            <h3 className="text-xl font-light tracking-tight text-foreground flex items-center gap-2 font-serif">
                                Dropdawn
                            </h3>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="px-6 pb-6 pt-2">
                            <p className="text-sm text-muted-foreground mb-8 font-light">
                                {isLogin ? 'Sign in to sync your conversations.' : 'Create an account to get started.'}
                            </p>

                            {checkEmail ? (
                                <div className="text-center space-y-6 py-8">
                                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-inner">
                                        <Mail className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-medium text-foreground">Check your inbox</h4>
                                        <p className="text-sm text-muted-foreground">
                                            We've sent you a confirmation link. <br />
                                            Please verify your account to continue.
                                        </p>
                                    </div>
                                    <Button onClick={onClose} variant="secondary" className="w-full">
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6 space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 relative gap-3 font-medium bg-background hover:bg-muted text-foreground border-border/40 rounded-xl transition-all shadow-sm"
                                            onClick={handleGoogleLogin}
                                            disabled={loading}
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path
                                                    fill="currentColor"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                            Continue with Google
                                        </Button>

                                        <div className="relative py-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-border/40" />
                                            </div>
                                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                                <span className="bg-background px-2 text-muted-foreground/50">Or use email</span>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Full Name (Sign Up only) */}
                                        <AnimatePresence initial={false}>
                                            {!isLogin && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="space-y-1.5 mb-4">
                                                        <label className="text-xs font-medium text-muted-foreground ml-1">Full Name</label>
                                                        <div className="relative group">
                                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                                                            <Input
                                                                name="fullName"
                                                                placeholder="John Doe"
                                                                className="pl-10 h-10 bg-secondary/50 border-border/40 focus:bg-background focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 rounded-xl transition-all"
                                                                required={!isLogin}
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground ml-1">Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    className="pl-10 h-10 bg-secondary/50 border-border/40 focus:bg-background focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 rounded-xl transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground ml-1">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                                                <Input
                                                    name="password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10 h-10 bg-secondary/50 border-border/40 focus:bg-background focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 rounded-xl transition-all"
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-xs font-medium">
                                                <AlertCircle className="w-4 h-4" />
                                                {error}
                                            </div>
                                        )}

                                        <Button type="submit" className="w-full h-11 font-medium tracking-wide rounded-xl mt-2" disabled={loading}>
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : null}
                                            {isLogin ? 'Sign In' : 'Sign Up'}
                                        </Button>
                                    </form>

                                    <div className="mt-8 text-center bg-muted/30 -mx-6 -mb-6 p-4 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground">
                                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                                            <button
                                                onClick={() => {
                                                    setIsLogin(!isLogin);
                                                    setError(null);
                                                }}
                                                className="text-foreground hover:underline font-medium transition-all"
                                            >
                                                {isLogin ? 'Sign Up' : 'Log In'}
                                            </button>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
