'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📋');
    const [points, setPoints] = useState(1);
    const [maxPerDay, setMaxPerDay] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCustomIcon, setShowCustomIcon] = useState(false);

    const presetTaskIcons = ['🕌', '📖', '📿', '🤲', '🕋', '🌙', '👳', '🧕', '🧹', '🍽️', '🛏️', '🚿', '📚', '🏃‍♂️', '💧', '☀️', '🪴', '🗑️', '👕', '🛒', '🍎', '🥦', '🥛', '🦷', '📝', '💪'];

    const taskSuggestions: Record<string, string> = {
        '🕌': 'Sholat Berjamaah', '📖': 'Membaca Al-Quran', '📿': 'Dzikir Setelah Sholat',
        '🤲': 'Berdoa', '🕋': 'Hafalan Surat Pendek', '🌙': 'Sholat Tarawih',
        '🧹': 'Menyapu Rumah', '🍽️': 'Membantu Cuci Piring', '🛏️': 'Merapikan Tempat Tidur',
        '🚿': 'Mandi Sendiri', '📚': 'Mengerjakan PR / Belajar', '🦷': 'Sikat Gigi Sebelum Tidur',
        '🗑️': 'Membuang Sampah', '🪴': 'Menyiram Tanaman', '👕': 'Merapikan Pakaian',
        '👳': 'Mendengarkan Ceramah', '🧕': 'Membantu Ibu', '🏃‍♂️': 'Olahraga / Jalan Pagi',
        '💧': 'Minum Air Putih 8 Gelas', '☀️': 'Bangun Pagi', '🛒': 'Membantu Belanja',
        '🍎': 'Makan Buah', '🥦': 'Makan Sayur', '🥛': 'Minum Susu / Vitamin',
        '📝': 'Menulis / Menggambar', '💪': 'Bantu Angkat Barang'
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicTemplate = async (type: 'tk' | 'sd') => {
        if (!confirm(`Terapkan preset otomatis untuk level ${type.toUpperCase()}?`)) return;
        setLoading(true);
        setError('');
        try {
            await api.post('/parent/tasks/magic', { template_type: type.toUpperCase() });
            fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menerapkan magic template');
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/tasks', { name, icon, points: Number(points), max_per_day: Number(maxPerDay) });
            setName('');
            setIcon('📋');
            setPoints(1);
            setMaxPerDay(1);
            setShowCustomIcon(false);
            fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menambahkan tugas');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus tugas ini?')) {
            try {
                await api.delete(`/tasks/${id}`);
                fetchTasks();
            } catch (err) {
                alert('Gagal menghapus tugas');
            }
        }
    };

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">Kelola Misi</h2>
                    <p className="text-gray-500 font-medium text-sm mt-1">Atur misi harian untuk anak-anak.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleMagicTemplate('tk')}
                        disabled={loading}
                        className="px-4 py-2 bg-[#f59e0b] text-white font-bold rounded-xl shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-[0_0px_0_#d97706] transition text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <i className="fas fa-magic"></i> Preset TK
                    </button>
                    <button
                        onClick={() => handleMagicTemplate('sd')}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-[0_4px_0_#2563eb] active:translate-y-1 active:shadow-[0_0px_0_#2563eb] transition text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <i className="fas fa-magic"></i> Preset SD
                    </button>
                </div>
            </header>

            {/* Add Form */}
            <form onSubmit={handleAddTask} className="bg-white border-2 border-[#fef3c7] rounded-2xl p-5 mb-6 shadow-sm flex flex-col gap-4">
                <div className="w-full">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Pilih Ikon Misi</label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-2 max-h-48 overflow-y-auto p-2 border-2 border-[#fef3c7] rounded-xl scrollbar-hide">
                        {presetTaskIcons.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                    setIcon(emoji);
                                    setShowCustomIcon(false);
                                    if (taskSuggestions[emoji]) {
                                        setName(taskSuggestions[emoji]);
                                    }
                                }}
                                className={`h-12 flex items-center justify-center text-2xl rounded-xl transition-all duration-200 hover:-translate-y-1 ${icon === emoji && !showCustomIcon
                                    ? 'bg-[#fce2c1] border-2 border-[#f9a826] shadow-[0_4px_0_#f9a826]'
                                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:shadow-sm'
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
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:shadow-sm text-gray-500'
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
                                className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-center text-xl shadow-inner"
                                maxLength={2}
                                placeholder="Ketuk 1 emoji..."
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-end">
                    <div className="w-full sm:w-80">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Misi</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-sm shadow-inner"
                            placeholder="Misal: Sholat Subuh"
                            required
                        />
                    </div>

                    <div className="w-full sm:w-32">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Poin</label>
                        <input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(Number(e.target.value))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-center font-bold shadow-inner"
                            min="1"
                            required
                        />
                    </div>

                    <div className="w-full sm:w-36">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Maks/Hari</label>
                        <select
                            value={maxPerDay}
                            onChange={(e) => setMaxPerDay(Number(e.target.value))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-center font-bold shadow-inner text-sm"
                        >
                            <option value={1}>1x (sekali)</option>
                            <option value={2}>2x</option>
                            <option value={3}>3x</option>
                            <option value={5}>5x</option>
                            <option value={0}>∞ Unlimited</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-[#f59e0b] text-white font-bold rounded-xl shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-[0_0px_0_#d97706] transition whitespace-nowrap text-sm self-end h-[46px]">
                        <i className="fas fa-plus mr-2"></i> Tambah Misi
                    </button>
                </div>
            </form>
            {error && <p className="text-red-500 mb-4 text-center text-sm font-medium">{error}</p>}

            {/* List */}
            <div className="bg-white border-2 border-[#fef3c7] rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500 font-medium">Memuat misi...</p>
                ) : tasks.length === 0 ? (
                    <p className="p-6 text-gray-500 font-medium text-center">Belum ada misi. Tambahkan atau gunakan preset!</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {tasks.map(task => (
                            <div key={task.ID} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                                <div className="text-2xl">{task.Icon}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{task.Name}</div>
                                    <div className="text-xs text-gray-400 font-medium mt-0.5">
                                        {task.MaxPerDay === 0 ? '∞ unlimited/hari' : `maks ${task.MaxPerDay}x/hari`}
                                    </div>
                                </div>
                                <div className="bg-[#fffbeb] text-[#d97706] px-3 py-1 rounded-full font-bold text-sm border border-[#fef3c7]">
                                    {task.PointReward} poin
                                </div>
                                <button onClick={() => handleDelete(task.ID)} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition">
                                    <i className="fas fa-trash-alt text-sm"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
