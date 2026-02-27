import { NextRequest, NextResponse } from 'next/server';

type AppRole = 'parent' | 'child' | 'super_admin';

const AUTH_COOKIE = 'auth_token';

function decodeRole(token: string): AppRole | null {
    try {
        const base64 = token.split('.')[1];
        if (!base64) return null;

        const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        const payload = JSON.parse(atob(padded));
        return payload.role ?? null;
    } catch {
        return null;
    }
}

function homeByRole(role: AppRole | null) {
    if (role === 'parent') return '/dashboard';
    if (role === 'child') return '/panel';
    if (role === 'super_admin') return '/super-admin';
    return '/';
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    const role = token ? decodeRole(token) : null;

    const isGuestPage = pathname === '/login' || pathname === '/register';
    const requiresParent = pathname.startsWith('/dashboard');
    const requiresParentOrChild = pathname.startsWith('/panel'); // both parent and child can access
    const requiresSuperAdmin = pathname.startsWith('/super-admin');

    if (isGuestPage && role) {
        return NextResponse.redirect(new URL(homeByRole(role), request.url));
    }

    if ((requiresParent || requiresParentOrChild || requiresSuperAdmin) && !role) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (requiresParent && role !== 'parent') {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('required', 'parent');
        url.searchParams.set('current', role ?? 'unknown');
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    if (requiresParentOrChild && role !== 'parent' && role !== 'child') {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('required', 'parent or child');
        url.searchParams.set('current', role ?? 'unknown');
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    if (requiresSuperAdmin && role !== 'super_admin') {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('required', 'super_admin');
        url.searchParams.set('current', role ?? 'unknown');
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/register', '/dashboard/:path*', '/panel/:path*', '/super-admin/:path*', '/unauthorized'],
};
