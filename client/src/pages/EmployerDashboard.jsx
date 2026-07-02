import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EmployerDashboard() {
  const { user, logout } = useAuth();

  const [credentials, setCredentials] = useState({});
  const [loadingList, setLoadingList] = useState(false);

  const [credentialId, setCredentialId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadList() {
    setLoadingList(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credentials/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCredentials(await res.json());
    } catch { /* ignore */ } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { loadList(); }, []);

  async function handleVerify() {
    setError(''); setResult(null);
    if (!credentialId.trim()) { setError('Enter a credential ID to verify.'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/credentials/verify/${credentialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Credential not found.'); return; }
      setResult(data);
    } catch { setError('Could not connect to server.'); }
    finally { setLoading(false); }
  }

  const list = Object.values(credentials);
  const total = list.length;
  const valid = list.filter(c => c.status === 'valid').length;
  const revoked = total - valid;

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col justify-between bg-gradient-to-b from-[#1a1533] to-[#0f0b1f] text-white sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 px-6 py-6">
            <Logo />
            <div>
              <p className="font-bold tracking-tight leading-none">Truvex</p>
              <p className="text-[11px] text-indigo-300/70 mt-0.5">Consensus Network</p>
            </div>
          </div>

          <nav className="px-3 mt-4 space-y-1">
            <NavItem active onClick={() => scrollTo('overview')} label="Overview" />
            <NavItem onClick={() => scrollTo('verify')} label="Verify Credential" />
            <NavItem onClick={() => scrollTo('activity')} label="All Credentials" />
          </nav>

          <div className="mx-5 mt-6 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">Network operational</span>
            </div>
            <p className="text-[11px] text-indigo-200/60 mt-1.5 leading-relaxed">
              7 validators - quorum 5 - tolerating up to 2 faults
            </p>
          </div>
        </div>

        <div className="px-5 py-5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-semibold">
              {(user?.username || 'E')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-[11px] text-indigo-300/60">Employer - Verifier</p>
            </div>
          </div>
          <button onClick={logout}
            className="mt-3 w-full text-sm text-indigo-200/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 transition-colors">
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Verification portal</h1>
            <p className="text-sm text-slate-500">Check any credential against the network's consensus ledger</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Consensus healthy
          </span>
        </header>

        <div id="overview" className="px-6 md:px-10 py-8 max-w-6xl">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="On the ledger" value={total} hint="Total credentials" />
            <Stat label="Valid" value={valid} hint="Active and verifiable" />
            <Stat label="Revoked" value={revoked} hint="Invalidated by HEC" />
            <Stat label="Validators" value="7 / 7" hint="Online and in consensus" />
          </div>

          {/* Verify */}
          <div id="verify" className="mt-8">
            <Panel title="Verify a credential"
              subtitle="Enter a credential ID to check its status, issuer, and details.">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  className={input + ' flex-1'}
                  value={credentialId}
                  onChange={e => setCredentialId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g. CRED-001"
                />
                <button onClick={handleVerify} disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                  {loading ? 'Checking...' : 'Verify'}
                </button>
              </div>

              {error && <div className="mt-4"><Banner type="error">{error}</Banner></div>}

              {result && (
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Status</span>
                    {result.status === 'valid' ? (
                      <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                        Revoked
                      </span>
                    )}
                  </div>
                  <Detail label="Student" value={result.studentName} />
                  <Detail label="Degree" value={result.degree} />
                  <Detail label="CGPA" value={result.cgpa} />
                  <Detail label="Issuing institution" value={result.issuingInstitution} />
                  <Detail label="Credential ID" value={result.credentialId} />
                  {result.status !== 'valid' && result.revokedReason && (
                    <Detail label="Revocation reason" value={result.revokedReason} />
                  )}
                </div>
              )}
            </Panel>
          </div>

          {/* Activity */}
          <div id="activity" className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">All credentials</h2>
                <p className="text-sm text-slate-500">Every credential finalized on the consensus ledger.</p>
              </div>
              <button onClick={loadList} disabled={loadingList}
                className="text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                {loadingList ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_24px_-12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:border-slate-400 hover:shadow-[0_6px_14px_rgba(15,23,42,0.10),0_20px_36px_-14px_rgba(15,23,42,0.28)]">
              {list.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No credentials on the ledger yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3 font-medium">Credential ID</th>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Degree</th>
                      <th className="px-5 py-3 font-medium">Institution</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(c => (
                      <tr key={c.credentialId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 cursor-pointer"
                        onClick={() => { setCredentialId(c.credentialId); setResult(c); setError(''); scrollTo('verify'); }}>
                        <td className="px-5 py-3 font-medium text-slate-800">{c.credentialId}</td>
                        <td className="px-5 py-3 text-slate-600">{c.studentName}</td>
                        <td className="px-5 py-3 text-slate-600">{c.degree}</td>
                        <td className="px-5 py-3 text-slate-600">{c.issuingInstitution}</td>
                        <td className="px-5 py-3">
                          {c.status === 'valid' ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                              Revoked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const input =
  'w-full bg-white text-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition';

function Logo() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </div>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-white/10 text-white font-medium' : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
      }`}>
      {label}
    </button>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_24px_-12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_6px_14px_rgba(15,23,42,0.10),0_20px_36px_-14px_rgba(15,23,42,0.30)]">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <p className="text-3xl font-bold tracking-tight mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

function Panel({ id, title, subtitle, children }) {
  return (
    <div id={id} className="relative bg-white border border-slate-300 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_24px_-12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:border-slate-400 hover:shadow-[0_6px_14px_rgba(15,23,42,0.10),0_20px_36px_-14px_rgba(15,23,42,0.28)]">
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 mb-5 mt-0.5">{subtitle}</p>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

function Banner({ type, children }) {
  const s = type === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return <div className={`border px-4 py-3 rounded-lg text-sm ${s}`}>{children}</div>;
}
