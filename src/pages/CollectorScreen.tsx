import { useState, useRef } from 'react';
import {
  QrCode, Check, AlertTriangle, CheckCircle2, Scale,
  Camera, Sparkles, RefreshCw, Upload, ChevronRight, User
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { collectorApi, aiApi, type AIWasteAnalysis } from '../api/api';
import { useAuth } from '../context/AuthContext';

type ScanState = 'idle' | 'scanning' | 'scanned' | 'ai_analyzing' | 'ai_done' | 'success';
type WasteType = 'WET' | 'DRY' | 'PLASTIC' | 'MIXED';

interface SuccessData {
  citizenName: string;
  pointsAwarded: number;
  wasteType: WasteType;
  weightKg: number;
}

const WASTE_CONFIG: Record<WasteType, { label: string; color: string; bg: string; border: string; pts: string }> = {
  WET:     { label: 'Wet Waste',             color: 'text-emerald-400', bg: 'bg-emerald-600/20', border: 'border-emerald-500/30', pts: '10 pts/kg' },
  DRY:     { label: 'Dry Waste',             color: 'text-blue-400',    bg: 'bg-blue-600/20',    border: 'border-blue-500/30',    pts: '10 pts/kg' },
  PLASTIC: { label: 'Plastic',               color: 'text-purple-400',  bg: 'bg-purple-600/20',  border: 'border-purple-500/30',  pts: '15 pts/kg' },
  MIXED:   { label: 'Mixed (Not Segregated)', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   pts: '2 pts/kg'  },
};

const CONFIDENCE_COLOR = (c: number) =>
  c >= 80 ? 'text-emerald-400' : c >= 50 ? 'text-yellow-400' : 'text-red-400';

export default function CollectorScreen() {
  const { user } = useAuth();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState<string>('1');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // AI state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIWasteAnalysis | null>(null);
  const [aiError, setAiError] = useState('');
  const [selectedType, setSelectedType] = useState<WasteType | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1: QR Scanner ───────────────────────────────────
  const startScanning = () => {
    setScanState('scanning');
    setScannedData(null);
    setSubmitError('');
    setPhotoPreview(null);
    setAiResult(null);
    setSelectedType(null);
    setAiError('');
  };

  const handleScan = (detected: { rawValue: string }[]) => {
    if (detected?.length > 0) {
      const value = detected[0].rawValue;
      if (value) {
        setScannedData(value);
        setScanState('scanned');
      }
    }
  };

  // ── Step 2: Photo → AI Analysis ─────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type || 'image/jpeg';

    // Preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);

      // Extract raw base64 (strip the data URI prefix)
      const base64 = dataUrl.split(',')[1];
      setAiError('');
      setScanState('ai_analyzing');

      try {
        const result = await aiApi.analyzeWaste(base64, mimeType);
        setAiResult(result);
        setSelectedType(result.wasteType as WasteType);
        setScanState('ai_done');
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'AI analysis failed');
        setScanState('scanned'); // Fall back so user can proceed manually
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Step 3: Submit ───────────────────────────────────────
  const handleSubmit = async (type: WasteType) => {
    if (!scannedData) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const kg = parseFloat(weightKg) || 1;
      const result = await collectorApi.scanWaste({
        qrCode: scannedData,
        wasteType: type,
        weightKg: kg,
      });

      setSuccessData({
        citizenName: result.citizenName,
        pointsAwarded: result.transaction.pointsAwarded,
        wasteType: type,
        weightKg: kg,
      });
      setScanState('success');
      setTimeout(() => setScanState('idle'), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to log waste');
    } finally {
      setSubmitting(false);
    }
  };

  const resetToScanned = () => {
    setScanState('scanned');
    setPhotoPreview(null);
    setAiResult(null);
    setAiError('');
    setSelectedType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-full max-w-md mx-auto relative pt-4">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Collector Mode</h1>
        <p className="text-sm text-emerald-200/60">Hello, {user?.name} · Ready for collection</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start relative w-full overflow-y-auto">

        {/* ── IDLE ─────────────────────────────────────── */}
        {scanState === 'idle' && (
          <div className="text-center w-full animate-[fadeIn_0.3s_ease-out] flex flex-col items-center justify-center flex-1">
            <button
              onClick={startScanning}
              className="glass-panel w-48 h-48 rounded-[2rem] mx-auto flex flex-col items-center justify-center gap-4 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all group"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                <QrCode className="w-12 h-12 text-emerald-400" />
              </div>
              <span className="text-lg font-medium text-emerald-100">Scan QR</span>
            </button>
            <p className="text-emerald-200/50 mt-8 text-sm">Tap to scan household code</p>
          </div>
        )}

        {/* ── SCANNING ─────────────────────────────────── */}
        {scanState === 'scanning' && (
          <div className="w-full text-center animate-[fadeIn_0.3s_ease-out]">
            <div className="glass-panel mx-auto p-2 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-500/30 max-w-[320px] overflow-hidden">
              <div className="rounded-3xl overflow-hidden relative">
                <Scanner
                  onScan={(result) => handleScan(result)}
                  components={{ finder: true }}
                />
              </div>
            </div>
            <p className="text-emerald-400 mt-6 font-medium tracking-wide animate-pulse">Point camera at QR Code...</p>
            <button onClick={() => setScanState('idle')} className="mt-4 mx-auto block text-emerald-200/50 text-sm hover:text-white transition-colors">
              Cancel Scan
            </button>
          </div>
        )}

        {/* ── SCANNED: photo + manual options ──────────── */}
        {(scanState === 'scanned') && (
          <div className="w-full glass-panel p-6 animate-[fadeIn_0.3s_ease-out] space-y-5">
            {/* Citizen QR confirmed */}
            <div className="pb-4 border-b border-white/10 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-lg text-emerald-400">QR</span>
              </div>
              <h2 className="text-base font-bold text-white mb-1 truncate px-2">{scannedData}</h2>
              <p className="text-sm text-emerald-200/60">Household Scanned Successfully</p>
            </div>

            {/* Weight */}
            <div>
              <label className="text-sm text-emerald-200/70 font-medium flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4" /> Weight (kg)
              </label>
              <input
                type="number" min="0.1" step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="glass-input w-full"
                placeholder="e.g. 2.5"
              />
            </div>

            {/* AI Photo Upload CTA */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AI Waste Analysis</p>
                  <p className="text-emerald-200/50 text-xs">Take a photo for auto-classification</p>
                </div>
              </div>
              {aiError && (
                <p className="text-red-400 text-xs mb-2 bg-red-500/10 rounded-lg px-3 py-2">{aiError}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="waste-photo-input"
              />
              <label
                htmlFor="waste-photo-input"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-medium text-sm cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take / Upload Photo
              </label>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-emerald-200/40">or select manually</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Manual waste type selection */}
            <div className="space-y-2">
              {(Object.keys(WASTE_CONFIG) as WasteType[]).map((type) => {
                const cfg = WASTE_CONFIG[type];
                const Icon = type === 'MIXED' ? AlertTriangle : Check;
                return (
                  <button
                    key={type}
                    onClick={() => handleSubmit(type)}
                    disabled={submitting}
                    className={`w-full glass-button p-3.5 ${cfg.bg} hover:opacity-90 border ${cfg.border} flex items-center gap-3 disabled:opacity-50`}
                  >
                    <div className={`p-2 rounded-lg bg-white/5`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <span className={`${cfg.color} font-medium text-sm`}>{cfg.label}</span>
                    <span className={`ml-auto text-xs ${cfg.color} opacity-70`}>{cfg.pts}</span>
                  </button>
                );
              })}
            </div>

            {submitError && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {submitError}
              </div>
            )}

            <button onClick={() => setScanState('scanning')} className="w-full py-2 text-center text-emerald-200/50 text-sm hover:text-white transition-colors">
              Scan Again
            </button>
          </div>
        )}

        {/* ── AI ANALYZING ─────────────────────────────── */}
        {scanState === 'ai_analyzing' && (
          <div className="w-full glass-panel p-8 animate-[fadeIn_0.3s_ease-out] text-center space-y-6">
            {photoPreview && (
              <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <img src={photoPreview} alt="Waste photo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400/30 border-t-emerald-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">AI Analyzing...</p>
                <p className="text-emerald-200/60 text-sm mt-1">Gemini Vision is classifying your waste</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI RESULT ─────────────────────────────────── */}
        {scanState === 'ai_done' && aiResult && (
          <div className="w-full glass-panel p-6 animate-[fadeIn_0.3s_ease-out] space-y-5">
            {/* Photo + AI result header */}
            <div className="flex gap-4 items-start">
              {photoPreview && (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/20 shrink-0">
                  <img src={photoPreview} alt="Waste" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">AI Analysis Complete</span>
                </div>
                <h3 className="text-white font-bold text-lg">
                  {WASTE_CONFIG[aiResult.wasteType]?.label ?? aiResult.wasteType}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-200/50">Confidence:</span>
                  <span className={`text-sm font-bold ${CONFIDENCE_COLOR(aiResult.confidence)}`}>
                    {aiResult.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-emerald-200/60 leading-relaxed">
                <span className="text-emerald-400 font-semibold">AI Reasoning: </span>
                {aiResult.reasoning}
              </p>
            </div>

            {/* Weight */}
            <div>
              <label className="text-sm text-emerald-200/70 font-medium flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4" /> Weight (kg)
              </label>
              <input
                type="number" min="0.1" step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="glass-input w-full"
              />
            </div>

            {/* Estimated points */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-200/50">Estimated Points</p>
                <p className="text-2xl font-bold text-emerald-400">
                  +{Math.round((parseFloat(weightKg) || 1) * aiResult.suggestedPointsPerKg)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-200/50">Rate</p>
                <p className="text-sm font-medium text-white">{aiResult.suggestedPointsPerKg} pts/kg</p>
              </div>
            </div>

            {/* Accept AI suggestion */}
            <button
              onClick={() => handleSubmit(selectedType || aiResult.wasteType as WasteType)}
              disabled={submitting}
              className="w-full glass-button glass-button-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Accept AI Suggestion & Submit</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>

            {submitError && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {submitError}
              </div>
            )}

            {/* Override options */}
            <div>
              <p className="text-center text-xs text-emerald-200/40 mb-3">Override AI selection</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(WASTE_CONFIG) as WasteType[]).map((type) => {
                  const cfg = WASTE_CONFIG[type];
                  const isSelected = (selectedType || aiResult.wasteType) === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      disabled={submitting}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-lg`
                          : 'bg-white/5 border-white/10 text-emerald-200/50 hover:bg-white/10'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              {selectedType && selectedType !== aiResult.wasteType && (
                <button
                  onClick={() => handleSubmit(selectedType)}
                  disabled={submitting}
                  className="w-full mt-2 glass-button py-3 bg-white/5 border border-white/20 text-emerald-200 text-sm disabled:opacity-50"
                >
                  Submit as {WASTE_CONFIG[selectedType].label}
                </button>
              )}
            </div>

            {/* Redo photo */}
            <div className="flex gap-3">
              <button
                onClick={resetToScanned}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-emerald-200/50 text-sm hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake Photo
              </button>
              <button
                onClick={() => setScanState('scanning')}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-emerald-200/50 text-sm hover:text-white transition-colors"
              >
                <Upload className="w-4 h-4" />
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ───────────────────────────────────── */}
        {scanState === 'success' && successData && (
          <div className="text-center w-full animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-1 text-glow">
                +{successData.pointsAwarded} Points
              </h2>
              <p className="text-emerald-200/80">Collection Logged Successfully</p>
            </div>

            {/* Citizen info */}
            <div className="glass-panel px-6 py-4 flex items-center gap-4 w-full max-w-xs">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-emerald-200/50 mb-0.5">Points awarded to</p>
                <p className="text-white font-bold">{successData.citizenName}</p>
                <p className="text-xs text-emerald-400 mt-0.5">
                  {WASTE_CONFIG[successData.wasteType]?.label} · {successData.weightKg} kg
                </p>
              </div>
            </div>

            <p className="text-emerald-200/40 text-xs">Citizen notified in real-time ✓</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.3); }
          50%  { opacity: 1; transform: scale(1.05); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40%           { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
