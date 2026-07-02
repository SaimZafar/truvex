import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HECDashboard() {
  const { user, logout } = useAuth();

  // Issue form state
  const [studentName, setStudentName] = useState('');
  const [degree, setDegree] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [issueMsg, setIssueMsg] = useState(null);
  const [issueErr, setIssueErr] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Revoke form state
  const [revokeId, setRevokeId] = useState('');
  const [reason, setReason] = useState('');
  const [revokeMsg, setRevokeMsg] = useState(null);
  const [revokeErr, setRevokeErr] = useState('');
  const [revoking, setRevoking] = useState(false);

  async function handleIssue() {
    setIssueErr('');
    setIssueMsg(null);
    if (!studentName.trim() || !degree.trim() || !cgpa || !credentialId.trim()) {
      setIssueErr('All fields are required.');
      return;
    }
    setIssuing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentName, degree, cgpa: parseFloat(cgpa), credentialId })
      });
      const data = await res.json();
      if (!res.ok) {
        setIssueErr(data.error || 'Failed to issue credential.');
        return;
      }
      setIssueMsg(`Proposal for ${credentialId} broadcast to the network. Awaiting consensus.`);
      setStudentName('');
      setDegree('');
      setCgpa('');
      setCredentialId('');
    } catch (err) {
      setIssueErr('Could not connect to server.');
    } finally {
      setIssuing(false);
    }
  }

  async function handleRevoke() {
    setRevokeErr('');
    setRevokeMsg(null);
    if (!revokeId.trim() || !reason.trim()) {
      setRevokeErr('Credential ID and reason are both required.');
      return;
    }
    setRevoking(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credentials/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ credentialId: revokeId, reason })
      });
      const data = await res.json();
      if (!res.ok) {
        setRevokeErr(data.error || 'Failed to revoke credential.');
        return;
      }
      setRevokeMsg(`Revocation of ${revokeId} broadcast to the network. Awaiting consensus.`);
      setRevokeId('');
      setReason('');
    } catch (err) {
      setRevokeErr('Could not connect to server.');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 px-8 py-5 flex items-center justify-between bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Truvex</h1>
          <p className="text-xs text-teal-400/80">HEC Dashboard</p>
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

      <div className="max-w-2xl mx-auto px-8 py-16 space-y-10">
        {/* Issue */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Issue a credential</h2>
          <p className="text-gray-500 text-sm mb-6">
            Issued as HEC. Broadcast to all 7 validators and requires network consensus before finalizing.
          </p>
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
            <div className="space-y-4">
              <Field label="Student Name">
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                  placeholder="Ali Raza" className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Degree">
                  <input type="text" value={degree} onChange={e => setDegree(e.target.value)}
                    placeholder="BSIT" className={inputClass} />
                </Field>
                <Field label="CGPA">
                  <input type="number" step="0.01" min="0" max="4" value={cgpa}
                    onChange={e => setCgpa(e.target.value)} placeholder="3.70" className={inputClass} />
                </Field>
              </div>
              <Field label="Credential ID">
                <input type="text" value={credentialId} onChange={e => setCredentialId(e.target.value)}
                  placeholder="CRED-001" className={inputClass} />
              </Field>
              <button onClick={handleIssue} disabled={issuing}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2">
                {issuing ? 'Broadcasting to network...' : 'Issue Credential'}
              </button>
            </div>
            {issueErr && <Banner type="error">{issueErr}</Banner>}
            {issueMsg && <Banner type="success">{issueMsg}</Banner>}
          </div>
        </section>

        {/* Revoke */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Revoke a credential</h2>
          <p className="text-gray-500 text-sm mb-6">
            Only HEC can revoke. The credential is marked revoked once the network reaches consensus.
          </p>
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="space-y-4">
              <Field label="Credential ID">
                <input type="text" value={revokeId} onChange={e => setRevokeId(e.target.value)}
                  placeholder="CRED-001" className={inputClass} />
              </Field>
              <Field label="Reason">
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Issued in error / fraudulent" className={inputClass} />
              </Field>
              <button onClick={handleRevoke} disabled={revoking}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2">
                {revoking ? 'Broadcasting to network...' : 'Revoke Credential'}
              </button>
            </div>
            {revokeErr && <Banner type="error">{revokeErr}</Banner>}
            {revokeMsg && <Banner type="success">{revokeMsg}</Banner>}
          </div>
        </section>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-gray-950 text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-teal-500/60 transition-colors';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Banner({ type, children }) {
  const styles = type === 'error'
    ? 'bg-red-900/30 border-red-500/40 text-red-300'
    : 'bg-teal-900/30 border-teal-500/40 text-teal-300';
  return <div className={`mt-4 border px-4 py-3 rounded-lg text-sm ${styles}`}>{children}</div>;
}