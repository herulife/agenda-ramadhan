'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface ChildProfile {
    id: string;
    name: string;
    avatar: string;
}

export default function PilihJagoan() {
    const router = useRouter();
    const [children, setChildren] = useState<ChildProfile[]>([]);
    const [familyTitle, setFamilyTitle] = useState('Keluarga');
    const [loading, setLoading] = useState(true);

    // PIN Modal State
    const [showPinModal, setShowPinModal] = useState(false);
    const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
    const [currentPin, setCurrentPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Determine family slug from query param or localStorage
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('family') || localStorage.getItem('family_slug');

        if (!slug) {
            router.push('/login');
            return;
        }

        // Always ensure the most recently used slug is in localStorage
        localStorage.setItem('family_slug', slug);

        fetchChildren(slug);
    }, [router]);

    const fetchChildren = async (slug: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
            const res = await axios.get(`${apiUrl}/api/auth/family/${slug}/children`);
            setChildren(res.data.children);
            setFamilyTitle(res.data.familyTitle);
        } catch (err: any) {
            console.error('Failed to fetch children', err);
            // Fallback or back to login
            if (err.response?.status === 404) {
                alert('Data keluarga tidak ditemukan.');
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const openPinModal = (child: ChildProfile) => {
        setSelectedChild(child);
        setCurrentPin('');
        setPinError('');
        setShowPinModal(true);
    };

    const closePinModal = () => {
        setShowPinModal(false);
        setTimeout(() => {
            setSelectedChild(null);
            setCurrentPin('');
            setPinError('');
        }, 300);
    };

    const enterPin = (num: number) => {
        if (currentPin.length < 4 && !isSubmitting) {
            const newPin = currentPin + num;
            setCurrentPin(newPin);
            setPinError('');

            if (newPin.length === 4) {
                submitPin(newPin);
            }
        }
    };

    const deletePin = () => {
        if (currentPin.length > 0 && !isSubmitting) {
            setCurrentPin(currentPin.slice(0, -1));
            setPinError('');
        }
    };

    const submitPin = async (pin: string) => {
        if (!selectedChild) return;

        setIsSubmitting(true);
        setPinError('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
            const res = await axios.post(`${apiUrl}/api/auth/login-child`, {
                childId: selectedChild.id,
                pin: pin
            });

            // Save auth data
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);

            // Redirect to child dashboard
            router.push('/panel-anak');

        } catch (err: any) {
            console.error('Login failed', err);
            setPinError('PIN salah, coba lagi ya!');
            setCurrentPin('');
            setIsSubmitting(false);
        }
    };

    // Helper for profile colors based on index
    const getThemeColors = (index: number) => {
        const themes = [
            { color: 'bg-pink-100', border: 'border-pink-300' },
            { color: 'bg-purple-100', border: 'border-purple-300' },
            { color: 'bg-blue-100', border: 'border-blue-300' },
            { color: 'bg-emerald-100', border: 'border-emerald-300' },
            { color: 'bg-orange-100', border: 'border-orange-300' }
        ];
        return themes[index % themes.length];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg1">
                <div className="animate-spin text-brand-shadow text-4xl"><i className="fas fa-circle-notch"></i></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans select-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)' }}>

            {/* Background Decorations */}
            <i className="fas fa-star absolute top-12 left-12 text-white/50 text-5xl animate-float"></i>
            <i className="fas fa-moon absolute bottom-20 right-16 text-white/40 text-7xl animate-pulse-slow"></i>
            <i className="fas fa-cloud absolute top-32 right-20 text-white/30 text-6xl animate-float" style={{ animationDelay: '2s' }}></i>

            {/* Main Profile Selector */}
            <main
                className={`w-full max-w-5xl px-4 z-10 text-center transition-all duration-500 ${showPinModal ? 'scale-90 blur-[5px] opacity-30 pointer-events-none' : 'scale-100 blur-0 opacity-100'}`}
            >
                <h1 className="text-4xl md:text-5xl font-black text-brand-900 mb-2 drop-shadow-md">
                    Waktunya Isi Agenda Ramadhan! 🌙
                </h1>
                <p className="text-xl font-bold text-brand-800 mb-12 drop-shadow-sm opacity-80">
                    {familyTitle}
                </p>

                <div className="flex flex-wrap justify-center gap-6 md:gap-14">
                    {children.length === 0 ? (
                        <div className="p-8 bg-white/50 backdrop-blur border-4 border-white rounded-3xl text-brand-900 font-bold max-w-md">
                            <p>Belum ada profil anak yang ditambahkan.</p>
                            <p className="text-sm font-medium mt-2">Minta Ayah/Ibu buatkan profil dari Panel Orang Tua ya!</p>
                        </div>
                    ) : (
                        children.map((child, index) => {
                            const theme = getThemeColors(index);
                            return (
                                <div
                                    key={child.id}
                                    className="profile-card cursor-pointer flex flex-col items-center w-32 md:w-44 group"
                                    onClick={() => openPinModal(child)}
                                >
                                    <div className={`avatar-ring w-32 h-32 md:w-44 md:h-44 rounded-full border-4 ${theme.border} ${theme.color} flex items-center justify-center text-7xl md:text-8xl shadow-lg mb-4 transition-all duration-300 group-hover:border-white group-hover:shadow-[0_20px_25px_-5px_rgba(217,119,6,0.5),0_10px_10px_-5px_rgba(217,119,6,0.2)]`}>
                                        {child.avatar || '👦'}
                                    </div>
                                    <h3 className="name-tag text-2xl md:text-3xl font-bold text-brand-900 transition-colors group-hover:text-white group-hover:drop-shadow-md">{child.name}</h3>
                                </div>
                            );
                        })
                    )}
                </div>

                <button
                    onClick={() => router.push('/login')}
                    className="mt-20 px-6 py-3 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-brand-900 font-bold rounded-full transition-all shadow-sm flex items-center justify-center mx-auto"
                >
                    <i className="fas fa-arrow-left mr-2"></i> Kembali ke Menu Orang Tua
                </button>
            </main>

            {/* PIN Modal Overlay */}
            <div
                className={`fixed inset-0 bg-brand-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${showPinModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <button
                    onClick={closePinModal}
                    className="absolute top-8 right-8 text-white/70 hover:text-white text-5xl transition-transform hover:rotate-90"
                >
                    <i className="fas fa-times-circle"></i>
                </button>

                {selectedChild && (
                    <>
                        <div className="text-center mb-6">
                            <div className="text-7xl bg-white w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 border-brand-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] mb-4">
                                {selectedChild.avatar || '👦'}
                            </div>
                            <h2 className="text-3xl font-black text-white drop-shadow-md">Masukkan PIN {selectedChild.name}</h2>
                            {pinError ? (
                                <p className="text-red-300 font-bold mt-2 animate-bounce">{pinError}</p>
                            ) : (
                                <p className="text-brand-100 font-medium mt-2">Tanya Ayah/Ibu kalau lupa ya!</p>
                            )}
                        </div>

                        <div className="flex gap-4 mb-8">
                            {[1, 2, 3, 4].map((dot) => (
                                <div
                                    key={dot}
                                    className={`w-6 h-6 rounded-full border-4 border-brand-400 transition-colors duration-200 ${currentPin.length >= dot ? 'bg-brand-400' : 'bg-transparent'}`}
                                ></div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 md:gap-5 w-72 md:w-80">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    className="pin-btn bg-white border-b-4 border-gray-200 text-3xl font-black text-brand-800 w-full aspect-square rounded-3xl"
                                    onClick={() => enterPin(num)}
                                    disabled={isSubmitting}
                                >
                                    {num}
                                </button>
                            ))}
                            <div aria-hidden="true"></div>
                            <button
                                className="pin-btn bg-white border-b-4 border-gray-200 text-3xl font-black text-brand-800 w-full aspect-square rounded-3xl"
                                onClick={() => enterPin(0)}
                                disabled={isSubmitting}
                            >
                                0
                            </button>
                            <button
                                className="pin-btn bg-red-50 border-b-4 border-red-200 text-2xl text-red-500 w-full aspect-square rounded-3xl flex items-center justify-center"
                                onClick={deletePin}
                                disabled={isSubmitting}
                            >
                                <i className="fas fa-backspace"></i>
                            </button>
                        </div>

                        {isSubmitting && (
                            <div className="mt-8 text-white flex items-center gap-3 font-bold">
                                <i className="fas fa-circle-notch fa-spin text-xl"></i> Mengecek PIN...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
