'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function RewardsPage() {
    const [rewards, setRewards] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🎁');
    const [pointsRequired, setPointsRequired] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCustomIcon, setShowCustomIcon] = useState(false);

    const presetRewardIcons = ['🍦', '🎮', '🚲', '💸', '📺', '🍬', '🍔', '🍿', '🎁', '⚽', '📱', '🎬', '🧸', '🧩', '🪁', '🛹', '🎨', '🏕️', '🎡', '🎠', '🚗', '👗', '👟', '🍕', '🍩', '🍫', '🧃', '🎫'];

    const rewardSuggestions: Record<string, string> = {
        '🍦': 'Makan Es Krim', '🎮': 'Main Game 1 Jam', '🚲': 'Sepeda Baru',
        '💸': 'Uang Jajan Tambahan', '📺': 'Nonton TV Lebihan', '🍬': 'Permen / Snack',
        '🍔': 'Makan Fast Food', '🍿': 'Nonton Bioskop', '🎁': 'Kado Misteri',
        '⚽': 'Beli Bola Baru', '📱': 'Main HP 30 Menit', '🎬': 'Movie Night di Rumah',
        '🧸': 'Boneka Baru', '🧩': 'Mainan Puzzle', '🪁': 'Bermain Layangan',
        '🛹': 'Bermain Skateboard', '🎨': 'Alat Mewarnai Baru', '🏕️': 'Kemah di Halaman',
        '🎡': 'Jalan-jalan ke Taman Hiburan', '🎠': 'Naik Odong-odong', '🚗': 'Mainan Mobil-mobilan',
        '👗': 'Baju Baru', '👟': 'Sepatu Baru', '🍕': 'Makan Pizza bareng Keluarga',
        '🍩': 'Donat Kesukaan', '🍫': 'Cokelat', '🧃': 'Minuman Favorit', '🎫': 'Tiket Playground'
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const res = await api.get('/rewards');
            setRewards(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/rewards', { name, icon, pointsRequired: Number(pointsRequired) });
            setName('');
            setIcon('🎁');
            setPointsRequired(10);
            setShowCustomIcon(false);
            fetchRewards();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menambahkan hadiah');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus hadiah ini?')) {
            try {
                await api.delete(`/rewards/${id}`);
                fetchRewards();
            } catch (err) {
                alert('Gagal menghapus hadiah');
            }
        }
    };

    const handleMagicTemplate = async () => {
        if (!confirm('Terapkan template hadiah otomatis? Ini akan menambahkan 5 daftar hadiah default.')) return;
        setLoading(true);
        setError('');
        try {
            await api.post('/parent/rewards/magic');
            fetchRewards();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menerapkan template hadiah');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border-[3px] border-white rounded-[50px] p-6 md:p-8 shadow-[0_12px_0_#b8772e]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
                    <i className="fas fa-gift text-orange-400"></i> Kelola Hadiah
                </h2>
                <button
                    onClick={handleMagicTemplate}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold rounded-xl shadow-[0_4px_0_#b45f06] active:translate-y-1 active:shadow-[0_0px_0_#b45f06] transition text-sm flex items-center gap-2 disabled:opacity-50"
                >
                    <i className="fas fa-wand-magic-sparkles"></i> Template Otomatis
                </button>
            </div>

            {/* Add Form */}
            <form onSubmit={handleAddReward} className="bg-amber-50 border-[3px] border-white rounded-[30px] p-5 mb-8 shadow-[0_8px_0_#b8772e] flex flex-col gap-4">
                <div className="w-full">
                    <label className="block text-sm font-semibold text-amber-800 mb-2">Pilih Ikon Hadiah</label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-2 max-h-48 overflow-y-auto p-2 border-2 border-amber-100 rounded-xl scrollbar-hide">
                        {presetRewardIcons.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                    setIcon(emoji);
                                    setShowCustomIcon(false);
                                    if (rewardSuggestions[emoji]) {
                                        setName(rewardSuggestions[emoji]);
                                    }
                                }}
                                className={`h-12 flex items-center justify-center text-2xl rounded-xl transition-all duration-200 hover:-translate-y-1 ${icon === emoji && !showCustomIcon
                                    ? 'bg-[#fce2c1] border-2 border-[#f9a826] shadow-[0_4px_0_#f9a826]'
                                    : 'bg-white border-2 border-transparent hover:bg-orange-50 hover:shadow-sm'
                                    }`}
                            >
                                {emoji}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowCustomIcon(true)}
                            className={`h-12 flex items-center justify-center text-sm font-bold rounded-xl transition-all duration-200 hover:-translate-y-1 ${showCustomIcon
                                ? 'bg-[#fce2c1] border-2 border-[#f9a826] shadow-[0_4px_0_#f9a826] text-[#b45f06]'
                                : 'bg-white border-2 border-transparent hover:bg-orange-50 hover:shadow-sm text-amber-800'
                                }`}
                            title="Ikon Custom"
                        >
                            <i className="fas fa-keyboard"></i>
                        </button>
                    </div>
                    {showCustomIcon && (
                        <div className="flex animate-fade-in mt-2 gap-2 max-w-[200px]">
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none text-center text-xl shadow-inner bg-white"
                                maxLength={2}
                                placeholder="Ketuk 1 emoji..."
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-end">
                    <div className="w-full sm:w-80">
                        <label className="block text-sm font-semibold text-amber-800 mb-1">Nama Hadiah</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none text-sm shadow-inner"
                            placeholder="Misal: Es Krim, Main Game 1 Jam"
                            required
                        />
                    </div>

                    <div className="w-full sm:w-32">
                        <label className="block text-sm font-semibold text-amber-800 mb-1">Harga (Poin)</label>
                        <input
                            type="number"
                            value={pointsRequired}
                            onChange={(e) => setPointsRequired(Number(e.target.value))}
                            className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none text-center font-bold text-amber-900 shadow-inner"
                            min="1"
                            required
                        />
                    </div>

                    <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-xl shadow-[0_4px_0_#b45f06] active:translate-y-1 active:shadow-[0_0px_0_#b45f06] transition whitespace-nowrap text-sm self-end h-[46px]">
                        <i className="fas fa-plus mr-2"></i> Tambah Hadiah
                    </button>
                </div>
            </form>
            {error && <p className="text-red-500 mb-4 text-center text-sm font-medium">{error}</p>}

            {/* List */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {loading ? (
                    <p className="p-4 text-amber-800 font-medium col-span-full">Memuat hadiah...</p>
                ) : rewards.length === 0 ? (
                    <p className="p-4 text-amber-800 font-medium text-center col-span-full">Belum ada hadiah.</p>
                ) : (
                    rewards.map(reward => (
                        <div key={reward.ID} className="bg-orange-50 border-[3px] border-white rounded-[30px] pt-6 pb-4 px-4 flex flex-col items-center shadow-[0_8px_0_#fde68a] relative group">
                            <button onClick={() => handleDelete(reward.ID)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-sm border border-red-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                            <div className="text-5xl filter drop-shadow-md mb-3">{reward.Icon}</div>
                            <div className="font-bold text-amber-900 text-center text-sm mb-2 h-10 flex items-center justify-center">{reward.Name}</div>
                            <div className="bg-orange-400 text-white px-4 py-1 rounded-full font-bold text-sm shadow-[0_4px_0_#b45f06]">
                                {reward.PointsRequired} poin
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
