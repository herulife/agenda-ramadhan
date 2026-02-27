'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SuperAdminPage() {
    const { logout } = useAuth();
    const { user, loading, isAuthorized } = useRoleGuard(['super_admin']);
    const [families, setFamilies] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ringkasan');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileSidebar, setMobileSidebar] = useState(false);

    // Create family modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [newParentName, setNewParentName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPlan, setNewPlan] = useState('FREE');

    // Announcement form
    const [annTitle, setAnnTitle] = useState('');
    const [annMessage, setAnnMessage] = useState('');
    const [annType, setAnnType] = useState('info');

    useEffect(() => {
        if (loading || !isAuthorized) return;
        fetchAll();
    }, [loading, isAuthorized]);

    const fetchAll = async () => {
        try {
            const [famRes, statsRes, annRes] = await Promise.all([
                api.get('/admin/families'),
                api.get('/admin/stats'),
                api.get('/admin/announcements'),
            ]);
            setFamilies(famRes.data || []);
            setStats(statsRes.data || {});
            setAnnouncements(annRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setDataLoading(false);
        }
    };

    const updatePlan = async (familyId: string, newPlan: string) => {
        toast.promise(
            api.put(`/admin/family/${familyId}/plan`, { plan: newPlan }),
            {
                loading: 'Mengubah paket...',
                success: () => { fetchAll(); return 'Paket berhasil diperbarui! ✅'; },
                error: 'Gagal mengupdate paket',
            }
        );
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!annTitle || !annMessage) return;
        try {
            await api.post('/admin/announcements', { title: annTitle, message: annMessage, type: annType });
            toast.success('Pengumuman berhasil dikirim! 📢');
            setAnnTitle('');
            setAnnMessage('');
            setAnnType('info');
            fetchAll();
        } catch (err) {
            toast.error('Gagal membuat pengumuman');
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;
        try {
            await api.delete(`/admin/announcements/${id}`);
            toast.success('Pengumuman dihapus');
            fetchAll();
        } catch (err) {
            toast.error('Gagal menghapus');
        }
    };

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/families', {
                familyName: newFamilyName,
                parentName: newParentName,
                email: newEmail,
                password: newPassword,
                plan: newPlan,
            });
            toast.success('Akun keluarga berhasil dibuat! ✅');
            setShowCreateModal(false);
            setNewFamilyName(''); setNewParentName(''); setNewEmail(''); setNewPassword(''); setNewPlan('FREE');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal membuat akun');
        }
    };

    const handleDeleteFamily = async (id: string, name: string) => {
        if (!confirm(`⚠️ PERINGATAN!\n\nYakin ingin menghapus keluarga "${name}"?\nSemua data (anak, tugas, hadiah, log) akan DIHAPUS PERMANEN.`)) return;
        try {
            await api.delete(`/admin/family/${id}`);
            toast.success('Keluarga berhasil dihapus');
            fetchAll();
        } catch (err) {
            toast.error('Gagal menghapus keluarga');
        }
    };

    // Search filter
    const filteredFamilies = useMemo(() => {
        if (!searchQuery.trim()) return families;
        const q = searchQuery.toLowerCase();
        return families.filter((f: any) =>
            f.Name?.toLowerCase().includes(q) ||
            f.ID?.toLowerCase().includes(q) ||
            f.Users?.some((u: any) => u.Email?.toLowerCase().includes(q) || u.Name?.toLowerCase().includes(q))
        );
    }, [families, searchQuery]);

    if (loading || !isAuthorized || !user) return null;

    const sidebarItems = [
        { id: 'ringkasan', name: 'Ringkasan', icon: 'fa-chart-pie' },
        { id: 'keluarga', name: 'Data Keluarga', icon: 'fa-users' },
        { id: 'paket', name: 'Paket & Tagihan', icon: 'fa-box-open' },
        { id: 'pengumuman', name: 'Pengumuman', icon: 'fa-bullhorn' },
    ];

    const typeColors: Record<string, string> = {
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        promo: 'bg-green-100 text-green-700 border-green-200',
    };

    return (
        <div className="bg-gray-50 text-gray-800 font-sans h-screen flex overflow-hidden">
            {/* MOBILE OVERLAY */}
            {mobileSidebar && (
                <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebar(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300
                ${mobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
                            onClick={() => { setActiveTab(item.id); setMobileSidebar(false); }}
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
                        <button className="md:hidden text-gray-500 hover:text-[#d97706]" onClick={() => setMobileSidebar(true)}>
                            <i className="fas fa-bars text-xl"></i>
                        </button>
                        <div className="relative hidden sm:block">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Cari email, nama keluarga, atau ID..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setActiveTab('keluarga'); }}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] w-72 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400 font-medium">Login sebagai</p>
                            <p className="text-sm font-bold text-gray-700">Super Admin</p>
                        </div>
                        <div className="h-9 w-9 bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white rounded-full flex items-center justify-center font-bold shadow-md">
                            <i className="fas fa-shield-alt text-sm"></i>
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* ==================== TAB: RINGKASAN ==================== */}
                        {activeTab === 'ringkasan' && (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Ringkasan Bisnis</h1>
                                    <p className="text-gray-500 text-sm mt-1">Pantau performa aplikasi Ramadhan Ceria secara real-time.</p>
                                </div>

                                {/* STAT CARDS */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Keluarga', value: stats?.totalFamilies || 0, icon: 'fa-home', color: 'bg-blue-50 text-blue-500' },
                                        { label: 'Anak Terdaftar', value: stats?.totalChildren || 0, icon: 'fa-child', color: 'bg-amber-50 text-amber-500' },
                                        { label: 'Paket Premium', value: stats?.premiumFamilies || 0, icon: 'fa-crown', color: 'bg-green-50 text-green-500' },
                                        { label: 'Orang Tua', value: stats?.totalParents || 0, icon: 'fa-user-tie', color: 'bg-purple-50 text-purple-500' },
                                    ].map(card => (
                                        <div key={card.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center text-xl`}>
                                                <i className={`fas ${card.icon}`}></i>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                                                <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ACTIVITY STATS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <i className="fas fa-check-double text-2xl opacity-80"></i>
                                            <span className="text-sm font-semibold opacity-90">Tugas Selesai Hari Ini</span>
                                        </div>
                                        <p className="text-4xl font-black">{stats?.totalTasksToday || 0}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-2xl text-white shadow-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <i className="fas fa-coins text-2xl opacity-80"></i>
                                            <span className="text-sm font-semibold opacity-90">Total Poin Beredar</span>
                                        </div>
                                        <p className="text-4xl font-black">{stats?.totalPointsEarned || 0}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-6 rounded-2xl text-white shadow-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <i className="fas fa-gift text-2xl opacity-80"></i>
                                            <span className="text-sm font-semibold opacity-90">Hadiah Ditukar</span>
                                        </div>
                                        <p className="text-4xl font-black">{stats?.totalRedemptions || 0}</p>
                                    </div>
                                </div>

                                {/* RECENT TABLE */}
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
                                                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                                                    <th className="py-3 px-5 font-semibold">Keluarga</th>
                                                    <th className="py-3 px-5 font-semibold">Anggota</th>
                                                    <th className="py-3 px-5 font-semibold">Paket</th>
                                                    <th className="py-3 px-5 font-semibold">Terdaftar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dataLoading ? (
                                                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">Memuat...</td></tr>
                                                ) : families.slice(0, 5).map((fam: any) => (
                                                    <tr key={fam.ID} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                        <td className="py-3 px-5">
                                                            <div className="font-semibold text-gray-800">{fam.Name}</div>
                                                            <div className="text-xs text-gray-400 font-mono">{fam.ID?.substring(0, 8)}...</div>
                                                        </td>
                                                        <td className="py-3 px-5 text-sm">
                                                            <span className="text-gray-700 font-medium">{fam.Users?.filter((u: any) => u.Role === 'child')?.length || 0} anak</span>
                                                            <span className="text-gray-400 mx-1">·</span>
                                                            <span className="text-gray-500">{fam.Users?.filter((u: any) => u.Role === 'parent')?.length || 0} ortu</span>
                                                        </td>
                                                        <td className="py-3 px-5">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${fam.Plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {fam.Plan}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-5 text-sm text-gray-500">
                                                            {new Date(fam.CreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ==================== TAB: DATA KELUARGA ==================== */}
                        {activeTab === 'keluarga' && (
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800">Data Keluarga</h1>
                                        <p className="text-gray-500 text-sm mt-1">{filteredFamilies.length} keluarga {searchQuery ? `cocok dengan "${searchQuery}"` : 'terdaftar'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative sm:hidden">
                                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                            <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] w-44" />
                                        </div>
                                        <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-[#d97706] hover:bg-[#b45f06] text-white font-bold rounded-xl shadow-sm transition text-sm flex items-center gap-2 whitespace-nowrap">
                                            <i className="fas fa-plus"></i> Tambah Akun
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                                                    <th className="py-3 px-5 font-semibold">Keluarga</th>
                                                    <th className="py-3 px-5 font-semibold">Email Ortu</th>
                                                    <th className="py-3 px-5 font-semibold">Anak</th>
                                                    <th className="py-3 px-5 font-semibold">Tugas</th>
                                                    <th className="py-3 px-5 font-semibold">Hadiah</th>
                                                    <th className="py-3 px-5 font-semibold">Paket</th>
                                                    <th className="py-3 px-5 font-semibold">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dataLoading ? (
                                                    <tr><td colSpan={7} className="py-6 text-center text-gray-400">Memuat...</td></tr>
                                                ) : filteredFamilies.length === 0 ? (
                                                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">
                                                        <i className="fas fa-search text-3xl mb-2 block"></i>
                                                        Tidak ada keluarga yang cocok.
                                                    </td></tr>
                                                ) : filteredFamilies.map((fam: any) => {
                                                    const parent = fam.Users?.find((u: any) => u.Role === 'parent');
                                                    const childCount = fam.Users?.filter((u: any) => u.Role === 'child')?.length || 0;
                                                    return (
                                                        <tr key={fam.ID} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                            <td className="py-3 px-5">
                                                                <div className="font-semibold text-gray-800">{fam.Name}</div>
                                                                <div className="text-xs text-gray-400">{new Date(fam.CreatedAt).toLocaleDateString('id-ID')}</div>
                                                            </td>
                                                            <td className="py-3 px-5 text-sm text-gray-600">{parent?.Email || '-'}</td>
                                                            <td className="py-3 px-5 text-center font-bold text-gray-700">{childCount}</td>
                                                            <td className="py-3 px-5 text-center font-bold text-gray-700">{fam.Tasks?.length || 0}</td>
                                                            <td className="py-3 px-5 text-center font-bold text-gray-700">{fam.Rewards?.length || 0}</td>
                                                            <td className="py-3 px-5">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${fam.Plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {fam.Plan}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-5">
                                                                <div className="flex items-center gap-2">
                                                                    <select value={fam.Plan} onChange={(e) => updatePlan(fam.ID, e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f59e0b]">
                                                                        <option value="FREE">FREE</option>
                                                                        <option value="PREMIUM">PREMIUM</option>
                                                                    </select>
                                                                    <button onClick={() => handleDeleteFamily(fam.ID, fam.Name)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition" title="Hapus Keluarga">
                                                                        <i className="fas fa-trash-alt text-xs"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ==================== TAB: PAKET & TAGIHAN ==================== */}
                        {activeTab === 'paket' && (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Paket & Tagihan</h1>
                                    <p className="text-gray-500 text-sm mt-1">Ringkasan lengkap konversi pengguna.</p>
                                </div>

                                {/* CONVERSION OVERVIEW */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl mb-3">
                                            <i className="fas fa-user-clock text-gray-400"></i>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Paket Sabar (Gratis)</p>
                                        <h3 className="text-3xl font-black text-gray-700">{families.filter(f => f.Plan === 'FREE').length}</h3>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm text-center bg-gradient-to-b from-amber-50 to-white">
                                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-3xl mb-3">
                                            <i className="fas fa-crown text-amber-500"></i>
                                        </div>
                                        <p className="text-sm text-amber-700 font-medium">Paket Berkah (Premium)</p>
                                        <h3 className="text-3xl font-black text-amber-600">{families.filter(f => f.Plan === 'PREMIUM').length}</h3>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm text-center bg-gradient-to-b from-green-50 to-white">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl mb-3">
                                            <i className="fas fa-percentage text-green-500"></i>
                                        </div>
                                        <p className="text-sm text-green-700 font-medium">Rasio Konversi</p>
                                        <h3 className="text-3xl font-black text-green-600">
                                            {families.length > 0 ? Math.round((families.filter(f => f.Plan === 'PREMIUM').length / families.length) * 100) : 0}%
                                        </h3>
                                    </div>
                                </div>

                                {/* DETAIL TABLE */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-800">Detail Per Keluarga</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                                                    <th className="py-3 px-5 font-semibold">Keluarga</th>
                                                    <th className="py-3 px-5 font-semibold">Paket</th>
                                                    <th className="py-3 px-5 font-semibold text-center">Anak</th>
                                                    <th className="py-3 px-5 font-semibold text-center">Tugas Aktif</th>
                                                    <th className="py-3 px-5 font-semibold text-center">Hadiah</th>
                                                    <th className="py-3 px-5 font-semibold">Terdaftar Sejak</th>
                                                    <th className="py-3 px-5 font-semibold">Ubah Paket</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {families.map((fam: any) => (
                                                    <tr key={fam.ID} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                        <td className="py-3 px-5 font-medium text-gray-800">{fam.Name}</td>
                                                        <td className="py-3 px-5">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${fam.Plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {fam.Plan === 'PREMIUM' ? '⭐ BERKAH' : 'SABAR'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-5 text-center font-bold">{fam.Users?.filter((u: any) => u.Role === 'child')?.length || 0}</td>
                                                        <td className="py-3 px-5 text-center font-bold">{fam.Tasks?.length || 0}</td>
                                                        <td className="py-3 px-5 text-center font-bold">{fam.Rewards?.length || 0}</td>
                                                        <td className="py-3 px-5 text-sm text-gray-500">{new Date(fam.CreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
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

                        {/* ==================== TAB: PENGUMUMAN ==================== */}
                        {activeTab === 'pengumuman' && (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Pengumuman</h1>
                                    <p className="text-gray-500 text-sm mt-1">Kirim pengumuman ke semua pengguna aplikasi.</p>
                                </div>

                                {/* CREATE FORM */}
                                <form onSubmit={handleCreateAnnouncement} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fas fa-plus-circle text-[#d97706]"></i> Buat Pengumuman Baru</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Judul</label>
                                            <input
                                                type="text"
                                                value={annTitle}
                                                onChange={(e) => setAnnTitle(e.target.value)}
                                                placeholder="Misal: Selamat Datang Ramadhan 1447H!"
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b] text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipe</label>
                                            <select
                                                value={annType}
                                                onChange={(e) => setAnnType(e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b] text-sm"
                                            >
                                                <option value="info">ℹ️ Info</option>
                                                <option value="warning">⚠️ Peringatan</option>
                                                <option value="promo">🎉 Promo</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Isi Pesan</label>
                                        <textarea
                                            value={annMessage}
                                            onChange={(e) => setAnnMessage(e.target.value)}
                                            placeholder="Tulis isi pengumuman di sini..."
                                            rows={3}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b] text-sm resize-none"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="px-6 py-3 bg-[#d97706] hover:bg-[#b45f06] text-white font-bold rounded-xl shadow-sm transition text-sm flex items-center gap-2">
                                        <i className="fas fa-paper-plane"></i> Kirim Pengumuman
                                    </button>
                                </form>

                                {/* LIST */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fas fa-list text-gray-400"></i> Riwayat Pengumuman ({announcements.length})</h3>
                                    {announcements.length === 0 ? (
                                        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
                                            <i className="fas fa-bullhorn text-4xl mb-3 block"></i>
                                            <p className="font-medium">Belum ada pengumuman.</p>
                                        </div>
                                    ) : announcements.map((ann: any) => (
                                        <div key={ann.ID} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${typeColors[ann.Type] || 'border-gray-100'}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[ann.Type] || 'bg-gray-100 text-gray-600'}`}>
                                                        {ann.Type === 'info' ? 'ℹ️ Info' : ann.Type === 'warning' ? '⚠️ Peringatan' : '🎉 Promo'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{new Date(ann.CreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800">{ann.Title}</h4>
                                                <p className="text-sm text-gray-600 mt-1">{ann.Message}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAnnouncement(ann.ID)}
                                                className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl font-medium text-sm transition flex items-center gap-2 self-start"
                                            >
                                                <i className="fas fa-trash-alt"></i> Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                    </div>
                </main>
            </div>

            {/* CREATE FAMILY MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-in">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition">
                            <i className="fas fa-times text-lg"></i>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <i className="fas fa-user-plus text-[#d97706]"></i> Tambah Akun Keluarga
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Buat akun keluarga baru beserta akun orang tua-nya.</p>
                        <form onSubmit={handleCreateFamily} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Keluarga</label>
                                    <input type="text" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} placeholder="Keluarga Bahagia" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Orang Tua</label>
                                    <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} placeholder="Budi Santoso" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Login</label>
                                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ortu@email.com" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                                    <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 karakter" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Paket</label>
                                    <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]">
                                        <option value="FREE">Sabar (FREE)</option>
                                        <option value="PREMIUM">Berkah (PREMIUM)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium rounded-xl transition text-sm">
                                    Batal
                                </button>
                                <button type="submit" className="px-6 py-2.5 bg-[#d97706] hover:bg-[#b45f06] text-white font-bold rounded-xl shadow-sm transition text-sm flex items-center gap-2">
                                    <i className="fas fa-check"></i> Buat Akun
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
