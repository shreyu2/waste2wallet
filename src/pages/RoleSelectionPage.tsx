import { useNavigate } from 'react-router-dom';
import { Home, Trash2, ShieldCheck, ChevronRight } from 'lucide-react';

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  const handleSelect = (role: string) => {
    navigate(`/auth?role=${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl z-10">
        <div className="text-center mb-12 animate-[fade-in_0.5s_ease-out]">
          <h1 className="text-4xl font-bold text-white mb-4">Select Your Role</h1>
          <p className="text-emerald-200/60 font-medium">Choose your portal to enter the Waste2Wallet ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CITIZEN */}
          <button 
            onClick={() => handleSelect('CITIZEN')}
            className="group glass-panel p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Home className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Citizen</h2>
            <p className="text-sm text-emerald-100/60 mb-6">Manage your household QR code, view eco-stats, and redeem your reward points.</p>
            <div className="mt-auto flex items-center text-emerald-400 font-medium group-hover:gap-2 transition-all">
              Login as Citizen <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* COLLECTOR */}
          <button 
            onClick={() => handleSelect('COLLECTOR')}
            className="group glass-panel p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)] hover:border-blue-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Trash2 className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Waste Collector</h2>
            <p className="text-sm text-emerald-100/60 mb-6">Scan QR codes, log waste segregation data, and distribute eco-points during runs.</p>
            <div className="mt-auto flex items-center text-blue-400 font-medium group-hover:gap-2 transition-all">
              Login as Collector <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* ADMIN */}
          <button 
            onClick={() => handleSelect('ADMIN')}
            className="group glass-panel p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)] hover:border-amber-500/50 border-amber-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-4 right-4 px-2 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-bold tracking-widest rounded uppercase">Restricted</div>
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <ShieldCheck className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin / STP</h2>
            <p className="text-sm text-emerald-100/60 mb-6">Municipality overview of STP health, total processing, and geographic intelligence.</p>
            <div className="mt-auto flex items-center text-amber-400 font-medium group-hover:gap-2 transition-all">
              Admin Gateway <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
