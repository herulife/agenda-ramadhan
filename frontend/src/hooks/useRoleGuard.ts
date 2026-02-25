'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type AppRole = 'parent' | 'child' | 'super_admin';

function getDefaultRedirect(role: string) {
    if (role === 'parent') return '/dashboard';
    if (role === 'child') return '/panel';
    if (role === 'super_admin') return '/super-admin';
    return '/';
}

export function useRoleGuard(allowedRoles: AppRole[]) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (!allowedRoles.includes(user.role as AppRole)) {
            router.push(getDefaultRedirect(user.role));
        }
    }, [allowedRoles, loading, router, user]);

    const isAuthorized = !loading && !!user && allowedRoles.includes(user.role as AppRole);

    return {
        user,
        loading,
        isAuthorized,
    };
}

export function useGuestGuard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (user) {
            router.push(getDefaultRedirect(user.role));
        }
    }, [loading, router, user]);

    return {
        user,
        loading,
        isGuest: !loading && !user,
    };
}
