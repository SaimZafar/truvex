import { useNavigate } from 'react-router-dom';
import LiquidEther from '../LiquidEther';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-black text-white">
      {/* Hero section with fluid animation */}
      <div className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0">
          <LiquidEther
            colors={['#5227FF', '#FF9FFC', '#B497CF']}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>

        {/* Nav bar */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 pointer-events-none">
          <span className="text-xl font-bold tracking-tight">Truvex</span>
          <button
            onClick={() => navigate('/login')}
            className="pointer-events-auto px-5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium transition-all"
          >
            Sign In
          </button>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 w-full h-[calc(100%-88px)] flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <span className="pointer-events-auto mb-6 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 backdrop-blur-md">
            Byzantine Fault Tolerant · PBFT Consensus
          </span>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight drop-shadow-lg">
            Truvex
          </h1>
          <p className="text-gray-300 mt-5 text-lg md:text-xl max-w-2xl leading-relaxed drop-shadow">
            A permissioned blockchain network where universities and HEC jointly verify academic credentials -
            no single institution controls the truth.
          </p>

          <div className="pointer-events-auto flex gap-4 mt-10">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white text-black font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              Sign In
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 font-semibold rounded-full transition-all duration-300"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-gray-500 text-xs animate-bounce">
            Scroll to explore
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-white/10 bg-gray-950">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-8 py-12 text-center">
          <Stat value="7" label="Validator institutions" />
          <Stat value="2" label="Faulty nodes tolerated" />
          <Stat value="5/7" label="Quorum required" />
          <Stat value="100%" label="Cryptographically signed" />
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="max-w-5xl mx-auto px-8 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How it works</h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
          Every credential goes through the same three-phase consensus process before it's considered final -
          no single validator, including a compromised one, can force a false record onto the network.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <StepCard
            step="01"
            title="Pre-prepare"
            description="A university proposes a credential - issuing a degree or revoking a fraudulent one. The proposal is cryptographically signed and broadcast to all 7 validators."
          />
          <StepCard
            step="02"
            title="Prepare & Commit"
            description="Validators independently verify the signature and broadcast their agreement. Once 5 of 7 validators agree twice over, consensus is reached."
          />
          <StepCard
            step="03"
            title="Finalized"
            description="The credential is permanently recorded across the network. Any employer can instantly verify it - without contacting the university directly."
          />
        </div>
      </div>

      {/* Trust model */}
      <div className="border-t border-white/10 bg-gray-950">
        <div className="max-w-5xl mx-auto px-8 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Trust, distributed</h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Traditional credential verification relies on one party - a single university's database.
              If it's compromised, a fraudulent degree can slip through unnoticed.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Truvex removes that single point of failure. Every issuance and revocation is agreed upon
              by a majority of independent validators before it's final - and the network keeps functioning
              correctly even if up to 2 of the 7 validators are compromised or go offline.
            </p>
          </div>
          <div className="space-y-4">
            <TrustLine text="Every message is signed with the sender's private key" />
            <TrustLine text="Forged or tampered messages are automatically rejected" />
            <TrustLine text="A dishonest leader sending conflicting proposals cannot reach consensus" />
            <TrustLine text="A failed leader is automatically detected and replaced through view change" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-10 text-center text-gray-600 text-xs">
        Truvex - Permissioned academic credential verification network
      </footer>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold">{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  );
}

function StepCard({ step, title, description }) {
  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
      <span className="text-gray-600 text-sm font-mono">{step}</span>
      <h3 className="text-lg font-semibold mt-2 mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function TrustLine({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </div>
  );
}