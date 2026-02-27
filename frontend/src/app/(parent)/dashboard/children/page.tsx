'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ChildrenPage() {
    const [children, setChildren] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('👦');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const res = await api.get('/children');
            setChildren(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin.length !== 4 || isNaN(Number(pin))) {
            setError('PIN harus persis 4 angka');
            return;
        }

        try {
            await api.post('/children', { name, avatar, pin });
            setName('');
            setPin('');
            fetchChildren();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menambahkan anak');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus anak ini?')) {
            try {
                await api.delete(`/children/${id}`);
                fetchChildren();
            } catch (err) {
                alert('Gagal menghapus anak');
            }
        }
    };

    return (
        <div className="bg-white border-[3px] border-white rounded-[50px] p-6 md:p-8 shadow-[0_12px_0_#b8772e]">
            <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center gap-3">
                <i className="fas fa-child text-orange-400"></i> Kelola Anak
            </h2>

            {/* Add Form */}
            <form onSubmit={handleAddChild} className="bg-amber-50 border-[3px] border-white rounded-[30px] p-5 mb-8 shadow-[0_8px_0_#b8772e] max-w-2xl">
                <h3 className="font-bold text-amber-900 mb-4">Tambah Anak Baru</h3>
                {error && <p className="text-red-500 mb-3 text-sm bg-red-100 p-2 rounded-lg">{error}</p>}

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-amber-800 mb-1">Nama Panggilan</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none"
                            placeholder="Misal: Ahmad"
                            required
                        />
                    </div>
                    <div className="w-full md:w-32">
                        <label className="block text-sm font-semibold text-amber-800 mb-1">Avatar Anak</label>
                        <select
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none bg-white text-xl"
                        >
                            <option value="👦">👦 Boy 1</option>
                            <option value="🧒">🧒 Boy 2</option>
                            <option value="🧕">🧕 Girl 1</option>
                            <option value="👧">👧 Girl 2</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-amber-800 mb-1">PIN Login (4 Angka)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full p-2.5 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none"
                            placeholder="Contoh: 1234"
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-[0_4px_0_#b45f06] active:translate-y-1 active:shadow-[0_0px_0_#b45f06] transition">
                    Simpan Anak
                </button>
            </form>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading ? (
                    <p className="text-amber-800 font-medium">Memuat data...</p>
                ) : children.length === 0 ? (
                    <p className="text-amber-800 font-medium col-span-full">Belum ada anak terdaftar.</p>
                ) : (
                    children.map(child => (
                        <div key={child.ID} className="bg-white border-[3px] border-amber-100 rounded-[30px] p-5 flex items-center gap-4 shadow-[0_6px_0_#fde68a]">
                            <div className="text-4xl w-16 h-16 rounded-full flex items-center justify-center bg-orange-100 shadow-sm">
                                {child.AvatarIcon || '👦'}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-lg text-amber-900">{child.Name}</div>
                                <div className="text-sm font-mono text-amber-600">ID: {child.ID.substring(0, 8)}</div>
                            </div>
                            <button onClick={() => handleDelete(child.ID)} className="text-red-400 hover:text-red-600 bg-red-50 p-2.5 rounded-full transition" title="Hapus">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
