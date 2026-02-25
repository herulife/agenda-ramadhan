'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import api from '@/lib/api';

export default function SuperAdminPage() {
    const { logout } = useAuth();
    const { user, loading, isAuthorized } = useRoleGuard(['super_admin']);
    const [families, setFamilies] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ringkasan');

    useEffect(() => {
        if (loading || !isAuthorized) return;
        fetchFamilies();
    }, [loading, isAuthorized]);

    const fetchFamilies = async () => {
        try {
            const res = await api.get('/admin/families');
            setFamilies(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setDataLoading(false);
        }
    };

    const updatePlan = async (familyId: string, newPlan: string) => {
        try {
            await api.put(`/admin/family/${familyId}/plan`, { plan: newPlan });
            fetchFamilies();
        } catch (err) {
            alert('Gagal mengupdate paket');
        }
    };

    if (loading || !isAuthorized || !user) return null;

    const sidebarItems = [
        { id: 'ringkasan', name: 'Ringkasan', icon: 'fa-chart-pie' },
        { id: 'keluarga', name: 'Data Keluarga', icon: 'fa-users' },
        { id: 'paket', name: 'Paket & Tagihan', icon: 'fa-box-open' },
        { id: 'pengumuman', name: 'Pengumuman', icon: 'fa-bullhorn' },
    ];

    const totalFamilies = families.length;
    const totalChildren = families.reduce((sum, f) => sum + (f.Users?.filter((u: any) => u.Role === 'child')?.length || 0), 0);
    const premiumFamilies = families.filter(f => f.Plan === 'PREMIUM').length;

    return (
        <div className="bg-gray-50 text-gray-800 font-sans h-screen flex overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="text-xl font-bold text-[#d97706] flex items-center gap-2">
                        <i className="fas fa-crown text-[#f59e0b]"></i>
                        <span>SaaS Admin</span>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === item.id ? 'bg-[#fffbeb] text-[#d97706] font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-[#d97706]'}`}
                        >
                            <i className={`fas ${item.icon} w-5 text-center`}></i> {item.name}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-500 rounded-lg font-medium transition-colors w-full">
                        <i className="fas fa-sign-out-alt w-5 text-center"></i> Keluar
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOP BAR */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-gray-500 hover:text-[#d97706]">
                            <i className="fas fa-bars text-xl"></i>
                        </button>
                        <div className="relative hidden sm:block">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="text" placeholder="Cari email atau nama keluarga..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] w-64 transition-all" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-[#d97706] relative">
                            <i className="fas fa-bell text-xl"></i>
                        </button>
                        <div className="h-8 w-8 bg-[#f59e0b] text-white rounded-full flex items-center justify-center font-bold shadow-md">
                            A
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {activeTab === 'ringkasan' && (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Ringkasan Bisnis</h1>
                                    <p className="text-gray-500 text-sm mt-1">Pantau performa aplikasi Ramadhan Ceria hari ini.</p>
                                </div>

                                {/* STAT CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl">
                                            <i className="fas fa-home"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Total Keluarga</p>
                                            <h3 className="text-2xl font-bold text-gray-800">{totalFamilies}</h3>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-xl">
                                            <i className="fas fa-child"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Anak Aktif</p>
                                            <h3 className="text-2xl font-bold text-gray-800">{totalChildren}</h3>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-xl">
                                            <i className="fas fa-wallet"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Paket Premium</p>
                                            <h3 className="text-2xl font-bold text-gray-800">{premiumFamilies}</h3>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-xl">
                                            <i className="fas fa-user-plus"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Pendaftar Baru</p>
                                            <h3 className="text-2xl font-bold text-gray-800">+{totalFamilies} <span className="text-xs text-green-500 font-normal">total</span></h3>
                                        </div>
                                    </div>
                                </div>

                                {/* RECENT FAMILIES TABLE */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                                        <h2 className="text-lg font-bold text-gray-800">Pendaftar Terbaru</h2>
                                        <button onClick={() => setActiveTab('keluarga')} className="px-4 py-2 bg-[#fffbeb] text-[#d97706] rounded-lg text-sm font-semibold hover:bg-[#fef3c7] transition-colors">
                                            Lihat Semua
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                                                    <th className="py-3 px-5 font-semibold">Keluarga</th>
                                                    <th className="py-3 px-5 font-semibold">Slug</th>
                                                    <th className="py-3 px-5 font-semibold">Paket</th>
                                                    <th className="py-3 px-5 font-semibold">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dataLoading ? (
                                                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">Memuat...</td></tr>
                                                ) : families.slice(0, 5).map((fam: any) => (
                                                    <tr key={fam.ID} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                        <td className="py-3 px-5 font-medium">{fam.Title}</td>
                                                        <td className="py-3 px-5 text-gray-500 text-sm">{fam.Slug}</td>
                                                        <td className="py-3 px-5">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${fam.Plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {fam.Plan}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-5">
                                                            <select value={fam.Plan} onChange={(e) => updatePlan(fam.ID, e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f59e0b]">
                                                                <option value="FREE">FREE</option>
                                                                <option value="PREMIUM">PREMIUM</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'keluarga' && (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Data Keluarga</h1>
                                    <p className="text-gray-500 text-sm mt-1">Semua keluarga yang terdaftar di sistem.</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                                                    <th className="py-3 px-5 font-semibold">ID</th>
                                                    <th className="py-3 px-5 font-semibold">Nama Keluarga</th>
                                                    <th className="py-3 px-5 font-semibold">Slug</th>
                                                    <th className="py-3 px-5 font-semibold">Paket</th>
                                                    <th className="py-3 px-5 font-semibold">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dataLoading ? (
                                                    <tr><td colSpan={5} className="py-6 text-center text-gray-400">Memuat...</td></tr>
                                                ) : families.map((fam: any) => (
                                                    <tr key={fam.ID} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                        <td className="py-3 px-5 font-mono text-xs text-gray-400">{fam.ID.substring(0, 8)}</td>
                                                        <td className="py-3 px-5 font-medium">{fam.Title}</td>
                                                        <td className="py-3 px-5 text-gray-500 text-sm">{fam.Slug}</td>
                                                        <td className="py-3 px-5">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${fam.Plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {fam.Plan}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-5">
                                                            <select value={fam.Plan} onChange={(e) => updatePlan(fam.ID, e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f59e0b]">
                                                                <option value="FREE">FREE</option>
                                                                <option value="PREMIUM">PREMIUM</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {(activeTab === 'paket' || activeTab === 'pengumuman') && (
                            <div className="flex flex-col items-center justify-center py-20">
                                <i className="fas fa-tools text-6xl text-gray-300 mb-4"></i>
                                <h3 className="text-xl font-bold text-gray-400">Fitur {activeTab} sedang dalam pengembangan</h3>
                                <p className="mt-2 text-sm text-gray-400">Tim engineer sedang mengerjakan modul ini.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
