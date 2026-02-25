'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import api from '@/lib/api';

export default function UserPanelPage() {
    const { logout } = useAuth();
    const { user, loading, isAuthorized } = useRoleGuard(['child']);
    const [tasks, setTasks] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'leaderboard'>('tasks');
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    useEffect(() => {
        if (loading || !isAuthorized || !user) return;
        fetchData(user.id, currentDate);
    }, [loading, isAuthorized, user, currentDate]);

    useEffect(() => {
        if (activeTab === 'leaderboard' && isAuthorized && user) {
            fetchLeaderboard();
        }
    }, [activeTab, isAuthorized, user]);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/leaderboard');
            setLeaderboard(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchData = async (childId: string, date: string) => {
        try {
            const [tasksRes, rewardsRes, balanceRes, logsRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/rewards'),
                api.get(`/points/${childId}`),
                api.get(`/logs?childId=${childId}&date=${date}`)
            ]);
            setTasks(tasksRes.data);
            setRewards(rewardsRes.data);
            setBalance(balanceRes.data.balance || 0);
            setLogs(logsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setDataLoading(false);
        }
    };

    const updateLog = async (taskId: string, newQuantity: number) => {
        if (!user) return;

        // Optimistic update
        setLogs(prev => {
            const exists = prev.find(l => l.TaskID === taskId);
            if (exists) return prev.map(l => l.TaskID === taskId ? { ...l, Quantity: newQuantity } : l);
            return [...prev, { TaskID: taskId, Quantity: newQuantity }];
        });

        try {
            await api.post('/logs', {
                childId: user.id,
                date: currentDate,
                logs: [{ taskId, quantity: newQuantity }]
            });
            // Refetch balance since we added/removed points
            const balanceRes = await api.get(`/points/${user.id}`);
            setBalance(balanceRes.data.balance || 0);
        } catch (err) {
            console.error('Failed to save log', err);
            // Optionally revert on failure
        }
    };

    const redeemReward = async (rewardId: string, price: number) => {
        if (balance < price) {
            alert('Poin tidak cukup!');
            return;
        }
        try {
            await api.post('/redemptions', { reward_id: rewardId });
            alert('Berhasil menukar hadiah. Menunggu persetujuan orang tua.');
            if (user?.id) fetchData(user.id, currentDate);
        } catch (err) {
            alert('Gagal menukar hadiah.');
        }
    };

    const changeDate = (days: number) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d.toISOString().split('T')[0]);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    if (loading || !isAuthorized || !user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex justify-center py-6 px-4">
            <div className="max-w-[750px] w-full bg-white/85 backdrop-blur-xl border-4 border-white/70 shadow-[0_30px_50px_rgba(241,143,1,0.2),0_20px_40px_rgba(0,60,80,0.1)] rounded-[60px_60px_40px_40px] p-6 pb-10 flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-6">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-700 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                        <i className="fas fa-moon bg-yellow-300 p-3 rounded-full text-amber-800 shadow-[0_8px_0_#b45f06] text-xl transform -translate-y-1"></i>
                        Ramadhan Ceria
                    </h1>
                    <button onClick={logout} className="bg-orange-200 border-4 border-white rounded-full w-12 h-12 flex items-center justify-center text-xl text-amber-900 shadow-[0_8px_0_#b45f06] hover:translate-y-1 hover:shadow-[0_2px_0_#b45f06] transition">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>

                <div className="bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white rounded-[40px_40px_30px_30px] p-4 flex flex-col items-center shadow-[0_10px_0_#bb6b2e] w-full max-w-sm mb-6">
                    <span className="text-5xl drop-shadow-sm mb-2">{user.avatar || '👦'}</span>
                    <span className="font-extrabold text-amber-900 text-xl">{user.name}</span>
                    <span className="text-5xl font-black text-green-800 drop-shadow-md my-2">{balance}</span>
                    <span className="text-sm bg-white/70 px-4 py-1.5 rounded-full font-bold text-amber-900">Total Poin Saat Ini</span>
                </div>

                <div className="w-full mb-6">
                    <div className="flex bg-white/50 border-4 border-white rounded-[40px] p-2 gap-2 shadow-[0_6px_0_#b8772e] md:text-base text-sm font-bold overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex-1 py-3 px-4 rounded-[30px] transition whitespace-nowrap ${activeTab === 'tasks' ? 'bg-orange-400 text-white shadow-[0_4px_0_#9f5100]' : 'text-amber-800 hover:bg-white/70 hover:shadow-sm'}`}
                        >
                            <i className="fas fa-check-circle mr-2"></i> Tugas Harian
                        </button>
                        <button
                            onClick={() => setActiveTab('rewards')}
                            className={`flex-1 py-3 px-4 rounded-[30px] transition whitespace-nowrap ${activeTab === 'rewards' ? 'bg-orange-400 text-white shadow-[0_4px_0_#9f5100]' : 'text-amber-800 hover:bg-white/70 hover:shadow-sm'}`}
                        >
                            <i className="fas fa-gift mr-2"></i> Klaim Hadiah
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex-1 py-3 px-4 rounded-[30px] transition whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-orange-400 text-white shadow-[0_4px_0_#9f5100]' : 'text-amber-800 hover:bg-white/70 hover:shadow-sm'}`}
                        >
                            <i className="fas fa-trophy mr-2"></i> Klasemen
                        </button>
                    </div>
                </div>

                {activeTab === 'tasks' && (
                    <>
                        <div className="flex items-center justify-between bg-orange-100 border-4 border-white rounded-[60px] p-1 mb-8 shadow-[0_6px_0_#b8772e] w-full mx-auto max-w-sm">
                            <button onClick={() => changeDate(-1)} className="bg-orange-300 border-2 border-white text-2xl w-10 h-10 rounded-full flex items-center justify-center text-amber-900 shadow-[0_4px_0_#9f5100] active:translate-y-1 active:shadow-none transition"><i className="fas fa-chevron-left"></i></button>
                            <span className="font-bold text-amber-900">{formatDate(currentDate)}</span>
                            <button onClick={() => changeDate(1)} className="bg-orange-300 border-2 border-white text-2xl w-10 h-10 rounded-full flex items-center justify-center text-amber-900 shadow-[0_4px_0_#9f5100] active:translate-y-1 active:shadow-none transition"><i className="fas fa-chevron-right"></i></button>
                        </div>

                        <div className="bg-amber-50 border-4 border-white rounded-[50px] p-6 w-full mb-8 shadow-[0_12px_0_#cc8e4b]">
                            <h2 className="text-2xl font-extrabold text-amber-900 mb-4 ml-2"><i className="fas fa-check-circle"></i> Tugas Hari Ini</h2>
                            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                                {dataLoading ? <p className="text-center font-bold text-amber-900">Memuat tugas...</p> : tasks.length === 0 ? <p className="text-center font-bold text-amber-900">Belum ada tugas</p> : tasks.map(task => {
                                    const taskPoints = task.Points || task.PointPerUnit || 0;
                                    const logData = logs.find(l => l.TaskID === task.ID);
                                    const quantity = logData ? logData.Quantity : 0;

                                    return (
                                        <div key={task.ID} className="flex flex-wrap items-center gap-4 py-3 px-4 border-b-2 border-dashed border-yellow-400 hover:bg-orange-100 transition rounded-[40px]">
                                            <span className="text-3xl drop-shadow-md">{task.Icon || '📋'}</span>
                                            <span className="flex-1 font-bold text-amber-900 min-w-[120px]">{task.Name}</span>
                                            <span className="bg-orange-200 border-2 border-white rounded-full px-3 py-1 font-extrabold text-amber-900 text-sm whitespace-nowrap">
                                                {taskPoints} poin
                                            </span>
                                            <div className="flex items-center gap-3 bg-white/50 rounded-full px-2 py-1">
                                                <button onClick={() => quantity > 0 && updateLog(task.ID, quantity - 1)} className="w-8 h-8 rounded-full border-2 border-white bg-orange-300 text-amber-900 font-bold text-lg shadow-[0_2px_0_#9f5100] active:translate-y-0.5 active:shadow-none flex items-center justify-center">
                                                    -
                                                </button>
                                                <span className="font-extrabold text-lg text-amber-900 w-4 text-center">{quantity}</span>
                                                <button onClick={() => updateLog(task.ID, quantity + 1)} className="w-8 h-8 rounded-full border-2 border-white bg-orange-400 text-white font-bold text-lg shadow-[0_2px_0_#9f5100] active:translate-y-0.5 active:shadow-none flex items-center justify-center">
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'rewards' && (
                    <div className="bg-orange-100 border-4 border-white rounded-[50px] p-6 w-full shadow-[0_12px_0_#b8772e] mb-8">
                        <h2 className="text-2xl font-extrabold text-amber-900 mb-6 flex items-center gap-3">
                            <i className="fas fa-gift"></i> Yuk Tukar Poin!
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {dataLoading ? <p className="font-bold text-amber-900 col-span-3">Memuat hadiah...</p> : rewards.length === 0 ? <p className="font-bold text-amber-900 col-span-3">Belum ada hadiah</p> : rewards.map(reward => {
                                const price = reward.PointsRequired || reward.Price || 0;
                                return (
                                    <div key={reward.ID} className="bg-white border-4 border-orange-200 rounded-[40px] p-4 text-center shadow-[0_8px_0_#d47f2a] transition flex flex-col justify-between">
                                        <div className="font-extrabold text-amber-900 flex flex-col items-center gap-2 mb-3">
                                            <span className="text-4xl drop-shadow-md mb-2">{reward.Icon || '🎁'}</span>
                                            <span className="text-sm">{reward.Name}</span>
                                        </div>
                                        <div>
                                            <div className="bg-orange-200 border-2 border-white rounded-full px-4 py-1 text-sm font-bold text-amber-900 inline-block mb-4">
                                                {price} poin
                                            </div>
                                            <button
                                                onClick={() => redeemReward(reward.ID, price)}
                                                disabled={balance < price}
                                                className="w-full bg-orange-500 border-2 border-white rounded-full py-2 font-bold text-white shadow-[0_4px_0_#9f5100] text-sm disabled:bg-orange-300 disabled:shadow-[0_4px_0_#b47a46] disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                Tukar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="bg-yellow-50 border-4 border-white rounded-[50px] p-6 w-full shadow-[0_12px_0_#d9a04a] mb-8">
                        <h2 className="text-2xl font-extrabold text-amber-900 mb-6 flex items-center gap-3">
                            <i className="fas fa-trophy text-yellow-500"></i> Papan Klasemen
                        </h2>
                        <div className="text-center p-8 bg-white/70 border-4 border-dashed border-yellow-200 rounded-[30px] font-bold text-amber-800">
                            Fitur klasemen sedang dimuat... (Data Leaderboard API akan ditampilkan di sini)
                        </div>
                    </div>
                )}

                <div className="mt-8 text-amber-700 font-bold text-center border-t-2 border-amber-200/50 pt-4 w-full">
                    ✨ klik + / - untuk catat jumlah tugas · poin otomatis ✨
                </div>
            </div>
        </div>
    );
}
