'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/leaderboard');
            const data = res.data || [];
            // Sort by points descending
            data.sort((a: any, b: any) => (b.Points || 0) - (a.Points || 0));
            setLeaderboard(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Podium order: [Rank 2] [Rank 1] [Rank 3]
    const podiumData = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);
    const podiumOrder = [podiumData[1], podiumData[0], podiumData[2]].filter(Boolean);

    const podiumConfig = [
        { height: 'h-36 md:h-48', color: 'from-gray-400 to-gray-300', border: 'border-gray-300', delay: '0.3s', medal: '🥈' },
        { height: 'h-48 md:h-64', color: 'from-[#d97706] to-[#f59e0b]', border: 'border-[#f59e0b]', delay: '0.6s', medal: '🥇' },
        { height: 'h-24 md:h-36', color: 'from-orange-700 to-orange-500', border: 'border-orange-500', delay: '0.9s', medal: '🥉' },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden font-sans select-none pb-10"
            style={{ background: 'radial-gradient(circle at top, #312e81 0%, #1e1b4b 60%, #0f172a 100%)' }}>

            {/* STARS & MOON DECORATIONS */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <i className="fas fa-star absolute top-10 left-10 text-[#fbbf24] text-2xl animate-pulse opacity-70"></i>
                <i className="fas fa-star absolute top-32 right-20 text-yellow-200 text-sm animate-pulse opacity-50" style={{ animationDelay: '1s' }}></i>
                <i className="fas fa-star absolute top-1/4 left-1/3 text-white text-xl animate-pulse opacity-40" style={{ animationDelay: '0.5s' }}></i>
                <i className="fas fa-moon absolute top-12 right-12 text-[#fef3c7] text-6xl opacity-30" style={{ animation: 'float 4s ease-in-out infinite' }}></i>
            </div>

            {/* HEADER */}
            <header className="w-full p-6 flex justify-between items-center z-10">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white transition-colors">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="text-center">
                    <span className="bg-[#f59e0b]/20 text-[#fbbf24] px-4 py-1.5 rounded-full text-sm font-bold border border-[#f59e0b]/30">
                        Ramadhan 2026
                    </span>
                </div>
                <div className="w-12 h-12"></div>
            </header>

            {/* TITLE */}
            <div className="z-10 text-center mt-2 mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#fef3c7] via-[#fbbf24] to-[#f59e0b] drop-shadow-lg mb-2">
                    Pahlawan Kebaikan! 🏆
                </h1>
                <p className="text-indigo-200 font-medium text-lg">Semuanya hebat, tetap semangat beramal!</p>
            </div>

            {/* PODIUM */}
            <main className="w-full max-w-3xl px-4 z-10 flex-1 flex flex-col justify-end">
                {loading ? (
                    <div className="text-center text-white/60 font-bold text-lg mb-20">Memuat klasemen...</div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center text-white/60 font-bold text-lg mb-20">Belum ada data klasemen.</div>
                ) : (
                    <>
                        <div className="flex items-end justify-center gap-2 md:gap-6 h-64 md:h-80">
                            {podiumOrder.map((child, index) => {
                                if (!child) return null;
                                const config = podiumConfig[index];
                                const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
                                const crown = rank === 1 ? (
                                    <i className="fas fa-crown absolute -top-8 text-[#fbbf24] text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]"></i>
                                ) : null;

                                return (
                                    <div key={child.ID || index} className="flex flex-col items-center justify-end w-24 md:w-32"
                                        style={{ animation: `riseUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`, animationDelay: config.delay, opacity: 0 }}>
                                        <div className="relative flex flex-col items-center mb-4 z-20">
                                            {crown}
                                            <div className={`w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-4xl md:text-5xl border-4 ${config.border} shadow-[0_0_30px_rgba(251,191,36,0.6)] mb-2`}>
                                                {child.Avatar || '👦'}
                                            </div>
                                            <div className="bg-[#0f172a]/80 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                                                <span className="font-bold text-white text-sm md:text-base">{child.Name}</span>
                                            </div>
                                            <div className="text-[#fbbf24] font-black text-lg md:text-xl mt-1 drop-shadow-md">
                                                {child.Points || 0} <span className="text-xs font-normal">pts</span>
                                            </div>
                                        </div>
                                        <div className={`w-full ${config.height} bg-gradient-to-t ${config.color} rounded-t-2xl flex justify-center pt-4 border-t-4 border-white/30 relative overflow-hidden shadow-[inset_0_10px_20px_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.5)]`}>
                                            <div className="absolute inset-0 bg-white/10 w-1/2"></div>
                                            <span className="text-4xl md:text-5xl font-black text-white/90 drop-shadow-md">{rank}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Others below podium */}
                        {others.length > 0 && (
                            <div className="mt-12 bg-white/10 backdrop-blur-md rounded-3xl p-4 max-w-lg mx-auto w-full border border-white/10">
                                {others.map((child, i) => (
                                    <div key={child.ID || i} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors mb-2 last:mb-0 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[#fef3c7]">{i + 4}</div>
                                            <div className="text-2xl">{child.Avatar || '👦'}</div>
                                            <div className="font-bold text-white text-lg">{child.Name}</div>
                                        </div>
                                        <div className="font-black text-[#fbbf24] text-lg">{child.Points || 0} <span className="text-sm font-normal text-[#fef3c7]">pts</span></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes riseUp {
                    0% { transform: translateY(100px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
