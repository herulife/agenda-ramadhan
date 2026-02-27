'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

export default function ParentLayout({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'parent' && user.role !== 'super_admin') {
                router.push('/unauthorized');
            }
        }
    }, [user, loading, router]);

    if (loading || !user || (user.role !== 'parent' && user.role !== 'super_admin')) {
        return (
            <div className="min-h-screen flex text-brand-900 items-center justify-center font-bold text-xl">
                Tunggu sebentar ya...
            </div>
        );
    }

    return <>{children}</>;
}
