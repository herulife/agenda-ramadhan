'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📋');
    const [points, setPoints] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            await api.post('/tasks/magic-template', { type });
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
            await api.post('/tasks', { name, icon, points: Number(points) });
            setName('');
            setIcon('📋');
            setPoints(1);
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
            <form onSubmit={handleAddTask} className="bg-white border-2 border-[#fef3c7] rounded-2xl p-5 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-auto flex-1">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Misi</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-sm"
                        placeholder="Misal: Sholat Subuh"
                        required
                    />
                </div>
                <div className="w-full md:w-24">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Ikon</label>
                    <input
                        type="text"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-center text-xl"
                        maxLength={2}
                        required
                    />
                </div>
                <div className="w-full md:w-28">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Poin</label>
                    <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl focus:border-[#f59e0b] focus:outline-none text-center font-bold"
                        min="1"
                        required
                    />
                </div>
                <button type="submit" className="w-full md:w-auto px-6 py-3 bg-[#f59e0b] text-white font-bold rounded-xl shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-[0_0px_0_#d97706] transition whitespace-nowrap text-sm">
                    <i className="fas fa-plus mr-2"></i> Tambah Misi
                </button>
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
                                <div className="flex-1 font-bold text-gray-800">{task.Name}</div>
                                <div className="bg-[#fffbeb] text-[#d97706] px-3 py-1 rounded-full font-bold text-sm border border-[#fef3c7]">
                                    {task.Points} poin
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
