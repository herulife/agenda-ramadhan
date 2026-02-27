'use client';
import { useState, useMemo, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

const fetcher = (url: string) => api.get(url).then(res => res.data);

// Helper: local date string YYYY-MM-DD
function getLocalDate(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const weekday = d.toLocaleDateString('id-ID', { weekday: 'long' });
    const day = d.toLocaleDateString('id-ID', { day: 'numeric' });
    const month = d.toLocaleDateString('id-ID', { month: 'short' });
    return `Hari ${weekday} · ${day} ${month}`;
}

export default function KioskPage() {
    const { user } = useAuth();

    // State
    const [selectedChild, setSelectedChild] = useState<number>(0);
    const [currentDate, setCurrentDate] = useState(getLocalDate());
    const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());

    // Fetch family data
    const { data: children = [] } = useSWR('/children', fetcher);
    const { data: tasks = [] } = useSWR('/tasks', fetcher);
    const { data: rewards = [] } = useSWR('/rewards', fetcher);

    // Fetch balance + logs per child
    const activeChild = children[selectedChild];
    const activeChildId = activeChild?.ID;

    const { data: balanceData, mutate: mutateBalance } = useSWR(
        activeChildId ? `/points/${activeChildId}` : null, fetcher
    );
    const { data: logs = [], mutate: mutateLogs } = useSWR(
        activeChildId ? `/logs?childId=${activeChildId}&date=${currentDate}` : null, fetcher
    );

    // Fetch all children balances for the top cards
    const allChildBalances = useSWR(
        children.length > 0 ? 'all-child-balances' : null,
        async () => {
            const results = await Promise.all(
                children.map((c: any) => api.get(`/points/${c.ID}`).then(r => r.data).catch(() => ({ balance: 0 })))
            );
            return results;
        }
    );

    // Build a map of task completions for the current child + day
    const taskCountMap = useMemo(() => {
        const map: Record<string, { count: number; logIds: string[] }> = {};
        if (!Array.isArray(logs)) return map;
        for (const log of logs) {
            const tid = log.TaskID;
            if (!map[tid]) map[tid] = { count: 0, logIds: [] };
            map[tid].count++;
            map[tid].logIds.push(log.ID);
        }
        return map;
    }, [logs]);

    const balance = balanceData?.balance || balanceData?.Balance || 0;

    // ==================== HANDLERS ====================

    // + Button: Complete task
    const handleIncrement = useCallback(async (task: any) => {
        if (!activeChildId || processingTasks.has(task.ID)) return;
        setProcessingTasks(prev => new Set([...prev, task.ID]));

        // Optimistic
        const origLogs = logs ? [...logs] : [];
        const origBalance = balance;
        mutateLogs([...origLogs, { TaskID: task.ID, Status: 'verified', ID: 'temp-' + Date.now() }], false);
        mutateBalance({ balance: origBalance + (task.PointReward || task.point || 0) }, false);

        try {
            await api.post('/parent/kiosk/complete', { child_id: activeChildId, task_id: task.ID, date: currentDate });
            toast.success(`+${task.PointReward || task.point} poin! 🌟`, {
                style: { border: '3px solid #fbbf24', background: '#fffbeb', color: '#b45f06', fontWeight: 'bold' },
                duration: 1500,
            });
            mutateLogs();
            mutateBalance();
            allChildBalances.mutate();
        } catch (err: any) {
            mutateLogs(origLogs, false);
            mutateBalance({ balance: origBalance }, false);
            if (err.response?.status === 409) {
                toast.info('Sudah dicatat hari ini! ✅', { duration: 1500 });
                mutateLogs();
            } else {
                toast.error('Gagal, coba lagi');
            }
        } finally {
            setProcessingTasks(prev => { const n = new Set(prev); n.delete(task.ID); return n; });
        }
    }, [activeChildId, logs, balance, currentDate, processingTasks, mutateLogs, mutateBalance, allChildBalances]);

    // - Button: Undo task
    const handleDecrement = useCallback(async (task: any) => {
        const entry = taskCountMap[task.ID];
        if (!entry || entry.count === 0) return;

        const logId = entry.logIds[entry.logIds.length - 1]; // undo last
        if (!logId || logId.startsWith('temp-')) return;

        setProcessingTasks(prev => new Set([...prev, task.ID]));

        const origLogs = logs ? [...logs] : [];
        const origBalance = balance;
        mutateLogs(origLogs.filter((l: any) => l.ID !== logId), false);
        mutateBalance({ balance: origBalance - (task.PointReward || task.point || 0) }, false);

        try {
            await api.post(`/parent/logs/${logId}/undo`);
            toast.success(`Dibatalkan -${task.PointReward || task.point} poin`, {
                style: { border: '3px solid #fca5a5', background: '#fef2f2', color: '#991b1b', fontWeight: 'bold' },
                duration: 1500,
            });
            mutateLogs();
            mutateBalance();
            allChildBalances.mutate();
        } catch {
            mutateLogs(origLogs, false);
            mutateBalance({ balance: origBalance }, false);
            toast.error('Gagal membatalkan');
        } finally {
            setProcessingTasks(prev => { const n = new Set(prev); n.delete(task.ID); return n; });
        }
    }, [taskCountMap, logs, balance, mutateLogs, mutateBalance, allChildBalances]);

    // Redeem reward
    const handleRedeem = useCallback(async (reward: any, childIdx: number) => {
        const child = children[childIdx];
        if (!child) return;
        const childBal = allChildBalances.data?.[childIdx]?.balance ?? 0;
        const price = reward.PointsRequired || reward.price || 0;

        if (childBal < price) {
            toast.error(`Poin ${child.Name} tidak cukup!`);
            return;
        }

        try {
            await api.post('/redemptions', {
                childId: child.ID,
                rewardId: reward.ID,
            });
            toast.success(`${child.Name} tukar ${reward.Name || reward.name}! 🎁`, {
                style: { border: '3px solid #86efac', background: '#f0fdf4', color: '#166534', fontWeight: 'bold' },
                duration: 2000,
            });
            allChildBalances.mutate();
            mutateBalance();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal tukar hadiah');
        }
    }, [children, allChildBalances, mutateBalance]);

    // Date navigation
    const goDate = (offset: number) => {
        const d = new Date(currentDate + 'T00:00:00');
        d.setDate(d.getDate() + offset);
        const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setCurrentDate(newDate);
    };

    const isToday = currentDate === getLocalDate();

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen flex justify-center p-3 sm:p-4 font-sans select-none" style={{ background: 'linear-gradient(145deg, #f9f0d4 0%, #fce2c1 100%)' }}>
            <div className="w-full max-w-[750px]" style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '60px 60px 40px 40px',
                boxShadow: '0 30px 50px rgba(241,143,1,0.2), 0 20px 40px rgba(0,60,80,0.1)',
                border: '3px solid rgba(255,255,255,0.67)',
                padding: '28px 18px 35px',
                overflow: 'hidden',
            }}>

                {/* ===== HEADER ===== */}
                <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
                    <h1 className="text-[2rem] sm:text-[2.2rem] font-[800] flex items-center gap-3" style={{
                        background: 'linear-gradient(135deg, #b43b0d, #e97c1f)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px',
                    }}>
                        <i className="fas fa-moon" style={{
                            background: '#ffd966', padding: 12, borderRadius: '50%',
                            color: '#b45f06', fontSize: '1.5rem',
                            boxShadow: '0 8px 0 #b45f06', transform: 'translateY(-3px)',
                            WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'unset',
                        }}></i>
                        Ramadhan Ceria
                    </h1>
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm rounded-full px-5 py-3 border-[3px] border-white transition-all" style={{
                        background: '#ffcf8a', color: '#7b4a1e',
                        boxShadow: '0 6px 0 #b45f06',
                    }}>
                        <i className="fas fa-arrow-left"></i> Kembali
                    </Link>
                </div>

                {/* ===== BALANCE CARDS ===== */}
                <div className="flex flex-wrap gap-3 mb-6 justify-center">
                    {children.map((child: any, idx: number) => {
                        const bal = allChildBalances.data?.[idx]?.balance ?? 0;
                        return (
                            <div key={child.ID} className="flex-1 min-w-[120px] max-w-[180px] flex flex-col items-center py-3 px-2 transition-transform hover:scale-[1.02]" style={{
                                background: 'linear-gradient(145deg, #feeac2, #ffd9a3)',
                                borderRadius: '40px 40px 30px 30px',
                                border: '3px solid white',
                                boxShadow: '0 10px 0 #bb6b2e, 0 6px 15px rgba(230,147,62,0.5)',
                            }}>
                                <span className="text-3xl drop-shadow-sm">{child.AvatarIcon || '👦'}</span>
                                <span className="font-[800] text-[#6b3f00] text-base mt-1">{child.Name}</span>
                                <span className="text-[2.2rem] font-[900] text-[#1f6d3b] leading-tight" style={{ textShadow: '2px 2px 0 #ffe3b0' }}>
                                    {bal}
                                </span>
                                <span className="text-xs bg-white/60 px-3 py-1 rounded-full text-[#563e1f] font-semibold">
                                    koin
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ===== CHILD TABS ===== */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {children.map((child: any, idx: number) => (
                        <button
                            key={child.ID}
                            onClick={() => setSelectedChild(idx)}
                            className="flex-1 min-w-[100px] py-3 font-bold text-sm sm:text-base rounded-full border-[3px] border-white transition-all"
                            style={idx === selectedChild ? {
                                background: '#fb8b2c', color: 'white',
                                boxShadow: '0 8px 0 #9f5100', transform: 'scale(0.98)',
                            } : {
                                background: '#ffe8c7', color: '#8d5200',
                                boxShadow: '0 6px 0 #b8772e',
                            }}
                        >
                            {child.AvatarIcon || '👦'} {child.Name}
                        </button>
                    ))}
                </div>

                {/* ===== DATE NAV ===== */}
                <div className="flex items-center justify-between mb-6 rounded-full px-3 py-1.5" style={{
                    background: '#ffeacc', border: '3px solid white', boxShadow: '0 6px 0 #b8772e',
                }}>
                    <button onClick={() => goDate(-1)} className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-2xl border-[3px] border-white" style={{
                        background: '#ffb156', color: '#633d0e', boxShadow: '0 4px 0 #9f5100',
                    }}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <span className="font-[800] text-base sm:text-lg text-[#492d0b] bg-white py-2 px-4 rounded-full" style={{ boxShadow: 'inset 0 -3px 0 #e6b881' }}>
                        {formatDateDisplay(currentDate)}{isToday && ' ✨'}
                    </span>
                    <button onClick={() => goDate(1)} className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-2xl border-[3px] border-white" style={{
                        background: '#ffb156', color: '#633d0e', boxShadow: '0 4px 0 #9f5100',
                    }}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                {/* ===== TASK LIST ===== */}
                <div className="mb-8 overflow-y-auto max-h-[420px] scrollbar-hide" style={{
                    background: '#fef9e6', borderRadius: 50, padding: '22px 14px',
                    border: '4px solid white',
                    boxShadow: '0 12px 0 #cc8e4b, 0 8px 20px #f1b36b',
                }}>
                    {tasks.length === 0 ? (
                        <p className="text-center font-bold text-[#8d5200] py-6">Belum ada tugas 📝</p>
                    ) : tasks.map((task: any) => {
                        const count = taskCountMap[task.ID]?.count || 0;
                        const points = task.PointReward || task.point || 0;
                        const maxPerDay = task.MaxPerDay ?? 1;
                        const atMax = maxPerDay > 0 && count >= maxPerDay;
                        const isProcessing = processingTasks.has(task.ID);

                        return (
                            <div key={task.ID} className={`flex items-center gap-3 py-3 px-2.5 border-b-2 border-dashed border-[#ffc107] rounded-[40px] transition-colors ${atMax ? 'bg-[#e8f5e9]' : 'hover:bg-[#ffefd2]'}`}>
                                <span className="text-xl w-9 text-center drop-shadow-sm">{task.Icon || '📌'}</span>
                                <div className="flex-1">
                                    <span className="font-semibold text-[#3b280b] text-sm sm:text-base">{task.Name}</span>
                                    <div className="text-[10px] text-[#8d5200] font-medium mt-0.5">
                                        {maxPerDay === 0 ? '∞' : `${count}/${maxPerDay}`}
                                    </div>
                                </div>
                                <span className="bg-[#ffd89c] rounded-full px-3 py-1 font-[800] text-[#5e3200] text-xs border-2 border-white whitespace-nowrap">
                                    {points} poin
                                </span>
                                <div className="flex items-center gap-2">
                                    {/* - Button */}
                                    <button
                                        onClick={() => handleDecrement(task)}
                                        disabled={count === 0 || isProcessing}
                                        className="w-8 h-8 rounded-full border-2 border-white font-[800] text-lg flex items-center justify-center transition-all disabled:opacity-40"
                                        style={{
                                            background: count > 0 ? '#ff7b7b' : '#ccc',
                                            color: 'white',
                                            boxShadow: count > 0 ? '0 4px 0 #b91c1c' : 'none',
                                        }}
                                    >
                                        −
                                    </button>
                                    {/* Count */}
                                    <span className={`min-w-[28px] text-center font-bold text-lg ${count > 0 ? 'text-[#1f6d3b]' : 'text-[#5e3200]'}`}>
                                        {isProcessing ? <i className="fas fa-spinner fa-spin text-sm"></i> : count}
                                    </span>
                                    {/* + Button */}
                                    <button
                                        onClick={() => handleIncrement(task)}
                                        disabled={isProcessing || atMax}
                                        className="w-8 h-8 rounded-full border-2 border-white font-[800] text-lg flex items-center justify-center transition-all disabled:opacity-50"
                                        style={{
                                            background: atMax ? '#4ade80' : '#ffb156',
                                            color: 'white',
                                            boxShadow: atMax ? '0 4px 0 #16a34a' : '0 4px 0 #9f5100',
                                        }}
                                    >
                                        {atMax ? '✓' : '+'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ===== REWARD SECTION ===== */}
                <div style={{
                    background: '#fce9cf',
                    borderRadius: '60px 60px 30px 30px',
                    padding: '26px 16px',
                    border: '5px solid white',
                    boxShadow: '0 12px 0 #b8772e, 0 12px 25px #e79a4e',
                    marginTop: 25,
                }}>
                    <h2 className="text-2xl sm:text-[2rem] font-[800] text-[#793f0e] flex items-center gap-3 mb-5">
                        <i className="fas fa-gift"></i> Yuk Tukar Poin!
                    </h2>

                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
                        {rewards.map((reward: any) => {
                            const price = reward.PointsRequired || reward.price || 0;
                            return (
                                <div key={reward.ID} className="p-4 transition-all" style={{
                                    background: 'white', borderRadius: 40,
                                    border: '3px solid #fec382',
                                    boxShadow: '0 8px 0 #d47f2a, 0 6px 12px rgba(0,0,0,0.1)',
                                }}>
                                    <div className="font-[800] text-[#5d3b12] text-sm mb-1 flex items-center gap-1">
                                        <span>{reward.Icon || '🎁'}</span> {reward.Name}
                                    </div>
                                    <div className="inline-block bg-[#fecb8b] rounded-full px-3 py-1 font-bold text-sm border-2 border-white mb-3">
                                        {price} poin
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {children.map((child: any, cIdx: number) => {
                                            const childBal = allChildBalances.data?.[cIdx]?.balance ?? 0;
                                            const canRedeem = childBal >= price;
                                            return (
                                                <button
                                                    key={child.ID}
                                                    onClick={() => handleRedeem(reward, cIdx)}
                                                    disabled={!canRedeem}
                                                    className="flex items-center justify-between rounded-full py-2 pl-3 pr-2.5 font-bold text-xs text-white border-[3px] border-white transition-all disabled:opacity-60"
                                                    style={canRedeem ? {
                                                        background: '#f09b22',
                                                        boxShadow: '0 4px 0 #9f5100',
                                                    } : {
                                                        background: '#cfa87a',
                                                        boxShadow: '0 4px 0 #7b572b',
                                                        pointerEvents: 'none' as const,
                                                    }}
                                                >
                                                    <span>{child.AvatarIcon || '👦'} {child.Name}</span>
                                                    <span className="bg-[#fdeaac] rounded-full px-2 py-0.5 text-[#633d0e] font-[800]">
                                                        Tukar
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== FOOTER ===== */}
                <footer className="text-center text-[#7a5d3b] mt-8 text-sm font-semibold">
                    ✨ klik + / − untuk catat tugas · poin otomatis ✨
                </footer>

            </div>
        </div>
    );
}
