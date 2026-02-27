'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import usePlanLimits from '@/hooks/usePlanLimits';
import { toast } from 'sonner';

export default function DashboardPage() {
    const { user } = useAuth();
    const { isPremium, maxChildren } = usePlanLimits();
    const [children, setChildren] = useState<any[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.familyId) {
            localStorage.setItem('familySlug', user.familyId); // For Child Gate
        }
        fetchData();
    }, [user?.familyId]);

    const fetchData = async () => {
        try {
            const [childrenRes, redemptionsRes] = await Promise.all([
                api.get('/children'),
                api.get('/redemptions')
            ]);
            setChildren(childrenRes.data || []);
            setRedemptions(redemptionsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
        // Skip default confirm for custom modal or stick to it as fallback
        toast.promise(
            api.put(`/redemptions/${id}/status`, { status }),
            {
                loading: 'Memproses...',
                success: () => {
                    fetchData();
                    return status === 'approved' ? 'Permintaan disetujui! ✅' : 'Permintaan ditolak. ❌';
                },
                error: 'Gagal memproses permintaan'
            }
        );
    };

    const pendingRedemptions = redemptions.filter((r: any) => r.Status === 'pending');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* UPSELL COMPONENT */}
            {!isPremium && (
                <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-[30px] p-6 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-[0_8px_0_#92400e]">
                    <div>
                        <h3 className="font-black text-2xl flex items-center gap-2"><i className="fas fa-crown text-yellow-300"></i> Mode Sabar (Gratis)</h3>
                        <p className="font-semibold text-brand-100 max-w-xl mt-1">
                            Kamu sedang menggunakan versi gratis dengan batas maksimal {maxChildren} anak dan fitur Papan Peringkat terkunci.
                        </p>
                    </div>
                    <Link href="/dashboard/upgrade" className="mt-4 md:mt-0 bg-white text-brand-800 font-bold px-6 py-3 rounded-full shadow-[0_4px_0_#d97706] transition hover:-translate-y-1 hover:shadow-[0_6px_0_#d97706] active:translate-y-1 active:shadow-none whitespace-nowrap">
                        Upgrade ke Paket Berkah
                    </Link>
                </div>
            )}

            {/* HEADER */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/60 backdrop-blur-sm p-5 sm:p-6 rounded-[30px] border-4 border-white shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="hidden sm:flex h-14 w-14 bg-white rounded-full border-4 border-brand-100 items-center justify-center text-3xl shadow-[0_4px_0_#fde68a] shrink-0">
                        {user?.avatar || '🧕'}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-900 drop-shadow-sm truncate">Assalamu&apos;alaikum, {user?.name}! 👋</h2>
                        <p className="text-brand-800 font-bold mt-0.5 text-sm sm:text-base">Pantau keseruan ibadah anak hari ini.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link href="/panel" className="w-full sm:w-auto text-center btn-gemoy px-6 py-3 sm:py-2 rounded-full font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_4px_0_#9f5100] text-white whitespace-nowrap border-2 border-white">
                        <i className="fas fa-child mr-2"></i> Layar Anak
                    </Link>
                    <Link href="/kiosk" className="w-full sm:w-auto text-center px-5 py-3 sm:py-2 rounded-full font-bold text-sm bg-brand-500 shadow-[0_4px_0_#d97706] text-white whitespace-nowrap">
                        <i className="fas fa-users mr-2"></i> Dashboard Anak
                    </Link>
                </div>
            </header>

            {/* SALDO POIN */}
            <section className="mb-10">
                <h3 className="text-xl font-black text-brand-900 mb-4 flex items-center gap-2 drop-shadow-sm">
                    <i className="fas fa-star text-brand-500"></i> Poin Jagoan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {loading ? (
                        <p className="col-span-4 text-brand-800 font-bold">Mencari data jagoan...</p>
                    ) : children.length === 0 ? (
                        <div className="col-span-4 bg-white/50 border-4 border-dashed border-brand-300 rounded-[30px] p-8 text-center">
                            <p className="text-brand-800 font-bold mb-4">Belum ada anak terdaftar.</p>
                            <Link href="/dashboard/children" className="btn-gemoy px-6 py-2 inline-block rounded-full">Tambah Anak</Link>
                        </div>
                    ) : (
                        children.map(child => (
                            <div key={child.ID} className="bg-white rounded-[40px] p-6 border-4 border-white shadow-[0_15px_0_#bb6b2e] text-center hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-5xl mb-3">{child.AvatarIcon || '👦'}</div>
                                <div className="font-black text-brand-900 text-lg mb-1">{child.Name}</div>
                                <div className="text-3xl font-black text-[#1f6d3b] drop-shadow-sm">{child.PointsBalance || 0}</div>
                                <div className="text-xs font-bold text-brand-text bg-brand-100 inline-block px-3 py-1 rounded-full mt-2">Poin</div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* WIDGET BUTUH PERSETUJUAN */}
            <section className="mb-10">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xl font-black text-brand-900 flex items-center gap-2 drop-shadow-sm">
                        <i className="fas fa-bell text-red-500 animate-pulse"></i> Butuh Persetujuan
                        {pendingRedemptions.length > 0 && (
                            <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full shadow-sm">{pendingRedemptions.length}</span>
                        )}
                    </h3>
                </div>

                <div className="bg-white rounded-[40px] border-4 border-white shadow-[0_15px_0_#bb6b2e] overflow-hidden p-2">
                    {pendingRedemptions.length === 0 ? (
                        <div className="p-10 text-center font-bold text-brand-800">
                            Belum ada yang menukar poin... 🎉
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {pendingRedemptions.map((item) => (
                                <div key={item.ID} className="bg-brand-50 p-5 rounded-[30px] flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-brand-100 hover:border-brand-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl bg-white w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-4 border-brand-100 shadow-sm">
                                            {item.Reward?.Icon || '🎁'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-brand-800 mb-1">
                                                {item.Child?.Name || 'Anak'}
                                                {' '}minta ditukar:
                                            </div>
                                            <div className="font-black text-brand-900 text-lg">
                                                Minta ditukarkan: <span className="bg-[#fecb8b] px-3 py-1 rounded-full text-brand-900 border-2 border-white ml-2 drop-shadow-sm">{item.Reward?.Name}</span>
                                            </div>
                                            <div className="mt-2 text-sm font-bold text-red-500">
                                                Pengeluaran: -{item.PointsSpent} Poin
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-2 md:mt-0">
                                        <button onClick={() => handleApproval(item.ID, 'rejected')} className="flex-1 md:flex-none px-6 py-3 bg-white text-gray-500 font-black rounded-full border-2 border-gray-200 hover:bg-gray-50 shadow-[0_4px_0_#d1d5db] active:translate-y-1 active:shadow-none transition text-sm">
                                            Batalkan
                                        </button>
                                        <button onClick={() => handleApproval(item.ID, 'approved')} className="flex-1 md:flex-none px-6 py-3 bg-green-500 text-white font-black rounded-full shadow-[0_6px_0_#166534] active:translate-y-1.5 active:shadow-none transition hover:-translate-y-1 hover:shadow-[0_8px_0_#166534] text-sm flex items-center justify-center gap-2">
                                            <i className="fas fa-check"></i> Setujui
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* AKSI CEPAT DAN LAINNYA */}
            <section className="grid md:grid-cols-2 gap-6">
                <Link href="/dashboard/tasks" className="card-gemoy p-6 flex items-center justify-center gap-4 text-center group">
                    <div className="bg-[#fef3c7] text-[#d97706] w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                        <i className="fas fa-magic"></i>
                    </div>
                    <span className="font-black text-brand-900 text-lg">Buat Misi dari Template</span>
                </Link>
                <Link href="/dashboard/rewards" className="card-gemoy p-6 flex items-center justify-center gap-4 text-center group">
                    <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                        <i className="fas fa-gift"></i>
                    </div>
                    <span className="font-black text-brand-900 text-lg">Tambah Hadiah Baru</span>
                </Link>
            </section>
        </div>
    );
}
