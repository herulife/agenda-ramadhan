'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    role: string;
    familyId: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_COOKIE = 'auth_token';

function decodeToken(token: string): User | null {
    try {
        const base64 = token.split('.')[1];
        const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        const payload = JSON.parse(atob(padded));

        return {
            id: payload.user_id,
            name: payload.name || '',
            role: payload.role,
            familyId: payload.family_id,
            avatar: payload.avatar,
        };
    } catch {
        return null;
    }
}

function getCookie(name: string): string | null {
    const parts = document.cookie.split(';').map((v) => v.trim());
    const row = parts.find((v) => v.startsWith(`${name}=`));
    return row ? row.substring(name.length + 1) : null;
}

function setAuthCookie(token: string) {
    document.cookie = `${AUTH_COOKIE}=${token}; Path=/; Max-Age=86400; SameSite=Lax`;
}

function clearAuthCookie() {
    document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const localToken = localStorage.getItem('token');
        const cookieToken = getCookie(AUTH_COOKIE);
        const activeToken = localToken || cookieToken;

        if (activeToken) {
            const decoded = decodeToken(activeToken);
            if (decoded) {
                localStorage.setItem('token', activeToken);
                setAuthCookie(activeToken);
                setToken(activeToken);
                setUser(decoded);
            } else {
                localStorage.removeItem('token');
                clearAuthCookie();
                setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, role } = res.data;
        localStorage.setItem('token', token);
        setAuthCookie(token);
        setToken(token);
        const decoded = decodeToken(token);
        if (decoded) setUser(decoded);
        if (role === 'parent') router.push('/dashboard');
        else if (role === 'child') router.push('/panel');
        else if (role === 'super_admin') router.push('/super-admin');
    };

    const logout = () => {
        localStorage.removeItem('token');
        clearAuthCookie();
        setToken(null);
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
