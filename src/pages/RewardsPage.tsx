import { ShoppingCart, Ticket, Receipt, ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const rewards = [
  {
    id: 1,
    title: 'Grocery Store Coupon',
    description: '$10 off your next purchase at EcoFresh Markets.',
    cost: 500,
    icon: ShoppingCart,
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-emerald-600/5'
  },
  {
    id: 2,
    title: 'Monthly Transport Pass',
    description: 'Free rides on the metro for the next 30 days.',
    cost: 1200,
    icon: Ticket,
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-600/5'
  },
  {
    id: 3,
    title: 'Utility Bill Discount',
    description: '5% discount on your next municipal electricity/water bill.',
    cost: 800,
    icon: Receipt,
    color: 'amber',
    gradient: 'from-amber-500/20 to-amber-600/5'
  }
];

export default function RewardsPage() {
  const navigate = useNavigate();
  const currentPoints = 1450;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 pt-4">
        <div>
          <button onClick={() => navigate(-1)} className="text-emerald-400 text-sm flex items-center gap-1 mb-4 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Rewards Marketplace</h1>
          <p className="text-emerald-200/60">Exchange your Eco-Points for real-world value.</p>
        </div>
        
        <div className="glass-panel px-6 py-4 flex items-center gap-4 bg-emerald-950/40 border-emerald-500/30">
          <div className="p-3 bg-emerald-500/20 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Star className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-emerald-100/60 uppercase tracking-widest mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white text-glow">{currentPoints} <span className="text-sm font-normal text-emerald-400">pts</span></p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const Icon = reward.icon;
          const canAfford = currentPoints >= reward.cost;
          
          return (
            <div key={reward.id} className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className={`absolute inset-0 bg-gradient-to-br ${reward.gradient} opacity-50`} />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl bg-${reward.color}-500/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]`}>
                    <Icon className={`w-8 h-8 text-${reward.color}-400`} />
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-sm font-bold text-white flex items-center gap-1">
                    <Star className="w-3 h-3 text-emerald-400" /> {reward.cost}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{reward.title}</h3>
                <p className="text-emerald-100/70 text-sm mb-8 leading-relaxed">{reward.description}</p>
                
                <button 
                  className={`mt-auto w-full py-4 rounded-xl font-semibold backdrop-blur-md outline-none transition-all ${
                    canAfford 
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                      : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                  }`}
                  disabled={!canAfford}
                >
                  {canAfford ? 'Redeem Reward' : 'Insufficient Points'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
