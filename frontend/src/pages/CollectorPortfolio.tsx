import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, Calendar, CheckCircle, Clock, QrCode, Trash2, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { collectorApi, type CollectorDashboard } from '../api/api';
import { useAuth } from '../context/AuthContext';

const WASTE_LABELS: Record<string, string> = {
  WET: 'Wet Waste', DRY: 'Dry Waste', PLASTIC: 'Plastic', MIXED: 'Mixed',
};

export default function CollectorPortfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<CollectorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    collectorApi
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-[#147BD1]/30 border-t-[#48B9F5] rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-red-400">{error}</p>
    </div>
  );

  const name = data?.name || user?.name || 'Collector';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const stats = [
    { label: 'Total Collections', value: (data?.totalCollections || 0).toLocaleString(), sub: 'all time', icon: QrCode, color: 'text-[#48B9F5]', bg: 'bg-[#147BD1]/20' },
    { label: 'Waste Processed', value: `${data?.totalWeightKg || 0} kg`, sub: 'total weight', icon: Trash2, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Proper Segregation', value: `${data?.properPct || 0}%`, sub: 'of collections', icon: CheckCircle, color: 'text-[#1683DC]', bg: 'bg-[#1683DC]/20' },
    { label: 'Today\'s Collections', value: String(data?.todayCount || 0), sub: 'logged today', icon: Users, color: 'text-[#48B9F5]', bg: 'bg-[#147BD1]/15' },
  ];

  const weeklyData = (data?.weeklyData || []).map((d) => ({ ...d, color: '#147BD1' }));

  const performance = [
    { label: 'Proper Segregation', value: data?.properPct || 0, color: 'bg-[#147BD1]' },
    { label: 'Partial Segregation', value: data?.partialPct || 0, color: 'bg-amber-400' },
    { label: 'Not Segregated', value: data?.nonePct || 0, color: 'bg-red-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <header className="pt-4">
        <button onClick={() => navigate('/collector')} className="text-[#48B9F5] text-sm flex items-center gap-1 mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Scanner
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Collector Portfolio</h1>
        <p className="text-[#8A9AAF]">Your collection performance & daily route history</p>
      </header>

      {/* Profile Card */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#147BD1]/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#147BD1]/20 border border-[#147BD1]/30 flex items-center justify-center text-3xl font-bold text-[#48B9F5] shadow-[0_0_20px_rgba(20,123,209,0.25)] shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
            <p className="text-[#8A9AAF] text-sm mb-3">Collector ID {data?.collectorId}</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-[#147BD1]/15 border border-[#147BD1]/30 rounded-full text-xs text-[#48B9F5] font-medium">Waste Collector</span>
              {(data?.properPct || 0) >= 70 && (
                <span className="px-3 py-1 bg-[#1683DC]/15 border border-[#1683DC]/30 rounded-full text-xs text-[#48B9F5] font-medium">Top Performer</span>
              )}
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs text-[#8A9AAF] uppercase tracking-widest mb-1">Today's Collections</p>
            <p className="text-4xl font-bold text-white text-glow">{data?.todayCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-[#8A9AAF] mt-0.5">{stat.label}</p>
                <p className="text-xs text-white/40">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Chart */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-5 h-5 text-[#48B9F5]" />
              <h3 className="text-lg font-medium text-white">This Week's Collections</h3>
            </div>
            {weeklyData.length > 0 ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#48B9F5" opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#48B9F5" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: 'rgba(11,31,70,0.95)', borderColor: 'rgba(72,185,245,0.2)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val) => [`${val} households`, 'Collections']}
                    />
                    <Bar dataKey="collections" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {weeklyData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-white/40 text-sm">
                No collections this week yet
              </div>
            )}
          </div>

          {/* Today's Route */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-[#48B9F5]" />
              <h3 className="text-lg font-medium text-white">Today's Route</h3>
            </div>
            {(data?.todayHistory || []).length === 0 ? (
              <p className="text-center text-white/40 py-8 text-sm">No collections logged today yet</p>
            ) : (
              <div className="space-y-3">
                {data!.todayHistory.map((item, i) => {
                  const citizenObj = typeof item.citizenId === 'object' && item.citizenId !== null
                    ? item.citizenId as { name?: string; qrCode?: string }
                    : null;
                  const citizenName = citizenObj?.name ?? citizenObj?.qrCode ?? String(item.citizenId);
                  return (
                    <div key={item._id || i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.wasteType !== 'MIXED' ? 'bg-[#48B9F5] shadow-[0_0_8px_rgba(72,185,245,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-white">{citizenName}</p>
                          <p className="text-xs text-[#8A9AAF] mt-0.5 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleTimeString()}
                            <span className="ml-1">{item.weightKg} kg</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-[#48B9F5]">{WASTE_LABELS[item.wasteType]}</p>
                        <p className="text-xs text-white/70">+{item.pointsAwarded} pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#48B9F5]" />
            <h3 className="text-lg font-medium text-white">Performance</h3>
          </div>
          <div className="space-y-5 flex-1">
            {performance.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">{item.label}</span>
                  <span className="font-bold text-white">{item.value}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">All Time</p>
            <p className="text-2xl font-bold text-white">{(data?.totalWeightKg || 0)} <span className="text-sm font-normal text-[#48B9F5]">kg collected</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
