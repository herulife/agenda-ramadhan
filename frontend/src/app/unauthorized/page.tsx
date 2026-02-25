'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function homeByRole(role: string | null) {
    if (role === 'parent') return '/dashboard';
    if (role === 'child') return '/panel';
    if (role === 'super_admin') return '/super-admin';
    return '/';
}

function UnauthorizedContent() {
    const params = useSearchParams();
    const required = params.get('required');
    const current = params.get('current');
    const next = params.get('next');
    const back = homeByRole(current);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
            <div className="w-full max-w-lg bg-white border-4 border-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="text-5xl font-black text-amber-700 mb-4">403</div>
                <h1 className="text-2xl font-extrabold text-amber-900 mb-3">Akses Ditolak</h1>
                <p className="text-amber-800 mb-6">
                    Kamu tidak punya izin untuk membuka halaman ini.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-900 mb-6">
                    <div><b>Halaman:</b> {next || '-'}</div>
                    <div><b>Role dibutuhkan:</b> {required || '-'}</div>
                    <div><b>Role kamu:</b> {current || '-'}</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href={back} className="btn">
                        Kembali ke Halaman Utama
                    </Link>
                    <Link href="/login" className="btn-outline">
                        Login Ulang
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function UnauthorizedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-amber-50"><i className="fas fa-circle-notch fa-spin text-4xl text-amber-500"></i></div>}>
            <UnauthorizedContent />
        </Suspense>
    );
}

