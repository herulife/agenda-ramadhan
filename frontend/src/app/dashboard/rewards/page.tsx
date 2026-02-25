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

    return (
        <div className="bg-white border-[3px] border-white rounded-[50px] p-6 md:p-8 shadow-[0_12px_0_#b8772e]">
            <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center gap-3">
                <i className="fas fa-gift text-orange-400"></i> Kelola Hadiah
            </h2>

            {/* Add Form */}
            <form onSubmit={handleAddReward} className="bg-amber-50 border-[3px] border-white rounded-[30px] p-5 mb-8 shadow-[0_8px_0_#b8772e] flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-auto flex-1">
                    <label className="block text-sm font-semibold text-amber-800 mb-1">Nama Hadiah</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none"
                        placeholder="Misal: Es Krim, Main Game 1 Jam"
                        required
                    />
                </div>
                <div className="w-full md:w-24">
                    <label className="block text-sm font-semibold text-amber-800 mb-1">Ikon Emoji</label>
                    <input
                        type="text"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none text-center text-xl"
                        maxLength={2}
                        required
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="block text-sm font-semibold text-amber-800 mb-1">Harga (Poin)</label>
                    <input
                        type="number"
                        value={pointsRequired}
                        onChange={(e) => setPointsRequired(Number(e.target.value))}
                        className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none text-center font-bold text-amber-900"
                        min="1"
                        required
                    />
                </div>
                <button type="submit" className="w-full md:w-auto bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_#b45f06] active:translate-y-1 active:shadow-[0_0px_0_#b45f06] transition whitespace-nowrap">
                    Tambah Hadiah
                </button>
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
                            <button onClick={() => handleDelete(reward.ID)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-white p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition">
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
