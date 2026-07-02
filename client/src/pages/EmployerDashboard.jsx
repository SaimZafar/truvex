import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EmployerDashboard() {
  const { user, logout } = useAuth();
  const [credentialId, setCredentialId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setError('');
    setResult(null);
    if (!credentialId.trim()) {
      setError('Enter a credential ID to verify.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/credentials/verify/${credentialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credential not found.');
        return;
      }
      setResult(data);
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 px-8 py-5 flex items-center justify-between bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Truvex</h1>
          <p className="text-xs text-teal-400/80">Employer Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.username}</span>
          <button
            onClick={logout}
            className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-semibold mb-2">Verify a credential</h2>
        <p className="text-gray-500 text-sm mb-8">
          Enter a credential ID to check its status against the network's consensus ledger.
        </p>

        <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

          <div className="flex gap-3">
            <input
              type="text"
              value={credentialId}
              onChange={e => setCredentialId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="e.g. CRED-001"
              className="flex-1 bg-gray-950 text-white px-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-teal-500/60 transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Checking...' : 'Verify'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 bg-gray-950/60 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-gray-500 text-sm">Status</span>
                <span
                  className={
                    result.status === 'valid'
                      ? 'inline-flex items-center gap-1.5 text-sm font-medium text-teal-400'
                      : 'inline-flex items-center gap-1.5 text-sm font-medium text-red-400'
                  }
                >
                  <span
                    className={
                      result.status === 'valid'
                        ? 'w-1.5 h-1.5 rounded-full bg-teal-400'
                        : 'w-1.5 h-1.5 rounded-full bg-red-400'
                    }
                  />
                  {result.status === 'valid' ? 'Valid' : 'Revoked'}
                </span>
              </div>

              <DetailRow label="Student" value={result.studentName} />
              <DetailRow label="Degree" value={result.degree} />
              <DetailRow label="CGPA" value={result.cgpa} />
              <DetailRow label="Issuing Institution" value={result.issuingInstitution} />
              <DetailRow label="Credential ID" value={result.credentialId} />
              {result.status !== 'valid' && result.revokedReason && (
                <DetailRow label="Revocation Reason" value={result.revokedReason} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-medium">{value}</span>
    </div>
  );
}