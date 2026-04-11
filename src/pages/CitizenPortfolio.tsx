import { useState, useEffect } from 'react';
import {
  Award, Leaf, Medal, Trees, Wind, Star, ArrowLeft, Calendar, CheckCircle, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  BarChart, Bar, CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { citizenApi, type Transaction } from '../api/api';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WASTE_COLORS: Record<string, string> = {
  WET: '#10b981',
  DRY: '#34d399',
  PLASTIC: '#3b82f6',
  MIXED: '#f59e0b',
};
const WASTE_LABELS: Record<string, string> = {
  WET: 'Wet Waste',
  DRY: 'Dry Waste',
  PLASTIC: 'Plastic',
  MIXED: 'Mixed',
};

function buildPointsHistory(transactions: Transaction[]) {
  const monthMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    const d = new Date(tx.createdAt);
    const key = MONTH_LABELS[d.getMonth()];
    monthMap[key] = (monthMap[key] || 0) + tx.pointsAwarded;
  });
  // Accumulate
  let cumulative = 0;
  const result: { month: string; points: number }[] = [];
  MONTH_LABELS.forEach((m) => {
    if (monthMap[m] !== undefined || result.length > 0) {
      cumulative += monthMap[m] || 0;
      if (monthMap[m] !== undefined) result.push({ month: m, points: cumulative });
    }
  });
  return result.length > 0 ? result : [];
}

function buildWasteBreakdown(transactions: Transaction[]) {
  const totals: Record<string, number> = { WET: 0, DRY: 0, PLASTIC: 0, MIXED: 0 };
  transactions.forEach((tx) => { totals[tx.wasteType] = (totals[tx.wasteType] || 0) + tx.weightKg; });
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: WASTE_LABELS[k],
      value: Math.round((v / total) * 100),
      color: WASTE_COLORS[k],
    }));
}

function buildWeeklyQuality(transactions: Transaction[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const map: Record<string, { proper: number; partial: number; none: number }> = {};
  days.forEach((d) => { map[d] = { proper: 0, partial: 0, none: 0 }; });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  transactions.forEach((tx) => {
    const d = new Date(tx.createdAt);
    if (d >= weekStart) {
      const dayIdx = (d.getDay() + 6) % 7;
      const day = days[dayIdx];
      if (tx.wasteType !== 'MIXED') map[day].proper += 1;
      else map[day].none += 1;
    }
  });
  return days.map((day) => ({ day, ...map[day] }));
}

function buildHeatmap(transactions: Transaction[]) {
  const dateSet = new Set(
    transactions.map((tx) => new Date(tx.createdAt).toDateString())
  );
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const proper = transactions.some((tx) => {
      return new Date(tx.createdAt).toDateString() === d.toDateString() && tx.wasteType !== 'MIXED';
    });
    const mixed = transactions.some((tx) => {
      return new Date(tx.createdAt).toDateString() === d.toDateString() && tx.wasteType === 'MIXED';
    });
    return { day: i, level: proper ? 2 : mixed ? 1 : dateSet.has(d.toDateString()) ? 1 : 0 };
  });
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgba(6,78,59,0.9)] border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md text-sm">
        <p className="text-emerald-200/70 mb-1">{label}</p>
        <p className="font-bold text-white">{payload[0].value} pts</p>
      </div>
    );
  }
  return null;
};

export default function CitizenPortfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    citizenApi.getTransactions()
      .then(setTransactions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-red-400">{error}</p>
    </div>
  );

  const pointsHistory = buildPointsHistory(transactions);
  const wasteBreakdown = buildWasteBreakdown(transactions);
  const weeklyQuality = buildWeeklyQuality(transactions);
  const heatmapData = buildHeatmap(transactions);
  const recentHistory = transactions.slice(0, 5);

  const totalPoints = user?.points || 0;
  const carbonSaved = transactions.reduce((s, tx) => s + tx.weightKg * 0.5, 0).toFixed(1);
  const totalCollections = transactions.length;
  const ecoScore = Math.min(100, Math.round((totalPoints / 2000) * 100));

  const scoreData = [{ name: 'Score', value: ecoScore, fill: '#10b981' }];

  const badges = [
    { name: 'Bronze', icon: Leaf, color: 'text-amber-600', bg: 'bg-amber-800/20', border: 'border-amber-700/30', earned: totalPoints >= 100, date: 'Bronze (100 pts)' },
    { name: 'Silver', icon: Award, color: 'text-slate-300', bg: 'bg-slate-400/20', border: 'border-slate-400/30', earned: totalPoints >= 500, date: 'Silver (500 pts)' },
    { name: 'Gold', icon: Medal, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', earned: totalPoints >= 1000, date: 'Gold (1000 pts)' },
  ];

  const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 md:pb-0">
      <header className="pt-4">
        <button onClick={() => navigate('/citizen')} className="text-emerald-400 text-sm flex items-center gap-1 mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">My Eco Portfolio</h1>
        <p className="text-emerald-200/60">Your complete sustainability journey & environmental impact</p>
      </header>

      {/* Profile + Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl font-bold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
              <p className="text-emerald-200/60 text-sm mb-3">{user?.qrCode}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">Level {user?.points ? Math.floor(user.points / 250) + 1 : 1} Citizen</span>
                {totalPoints >= 500 && <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-medium">Silver Badge</span>}
                {totalPoints >= 1000 && <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400 font-medium">Gold Badge</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            {[
              { label: 'Total Points', value: totalPoints.toLocaleString() },
              { label: 'Carbon Saved', value: `${carbonSaved} kg` },
              { label: 'Collections', value: String(totalCollections) },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-emerald-200/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Eco Score */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <p className="text-sm font-medium text-emerald-200/60 uppercase tracking-widest mb-2 relative z-10">Eco Score</p>
          <div className="relative w-44 h-44 z-10">
            <RadialBarChart width={176} height={176} cx={88} cy={88} innerRadius={55} outerRadius={80} startAngle={225} endAngle={-45} data={scoreData}>
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(255,255,255,0.05)' }} />
            </RadialBarChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-white text-glow">{ecoScore}</p>
              <p className="text-xs text-emerald-400 font-medium">/ 100</p>
            </div>
          </div>
          <p className="text-emerald-400 font-semibold mt-2 relative z-10">
            {ecoScore >= 80 ? 'Excellent' : ecoScore >= 50 ? 'Good' : ecoScore >= 20 ? 'Developing' : 'Getting Started'}
          </p>
        </div>
      </div>

      {/* Points Journey */}
      {pointsHistory.length > 0 && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Points Journey</h3>
              <p className="text-xs text-emerald-200/50 mt-0.5">Cumulative eco-points earned over time</p>
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pointsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#a7f3d0" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a7f3d0" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="points" stroke="#10b981" strokeWidth={2.5} fill="url(#pointsGradient)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#34d399', stroke: 'rgba(52,211,153,0.4)', strokeWidth: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Waste Breakdown + Weekly Quality */}
      {(wasteBreakdown.length > 0 || transactions.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Waste Type Breakdown</h3>
              <p className="text-xs text-emerald-200/50 mt-0.5">Distribution across all your collections</p>
            </div>
            {wasteBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[180px] h-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={wasteBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {wasteBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {wasteBreakdown.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-emerald-100/70 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="font-bold text-white">{item.value}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-emerald-200/40 py-12 text-sm">No collections yet</p>
            )}
          </div>

          <div className="glass-panel p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">This Week's Segregation</h3>
              <p className="text-xs text-emerald-200/50 mt-0.5">Daily collection quality breakdown</p>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyQuality} barSize={14} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#a7f3d0" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a7f3d0" opacity={0.3} fontSize={11} tickLine={false} axisLine={false} tickCount={2} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: 'rgba(6,78,59,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="proper" stackId="a" fill="#10b981" name="Proper" />
                  <Bar dataKey="partial" stackId="a" fill="#f59e0b" name="Partial" />
                  <Bar dataKey="none" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Not Segregated" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              {[['#10b981', 'Proper'], ['#f59e0b', 'Partial'], ['#ef4444', 'None']].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-emerald-200/60">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Heatmap + Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
              <p className="text-xs text-emerald-200/50">Last 35 days</p>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-emerald-200/30 font-medium">{d}</div>
            ))}
            {heatmapData.map((d) => (
              <div
                key={d.day}
                className={`aspect-square rounded-lg transition-all cursor-pointer ${
                  d.level === 2 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                  d.level === 1 ? 'bg-emerald-700/60' : 'bg-white/5'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-emerald-200/40">
            <span>Less</span>
            {['bg-white/5', 'bg-emerald-700/60', 'bg-emerald-400'].map((cls, i) => (
              <span key={i} className={`w-3.5 h-3.5 rounded-sm ${cls}`} />
            ))}
            <span>More</span>
          </div>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-4">Recent Collections</h4>
              <div className="space-y-2">
                {recentHistory.map((item) => (
                  <div key={item._id} className="flex items-center justify-between py-2.5 px-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.wasteType !== 'MIXED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <p className="text-sm text-white">{WASTE_LABELS[item.wasteType]}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-200/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`font-bold ${item.pointsAwarded > 0 ? 'text-emerald-400' : 'text-red-400/60'}`}>
                        {item.pointsAwarded > 0 ? `+${item.pointsAwarded}` : '0'} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badges + Impact */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Eco Badges</h3>
            </div>
            <div className="space-y-3">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.name} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${badge.earned ? `${badge.bg} ${badge.border}` : 'bg-white/5 border-white/5 opacity-40 grayscale'}`}>
                    <div className={`w-11 h-11 rounded-xl ${badge.bg} border ${badge.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${badge.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{badge.name} Badge</p>
                      <p className="text-xs text-emerald-200/60 mt-0.5">{badge.earned ? 'Earned' : badge.date}</p>
                    </div>
                    {badge.earned && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-lg font-semibold text-white">Environmental Impact</h3>
            {[
              { label: 'Carbon Saved', value: `${carbonSaved} kg CO₂`, icon: Trees, color: 'text-emerald-400', pct: Math.min(100, parseFloat(carbonSaved) * 2) },
              { label: 'Air Quality', value: totalPoints > 500 ? 'Excellent' : 'Good', icon: Wind, color: 'text-blue-400', pct: Math.min(100, totalPoints / 10) },
              { label: 'Eco Streak', value: `${totalCollections} collections`, icon: Star, color: 'text-yellow-400', pct: Math.min(100, totalCollections * 5) },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className={`flex items-center gap-2 ${item.color}`}><Icon className="w-4 h-4" />{item.label}</span>
                    <span className="font-bold text-white text-xs">{item.value}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${item.pct}%`, background: item.label === 'Carbon Saved' ? '#10b981' : item.label === 'Air Quality' ? '#3b82f6' : '#eab308' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
