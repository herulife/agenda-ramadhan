"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useGuestGuard } from "@/hooks/useRoleGuard";
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [slug, setSlug] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { loading: guardLoading, isGuest } = useGuestGuard();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.post("/auth/register", {
                email,
                password,
                name,
                familyName,
                slug,
            });
            router.push("/login");
        } catch (err: any) {
            setError(err.response?.data?.error || "Pendaftaran gagal. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    if (guardLoading || !isGuest) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4 py-12">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-white w-full max-w-md">
                <h1 className="text-3xl font-bold text-amber-800 mb-6 text-center">Buat Keluarga Baru</h1>
                {error && <p className="text-red-500 mb-4 text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}

                <div className="mb-4">
                    <label className="block text-amber-700 font-semibold mb-2">Nama Lengkap (Orang Tua)</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                        placeholder="Budi Santoso"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-amber-700 font-semibold mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                        placeholder="budi@email.com"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-amber-700 font-semibold mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                        placeholder="********"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-amber-700 font-semibold mb-2">Nama Keluarga</label>
                    <input
                        type="text"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                        placeholder="Keluarga Santoso"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-amber-700 font-semibold mb-2">Slug (ID Unik Keluarga)</label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                        className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                        placeholder="keluarga-santoso"
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-white py-3 rounded-xl font-bold text-lg shadow-[0_6px_0_#b45f06] active:shadow-[0_2px_0_#b45f06] active:translate-y-1 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Memproses..." : "Daftar"}
                </button>
                <p className="mt-6 text-center text-gray-600">
                    Sudah punya akun? <Link href="/login" className="text-amber-600 font-bold hover:underline">Masuk</Link>
                </p>
            </form>
        </div>
    );
}


