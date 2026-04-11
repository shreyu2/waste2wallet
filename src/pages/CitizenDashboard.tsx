import { useState, useEffect, useRef, useCallback } from 'react';
import { Award, Leaf, Medal, Star, Trees, Wind, LogOut, Sparkles, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { citizenApi, type CitizenDashboard as DashboardData, type Transaction } from '../api/api';
import { useNavigate } from 'react-router-dom';

const SSE_BASE = 'http://localhost:3000/api/events/citizen';

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );
}

const WASTE_LABELS: Record<string, string> = {
  WET: 'Wet Waste',
  DRY: 'Dry Waste',
  PLASTIC: 'Plastic',
  MIXED: 'Mixed',
};

const WASTE_COLORS: Record<string, string> = {
  WET: 'text-emerald-400',
  DRY: 'text-blue-400',
  PLASTIC: 'text-purple-400',
  MIXED: 'text-amber-400',
};

interface LiveNotification {
  id: string;
  wasteType: string;
  weightKg: number;
  pointsAwarded: number;
  collectorName: string;
  newPoints: number;
}

export default function CitizenDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [livePoints, setLivePoints] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // ── Load dashboard ──────────────────────────────────────
  useEffect(() => {
    citizenApi
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Retrieve QR data from payload ────────────────────────────────
  const qrCode = data?.qrCode || user?.qrCode || '';
  const qrBase64 = data?.qrBase64;

  // ── SSE: subscribe to real-time collection events ───────
  const setupSSE = useCallback(() => {
    if (!qrCode) return;
    if (sseRef.current) sseRef.current.close();

    const es = new EventSource(`${SSE_BASE}/${encodeURIComponent(qrCode)}`);
    sseRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'COLLECTION_LOGGED') {
          const notif: LiveNotification = {
            id: Date.now().toString(),
            wasteType: payload.transaction.wasteType,
            weightKg: payload.transaction.weightKg,
            pointsAwarded: payload.transaction.pointsAwarded,
            collectorName: payload.collectorName,
            newPoints: payload.newPoints,
          };

          // Update live points counter
          setLivePoints(payload.newPoints);
          updateUser({ points: payload.newPoints });

          // Add notification toast
          setNotifications((prev) => [notif, ...prev].slice(0, 5));

          // Also prepend to recent history
          setData((prev) => {
            if (!prev) return prev;
            const newTx: Transaction = {
              _id: Date.now().toString(),
              wasteType: payload.transaction.wasteType,
              weightKg: payload.transaction.weightKg,
              pointsAwarded: payload.transaction.pointsAwarded,
              createdAt: payload.transaction.createdAt,
              collectorId: payload.collectorName,
            };
            return {
              ...prev,
              wallet: { ...prev.wallet, points: payload.newPoints },
              recentHistory: [newTx, ...prev.recentHistory].slice(0, 10),
            };
          });

          // Auto-dismiss notification after 8 seconds
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          }, 8000);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // Auto-reconnect is handled by EventSource natively
    };
  }, [qrCode, updateUser]);

  useEffect(() => {
    if (qrCode) setupSSE();
    return () => {
      sseRef.current?.close();
    };
  }, [qrCode, setupSSE]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLogout = () => {
    sseRef.current?.close();
    logout();
    navigate('/');
  };

  const levelLabel = (lvl: number) => {
    if (lvl >= 5) return 'Platinum Citizen';
    if (lvl >= 4) return 'Gold Citizen';
    if (lvl >= 3) return 'Silver Citizen';
    if (lvl >= 2) return 'Bronze Citizen';
    return 'Eco Newcomer';
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-red-400">{error}</p>
    </div>
  );

  const wallet = data?.wallet;
  const currentPoints = livePoints !== null ? livePoints : (wallet?.points || 0);
  const history: Transaction[] = data?.recentHistory || [];

  const badges = [
    { id: 1, name: 'Bronze Badge', icon: Leaf, color: 'text-amber-700', bg: 'bg-amber-800/20', active: currentPoints >= 100 },
    { id: 2, name: 'Silver Badge', icon: Award, color: 'text-slate-300', bg: 'bg-slate-400/20', active: currentPoints >= 500 },
    { id: 3, name: 'Gold Badge', icon: Medal, color: 'text-yellow-400', bg: 'bg-yellow-500/20', active: currentPoints >= 1000 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-0 relative">

      {/* ── Live Notification Toasts ── */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto glass-panel border border-emerald-400/40 p-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-[slideInRight_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">
                    +{notif.pointsAwarded} pts earned! 🎉
                  </p>
                  <p className="text-emerald-200/70 text-xs mt-0.5">
                    {WASTE_LABELS[notif.wasteType]} · {notif.weightKg} kg · by {notif.collectorName}
                  </p>
                  <p className="text-emerald-400 text-xs font-medium mt-1">
                    Total: {notif.newPoints.toLocaleString()} pts
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-emerald-200/40 hover:text-white transition-colors text-lg leading-none shrink-0 mt-0.5"
              >
                ×
              </button>
            </div>
            {/* animated progress bar */}
            <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ animation: 'shrink 8s linear forwards' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Eco-Wallet</h1>
          <p className="text-emerald-200/60">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <div className="glass-panel px-3 py-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span className="text-xs font-medium text-emerald-300">{notifications.length} new</span>
            </div>
          )}
          <div className="glass-panel px-4 py-2 flex items-center gap-2">
            <Medal className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-emerald-50">{levelLabel(wallet?.level || 1)}</span>
          </div>
          <button
            onClick={handleLogout}
            className="glass-panel p-2.5 text-emerald-200/60 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet & Points */}
        <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-[-10%] top-[-10%] w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />
          <div>
            <p className="text-emerald-100/70 font-medium mb-1">Available Points</p>
            <div className="flex items-end gap-3 mb-6">
              <h2
                key={currentPoints}
                className="text-6xl font-bold text-white tracking-tight text-glow"
                style={{ transition: 'all 0.6s ease-out' }}
              >
                {currentPoints.toLocaleString()}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-emerald-200/50 mb-1">Carbon Saved</p>
                <p className="font-bold text-white">{((wallet?.carbonSavedKg || 0).toFixed(1))} kg CO₂</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-emerald-200/50 mb-1">Streak</p>
                <p className="font-bold text-white">{wallet?.streakWeeks || 0} weeks</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={() => navigate('/citizen/portfolio')} className="glass-button glass-button-primary py-3">
              Portfolio
            </button>
            <button onClick={() => navigate('/rewards')} className="glass-button glass-button-secondary py-3">
              Rewards
            </button>
          </div>
        </div>

        {/* QR Code — canvas-generated */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
          <p className="text-emerald-100/70 font-medium mb-4">Your QR Code</p>
          <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative group cursor-pointer transition-all hover:scale-105">
            {qrBase64 ? (
              <img
                src={qrBase64}
                className="rounded-xl w-[180px] h-[180px]"
                alt="My QR Code"
              />
            ) : qrCode ? (
               <div className="w-[180px] h-[180px] rounded-xl bg-white/10 flex items-center justify-center text-sm text-emerald-200">
                Generating QR...
              </div>
            ) : (
              <div className="w-[180px] h-[180px] rounded-xl bg-white/10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-emerald-400 font-mono mb-1 break-all px-2">{qrCode}</p>
          <p className="text-sm text-emerald-200/60">Show this code to the collector</p>
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live — watching for scans</span>
          </div>
        </div>
      </div>

      {/* Impact Stats */}
      <h3 className="text-xl font-medium text-white mb-4 mt-8">My Environmental Impact</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <Trees className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-100/70 text-sm font-medium mb-1">Carbon Saved</p>
            <p className="text-2xl font-bold text-white">
              {(wallet?.carbonSavedKg || 0).toFixed(1)} <span className="text-sm font-normal text-emerald-400">kg CO₂</span>
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Wind className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-emerald-100/70 text-sm font-medium mb-1">Air Quality Impact</p>
            <p className="text-2xl font-bold text-white">
              {currentPoints > 500 ? 'Excellent' : currentPoints > 100 ? 'Good' : 'Getting There'}
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-start gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-xl">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-emerald-100/70 text-sm font-medium mb-1">Streak</p>
            <p className="text-2xl font-bold text-white">
              {wallet?.streakWeeks || 0} <span className="text-sm font-normal text-yellow-400">weeks</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      {history.length > 0 && (
        <div className="glass-panel p-6 mt-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Collections</h3>
          <div className="space-y-3">
            {history.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${tx.wasteType !== 'MIXED' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                  <div>
                    <p className={`text-sm font-medium ${WASTE_COLORS[tx.wasteType] || 'text-white'}`}>
                      {WASTE_LABELS[tx.wasteType] || tx.wasteType}
                    </p>
                    <p className="text-xs text-emerald-200/40">{tx.weightKg} kg · {new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-400">+{tx.pointsAwarded} pts</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="glass-panel p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Eco Badges</h3>
          <span className="text-sm text-emerald-400 cursor-pointer hover:underline" onClick={() => navigate('/citizen/portfolio')}>
            View All
          </span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.id} className={`flex flex-col items-center gap-2 ${!badge.active ? 'opacity-40 grayscale' : ''}`}>
                <div className={`w-14 h-14 rounded-2xl ${badge.bg} flex items-center justify-center border border-white/10`}>
                  <Icon className={`w-7 h-7 ${badge.color}`} />
                </div>
                <span className="text-xs text-emerald-100/70 font-medium text-center">{badge.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
