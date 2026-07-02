import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function UniversityDashboard() {
  const { user, logout } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [degree, setDegree] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleIssue() {
    setError('');
    setMessage(null);

    if (!studentName.trim() || !degree.trim() || !cgpa || !credentialId.trim()) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName,
          degree,
          cgpa: parseFloat(cgpa),
          credentialId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to issue credential.');
        return;
      }
      setMessage(`Proposal for ${credentialId} broadcast to the network. Awaiting consensus.`);
      setStudentName('');
      setDegree('');
      setCgpa('');
      setCredentialId('');
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
          <p className="text-xs text-teal-400/80">{user?.institution || 'University'} Dashboard</p>
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

      <div className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-semibold mb-2">Issue a credential</h2>
        <p className="text-gray-500 text-sm mb-8">
          Submitted proposals are broadcast to all 7 validators and require network consensus before finalizing.
        </p>

        <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

          <div className="space-y-4">
            <Field label="Student Name">
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Ali Raza"
                className="w-full bg-gray-950 text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-teal-500/60 transition-colors"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Degree">
                <input
                  type="text"
                  value={degree}
                  onChange={e => setDegree(e.target.value)}
                  placeholder="BSIT"
                  className="w-full bg-gray-950 text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-teal-500/60 transition-colors"
                />
              </Field>
              <Field label="CGPA">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={cgpa}
                  onChange={e => setCgpa(e.target.value)}
                  placeholder="3.70"
                  className="w-full bg-gray-950 text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-teal-500/60 transition-colors"
                />
              </Field>
            </div>

            <Field label="Credential ID">
              <input
                type="text"
                value={credentialId}
                onChange={e => setCredentialId(e.target.value)}
                placeholder="CRED-001"
                className="w-full bg-gray-950 text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-teal-500/60 transition-colors"
              />
            </Field>

            <button
              onClick={handleIssue}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Broadcasting to network...' : 'Issue Credential'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 bg-teal-900/30 border border-teal-500/40 text-teal-300 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}