"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGuestGuard } from "@/hooks/useRoleGuard";
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { loading: guardLoading, isGuest } = useGuestGuard();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError("Login gagal. Periksa email dan password.");
        } finally {
            setLoading(false);
        }
    };

    if (guardLoading || !isGuest) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-white w-full max-w-sm">
                <h1 className="text-3xl font-bold text-amber-800 mb-6 text-center">Masuk</h1>
                {error && <p className="text-red-500 mb-4 text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="mb-4">
                    <label className="block text-amber-700 font-semibold mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                        placeholder="nama@email.com"
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-6">
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
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-gemoy text-white py-3 rounded-xl font-bold text-lg mb-4"
                >
                    {loading ? "Memproses..." : "Masuk"}
                </button>

                <div className="relative flex items-center py-5">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold">Atau</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-100 mb-4">
                    <h3 className="font-bold text-amber-900 mb-2 text-center text-sm">Masuk sebagai Anak</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="familySlugInput"
                            placeholder="Username Keluarga (Slug)"
                            className="flex-1 p-2 border-2 border-amber-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const slugInput = document.getElementById('familySlugInput') as HTMLInputElement;
                                if (slugInput && slugInput.value) {
                                    localStorage.setItem('family_slug', slugInput.value);
                                    window.location.href = `/pilih-jagoan?family=${slugInput.value}`;
                                } else {
                                    alert('Masukkan username keluarga dulu ya!');
                                }
                            }}
                            className="bg-amber-100 text-amber-900 font-bold px-3 py-2 rounded-lg border-2 border-amber-200 hover:bg-amber-200 transition text-sm whitespace-nowrap"
                        >
                            Ke Layar Anak
                        </button>
                    </div>
                </div>
                <p className="mt-6 text-center text-gray-600">
                    Belum punya akun? <Link href="/register" className="text-amber-600 font-bold hover:underline">Daftar</Link>
                </p>
            </form>
        </div>
    );
}


