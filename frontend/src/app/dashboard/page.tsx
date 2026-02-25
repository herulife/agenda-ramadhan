'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();
    const [children, setChildren] = useState<any[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

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
        if (!confirm(`Yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} permintaan ini?`)) return;
        try {
            await api.put(`/redemptions/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert('Gagal memproses permintaan klaim');
        }
    };

    const pendingRedemptions = redemptions.filter(r => r.Status === 'pending');

    return (
        <>
            {/* HEADER */}
            <header className="flex justify-between items-center mb-8 mt-2 md:mt-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Selamat datang, {user?.name}! 👋</h2>
                    <p className="text-gray-500 font-medium mt-1">Pantau keseruan anak hari ini.</p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full border-2 border-[#fef3c7] flex items-center justify-center text-xl shadow-sm">
                    {user?.avatar || '🧕'}
                </div>
            </header>

            {/* SALDO POIN - Overview Cards */}
            <section className="mb-8">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="fas fa-wallet text-[#f59e0b]"></i> Saldo Poin Saat Ini
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {loading ? (
                        <p className="col-span-4 text-gray-500 font-medium">Memuat data...</p>
                    ) : children.length === 0 ? (
                        <p className="col-span-4 text-gray-500 font-medium">Belum ada anak. <Link href="/dashboard/children" className="text-[#d97706] underline">Tambah anak</Link></p>
                    ) : (
                        children.map(child => (
                            <div key={child.ID} className="bg-white rounded-3xl p-4 border-2 border-[#fef3c7] shadow-[0_4px_0_#fef3c7] text-center">
                                <div className="text-3xl mb-1">{child.Avatar || (child.gender === 'male' ? '👦' : '🧕')}</div>
                                <div className="font-bold text-gray-800">{child.Name}</div>
                                <div className="text-2xl font-black text-[#d97706] mt-1">{child.Points || 0}</div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* BUTUH PERSETUJUAN */}
            <section className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                        <i className="fas fa-bell text-red-500"></i> Butuh Persetujuan
                        {pendingRedemptions.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRedemptions.length}</span>
                        )}
                    </h3>
                </div>

                <div className="bg-white rounded-3xl border-2 border-[#fef3c7] shadow-[0_8px_0_#fef3c7] overflow-hidden">
                    {pendingRedemptions.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 font-medium">
                            Tidak ada permintaan yang menunggu persetujuan saat ini. 🎉
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pendingRedemptions.map((item, index) => {
                                const isReward = true;
                                const badgeColor = isReward ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';
                                return (
                                    <div key={item.ID} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition">
                                        <div className="flex items-start gap-3 md:gap-4">
                                            <div className="text-3xl bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-gray-200">
                                                {item.Reward?.Icon || '🎁'}
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 mb-0.5">
                                                    <span className="font-bold text-gray-700">{item.Child?.Name || 'Anak'}</span>
                                                </div>
                                                <div className="font-medium text-gray-800 text-sm md:text-base">
                                                    Minta ditukarkan hadiah: <span className={`font-bold inline-block px-2 py-0.5 rounded-md ${badgeColor} ml-1`}>{item.Reward?.Name}</span>
                                                </div>
                                                <div className="mt-1 text-xs md:text-sm">
                                                    Perubahan: <span className="text-red-500 font-bold">-{item.Reward?.PointsRequired || 0} Poin</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                            <button onClick={() => handleApproval(item.ID, 'rejected')} className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition text-sm">
                                                Batalkan
                                            </button>
                                            <button onClick={() => handleApproval(item.ID, 'approved')} className="flex-1 md:flex-none px-4 py-2 bg-[#f59e0b] text-white font-bold rounded-xl shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-[0_0px_0_#d97706] transition text-sm">
                                                Setujui
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* AKSI CEPAT */}
            <section>
                <h3 className="text-lg font-bold text-gray-700 mb-4">Aksi Cepat</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/dashboard/tasks" className="bg-white border-2 border-[#fef3c7] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#fffbeb] transition shadow-sm">
                        <div className="bg-[#fef3c7] text-[#d97706] w-12 h-12 rounded-full flex items-center justify-center text-xl">
                            <i className="fas fa-magic"></i>
                        </div>
                        <span className="font-bold text-gray-700 text-sm">Gunakan Template Misi</span>
                    </Link>
                    <Link href="/dashboard/rewards" className="bg-white border-2 border-[#fef3c7] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#fffbeb] transition shadow-sm">
                        <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                            <i className="fas fa-plus"></i>
                        </div>
                        <span className="font-bold text-gray-700 text-sm">Tambah Hadiah Baru</span>
                    </Link>
                </div>
            </section>
        </>
    );
}
