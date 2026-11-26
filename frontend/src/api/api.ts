const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('w2w_token');
}

/**
 * Centralised fetch wrapper.
 *
 * – Attaches the current JWT from localStorage on every request.
 * – On 401 / 403 responses it clears the stored session and redirects to the
 *   auth page so the user is never stuck on a broken dashboard.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));

    // If the server says the token is invalid, expired, or the role is wrong,
    // clear the stale session so the user is prompted to log in again.
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('w2w_token');
      localStorage.removeItem('w2w_user');

      // Only redirect if we're not already on the auth page (avoid loops)
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }

    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; role: string; points: number; qrCode?: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  register: (name: string, email: string, password: string, role: string) =>
    request<{ message: string; userId: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password, role }) }
    ),
};

// ── Citizen ───────────────────────────────────────────────
export interface Transaction {
  _id: string;
  wasteType: 'WET' | 'DRY' | 'PLASTIC' | 'MIXED';
  weightKg: number;
  pointsAwarded: number;
  createdAt: string;
  collectorId?: { name?: string } | string;
  citizenId?: string;
}

export interface CitizenDashboard {
  wallet: {
    points: number;
    carbonSavedKg: number;
    streakWeeks: number;
    level: number;
  };
  qrCode: string;
  qrBase64?: string;
  recentHistory: Transaction[];
}

export const citizenApi = {
  getDashboard: () => request<CitizenDashboard>('/citizens/dashboard'),
  getTransactions: () => request<Transaction[]>('/citizens/transactions'),
};

// ── Collector ─────────────────────────────────────────────
export interface ScanWastePayload {
  qrCode: string;
  wasteType: 'WET' | 'DRY' | 'PLASTIC' | 'MIXED';
  weightKg: number;
}

export interface ScanWasteResponse {
  message: string;
  transaction: Transaction;
  newCitizenPoints: number;
  citizenName: string;
  collectorName: string;
}

export interface CollectorDashboard {
  name: string;
  collectorId: string;
  todayCount: number;
  totalCollections: number;
  totalWeightKg: number;
  properPct: number;
  partialPct: number;
  nonePct: number;
  weeklyData: { day: string; collections: number }[];
  todayHistory: {
    _id: string;
    citizenId: { name?: string; qrCode?: string } | string;
    wasteType: string;
    weightKg: number;
    pointsAwarded: number;
    createdAt: string;
  }[];
}

export interface CollectorLocation {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: string;
    updatedAt?: string;
  };
}

export const collectorApi = {
  scanWaste: (payload: ScanWastePayload) =>
    request<ScanWasteResponse>('/collectors/scan-waste', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDashboard: () => request<CollectorDashboard>('/collectors/dashboard'),
  updateLocation: (location: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
  }) =>
    request<{ message: string; location: CollectorLocation['location'] }>('/collectors/location', {
      method: 'PUT',
      body: JSON.stringify(location),
    }),
  getLocations: () => request<CollectorLocation[]>('/collectors/locations'),
};

// ── AI ────────────────────────────────────────────────────
export interface AIWasteAnalysis {
  wasteType: 'WET' | 'DRY' | 'PLASTIC' | 'MIXED';
  confidence: number;
  reasoning: string;
  suggestedPointsPerKg: number;
}

export const aiApi = {
  analyzeWaste: (imageBase64: string, mimeType = 'image/jpeg') =>
    request<AIWasteAnalysis>('/ai/analyze-waste', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    }),
};

// ── Admin ─────────────────────────────────────────────────
export interface AdminDashboard {
  totalProcessed: number;
  wasteImpactIndex: number;
  segregationData: { name: string; value: number; color: string }[];
  stpHealth: { mixedWastePercentage: number; efficiencyScore: number };
  totalCitizens: number;
  totalTransactions: number;
}

export interface LeaderboardEntry {
  _id: string;
  name: string;
  points: number;
  level: number;
}

export const adminApi = {
  getDashboard: () => request<AdminDashboard>('/admin/dashboard'),
  getLeaderboard: () => request<LeaderboardEntry[]>('/admin/leaderboard'),
  getCollectorLocations: () => request<CollectorLocation[]>('/collectors/locations'),
};

// ── STP ───────────────────────────────────────────────────
export interface STPMetricPoint {
  time: string;
  flow: number;
  mixed: number;
}

export interface STPLatest {
  mixedWastePercentage: number;
  flowRateMLD: number;
  efficiencyScore: number;
}

export const stpApi = {
  getMetrics: () => request<STPMetricPoint[]>('/stp/metrics'),
  getLatest: () => request<STPLatest>('/stp/latest'),
};
