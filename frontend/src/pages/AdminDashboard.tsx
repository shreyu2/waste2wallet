import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Leaf, TrendingUp, Users, Award, LogOut } from 'lucide-react';
import { adminApi, type AdminDashboard as DashboardData, type CollectorLocation, type LeaderboardEntry } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CollectorMap from '../components/CollectorMap';

const CHART_COLOR_MAP: Record<string, string> = {
  WET: '#147BD1',
  DRY: '#48B9F5',
  PLASTIC: '#93c5fd',
  MIXED: '#f59e0b',
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [collectorLocations, setCollectorLocations] = useState<CollectorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadLocations = () => adminApi.getCollectorLocations()
      .then((locations) => {
        if (!cancelled) {
          setCollectorLocations(locations);
          setLocationError('');
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setLocationError(e instanceof Error ? e.message : 'Unable to refresh collector locations');
      });

    Promise.all([adminApi.getDashboard(), adminApi.getLeaderboard()])
      .then(([dash, lb]) => {
        if (cancelled) return;
        setDashboard(dash);
        setLeaderboard(lb);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    void loadLocations();
    const refreshTimer = window.setInterval(loadLocations, 4_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
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

  const segregationData = (dashboard?.segregationData || []).map((item) => ({
    ...item,
    color: CHART_COLOR_MAP[item.name] || item.color,
  }));
  const stpAlert = (dashboard?.stpHealth?.mixedWastePercentage || 0) > 15;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#8A9AAF]">Municipality Overview & Performance Tracking</p>
        </div>
        <button
          onClick={() => { logout(); navigate('/auth'); }}
          className="glass-panel p-2.5 text-white/60 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2 text-white/70 font-medium">
            <Users className="w-5 h-5 text-[#48B9F5]" /> Total Citizens
          </div>
          <h2 className="text-4xl font-bold text-white text-glow">{(dashboard?.totalCitizens || 0).toLocaleString()}</h2>
          <p className="text-xs text-[#48B9F5] mt-2">Registered accounts</p>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2 text-white/70 font-medium">
            <Leaf className="w-5 h-5 text-[#48B9F5]" /> Total Collections
          </div>
          <h2 className="text-4xl font-bold text-white text-glow">{(dashboard?.totalTransactions || 0).toLocaleString()}</h2>
          <p className="text-xs text-[#48B9F5] mt-2">Waste transactions logged</p>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2 text-white/70 font-medium">
            <TrendingUp className="w-5 h-5 text-[#48B9F5]" /> Waste Impact Index
          </div>
          <h2 className="text-4xl font-bold text-white text-glow">{dashboard?.wasteImpactIndex || 0}%</h2>
          <p className="text-xs text-[#48B9F5] mt-2">Properly segregated</p>
        </div>

        {stpAlert ? (
          <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-3 mb-2 text-amber-500 font-medium">
              <AlertTriangle className="w-5 h-5" /> Active Alert
            </div>
            <h2 className="text-xl font-bold text-amber-400 leading-tight">
              High mixed waste: {dashboard?.stpHealth?.mixedWastePercentage}%
            </h2>
          </div>
        ) : (
          <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2 text-white/70 font-medium">
              <TrendingUp className="w-5 h-5 text-[#48B9F5]" /> Total Processed
            </div>
            <h2 className="text-4xl font-bold text-white text-glow">{dashboard?.totalProcessed || 0} kg</h2>
            <p className="text-xs text-[#48B9F5] mt-2">All waste by weight</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segregation Chart */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-medium text-white mb-6">Waste Type Breakdown (by kg)</h3>
          {segregationData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segregationData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#48B9F5" opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#48B9F5" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(11, 31, 70, 0.95)', borderColor: 'rgba(72,185,245,0.2)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(v) => [`${v} kg`, 'Weight']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {segregationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/40 text-sm">
              No transaction data yet — log some waste collections to see the breakdown
            </div>
          )}

          {/* STP Health row */}
          {dashboard?.stpHealth && (
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-[#8A9AAF] mb-1">Mixed Waste %</p>
                <p className={`text-2xl font-bold ${(dashboard.stpHealth.mixedWastePercentage > 15) ? 'text-amber-400' : 'text-[#48B9F5]'}`}>
                  {dashboard.stpHealth.mixedWastePercentage}%
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-[#8A9AAF] mb-1">STP Efficiency</p>
                <p className={`text-2xl font-bold ${(dashboard.stpHealth.efficiencyScore > 75) ? 'text-[#48B9F5]' : 'text-amber-400'}`}>
                  {dashboard.stpHealth.efficiencyScore}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-[#48B9F5]" />
            <h3 className="text-lg font-medium text-white">Top Eco-Citizens</h3>
          </div>
          {leaderboard.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm text-center py-8">
              No citizens yet — register some users to see the leaderboard
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto">
              {leaderboard.map((citizen, idx) => (
                <div key={citizen._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                      'bg-white/5 text-white/50'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{citizen.name}</p>
                      <p className="text-[10px] text-[#8A9AAF] mt-0.5">Level {citizen.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#48B9F5]">{citizen.points.toLocaleString()}</p>
                    <p className="text-[10px] text-[#8A9AAF]">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">Live Collector Locations</h3>
            <p className="text-sm text-[#8A9AAF]">Only authenticated collectors that have shared a valid location appear here.</p>
          </div>
          <span className="text-sm text-[#48B9F5] font-medium">{collectorLocations.length} reporting</span>
        </div>
        {locationError && <p className="text-sm text-amber-400 mb-3">{locationError}</p>}
        {collectorLocations.length > 0 ? (
          <CollectorMap locations={collectorLocations} />
        ) : (
          <div className="h-[180px] flex items-center justify-center rounded-xl border border-white/10 text-sm text-white/40">
            No collector location has been reported yet.
          </div>
        )}
      </section>
    </div>
  );
}
