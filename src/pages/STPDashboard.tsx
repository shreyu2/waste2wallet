import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertOctagon, Activity, Droplets, Filter, Workflow } from 'lucide-react';
import { stpApi, type STPMetricPoint, type STPLatest } from '../api/api';

export default function STPDashboard() {
  const [flowData, setFlowData] = useState<STPMetricPoint[]>([]);
  const [latest, setLatest] = useState<STPLatest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([stpApi.getMetrics(), stpApi.getLatest()])
      .then(([metrics, lat]) => {
        setFlowData(metrics);
        setLatest(lat);
      })
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

  const mixedPct = latest?.mixedWastePercentage ?? 0;
  const flowMLD = latest?.flowRateMLD ?? 0;
  const efficiency = latest?.efficiencyScore ?? 100;
  const isAlert = mixedPct > 15;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Sewage System Health</h1>
        <p className="text-emerald-200/60">Real-time STP Monitoring & Analytics</p>
      </header>

      {/* Alert Banner */}
      {isAlert && (
        <div className="glass-panel border-amber-500/50 bg-amber-500/10 p-5 flex items-start md:items-center gap-4 relative overflow-hidden mb-8 animate-[pulse_3s_ease-in-out_infinite]">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
          <div className="p-3 bg-amber-500/20 rounded-xl shrink-0">
            <AlertOctagon className="w-8 h-8 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-500 tracking-wide">CAUTION: High Mixed Waste Detected</h3>
            <p className="text-amber-200/70 text-sm mt-1">
              Mixed waste is at {mixedPct}% — above the safe threshold of 15%. Efficiency degradation may occur.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Workflow className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-emerald-100/70 font-medium text-sm">Mixed Waste %</p>
          </div>
          <div className="flex items-end gap-3">
            <h3 className={`text-4xl font-bold ${mixedPct > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {mixedPct > 0 ? `${mixedPct.toFixed(1)}%` : '—'}
            </h3>
            {mixedPct > 0 && (
              <span className={`text-sm font-medium mb-1 ${mixedPct > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                {mixedPct > 15 ? '⚠ High' : '✓ Normal'}
              </span>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Droplets className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-emerald-100/70 font-medium text-sm">Current Flow Rate</p>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-bold text-white">
              {flowMLD > 0 ? flowMLD.toFixed(1) : '—'}
              {flowMLD > 0 && <span className="text-xl text-emerald-400 font-normal ml-1">MLD</span>}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-emerald-100/70 font-medium text-sm">Processing Efficiency</p>
          </div>
          <div className="flex items-end gap-3">
            <h3 className={`text-4xl font-bold text-white text-glow`}>
              {efficiency > 0 ? `${efficiency.toFixed(0)}%` : '—'}
            </h3>
            {efficiency > 0 && (
              <span className={`text-sm font-medium mb-1 ${efficiency >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {efficiency >= 80 ? 'Good' : 'Warning'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Chart */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-white">Daily Flow Pipeline</h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400" />Total Flow</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" />Mixed Waste</div>
            </div>
          </div>
          {flowData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMixed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#a7f3d0" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a7f3d0" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(6, 78, 59, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="flow" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorFlow)" />
                  <Area type="monotone" dataKey="mixed" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorMixed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-emerald-200/40 gap-3">
              <Activity className="w-10 h-10 opacity-30" />
              <p className="text-sm">No STP metric readings yet</p>
              <p className="text-xs">POST to /api/stp/metrics to log sensor data</p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-medium text-white">System Status</h3>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { label: 'Efficiency', value: efficiency, color: efficiency >= 80 ? 'bg-emerald-400' : 'bg-amber-400' },
              { label: 'Flow Clarity', value: flowMLD > 0 ? Math.max(0, 100 - mixedPct * 2) : 0, color: 'bg-blue-400' },
              { label: 'Solid Waste Control', value: flowMLD > 0 ? Math.max(0, 100 - mixedPct * 3) : 100, color: mixedPct > 15 ? 'bg-red-400' : 'bg-emerald-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-emerald-100/70">{item.label}</span>
                  <span className="font-bold text-white">{item.value.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-emerald-200/40 text-center">
              {flowData.length > 0
                ? `${flowData.length} readings in current session`
                : 'Awaiting sensor data'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
