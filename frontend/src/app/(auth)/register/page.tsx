'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useGuestGuard } from '@/hooks/useRoleGuard';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function RegisterPage() {
    const [step, setStep] = useState(1); // 1: name+family, 2: email+password
    const [name, setName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { loading: guardLoading, isGuest } = useGuestGuard();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (!name.trim() || !familyName.trim()) {
                toast.error('Nama dan nama keluarga harus diisi', {
                    description: 'Silakan lengkapi semua field untuk melanjutkan 📝',
                    icon: '⚠️',
                });
                return;
            }
            setError('');
            setStep(2);
            toast.info('Satu langkah lagi! 🎯', {
                description: 'Masukkan email dan password untuk menyelesaikan pendaftaran',
                icon: '✨',
            });
            return;
        }

        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', { email, password, name, familyName });

            // SweetAlert2 celebration!
            await Swal.fire({
                title: '🎉 Alhamdulillah!',
                html: `
                    <div style="text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 12px;" class="celebrate-icon">🌙</div>
                        <p style="font-size: 16px; color: #5a3e2b; font-weight: 600; margin-bottom: 8px;">
                            Selamat datang di <strong>Ramadhan Ceria</strong>, ${name}!
                        </p>
                        <p style="font-size: 14px; color: #a0764a;">
                            Keluarga <strong>${familyName}</strong> siap memulai perjalanan ibadah yang seru! 🚀
                        </p>
                    </div>
                `,
                confirmButtonText: 'Masuk Sekarang →',
                customClass: {
                    popup: 'ramadhan-swal',
                },
                showClass: {
                    popup: 'animate__animated animate__bounceIn',
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp',
                },
                timer: 6000,
                timerProgressBar: true,
            });

            router.push('/login');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.';
            toast.error(errorMsg, {
                description: 'Periksa kembali data yang diinput dan coba lagi 🔄',
                icon: '😔',
                duration: 5000,
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
            <div className="absolute top-[8%] right-[10%] text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>🌟</div>
            <div className="absolute top-[18%] left-[8%] text-5xl opacity-15 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>🕌</div>
            <div className="absolute bottom-[15%] right-[15%] text-4xl opacity-15 animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}>📿</div>
            <div className="absolute bottom-[8%] left-[10%] text-7xl opacity-10 animate-pulse" style={{ animationDuration: '3s' }}>🌙</div>

            {/* Gradient orbs */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-orange-300/30 to-amber-200/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-br from-yellow-300/25 to-orange-200/15 rounded-full blur-3xl"></div>

            <div className="w-full max-w-[420px] relative z-10">

                {/* Logo & branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 8px 0 #92400e, 0 12px 30px rgba(245,158,11,0.4)',
                            border: '4px solid rgba(255,255,255,0.6)',
                        }}>
                        <span className="text-4xl">👨‍👩‍👧‍👦</span>
                    </div>
                    <h1 className="text-3xl font-[900] tracking-tight" style={{
                        background: 'linear-gradient(135deg, #92400e, #b45309)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Buat Akun Keluarga</h1>
                    <p className="text-[#a0764a] font-semibold text-sm mt-1">Gratis • Langsung bisa dipakai</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${step >= 1 ? 'bg-[#f59e0b] text-white shadow-md' : 'bg-white/50 text-[#c9a87a]'}`}>
                        <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-black">1</span>
                        Kenalan
                    </div>
                    <div className="w-6 h-0.5 bg-[#edd5aa] rounded-full"></div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${step >= 2 ? 'bg-[#f59e0b] text-white shadow-md' : 'bg-white/50 text-[#c9a87a]'}`}>
                        <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-black">2</span>
                        Akun
                    </div>
                </div>

                {/* Register card */}
                <div style={{
                    background: 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '40px',
                    border: '3px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 20px 0 #c4873c, 0 24px 50px rgba(180,95,6,0.15)',
                    padding: '36px 28px',
                }}>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {step === 1 && (
                            <>
                                {/* Name */}
                                <div>
                                    <label className="block font-[800] text-[#6b3f00] text-sm mb-2 pl-1">Nama Ayah / Bunda</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#c4873c] group-focus-within:text-[#b45f06] transition">
                                            <i className="fas fa-user"></i>
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nama lengkap"
                                            className="w-full py-3.5 pl-12 pr-4 font-bold text-[#5e3200] placeholder-[#c9a87a] border-[3px] border-[#edd5aa] rounded-2xl bg-[#fef9ee] focus:outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,158,11,0.15)] transition-all"
                                            required
                                            disabled={loading}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Family name */}
                                <div>
                                    <label className="block font-[800] text-[#6b3f00] text-sm mb-2 pl-1">Nama Keluarga</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#c4873c] group-focus-within:text-[#b45f06] transition">
                                            <i className="fas fa-house-chimney"></i>
                                        </div>
                                        <input
                                            type="text"
                                            value={familyName}
                                            onChange={(e) => setFamilyName(e.target.value)}
                                            placeholder="Contoh: Keluarga Budi"
                                            className="w-full py-3.5 pl-12 pr-4 font-bold text-[#5e3200] placeholder-[#c9a87a] border-[3px] border-[#edd5aa] rounded-2xl bg-[#fef9ee] focus:outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,158,11,0.15)] transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Next button */}
                                <div className="pt-3">
                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-2xl font-[900] text-lg text-white flex items-center justify-center gap-3 transition-all active:translate-y-1 active:shadow-none hover:-translate-y-0.5"
                                        style={{
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            border: '3px solid rgba(255,255,255,0.5)',
                                            boxShadow: '0 6px 0 #92400e, 0 8px 20px rgba(180,95,6,0.3)',
                                        }}
                                    >
                                        Lanjut <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                {/* Summary */}
                                <div className="flex items-center gap-3 bg-[#fef9ee] rounded-2xl p-3 border-2 border-[#edd5aa]">
                                    <div className="w-10 h-10 rounded-full bg-[#f59e0b] flex items-center justify-center text-white font-black text-sm">
                                        {name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-[800] text-[#6b3f00] text-sm">{name}</p>
                                        <p className="text-[#a0764a] text-xs font-semibold">{familyName}</p>
                                    </div>
                                    <button type="button" onClick={() => setStep(1)} className="ml-auto text-[#c9a87a] hover:text-[#b45f06] transition">
                                        <i className="fas fa-pen text-xs"></i>
                                    </button>
                                </div>

                                {/* Email */}
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
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Password */}
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
                                            placeholder="Minimal 8 karakter"
                                            className="w-full py-3.5 pl-12 pr-12 font-bold text-[#5e3200] placeholder-[#c9a87a] border-[3px] border-[#edd5aa] rounded-2xl bg-[#fef9ee] focus:outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,158,11,0.15)] transition-all"
                                            required
                                            disabled={loading}
                                            minLength={8}
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

                                {/* Free plan info */}
                                <div className="flex items-start gap-2.5 bg-green-50 rounded-2xl p-3 border-2 border-green-200">
                                    <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <div>
                                        <p className="font-[800] text-green-800 text-xs">Paket Sabar (Gratis)</p>
                                        <p className="text-green-600 text-[11px] font-semibold mt-0.5">2 anak, 10 tugas, 5 hadiah. Upgrade kapan saja.</p>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-1">
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
                                            <>Daftar Sekarang <i className="fas fa-rocket"></i></>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-[2px] bg-[#edd5aa]/60 rounded-full"></div>
                        <span className="text-[#c9a87a] text-xs font-bold">atau</span>
                        <div className="flex-1 h-[2px] bg-[#edd5aa]/60 rounded-full"></div>
                    </div>

                    {/* Google Auth button */}
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
                        Daftar dengan Google
                    </button>

                    {/* Login link */}
                    <div className="mt-6 text-center">
                        <p className="text-[#a0764a] font-semibold text-sm">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-[#b45309] font-[800] hover:text-[#92400e] transition border-b-2 border-[#b45309]/30 hover:border-[#92400e]">
                                Masuk
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[#b8854a] font-semibold text-xs mt-6 opacity-60">
                    ✨ Menjadikan ibadah anak lebih seru & bermakna ✨
                </p>
            </div>
        </div>
    );
}
