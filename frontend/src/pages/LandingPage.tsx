import { useNavigate } from 'react-router-dom';
import { ArrowRight, Droplets, Leaf, QrCode, Gift } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center w2w-page-bg">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#147BD1]/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#102D65]/40 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-[#48B9F5]/8 blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#147BD1]/10 border border-[#147BD1]/25 mb-8 backdrop-blur-md animate-[fade-in_1s_ease-out]">
          <Leaf className="w-4 h-4 text-[#48B9F5]" />
          <span className="text-sm font-medium text-[#48B9F5]">Rewarding Responsible Waste Segregation</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight max-w-4xl mx-auto leading-tight">
          Transforming Waste Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#48B9F5] to-[#a0d8fb]">Wallet Wealth</span>
        </h1>
        
        <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Stop mixed waste at the source. Scan, segregate, and earn real-world rewards while protecting our city's sewage treatment infrastructure.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => navigate('/roles')}
            className="glass-button glass-button-primary px-8 py-4 text-lg font-medium flex items-center gap-2 group"
          >
            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/roles')}
            className="glass-button px-8 py-4 text-lg font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white backdrop-blur-md"
          >
            Sign In
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left">
          <div className="w2w-card p-8">
            <div className="w-12 h-12 rounded-xl bg-[#147BD1]/15 flex items-center justify-center mb-6 border border-[#147BD1]/25">
              <Droplets className="w-6 h-6 text-[#48B9F5]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">The Problem</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              Unsegregated mixed waste frequently enters the sewage system, causing blockages, infrastructure degradation, and plunging STP efficiency scores.
            </p>
          </div>

          <div className="w2w-card p-8">
            <div className="w-12 h-12 rounded-xl bg-[#1683DC]/15 flex items-center justify-center mb-6 border border-[#1683DC]/25">
              <QrCode className="w-6 h-6 text-[#48B9F5]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">The Solution</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              A QR-based segregation tracking system linking households directly to waste collectors, ensuring accountability and perfect source segregation.
            </p>
          </div>

          <div className="w2w-card p-8">
            <div className="w-12 h-12 rounded-xl bg-[#174A89]/30 flex items-center justify-center mb-6 border border-[#174A89]/40">
              <Gift className="w-6 h-6 text-[#48B9F5]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">The Features</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              Earn Eco-Points instantly. Monitor STP Health in real-time. Redeem points for grocery coupons, transport passes, and energy bill discounts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
