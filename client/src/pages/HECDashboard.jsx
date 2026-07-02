import { useAuth } from '../context/AuthContext';

export default function HECDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Truvex</h1>
          <p className="text-xs text-gray-500">HEC Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.username}</span>
          <button
            onClick={logout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Welcome, HEC</h2>
          <p className="text-gray-400 text-sm">
            Issue credentials, revoke fraudulent ones, and view network-wide activity here.
          </p>
        </div>
      </div>
    </div>
  );
}