'use client';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const { user, loading, isAuthorized } = useRoleGuard(['parent']);
    const pathname = usePathname();

    if (loading || !isAuthorized || !user) return null;

    const menuItems = [
        { name: 'Beranda', href: '/dashboard', icon: 'fa-home', mobileLabel: 'Beranda' },
        { name: 'Kelola Anak', href: '/dashboard/children', icon: 'fa-child', mobileLabel: 'Anak' },
        { name: 'Kelola Misi', href: '/dashboard/tasks', icon: 'fa-tasks', mobileLabel: 'Misi' },
        { name: 'Katalog Hadiah', href: '/dashboard/rewards', icon: 'fa-gift', mobileLabel: 'Hadiah' },
        { name: 'Profil', href: '/dashboard/settings', icon: 'fa-user-circle', mobileLabel: 'Profil' },
    ];

    return (
        <div className="bg-[linear-gradient(145deg,_#f9f0d4_0%,_#fce2c1_100%)] text-gray-800 font-sans min-h-screen pb-20 md:pb-0 md:flex">
            {/* MOBILE BOTTOM NAV */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-white/50 flex justify-around p-3 z-50 shadow-[0_-4px_15px_-1px_rgba(217,119,6,0.1)]">
                {menuItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href} className={`flex flex-col items-center ${isActive ? 'text-[#d97706] font-bold' : 'text-gray-400 hover:text-[#f59e0b]'}`}>
                            <i className={`fas ${item.icon} text-xl mb-1`}></i>
                            <span className="text-[10px]">{item.mobileLabel}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 bg-white/85 backdrop-blur-md border-r-4 border-white flex-col h-screen fixed shadow-[5px_0_15px_-5px_rgba(217,119,6,0.1)]">
                <div className="p-6 text-center border-b border-gray-100">
                    <h1 className="text-xl font-bold text-[#d97706] flex items-center justify-center gap-2">
                        <i className="fas fa-moon text-[#f59e0b]"></i> Ramadhan Ceria
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-semibold">Keluarga {user.name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${isActive ? 'bg-[#fce2c1] text-[#d97706] shadow-sm border border-[#f9a826]/30' : 'text-gray-500 hover:bg-white/50 hover:text-[#f59e0b]'}`}>
                                <i className={`fas ${item.icon} w-5`}></i> {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-500 rounded-lg font-medium transition w-full">
                        <i className="fas fa-sign-out-alt w-5 text-center"></i> Keluar
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-4xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
