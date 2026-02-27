'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => api.get(url).then(res => res.data);

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

// ============================================================
// PHASE 1: CHILD SELECTOR (Netflix-style picks)
// ============================================================
function ChildSelector({ children, onSelect }: { children: any[], onSelect: (child: any) => void }) {
    return (
        <div className="min-h-screen flex justify-center items-center p-4 font-sans select-none" style={{ background: 'linear-gradient(145deg, #f9f0d4 0%, #fce2c1 100%)' }}>
            <div className="w-full max-w-lg text-center" style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '60px',
                boxShadow: '0 30px 50px rgba(241,143,1,0.2)',
                border: '3px solid rgba(255,255,255,0.67)',
                padding: '40px 24px',
            }}>
                <div className="mb-2 text-5xl">🌙</div>
                <h1 className="text-2xl sm:text-3xl font-[800] mb-2" style={{
                    background: 'linear-gradient(135deg, #b43b0d, #e97c1f)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Siapa hari ini?</h1>
                <p className="text-[#8d5200] font-semibold mb-8">Pilih jagoan yang mau mengerjakan tugas</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {children.map((child: any) => (
                        <button
                            key={child.ID}
                            onClick={() => onSelect(child)}
                            className="flex flex-col items-center gap-2 py-5 px-3 rounded-[40px] border-[3px] border-white transition-all hover:scale-[1.03] active:scale-95"
                            style={{
                                background: 'linear-gradient(145deg, #feeac2, #ffd9a3)',
                                boxShadow: '0 8px 0 #bb6b2e, 0 6px 15px rgba(230,147,62,0.4)',
                            }}
                        >
                            <span className="text-5xl drop-shadow-md">{child.AvatarIcon || '👦'}</span>
                            <span className="font-[800] text-[#6b3f00] text-lg">{child.Name}</span>
                        </button>
                    ))}
                </div>

                <Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-sm text-[#7b4a1e] bg-[#ffcf8a] px-6 py-3 rounded-full border-[3px] border-white" style={{ boxShadow: '0 4px 0 #b45f06' }}>
                    <i className="fas fa-arrow-left"></i> Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
}

// ============================================================
// PHASE 2: PIN VERIFICATION
// ============================================================
function PinVerify({ child, onVerified, onBack }: { child: any, onVerified: () => void, onBack: () => void }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);

    const handleDigit = (digit: string) => {
        if (pin.length >= 4) return;
        const newPin = pin + digit;
        setPin(newPin);
        setError('');

        if (newPin.length === 4) {
            verifyPin(newPin);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const verifyPin = async (pinValue: string) => {
        setChecking(true);
        try {
            await api.post('/parent/verify-pin', { childId: child.ID, pin: pinValue });
            onVerified();
        } catch (err: any) {
            setPin('');
            setError(err.response?.data?.error || 'PIN salah!');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center p-4 font-sans select-none" style={{ background: 'linear-gradient(145deg, #f9f0d4 0%, #fce2c1 100%)' }}>
            <div className="w-full max-w-sm text-center" style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '60px',
                boxShadow: '0 30px 50px rgba(241,143,1,0.2)',
                border: '3px solid rgba(255,255,255,0.67)',
                padding: '40px 24px',
            }}>
                <span className="text-6xl block mb-3">{child.AvatarIcon || '👦'}</span>
                <h2 className="text-xl font-[800] text-[#6b3f00] mb-1">{child.Name}</h2>
                <p className="text-[#8d5200] font-semibold mb-6">Masukkan PIN 4 digit</p>

                {/* PIN dots */}
                <div className="flex justify-center gap-4 mb-6">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center text-2xl font-[900]" style={{
                            background: pin[i] ? '#fb8b2c' : '#ffeacc',
                            boxShadow: pin[i] ? '0 4px 0 #9f5100' : '0 4px 0 #b8772e',
                            color: pin[i] ? 'white' : '#ccc',
                        }}>
                            {pin[i] ? '●' : ''}
                        </div>
                    ))}
                </div>

                {error && <p className="text-red-500 font-bold mb-4 animate-pulse">{error}</p>}
                {checking && <p className="text-[#b45f06] font-bold mb-4"><i className="fas fa-spinner fa-spin"></i> Memeriksa...</p>}

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((key, i) => {
                        if (key === '') return <div key={`empty-${i}`}></div>;
                        return (
                            <button
                                key={`btn-${key}`}
                                onClick={() => key === '←' ? handleDelete() : handleDigit(key)}
                                disabled={checking}
                                className="h-14 rounded-full border-[3px] border-white font-[800] text-xl transition-all active:scale-90 disabled:opacity-50"
                                style={{
                                    background: key === '←' ? '#ff9b9b' : '#ffb156',
                                    color: key === '←' ? 'white' : '#633d0e',
                                    boxShadow: key === '←' ? '0 4px 0 #b91c1c' : '0 4px 0 #9f5100',
                                }}
                            >
                                {key === '←' ? <i className="fas fa-backspace"></i> : key}
                            </button>
                        );
                    })}
                </div>

                <button onClick={onBack} className="text-[#8d5200] font-bold text-sm hover:underline">
                    <i className="fas fa-arrow-left mr-1"></i> Ganti Profil
                </button>
            </div>
        </div>
    );
}

// ============================================================
// PHASE 3: TASK PANEL (Kiosk-style for selected child)
// ============================================================
function TaskPanel({ child, onSwitchProfile }: { child: any, onSwitchProfile: () => void }) {
    const [currentDate, setCurrentDate] = useState(getLocalDate());
    const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());

    const { data: tasks = [] } = useSWR('/tasks', fetcher);
    const { data: rewards = [] } = useSWR('/rewards', fetcher);
    const { data: balanceData, mutate: mutateBalance } = useSWR(`/points/${child.ID}`, fetcher);
    const { data: logs = [], mutate: mutateLogs } = useSWR(
        `/logs?childId=${child.ID}&date=${currentDate}`, fetcher
    );

    const balance = balanceData?.balance || balanceData?.Balance || 0;
    const isToday = currentDate === getLocalDate();

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

    // + Button
    const handleIncrement = useCallback(async (task: any) => {
        if (processingTasks.has(task.ID)) return;
        setProcessingTasks(prev => new Set([...prev, task.ID]));

        const origLogs = logs ? [...logs] : [];
        const origBalance = balance;
        mutateLogs([...origLogs, { TaskID: task.ID, Status: 'verified', ID: 'temp-' + Date.now() }], false);
        mutateBalance({ balance: origBalance + (task.PointReward || 0) }, false);

        try {
            await api.post('/parent/kiosk/complete', { child_id: child.ID, task_id: task.ID, date: currentDate });
            toast.success(`Hore! +${task.PointReward} poin! 🌟`, {
                style: { border: '3px solid #fbbf24', background: '#fffbeb', color: '#b45f06', fontWeight: 'bold' },
                duration: 1500,
            });
            mutateLogs();
            mutateBalance();
        } catch (err: any) {
            mutateLogs(origLogs, false);
            mutateBalance({ balance: origBalance }, false);
            if (err.response?.status === 409) {
                toast.info('Sudah dikerjakan hari ini! ✅', { duration: 1500 });
                mutateLogs();
            } else {
                toast.error('Gagal, coba lagi');
            }
        } finally {
            setProcessingTasks(prev => { const n = new Set(prev); n.delete(task.ID); return n; });
        }
    }, [child.ID, logs, balance, currentDate, processingTasks, mutateLogs, mutateBalance]);

    // - Button (undo)
    const handleDecrement = useCallback(async (task: any) => {
        const entry = taskCountMap[task.ID];
        if (!entry || entry.count === 0) return;
        const logId = entry.logIds[entry.logIds.length - 1];
        if (!logId || logId.startsWith('temp-')) return;

        setProcessingTasks(prev => new Set([...prev, task.ID]));
        const origLogs = logs ? [...logs] : [];
        const origBalance = balance;
        mutateLogs(origLogs.filter((l: any) => l.ID !== logId), false);
        mutateBalance({ balance: origBalance - (task.PointReward || 0) }, false);

        try {
            await api.post(`/parent/logs/${logId}/undo`);
            toast.success(`Dibatalkan -${task.PointReward} poin`, {
                style: { border: '3px solid #fca5a5', background: '#fef2f2', color: '#991b1b', fontWeight: 'bold' },
                duration: 1500,
            });
            mutateLogs();
            mutateBalance();
        } catch {
            mutateLogs(origLogs, false);
            mutateBalance({ balance: origBalance }, false);
            toast.error('Gagal membatalkan');
        } finally {
            setProcessingTasks(prev => { const n = new Set(prev); n.delete(task.ID); return n; });
        }
    }, [taskCountMap, logs, balance, mutateLogs, mutateBalance]);

    // Redeem
    const handleRedeem = useCallback(async (reward: any) => {
        const price = reward.PointsRequired || 0;
        if (balance < price) {
            toast.error('Poin belum cukup! 💪');
            return;
        }
        try {
            await api.post('/redemptions', { childId: child.ID, rewardId: reward.ID });
            toast.success(`Yeay! Tukar ${reward.Name}! 🎁`, {
                style: { border: '3px solid #86efac', background: '#f0fdf4', color: '#166534', fontWeight: 'bold' },
                duration: 2000,
            });
            mutateBalance();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal tukar hadiah');
        }
    }, [balance, child.ID, mutateBalance]);

    const goDate = (offset: number) => {
        const d = new Date(currentDate + 'T00:00:00');
        d.setDate(d.getDate() + offset);
        setCurrentDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    };

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

                {/* HEADER */}
                <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
                    <h1 className="text-[1.8rem] sm:text-[2.2rem] font-[800] flex items-center gap-3" style={{
                        background: 'linear-gradient(135deg, #b43b0d, #e97c1f)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        <i className="fas fa-moon" style={{
                            background: '#ffd966', padding: 12, borderRadius: '50%',
                            color: '#b45f06', fontSize: '1.5rem',
                            boxShadow: '0 8px 0 #b45f06', transform: 'translateY(-3px)',
                            WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'unset',
                        }}></i>
                        Ramadhan Ceria
                    </h1>
                    <button onClick={onSwitchProfile} className="flex items-center gap-2 font-bold text-sm rounded-full px-5 py-3 border-[3px] border-white transition-all active:scale-95" style={{
                        background: '#ffcf8a', color: '#7b4a1e',
                        boxShadow: '0 6px 0 #b45f06',
                    }}>
                        <i className="fas fa-exchange-alt"></i> Ganti Profil
                    </button>
                </div>

                {/* BALANCE CARD */}
                <div className="flex justify-center mb-6">
                    <div className="w-full max-w-sm flex items-center gap-5 py-4 px-6 transition-transform hover:scale-[1.02]" style={{
                        background: 'linear-gradient(145deg, #feeac2, #ffd9a3)',
                        borderRadius: '40px 40px 30px 30px',
                        border: '3px solid white',
                        boxShadow: '0 10px 0 #bb6b2e, 0 6px 15px rgba(230,147,62,0.5)',
                    }}>
                        <span className="text-5xl drop-shadow-md">{child.AvatarIcon || '👦'}</span>
                        <div>
                            <p className="font-[800] text-[#6b3f00] text-lg">{child.Name}</p>
                            <p className="text-[2.8rem] font-[900] text-[#1f6d3b] leading-none" style={{ textShadow: '2px 2px 0 #ffe3b0' }}>
                                {balance}
                            </p>
                            <span className="text-xs bg-white/60 px-3 py-1 rounded-full text-[#563e1f] font-semibold">total koin</span>
                        </div>
                    </div>
                </div>

                {/* DATE NAV */}
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

                {/* TASKS */}
                <div className="mb-8 overflow-y-auto max-h-[420px]" style={{
                    background: '#fef9e6', borderRadius: 50, padding: '22px 14px',
                    border: '4px solid white',
                    boxShadow: '0 12px 0 #cc8e4b, 0 8px 20px #f1b36b',
                }}>
                    {tasks.length === 0 ? (
                        <p className="text-center font-bold text-[#8d5200] py-6">Belum ada tugas 📝</p>
                    ) : tasks.map((task: any) => {
                        const count = taskCountMap[task.ID]?.count || 0;
                        const points = task.PointReward || 0;
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
                                    <button onClick={() => handleDecrement(task)} disabled={count === 0 || isProcessing}
                                        className="w-8 h-8 rounded-full border-2 border-white font-[800] text-lg flex items-center justify-center transition-all disabled:opacity-40"
                                        style={{ background: count > 0 ? '#ff7b7b' : '#ccc', color: 'white', boxShadow: count > 0 ? '0 4px 0 #b91c1c' : 'none' }}>
                                        −
                                    </button>
                                    <span className={`min-w-[28px] text-center font-bold text-lg ${count > 0 ? 'text-[#1f6d3b]' : 'text-[#5e3200]'}`}>
                                        {isProcessing ? <i className="fas fa-spinner fa-spin text-sm"></i> : count}
                                    </span>
                                    <button onClick={() => handleIncrement(task)} disabled={isProcessing || atMax}
                                        className="w-8 h-8 rounded-full border-2 border-white font-[800] text-lg flex items-center justify-center transition-all disabled:opacity-50"
                                        style={{ background: atMax ? '#4ade80' : '#ffb156', color: 'white', boxShadow: atMax ? '0 4px 0 #16a34a' : '0 4px 0 #9f5100' }}>
                                        {atMax ? '✓' : '+'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* REWARDS */}
                <div style={{
                    background: '#fce9cf', borderRadius: '60px 60px 30px 30px',
                    padding: '26px 16px', border: '5px solid white',
                    boxShadow: '0 12px 0 #b8772e, 0 12px 25px #e79a4e', marginTop: 25,
                }}>
                    <h2 className="text-2xl sm:text-[2rem] font-[800] text-[#793f0e] flex items-center gap-3 mb-5">
                        <i className="fas fa-gift"></i> Yuk Tukar Poin!
                    </h2>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
                        {rewards.map((reward: any) => {
                            const price = reward.PointsRequired || 0;
                            const canRedeem = balance >= price;
                            return (
                                <div key={reward.ID} className="p-4" style={{
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
                                    <button onClick={() => handleRedeem(reward)} disabled={!canRedeem}
                                        className="w-full flex items-center justify-between rounded-full py-2.5 pl-4 pr-3 font-bold text-sm text-white border-[3px] border-white transition-all disabled:opacity-50"
                                        style={canRedeem ? { background: '#f09b22', boxShadow: '0 4px 0 #9f5100' } : { background: '#cfa87a', boxShadow: '0 4px 0 #7b572b', pointerEvents: 'none' as const }}>
                                        <span>🎁 Tukar</span>
                                        <span className="bg-[#fdeaac] rounded-full px-2.5 py-0.5 text-[#633d0e] font-[800] text-xs">{price} koin</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <footer className="text-center text-[#7a5d3b] mt-8 text-sm font-semibold">
                    ✨ klik + / − untuk catat tugas · poin otomatis ✨
                </footer>
            </div>
        </div>
    );
}

// ============================================================
// MAIN PAGE: Orchestrates the 3 phases
// ============================================================
export default function PanelPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [pinVerified, setPinVerified] = useState(false);

    const { data: children = [] } = useSWR(user ? '/children' : null, fetcher);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-[#b45f06]" style={{ background: 'linear-gradient(145deg, #f9f0d4, #fce2c1)' }}>
            <i className="fas fa-spinner fa-spin mr-3"></i> Tunggu sebentar ya...
        </div>;
    }

    // Phase 1: Pick a child
    if (!selectedChild) {
        return <ChildSelector children={children} onSelect={(child) => {
            setSelectedChild(child);
            setPinVerified(false);
        }} />;
    }

    // Phase 2: Verify PIN
    if (!pinVerified) {
        return <PinVerify
            child={selectedChild}
            onVerified={() => setPinVerified(true)}
            onBack={() => { setSelectedChild(null); setPinVerified(false); }}
        />;
    }

    // Phase 3: Task Panel
    return <TaskPanel
        child={selectedChild}
        onSwitchProfile={() => { setSelectedChild(null); setPinVerified(false); }}
    />;
}
