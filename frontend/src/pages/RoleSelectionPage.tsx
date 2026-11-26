import { useNavigate } from 'react-router-dom';
import { Home, Trash2, ShieldCheck, ChevronRight } from 'lucide-react';

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  const handleSelect = (role: string) => {
    navigate(`/auth?role=${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 w2w-page-bg overflow-hidden">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#147BD1]/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#102D65]/50 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-[#48B9F5]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl z-10 py-12">
        <div className="text-center mb-12 animate-[fade-in_0.5s_ease-out]">
          <h1 className="text-4xl font-bold text-white mb-4">Select Your Role</h1>
          <p className="text-white/60 font-medium">Choose your portal to enter the Waste2Wallet ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CITIZEN */}
          <button 
            onClick={() => handleSelect('CITIZEN')}
            className="group w2w-card p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(20,123,209,0.2)] hover:border-[#147BD1]/60"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#147BD1]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-2xl bg-[#147BD1]/15 border border-[#147BD1]/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,123,209,0.2)]">
              <Home className="w-10 h-10 text-[#48B9F5] group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Citizen</h2>
            <p className="text-sm text-white/60 mb-6">Manage your household QR code, view eco-stats, and redeem your reward points.</p>
            <div className="mt-auto flex items-center text-[#48B9F5] font-medium group-hover:text-[#1683DC] group-hover:gap-2 transition-all">
              Login as Citizen <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* COLLECTOR */}
          <button 
            onClick={() => handleSelect('COLLECTOR')}
            className="group w2w-card p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(22,131,220,0.2)] hover:border-[#1683DC]/60"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#1683DC]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-2xl bg-[#1683DC]/15 border border-[#1683DC]/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(22,131,220,0.2)]">
              <Trash2 className="w-10 h-10 text-[#48B9F5] group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Waste Collector</h2>
            <p className="text-sm text-white/60 mb-6">Scan QR codes, log waste segregation data, and distribute eco-points during runs.</p>
            <div className="mt-auto flex items-center text-[#48B9F5] font-medium group-hover:text-[#1683DC] group-hover:gap-2 transition-all">
              Login as Collector <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* ADMIN */}
          <button 
            onClick={() => handleSelect('ADMIN')}
            className="group w2w-card p-8 flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(23,74,137,0.3)] hover:border-[#48B9F5]/50 border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#174A89]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-[#147BD1]/20 border border-[#147BD1]/30 text-[#48B9F5] text-[10px] font-bold tracking-widest rounded uppercase">
              Restricted
            </div>
            <div className="w-20 h-20 rounded-2xl bg-[#174A89]/30 border border-[#174A89]/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(23,74,137,0.3)]">
              <ShieldCheck className="w-10 h-10 text-[#48B9F5] group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin / STP</h2>
            <p className="text-sm text-white/60 mb-6">Municipality overview of STP health, total processing, and geographic intelligence.</p>
            <div className="mt-auto flex items-center text-[#48B9F5] font-medium group-hover:text-[#1683DC] group-hover:gap-2 transition-all">
              Admin Gateway <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
