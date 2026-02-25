'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({ Title: '', Slug: '', Plan: '' });
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/family/settings');
            setSettings(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.put('/family/settings', { title: settings.Title });
            setSuccess('Pengaturan berhasil disimpan!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal memperbarui pengaturan');
        }
    };

    if (loading) return <div className="p-8 font-bold text-amber-900">Memuat pengaturan...</div>;

    const isPremium = settings.Plan === 'PREMIUM';

    return (
        <div className="flex flex-col gap-6">

            {/* SECTION 1: Informasi Akun */}
            <div className="bg-white border-[3px] border-white rounded-[40px] p-6 md:p-8 shadow-[0_12px_0_#b8772e]">
                <h2 className="text-2xl font-extrabold text-amber-900 mb-6 flex items-center gap-3">
                    <i className="fas fa-user-circle text-orange-400 text-3xl"></i> Informasi Akun
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Nama Pemilik</p>
                        <p className="font-bold text-amber-900 text-lg">{user?.name || '-'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Email Login</p>
                        <p className="font-bold text-amber-900 text-lg">{user?.email || '-'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Role</p>
                        <p className="font-bold text-amber-900 text-lg capitalize">{user?.role || '-'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">ID Keluarga</p>
                        <p className="font-mono text-amber-900 text-sm">{settings.Slug || '-'}</p>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Ubah Nama Keluarga */}
            <div className="bg-white border-[3px] border-white rounded-[40px] p-6 md:p-8 shadow-[0_12px_0_#b8772e]">
                <h2 className="text-2xl font-extrabold text-amber-900 mb-6 flex items-center gap-3">
                    <i className="fas fa-pen text-orange-400 text-2xl"></i> Ubah Nama Keluarga
                </h2>

                {success && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-2xl border border-green-200 font-medium text-sm mb-4">
                        <i className="fas fa-check-circle"></i> {success}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200 font-medium text-sm mb-4">
                        <i className="fas fa-exclamation-circle"></i> {error}
                    </div>
                )}

                <form onSubmit={handleUpdate}>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-amber-800 mb-2">Nama Keluarga</label>
                        <input
                            type="text"
                            value={settings.Title}
                            onChange={(e) => setSettings({ ...settings, Title: e.target.value })}
                            placeholder="Contoh: Keluarga Bahagia"
                            className="w-full p-4 border-2 border-amber-200 rounded-2xl focus:border-orange-400 focus:outline-none text-lg font-medium bg-amber-50/50"
                            required
                        />
                        <p className="text-xs text-amber-500 mt-2 ml-1">
                            Nama ini akan tampil di header dashboard dan panel anak Anda.
                        </p>
                    </div>
                    <button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_6px_0_#b45f06] active:translate-y-1 active:shadow-[0_2px_0_#b45f06] transition text-lg">
                        <i className="fas fa-save mr-2"></i> Simpan Perubahan
                    </button>
                </form>
            </div>

            {/* SECTION 3: Paket Langganan */}
            <div className={`border-[3px] rounded-[40px] p-6 md:p-8 shadow-[0_12px_0_#b8772e] ${isPremium ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-300' : 'bg-white border-white'}`}>
                <h2 className="text-2xl font-extrabold text-amber-900 mb-6 flex items-center gap-3">
                    <i className={`fas fa-crown text-2xl ${isPremium ? 'text-yellow-500' : 'text-slate-400'}`}></i> Paket Langganan
                </h2>

                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex justify-center items-center shadow-md ${isPremium ? 'bg-gradient-to-br from-yellow-300 to-orange-400' : 'bg-slate-100'}`}>
                        <i className={`fas fa-crown text-3xl ${isPremium ? 'text-white' : 'text-slate-400'}`}></i>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">Paket Aktif</div>
                        <div className={`text-3xl font-black ${isPremium ? 'text-orange-500' : 'text-slate-500'}`}>
                            {settings.Plan}
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 rounded-2xl p-5 border border-amber-100 mb-6">
                    <p className="font-bold text-amber-800 mb-3 text-sm uppercase tracking-wider">Fitur yang tersedia:</p>
                    <ul className="space-y-3 text-amber-900">
                        <li className="flex items-start gap-3">
                            <i className={`fas ${isPremium ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-400'} mt-0.5`}></i>
                            <div>
                                <p className="font-semibold">{isPremium ? 'Anak tidak terbatas' : 'Maksimal 2 Anak'}</p>
                                <p className="text-xs text-amber-600">{isPremium ? 'Daftarkan seluruh anggota keluarga Anda.' : 'Upgrade untuk menambah lebih banyak anak.'}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <i className={`fas ${isPremium ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-400'} mt-0.5`}></i>
                            <div>
                                <p className="font-semibold">{isPremium ? 'Tugas tidak terbatas' : 'Maksimal 10 Tugas Aktif'}</p>
                                <p className="text-xs text-amber-600">{isPremium ? 'Buat tugas sebanyak kebutuhan keluarga.' : 'Upgrade untuk menambah variasi tugas.'}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <i className={`fas ${isPremium ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-400'} mt-0.5`}></i>
                            <div>
                                <p className="font-semibold">{isPremium ? 'Hadiah tidak terbatas' : 'Maksimal 5 Hadiah Aktif'}</p>
                                <p className="text-xs text-amber-600">{isPremium ? 'Buat katalog hadiah yang lebih menarik.' : 'Upgrade untuk lebih banyak pilihan hadiah.'}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <i className={`fas ${isPremium ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-400'} mt-0.5`}></i>
                            <div>
                                <p className="font-semibold">{isPremium ? 'Laporan analitik lengkap' : 'Laporan analitik terkunci'}</p>
                                <p className="text-xs text-amber-600">{isPremium ? 'Pantau progres ibadah anak secara detail.' : 'Upgrade untuk melihat grafik dan statistik.'}</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {!isPremium && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <i className="fas fa-rocket text-green-500 text-xl"></i>
                            <div>
                                <p className="font-bold text-green-800">Upgrade ke Premium</p>
                                <p className="text-sm text-green-700">Rp 49.000 / bulan Ramadhan</p>
                            </div>
                        </div>
                        <p className="text-sm text-green-700 mb-4">
                            Untuk upgrade, silakan hubungi admin melalui WhatsApp. Setelah pembayaran dikonfirmasi, paket Anda akan langsung diaktifkan.
                        </p>
                        <a
                            href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20upgrade%20ke%20paket%20Premium%20Ramadhan%20Ceria."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_6px_0_#15803d] active:translate-y-1 active:shadow-[0_2px_0_#15803d] transition text-center text-lg"
                        >
                            <i className="fab fa-whatsapp mr-2 text-xl"></i> Hubungi Admin via WhatsApp
                        </a>
                    </div>
                )}

                {isPremium && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-200 text-center">
                        <p className="text-amber-700 font-semibold">
                            <i className="fas fa-sparkles mr-1"></i> Anda sudah menikmati semua fitur Premium. Terima kasih!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
