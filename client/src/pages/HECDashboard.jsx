import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HECDashboard() {
  const { user, logout } = useAuth();

  const [credentials, setCredentials] = useState({});
  const [loadingList, setLoadingList] = useState(false);

  // Issue form
  const [studentName, setStudentName] = useState('');
  const [degree, setDegree] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [issueMsg, setIssueMsg] = useState(null);
  const [issueErr, setIssueErr] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Revoke form
  const [revokeId, setRevokeId] = useState('');
  const [reason, setReason] = useState('');
  const [revokeMsg, setRevokeMsg] = useState(null);
  const [revokeErr, setRevokeErr] = useState('');
  const [revoking, setRevoking] = useState(false);

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

  async function handleIssue() {
    setIssueErr(''); setIssueMsg(null);
    if (!studentName.trim() || !degree.trim() || !cgpa || !credentialId.trim()) {
      setIssueErr('All fields are required.'); return;
    }
    setIssuing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentName, degree, cgpa: parseFloat(cgpa), credentialId })
      });
      const data = await res.json();
      if (!res.ok) { setIssueErr(data.error || 'Failed to issue credential.'); return; }
      setIssueMsg(`${credentialId} broadcast to the network. Awaiting consensus.`);
      setStudentName(''); setDegree(''); setCgpa(''); setCredentialId('');
      setTimeout(loadList, 1500);
    } catch { setIssueErr('Could not connect to server.'); }
    finally { setIssuing(false); }
  }

  async function handleRevoke() {
    setRevokeErr(''); setRevokeMsg(null);
    if (!revokeId.trim() || !reason.trim()) {
      setRevokeErr('Credential ID and reason are both required.'); return;
    }
    setRevoking(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credentials/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ credentialId: revokeId, reason })
      });
      const data = await res.json();
      if (!res.ok) { setRevokeErr(data.error || 'Failed to revoke credential.'); return; }
      setRevokeMsg(`Revocation of ${revokeId} broadcast to the network.`);
      setRevokeId(''); setReason('');
      setTimeout(loadList, 1500);
    } catch { setRevokeErr('Could not connect to server.'); }
    finally { setRevoking(false); }
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
            <NavItem onClick={() => scrollTo('issue')} label="Issue Credential" />
            <NavItem onClick={() => scrollTo('revoke')} label="Revoke Credential" />
            <NavItem onClick={() => scrollTo('activity')} label="Network Activity" />
          </nav>

          <div className="mx-5 mt-6 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">Network operational</span>
            </div>
            <p className="text-[11px] text-indigo-200/60 mt-1.5 leading-relaxed">
              7 validators · quorum 5 · tolerating up to 2 faults
            </p>
          </div>
        </div>

        <div className="px-5 py-5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-semibold">
              {(user?.username || 'H')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-[11px] text-indigo-300/60">HEC Administrator</p>
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
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Higher Education Commission</h1>
            <p className="text-sm text-slate-500">Credential authority · full issuing and revocation rights</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Consensus healthy
          </span>
        </header>

        <div id="overview" className="px-6 md:px-10 py-8 max-w-6xl">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Total credentials" value={total} accent="indigo" hint="On the ledger" />
            <Stat label="Valid" value={valid} accent="emerald" hint="Active & verifiable" />
            <Stat label="Revoked" value={revoked} accent="rose" hint="Invalidated" />
            <Stat label="Validators" value="7 / 7" accent="violet" hint="Online & in consensus" />
          </div>

          {/* Actions */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            {/* Issue */}
            <Panel id="issue" title="Issue a credential"
              subtitle="Signed as HEC and broadcast to all validators for consensus." accent="indigo">
              <div className="space-y-4">
                <Field label="Student name">
                  <input className={input} value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Ali Raza" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Degree">
                    <input className={input} value={degree} onChange={e => setDegree(e.target.value)} placeholder="BSIT" />
                  </Field>
                  <Field label="CGPA">
                    <input className={input} type="number" step="0.01" min="0" max="4" value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="3.70" />
                  </Field>
                </div>
                <Field label="Credential ID">
                  <input className={input} value={credentialId} onChange={e => setCredentialId(e.target.value)} placeholder="CRED-001" />
                </Field>
                <button onClick={handleIssue} disabled={issuing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {issuing ? 'Broadcasting…' : 'Issue Credential'}
                </button>
                {issueErr && <Banner type="error">{issueErr}</Banner>}
                {issueMsg && <Banner type="success">{issueMsg}</Banner>}
              </div>
            </Panel>

            {/* Revoke */}
            <Panel id="revoke" title="Revoke a credential"
              subtitle="HEC-only. Marks a credential invalid once consensus is reached." accent="rose">
              <div className="space-y-4">
                <Field label="Credential ID">
                  <input className={input} value={revokeId} onChange={e => setRevokeId(e.target.value)} placeholder="CRED-001" />
                </Field>
                <Field label="Reason">
                  <input className={input} value={reason} onChange={e => setReason(e.target.value)} placeholder="Issued in error / fraudulent" />
                </Field>
                <button onClick={handleRevoke} disabled={revoking}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {revoking ? 'Broadcasting…' : 'Revoke Credential'}
                </button>
                {revokeErr && <Banner type="error">{revokeErr}</Banner>}
                {revokeMsg && <Banner type="success">{revokeMsg}</Banner>}
              </div>
            </Panel>
          </div>

          {/* Activity */}
          <div id="activity" className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Network activity</h2>
                <p className="text-sm text-slate-500">Every credential finalized on the consensus ledger.</p>
              </div>
              <button onClick={loadList} disabled={loadingList}
                className="text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                {loadingList ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_24px_-12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:border-slate-400 hover:shadow-[0_6px_14px_rgba(15,23,42,0.10),0_20px_36px_-14px_rgba(15,23,42,0.28)]">
              {list.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No credentials issued yet.</div>
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
                      <tr key={c.credentialId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
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

function Panel({ id, title, subtitle, accent, children }) {
  const bar = { indigo: 'from-indigo-500', rose: 'from-rose-500' }[accent] || 'from-indigo-500';
  return (
    <div id={id} className="relative bg-white border border-slate-300 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_24px_-12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:border-slate-400 hover:shadow-[0_6px_14px_rgba(15,23,42,0.10),0_20px_36px_-14px_rgba(15,23,42,0.28)]">
      <div className={`absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r ${bar} to-transparent rounded-full`} />
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 mb-5 mt-0.5">{subtitle}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Banner({ type, children }) {
  const s = type === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return <div className={`border px-4 py-3 rounded-lg text-sm ${s}`}>{children}</div>;
}