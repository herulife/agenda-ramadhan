'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGuestGuard } from '@/hooks/useRoleGuard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const { loading: guardLoading, isGuest } = useGuestGuard();

    useEffect(() => {
        // Check if we just came back from Google OAuth via callback redirect
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            // Save token and try to get user info to hydrate context
            localStorage.setItem('token', token);
            document.cookie = `auth_token=${token}; Path=/; Max-Age=86400; SameSite=Lax`;

            // Wait a tick for cookies/storage, then redirect
            setTimeout(() => {
                toast.success('Berhasil masuk dengan Google! ✨');
                window.location.href = '/dashboard';
            }, 500);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Assalamualaikum! Selamat datang kembali 🌙', {
                description: 'Mengarahkan ke dashboard...',
                icon: '✨',
            });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Login gagal. Periksa email dan password.';
            toast.error(errorMsg, {
                description: 'Pastikan email dan password Anda benar 🔑',
                icon: '😅',
            });
        } finally {
            setLoading(false);
        }
    };

    if (guardLoading || !isGuest) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #fef6e4 0%, #fce8c8 40%, #f9d9a8 100%)' }}>

            {/* Decorative floating elements */}
            <div className="absolute top-[10%] left-[8%] text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>⭐</div>
            <div className="absolute top-[15%] right-[12%] text-5xl opacity-15 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>🌙</div>
            <div className="absolute bottom-[20%] left-[15%] text-4xl opacity-15 animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}>✨</div>
            <div className="absolute bottom-[10%] right-[8%] text-7xl opacity-10 animate-pulse" style={{ animationDuration: '3s' }}>🕌</div>

            {/* Gradient orbs */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-orange-300/30 to-amber-200/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-br from-yellow-300/25 to-orange-200/15 rounded-full blur-3xl"></div>

            <div className="w-full max-w-[420px] relative z-10">

                {/* Logo & branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 8px 0 #92400e, 0 12px 30px rgba(245,158,11,0.4)',
                            border: '4px solid rgba(255,255,255,0.6)',
                        }}>
                        <span className="text-4xl">🌙</span>
                    </div>
                    <h1 className="text-3xl font-[900] tracking-tight" style={{
                        background: 'linear-gradient(135deg, #92400e, #b45309)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Ramadhan Ceria</h1>
                    <p className="text-[#a0764a] font-semibold text-sm mt-1">Kelola ibadah & kebaikan si kecil</p>
                </div>

                {/* Login card */}
                <div style={{
                    background: 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '40px',
                    border: '3px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 20px 0 #c4873c, 0 24px 50px rgba(180,95,6,0.15)',
                    padding: '36px 28px',
                }}>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-500 font-bold p-3.5 rounded-2xl text-sm border-2 border-red-200">
                                <i className="fas fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}

                        {/* Email field */}
                        <div>
                            <label className="block font-[800] text-[#6b3f00] text-sm mb-2 pl-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#c4873c] group-focus-within:text-[#b45f06] transition">
                                    <i className="fas fa-envelope"></i>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ayah@email.com"
                                    className="w-full py-3.5 pl-12 pr-4 font-bold text-[#5e3200] placeholder-[#c9a87a] border-[3px] border-[#edd5aa] rounded-2xl bg-[#fef9ee] focus:outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,158,11,0.15)] transition-all"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block font-[800] text-[#6b3f00] text-sm mb-2 pl-1">Kata Sandi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#c4873c] group-focus-within:text-[#b45f06] transition">
                                    <i className="fas fa-lock"></i>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full py-3.5 pl-12 pr-12 font-bold text-[#5e3200] placeholder-[#c9a87a] border-[3px] border-[#edd5aa] rounded-2xl bg-[#fef9ee] focus:outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,158,11,0.15)] transition-all"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#c9a87a] hover:text-[#b45f06] transition"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-[900] text-lg text-white flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none hover:-translate-y-0.5"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    border: '3px solid rgba(255,255,255,0.5)',
                                    boxShadow: '0 6px 0 #92400e, 0 8px 20px rgba(180,95,6,0.3)',
                                }}
                            >
                                {loading ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Memproses...</>
                                ) : (
                                    <>Masuk <i className="fas fa-arrow-right"></i></>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Google Auth button */}
                    <div className="mt-4">
                        <div className="relative flex items-center mb-4">
                            <div className="flex-grow border-t border-[#edd5aa]"></div>
                            <span className="flex-shrink-0 mx-4 text-[#a0764a] font-semibold text-xs uppercase tracking-widest">Atau masuk dengan</span>
                            <div className="flex-grow border-t border-[#edd5aa]"></div>
                        </div>

                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm border-[3px] border-[#edd5aa] bg-white hover:bg-[#fef9ee] transition-all hover:shadow-md active:translate-y-0.5 text-[#5e3200]"
                            onClick={() => window.location.href = 'http://localhost:3005/api/auth/google'}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Masuk dengan Google
                        </button>
                    </div>

                    {/* Register link */}
                    <div className="mt-7 text-center">
                        <p className="text-[#a0764a] font-semibold text-sm">
                            Belum punya akun?{' '}
                            <Link href="/register" className="text-[#b45309] font-[800] hover:text-[#92400e] transition border-b-2 border-[#b45309]/30 hover:border-[#92400e]">
                                Daftar Gratis
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer tagline */}
                <p className="text-center text-[#b8854a] font-semibold text-xs mt-6 opacity-60">
                    ✨ Menjadikan ibadah anak lebih seru & bermakna ✨
                </p>
            </div>
        </div>
    );
}
