'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState({ Title: '', Slug: '', Plan: '' });
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFamily, setEditingFamily] = useState(false);
    const [familyName, setFamilyName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, childrenRes] = await Promise.all([
                api.get('/family/settings'),
                api.get('/children'),
            ]);
            setSettings(settingsRes.data);
            setFamilyName(settingsRes.data.Title || settingsRes.data.Name || '');
            setChildren(childrenRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFamilyName = async () => {
        try {
            await api.put('/family/settings', { title: familyName });
            toast.success('Nama keluarga berhasil disimpan! ✅');
            setEditingFamily(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        }
    };

    const copySlug = () => {
        navigator.clipboard.writeText(settings.Slug);
        toast.success('ID Keluarga berhasil disalin! 📋');
    };

    const handleLogout = () => {
        if (!confirm('Yakin ingin keluar dari aplikasi?')) return;
        logout();
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="w-24 h-24 bg-amber-200 rounded-full"></div>
                <div className="w-40 h-4 bg-amber-200 rounded-full"></div>
            </div>
        </div>
    );

    const isPremium = settings.Plan === 'PREMIUM';
    const childList = Array.isArray(children) ? children.filter((c: any) => c.Role === 'child') : [];
    const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-8">

            {/* ===== TOP BAR: small logout ===== */}
            <div className="flex justify-end">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200 transition-all"
                >
                    <i className="fas fa-sign-out-alt"></i> Keluar
                </button>
            </div>

            {/* ===== PROFILE HERO CARD ===== */}
            <div className="relative bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] rounded-[36px] p-8 pb-24 text-white shadow-[0_12px_0_#92400e] overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full"></div>

                <div className="relative flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center text-5xl font-black shadow-xl mb-4">
                        {initials}
                    </div>

                    <h1 className="text-3xl font-black tracking-tight drop-shadow-md">{user?.name || 'Pengguna'}</h1>
                    <p className="text-white/80 font-medium mt-1">{user?.email || '-'}</p>

                    {/* Badge paket */}
                    <div className={`mt-4 px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg ${isPremium ? 'bg-yellow-300 text-yellow-900' : 'bg-white/20 text-white border border-white/30'}`}>
                        <i className={`fas fa-${isPremium ? 'crown' : 'circle-half-stroke'}`}></i>
                        {isPremium ? 'Paket Berkah ⭐' : 'Paket Sabar (Gratis)'}
                    </div>
                </div>
            </div>

            {/* ===== FAMILY INFO CARD ===== */}
            <div className="bg-white rounded-[32px] p-6 border-2 border-amber-100 shadow-[0_8px_0_#d4a54a] -mt-16 relative z-10 mx-4">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-amber-900 flex items-center gap-2">
                        <i className="fas fa-house-chimney text-orange-400"></i> Keluarga
                    </h2>
                    {!editingFamily && (
                        <button onClick={() => setEditingFamily(true)} className="text-xs text-amber-500 hover:text-amber-700 font-bold flex items-center gap-1 transition">
                            <i className="fas fa-pen-to-square"></i> Edit
                        </button>
                    )}
                </div>

                {editingFamily ? (
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                            className="flex-1 p-3 border-2 border-amber-200 rounded-2xl focus:border-orange-400 focus:outline-none font-bold text-amber-900 bg-amber-50"
                            autoFocus
                        />
                        <button onClick={handleSaveFamilyName} className="px-5 py-3 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-[0_4px_0_#b45f06] active:translate-y-0.5 transition text-sm">
                            <i className="fas fa-check"></i>
                        </button>
                        <button onClick={() => { setEditingFamily(false); setFamilyName(settings.Title || ''); }} className="px-4 py-3 text-gray-400 hover:text-gray-600 transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ) : (
                    <p className="text-2xl font-black text-amber-900 mb-4">{settings.Title || settings.Name || '-'}</p>
                )}

                {/* Family ID */}
                <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-3 border border-amber-100">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">ID Keluarga</p>
                        <p className="font-mono text-sm font-bold text-amber-800 truncate">{settings.Slug || '-'}</p>
                    </div>
                    <button onClick={copySlug} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-amber-200 text-amber-500 hover:text-orange-500 hover:border-orange-300 rounded-xl transition shadow-sm active:translate-y-0.5 shrink-0">
                        <i className="fas fa-copy"></i>
                    </button>
                </div>

                {/* Children avatars */}
                {childList.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-amber-100">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Anak-anak ({childList.length})</p>
                        <div className="flex flex-wrap gap-3">
                            {childList.map((child: any) => (
                                <div key={child.ID} className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                                    <span className="text-xl">{child.AvatarIcon || '👦'}</span>
                                    <span className="font-bold text-amber-800 text-sm">{child.Name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== SUBSCRIPTION CARD ===== */}
            <div className={`rounded-[32px] p-6 border-2 shadow-[0_8px_0_#d4a54a] ${isPremium ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200' : 'bg-white border-amber-100'}`}>
                <h2 className="text-lg font-black text-amber-900 flex items-center gap-2 mb-5">
                    <i className={`fas fa-crown ${isPremium ? 'text-yellow-500' : 'text-gray-300'}`}></i> Paket Langganan
                </h2>

                <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl flex justify-center items-center shadow-md ${isPremium ? 'bg-gradient-to-br from-yellow-300 to-orange-400' : 'bg-gray-100'}`}>
                        <i className={`fas fa-crown text-2xl ${isPremium ? 'text-white' : 'text-gray-300'}`}></i>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Paket Aktif</p>
                        <p className={`text-2xl font-black ${isPremium ? 'text-orange-500' : 'text-gray-500'}`}>
                            {isPremium ? 'Berkah' : 'Sabar'}
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white/70 rounded-2xl p-4 border border-amber-100 mb-5 space-y-3">
                    {[
                        { label: isPremium ? 'Anak tidak terbatas' : 'Maksimal 2 Anak', ok: isPremium },
                        { label: isPremium ? 'Tugas tidak terbatas' : 'Maksimal 10 Tugas', ok: isPremium },
                        { label: isPremium ? 'Hadiah tidak terbatas' : 'Maksimal 5 Hadiah', ok: isPremium },
                        { label: isPremium ? 'Analitik lengkap' : 'Analitik terkunci', ok: isPremium },
                    ].map(f => (
                        <div key={f.label} className="flex items-center gap-3">
                            <i className={`fas ${f.ok ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-300'}`}></i>
                            <span className={`text-sm font-semibold ${f.ok ? 'text-amber-900' : 'text-gray-400'}`}>{f.label}</span>
                        </div>
                    ))}
                </div>

                {!isPremium && (
                    <a
                        href="https://wa.me/6282114752228?text=Assalamu%27alaikum%20Admin%2C%20saya%20ingin%20upgrade%20ke%20paket%20Berkah%20Ramadhan%20Ceria."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_6px_0_#15803d] active:translate-y-1 active:shadow-[0_2px_0_#15803d] transition text-center text-lg"
                    >
                        <i className="fab fa-whatsapp mr-2 text-xl"></i> Upgrade via WhatsApp
                    </a>
                )}
                {isPremium && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-200 text-center">
                        <p className="text-amber-700 font-semibold text-sm">
                            ✨ Anda sudah menikmati semua fitur Premium. Terima kasih!
                        </p>
                    </div>
                )}
            </div>

            {/* ===== ACCOUNT DETAILS ===== */}
            <div className="bg-white rounded-[32px] p-6 border-2 border-amber-100 shadow-[0_8px_0_#d4a54a]">
                <h2 className="text-lg font-black text-amber-900 flex items-center gap-2 mb-5">
                    <i className="fas fa-shield-halved text-orange-400"></i> Informasi Akun
                </h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 px-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Nama</p>
                            <p className="font-bold text-amber-900">{user?.name || '-'}</p>
                        </div>
                        <i className="fas fa-user text-amber-300"></i>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Email</p>
                            <p className="font-bold text-amber-900">{user?.email || '-'}</p>
                        </div>
                        <i className="fas fa-envelope text-amber-300"></i>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Peran</p>
                            <p className="font-bold text-amber-900 capitalize">{user?.role === 'parent' ? '👨 Orang Tua' : user?.role || '-'}</p>
                        </div>
                        <i className="fas fa-id-badge text-amber-300"></i>
                    </div>
                </div>
            </div>



        </div>
    );
}
