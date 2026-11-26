import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, logout, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState('CITIZEN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Clear any existing session when the auth page mounts —
  // this guarantees a fresh login with no stale JWT.
  useEffect(() => {
    if (user) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 w2w-page-bg">
      {/* Background decorative blurs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#147BD1]/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#102D65]/40 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#48B9F5]/8 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 py-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-[#DCE5F0]/60">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#147BD1]/10 border border-[#147BD1]/20 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(20,123,209,0.15)]">
              <Leaf className="w-8 h-8 text-[#147BD1]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102D65] mb-1">
              {mode === 'login'
                ? isAdmin ? 'Admin Portal' : role === 'COLLECTOR' ? 'Collector Login' : 'Citizen Login'
                : 'Create Account'}
            </h1>
            <p className="text-[#8A9AAF] font-medium tracking-wide text-sm">
              {isAdmin ? 'Restricted access for STP authorities' : 'Track sustainability. Earn rewards.'}
            </p>
          </div>

          {/* Mode Toggle (non-admin, non-collector only) */}
          {!isAdmin && role !== 'COLLECTOR' && (
            <div className="flex rounded-xl overflow-hidden border border-[#DCE5F0] mb-6 bg-[#F5F8FC]">
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-[#147BD1] text-white shadow-sm'
                      : 'text-[#8A9AAF] hover:text-[#26364B]'
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
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9AAF]" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input w-full"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9AAF]" />
              <input
                type="email"
                placeholder={isAdmin ? 'Admin Email' : 'Email Address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input w-full"
                required
              />
            </div>
            {isAdmin && mode === 'login' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F8FC] border border-[#DCE5F0]">
                <span className="text-[10px] text-[#147BD1] uppercase tracking-widest font-semibold shrink-0">Reference</span>
                <span className="text-xs text-[#26364B] font-mono select-all">admin@stp.gov</span>
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9AAF]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isAdmin ? 'System Password' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9AAF] hover:text-[#26364B] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Role selector (register only, non-admin) */}
            {mode === 'register' && !isAdmin && role !== 'COLLECTOR' && (
              <div className="relative">
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9AAF] pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="auth-input w-full appearance-none cursor-pointer"
                >
                  <option value="CITIZEN">Citizen</option>
                </select>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-blue-50 border border-[#147BD1]/20 text-[#147BD1] text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 shadow-md bg-[#1683DC] hover:bg-[#147BD1] text-white shadow-[#1683DC]/25 hover:shadow-[#1683DC]/40"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? isAdmin ? 'Authenticate' : 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-[#DCE5F0] text-center text-xs text-[#8A9AAF]">
              Internal STP personnel only. Contact DB admin for credential issues.
            </div>
          )}
        </div>

        {/* Branding below card */}
        <p className="text-center text-white/50 text-xs mt-6 tracking-wide">
          Waste2Wallet &mdash; Sustainable waste management platform
        </p>
      </div>
    </div>
  );
}
