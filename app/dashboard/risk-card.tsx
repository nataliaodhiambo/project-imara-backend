'use client';

import React, { useState } from 'react';

// Mock Squad Data
const SQUAD_PLAYERS = [
  { name: "Bukayo Saka", position: "Winger", acwr: 1.65, sleep: 5.5, fatigue: 4.5, soreness: 4.0 },
  { name: "Declan Rice", position: "Midfielder", acwr: 1.10, sleep: 8.0, fatigue: 2.0, soreness: 1.5 },
  { name: "William Saliba", position: "Defender", acwr: 1.20, sleep: 7.5, fatigue: 2.5, soreness: 2.0 },
  { name: "Gabriel Martinelli", position: "Winger", acwr: 1.45, sleep: 6.0, fatigue: 4.0, soreness: 3.5 },
  { name: "Martin Odegaard", position: "Midfielder", acwr: 1.05, sleep: 8.5, fatigue: 1.5, soreness: 1.0 },
];

export default function AppRouter() {
  // Access Control State: 'login' | 'coach' | 'player'
  const [role, setRole] = useState<'login' | 'coach' | 'player'>('login');
  const [selectedPlayerName, setSelectedPlayerName] = useState(SQUAD_PLAYERS[0].name);

  // Shared evaluation states
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const handleLogin = (selectedRole: 'coach' | 'player') => {
    setRole(selectedRole);
  };

  const evaluatePlayer = async (player: typeof SQUAD_PLAYERS[0]) => {
    setEvaluating(player.name);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_name: player.name,
          features: {
            acwr: player.acwr,
            atl: 520.0,
            ctl28: 400.0,
            ctl42: 390.0,
            daily_load: 550.0,
            monotony: 1.8,
            strain: 650.0,
            weekly_load: 3100.0,
            fatigue: player.fatigue,
            mood: 3.0,
            readiness: 2.5,
            sleep_duration: player.sleep,
            sleep_quality: 3.0,
            soreness: player.soreness,
            stress: 3.0
          }
        }),
      });

      if (!response.ok) throw new Error('Inference failed');
      const data = await response.json();

      let riskFactors = [];
      let recommendation = "";
      let recoveryTips = [];

      if (player.acwr > 1.4) riskFactors.push({ feature: 'High ACWR Spike (>1.4)', value: player.acwr });
      if (player.sleep < 6.5) riskFactors.push({ feature: 'Sleep Deficit (<6.5h)', value: player.sleep });
      if (player.fatigue > 3.5) riskFactors.push({ feature: 'Elevated Fatigue', value: player.fatigue });
      if (player.soreness > 3.0) riskFactors.push({ feature: 'Muscle Soreness', value: player.soreness });

      if (data.risk_tier.includes('Red')) {
        recommendation = `Rest or restrict ${player.name} from high-intensity drills immediately. Triggered by severe fatigue and acute workload spikes.`;
        recoveryTips = [
          "Mandatory 8+ hours sleep target with blackout room conditions.",
          "Hydrotherapy & contrast water immersion (cold/hot bath) to flush metabolic waste.",
          "Consult club physiotherapist for soft-tissue release on tight hamstrings/calves."
        ];
      } else if (data.risk_tier.includes('Amber')) {
        recommendation = `Reduce training volume and monitor ${player.name} closely during tactical drills.`;
        recoveryTips = [
          "Incorporate 20 minutes of light mobility and foam rolling post-session.",
          "Prioritize carbohydrate-electrolyte replenishment and protein intake within 45 mins of training.",
          "Maintain consistent sleep schedule to stabilize autonomic nervous system."
        ];
      } else {
        recommendation = `Clear ${player.name} for full training session. Workload and recovery are in optimal balance.`;
        recoveryTips = [
          "Maintain current baseline training load and hydration habits.",
          "Incorporate standard dynamic stretching prior to high-speed running blocks.",
          "Continue optimal sleep hygiene to preserve peak performance capacity."
        ];
      }

      setResults(prev => ({
        ...prev,
        [player.name]: {
          ...data,
          top_risk_factors: riskFactors,
          prescription: recommendation,
          recovery_tips: recoveryTips
        }
      }));
    } catch (err) {
      console.error(err);
      alert('Error connecting to FastAPI Edge Node on Jetson/Localhost.');
    } finally {
      setEvaluating(null);
    }
  };

  // ================= 1. ACCESS GATE / LOGIN SCREEN =================
  if (role === 'login') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center p-6">
        <div className="bg-[#141414] border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center">
          <div className="w-3 h-3 rounded-full bg-[#FF2D6B] animate-pulse mx-auto mb-4"></div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Project <span className="text-[#FF2D6B]">Imara</span></h1>
          <p className="text-xs text-gray-400 mb-8 uppercase tracking-widest">Secure Access Gateway</p>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('coach')}
              className="w-full bg-[#FF2D6B] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition shadow-lg text-sm"
            >
              Access as Performance Staff / Coach
            </button>
            <button
              onClick={() => handleLogin('player')}
              className="w-full bg-gray-900 border border-gray-800 text-gray-200 font-semibold py-3 rounded-xl hover:bg-gray-800 transition text-sm"
            >
              Access as Athlete (Player Portal)
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between text-xs text-gray-500">
            <a href="http://127.0.0.1:8000" className="hover:text-gray-300">FastAPI Home</a>
            <a href="http://127.0.0.1:8000/docs" target="_blank" className="hover:text-gray-300">Explore API Docs</a>
          </div>
        </div>
      </main>
    );
  }

  // ================= 2. COACH COMMAND CENTER =================
  if (role === 'coach') {
    const selectedPlayer = SQUAD_PLAYERS.find(p => p.name === selectedPlayerName) || SQUAD_PLAYERS[0];
    const res = results[selectedPlayer.name];

    return (
      <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 md:p-10 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center border-b border-gray-800 pb-6 mb-8">
            <div>
              <span className="text-xs text-[#FF2D6B] uppercase tracking-widest font-semibold">Coach Portal &bull; Edge Inference Node</span>
              <h1 className="text-2xl font-extrabold">Squad Telemetry Command Center</h1>
            </div>
            <button onClick={() => setRole('login')} className="text-xs bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl border border-gray-700">
              Log Out
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#141414] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Squad Training Roster</h2>
              <div className="space-y-3">
                {SQUAD_PLAYERS.map(player => {
                  const playerRes = results[player.name];
                  const isSelected = selectedPlayerName === player.name;

                  return (
                    <div 
                      key={player.name}
                      onClick={() => setSelectedPlayerName(player.name)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected ? 'bg-gray-900 border-[#FF2D6B]' : 'bg-black/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-gray-400">{player.position} &bull; ACWR: {player.acwr} &bull; Sleep: {player.sleep}h</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {playerRes && (
                          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                            playerRes.risk_tier.includes('Red') ? 'bg-red-500/10 text-red-500' :
                            playerRes.risk_tier.includes('Amber') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {playerRes.risk_tier.split(' ')[0]}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); evaluatePlayer(player); }}
                          disabled={evaluating === player.name}
                          className="bg-[#FF2D6B] hover:opacity-90 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                        >
                          {evaluating === player.name ? 'Running...' : 'Run Analysis'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold mb-4">Prescriptive Coaching Action</h2>
                <div className="bg-black border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase">Selected Athlete</p>
                  <p className="text-xl font-bold text-white mb-4">{selectedPlayer.name}</p>

                  {res ? (
                    <div className="space-y-4">
                      <div className="bg-gray-900/90 border border-[#FF2D6B]/30 p-3 rounded-xl">
                        <p className="text-xs font-bold text-[#FF2D6B] uppercase mb-1">Coach Recommendation</p>
                        <p className="text-xs text-gray-200 leading-relaxed">{res.prescription}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Run analysis on this player to view AI recommendations.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ================= 3. PLAYER PORTAL (WITH RECOVERY OPTIMIZATION XAI) =================
  const currentPlayer = SQUAD_PLAYERS[0]; // Default player view for demo
  const playerRes = results[currentPlayer.name];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 mb-8">
          <div>
            <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold">Athlete Portal &bull; Self-Management</span>
            <h1 className="text-2xl font-extrabold">Welcome, {currentPlayer.name}</h1>
          </div>
          <button onClick={() => setRole('login')} className="text-xs bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl border border-gray-700">
            Log Out
          </button>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold">Your Daily Telemetry & Recovery Status</h2>
              <p className="text-xs text-gray-400">Position: {currentPlayer.position} &bull; ACWR: {currentPlayer.acwr}</p>
            </div>
            <button
              onClick={() => evaluatePlayer(currentPlayer)}
              disabled={evaluating === currentPlayer.name}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition"
            >
              {evaluating === currentPlayer.name ? 'Analyzing Metrics...' : 'Check My Recovery Status'}
            </button>
          </div>

          {playerRes ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black border border-gray-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-400 uppercase">Current Risk Tier</p>
                  <p className={`text-xl font-bold mt-1 ${playerRes.risk_tier.includes('Red') ? 'text-red-500' : playerRes.risk_tier.includes('Amber') ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {playerRes.risk_tier}
                  </p>
                </div>
                <div className="bg-black border border-gray-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-400 uppercase">Model Risk Probability</p>
                  <p className="text-xl font-mono font-bold mt-1">{Math.round(playerRes.risk_score * 100)}%</p>
                </div>
              </div>

              {/* Personalized Recovery & Optimization Tips (XAI) */}
              <div className="bg-blue-950/20 border border-blue-500/30 p-5 rounded-xl">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">AI Recovery & Performance Optimization Plan</h3>
                <ul className="space-y-2">
                  {playerRes.recovery_tips.map((tip: string, idx: number) => (
                    <li key={idx} className="text-xs text-gray-200 flex items-start space-x-2">
                      <span className="text-blue-400 font-bold">&bull;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-black border border-gray-800 p-8 rounded-xl text-center text-gray-500 text-xs italic">
              Click "Check My Recovery Status" above to generate your AI-powered recovery and performance guidelines.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}