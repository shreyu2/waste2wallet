import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ChevronDown } from 'lucide-react';
import { authApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState('CITIZEN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) setRole(roleParam.toUpperCase());
  }, [searchParams]);

  const isAdmin = role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await authApi.register(name, email, password, role);
        setSuccess('Account created! Please sign in.');
        setMode('login');
        setName('');
        setPassword('');
      } else {
        const data = await authApi.login(email, password);
        login(data.token, {
          id: data.user.id,
          name: data.user.name,
          role: data.user.role as 'CITIZEN' | 'COLLECTOR' | 'ADMIN',
          points: data.user.points,
          qrCode: data.user.qrCode,
        });

        if (data.user.role === 'ADMIN') navigate('/admin');
        else if (data.user.role === 'COLLECTOR') navigate('/collector');
        else navigate('/citizen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#1e40af]/30 blur-[150px] pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {mode === 'login'
              ? isAdmin ? 'Admin Portal' : role === 'COLLECTOR' ? 'Collector Login' : 'Citizen Login'
              : 'Create Account'}
          </h1>
          <p className="text-emerald-200/60 font-medium tracking-wide text-sm">
            {isAdmin ? 'Restricted access for STP authorities' : 'Track sustainability. Earn rewards.'}
          </p>
        </div>

        {/* Mode Toggle (non-admin only) */}
        {!isAdmin && (
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
            {(['login', 'register'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-emerald-200/50 hover:text-emerald-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (register only) */}
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full pl-12"
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
            <input
              type="email"
              placeholder={isAdmin ? 'Admin Email' : 'Email Address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full pl-12"
              required
            />
          </div>
          {isAdmin && mode === 'login' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-amber-500/70 uppercase tracking-widest font-medium shrink-0">Reference</span>
              <span className="text-xs text-amber-400 font-mono select-all">admin@stp.gov</span>
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
            <input
              type="password"
              placeholder={isAdmin ? 'System Password' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full pl-12"
              required
            />
          </div>

          {/* Role selector (register only, non-admin) */}
          {mode === 'register' && !isAdmin && (
            <div className="relative">
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50 pointer-events-none" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="glass-input w-full appearance-none cursor-pointer"
              >
                <option value="CITIZEN">Citizen</option>
                <option value="COLLECTOR">Waste Collector</option>
              </select>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`glass-button glass-button-primary w-full py-4 text-lg mt-2 disabled:opacity-50 ${
              isAdmin ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30' : ''
            }`}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? isAdmin ? 'Authenticate' : 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-amber-500/60">
            Internal STP personnel only. Contact DB admin for credential issues.
          </div>
        )}
      </div>
    </div>
  );
}
