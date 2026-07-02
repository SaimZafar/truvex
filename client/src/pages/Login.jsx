import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }
      login(data);
      if (data.role === 'hec') navigate('/hec');
      else if (data.role === 'university') navigate('/university');
      else if (data.role === 'employer') navigate('/employer');
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-gray-950">
      {/* Left panel — branding, animated background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gray-950">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-[drift1_18s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] bg-pink-500/15 rounded-full blur-[120px] animate-[drift2_22s_ease-in-out_infinite]" />
          <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] bg-indigo-500/15 rounded-full blur-[100px] animate-[drift1_25s_ease-in-out_infinite_reverse]" />
        </div>

        <div className="relative z-10 px-16 max-w-lg">
          <h1 className="text-5xl font-bold text-white tracking-tight">Truvex</h1>
          <p className="text-gray-400 mt-4 text-lg leading-relaxed">
            A permissioned blockchain network for academic credential verification.
          </p>

          <div className="mt-12 space-y-5">
            <FeatureLine text="PBFT consensus across 7 validator institutions" />
            <FeatureLine text="Byzantine fault tolerant - survives up to 2 compromised validators" />
            <FeatureLine text="Every credential cryptographically signed and independently verified" />
          </div>
        </div>
      </div>

      {/* Right panel — the actual form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Truvex</h1>
            <p className="text-gray-400 mt-1 text-sm">Academic Credential Verification Network</p>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-8">Enter your institutional credentials to continue.</p>

          {error && (
            <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-gray-600 transition-colors"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg border border-gray-800 focus:outline-none focus:border-gray-600 transition-colors"
                placeholder="Enter your password"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-gray-950 font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p className="text-gray-600 text-xs text-center mt-8">
            Permissioned network - access is provisioned by your institution's administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureLine({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
      <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
    </div>
  );
}