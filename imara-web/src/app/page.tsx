'use client';

import React, { useState } from 'react';

const INITIAL_SQUAD = [
  { id: "p1", squadNo: 9, username: "haaland", name: "Erling Haaland", position: "Forward", preferredFoot: "Left", maxHR: 195, acwr: 1.68, dailyLoad: 680, sleep: 5.5, fatigue: 4.5, soreness: 4.2 },
  { id: "p2", squadNo: 17, username: "debruyne", name: "Kevin De Bruyne", position: "Midfielder", preferredFoot: "Right", maxHR: 188, acwr: 1.45, dailyLoad: 590, sleep: 6.0, fatigue: 3.8, soreness: 3.5 },
  { id: "p3", squadNo: 47, username: "foden", name: "Phil Foden", position: "Forward", preferredFoot: "Left", maxHR: 192, acwr: 1.15, dailyLoad: 420, sleep: 8.0, fatigue: 2.0, soreness: 1.8 },
  { id: "p4", squadNo: 16, username: "rodri", name: "Rodri", position: "Midfielder", preferredFoot: "Right", maxHR: 186, acwr: 1.55, dailyLoad: 640, sleep: 5.8, fatigue: 4.2, soreness: 3.9 },
  { id: "p5", squadNo: 20, username: "bernardo", name: "Bernardo Silva", position: "Midfielder", preferredFoot: "Left", maxHR: 190, acwr: 1.08, dailyLoad: 390, sleep: 8.2, fatigue: 1.8, soreness: 1.2 },
];

export default function AppRouter() {
  const [role, setRole] = useState<'login' | 'coach' | 'executive' | 'player'>('login');
  const [portalType, setPortalType] = useState<'coach' | 'executive' | 'player'>('coach');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Coach Navigation State
  const [coachNavTab, setCoachNavTab] = useState<'roster' | 'sessions' | 'settings'>('roster');
  const [squad, setSquad] = useState(INITIAL_SQUAD);
  const [selectedPlayerName, setSelectedPlayerName] = useState(INITIAL_SQUAD[0].name);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  // Modals & Settings
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('Forward');
  const [newPlayerSquadNo, setNewPlayerSquadNo] = useState(10);

  // Settings State
  const [nodeName, setNodeName] = useState('Imara-Node-Alpha-Local');
  const [syncInterval, setSyncInterval] = useState('15 mins');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Sessions State
  const [activeSessions, setActiveSessions] = useState([
    { id: 's1', title: 'MD-2 High-Speed Tactical Prep', category: 'Tactical & High Speed', duration: 90, targetLoad: 550, hsrDistance: 1200 }
  ]);
  const [newSessionTitle, setNewSessionTitle] = useState('MD-1 Tactical Shape');
  const [newSessionCategory, setNewSessionCategory] = useState('Tactical & High Speed');

  // Executive Report View State
  const [execRole, setExecRole] = useState('Sporting Director');

  // Athlete Portal State
  const [currentAthlete, setCurrentAthlete] = useState(INITIAL_SQUAD[0]);
  const [checkInSleep, setCheckInSleep] = useState(currentAthlete.sleep);
  const [checkInFatigue, setCheckInFatigue] = useState(currentAthlete.fatigue);
  const [checkInSoreness, setCheckInSoreness] = useState(currentAthlete.soreness);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (portalType === 'coach') {
      if (username.toLowerCase() === 'coach' && password === 'imara123') {
        setRole('coach');
      } else {
        setLoginError('Invalid Coach credentials. (Use: coach / imara123)');
      }
    } else if (portalType === 'executive') {
      if (username.toLowerCase() === 'exec' && password === 'imara123') {
        setRole('executive');
      } else {
        setLoginError('Invalid Executive credentials. (Use: exec / imara123)');
      }
    } else {
      const found = squad.find(p => p.username.toLowerCase() === username.toLowerCase());
      if (found && password === 'imara123') {
        setCurrentAthlete(found);
        setCheckInSleep(found.sleep);
        setCheckInFatigue(found.fatigue);
        setCheckInSoreness(found.soreness);
        setRole('player');
      } else {
        setLoginError('Invalid Athlete credentials. (Try: haaland / imara123)');
      }
    }
  };

  const evaluatePlayer = async (player: typeof INITIAL_SQUAD[0]) => {
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
            daily_load: player.dailyLoad,
            monotony: 1.8,
            strain: 650.0,
            weekly_load: 3100.0,
            fatigue: player.fatigue,
            mood: 3.0,
            readiness: 2.5,
            sleep_duration: player.sleep,
            sleep_quality: 3.0,
            soreness: player.soreness,
            stress: 2.0
          }
        }),
      });

      if (!response.ok) throw new Error('Inference failed');
      const data = await response.json();

      let recommendation = "";
      let xaiExplanation = "";

      if (player.acwr > 1.4) {
        recommendation = `Restrict ${player.name} from high-intensity pitch drills. Mandatory hydrotherapy and light mobility session.`;
        xaiExplanation = `Imara-XAI Engine flagged High Risk because Acute-to-Chronic Workload Ratio (${player.acwr}) exceeded safety limits combined with severe fatigue.`;
      } else {
        recommendation = `Clear ${player.name} for 100% training intensity. All physiological metrics optimal.`;
        xaiExplanation = `Imara-XAI Engine verified telemetry vectors remain within safe performance boundaries.`;
      }

      setResults(prev => ({
        ...prev,
        [player.name]: {
          ...data,
          prescription: recommendation,
          xai_explanation: xaiExplanation
        }
      }));
    } catch (err) {
      console.error(err);
      alert('Error connecting to FastAPI backend.');
    } finally {
      setEvaluating(null);
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName) return;
    const newP = {
      id: `p_${Date.now()}`,
      squadNo: Number(newPlayerSquadNo),
      username: newPlayerName.toLowerCase().replace(/\s+/g, ''),
      name: newPlayerName,
      position: newPlayerPos,
      preferredFoot: "Right",
      maxHR: 190,
      acwr: 1.15,
      dailyLoad: 450,
      sleep: 7.5,
      fatigue: 2.0,
      soreness: 2.0
    };
    setSquad([...squad, newP]);
    setNewPlayerName('');
    setShowAddPlayerModal(false);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle) return;
    setActiveSessions([...activeSessions, {
      id: `s_${Date.now()}`,
      title: newSessionTitle,
      category: newSessionCategory,
      duration: 75,
      targetLoad: 480,
      hsrDistance: 1000
    }]);
    setNewSessionTitle('');
    setShowAddSessionModal(false);
  };

  const handleTerminateSession = (sessionId: string) => {
    setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMsg('Settings updated successfully!');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  // ================= 1. LOGIN GATE =================
  if (role === 'login') {
    return (
      <main className="min-h-screen bg-[#060608] text-gray-100 flex items-center justify-center p-6 selection:bg-[#F472B6]">
        <div className="bg-[#121218] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#F472B6]"></div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight mb-1">Project <span className="text-[#F472B6]">Imara</span></h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Secure Access Gateway</p>
          </div>

          <div className="flex bg-black/60 p-1 rounded-xl mb-6 border border-white/5 text-[11px] font-semibold">
            <button onClick={() => { setPortalType('coach'); setLoginError(''); }} className={`flex-1 py-2.5 rounded-lg transition ${portalType === 'coach' ? 'bg-[#F472B6] text-black font-bold' : 'text-gray-400 hover:text-white'}`}>Coach Portal</button>
            <button onClick={() => { setPortalType('executive'); setLoginError(''); }} className={`flex-1 py-2.5 rounded-lg transition ${portalType === 'executive' ? 'bg-[#F472B6] text-black font-bold' : 'text-gray-400 hover:text-white'}`}>Executive Suite</button>
            <button onClick={() => { setPortalType('player'); setLoginError(''); }} className={`flex-1 py-2.5 rounded-lg transition ${portalType === 'player' ? 'bg-[#F472B6] text-black font-bold' : 'text-gray-400 hover:text-white'}`}>Athlete Hub</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Username</label>
              <input type="text" required placeholder={portalType === 'player' ? 'haaland' : portalType === 'executive' ? 'exec' : 'coach'} value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Password</label>
              <input type="password" required placeholder="imara123" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            {loginError && <p className="text-red-400 text-center bg-red-500/10 p-2.5 rounded-xl">{loginError}</p>}
            <button type="submit" className="w-full bg-[#F472B6] hover:opacity-95 text-black font-black py-3.5 rounded-xl uppercase tracking-wider shadow-lg">Authenticate Access &rarr;</button>
          </form>
        </div>
      </main>
    );
  }

  // ================= 2. COACH COMMAND CENTER =================
  if (role === 'coach') {
    const selectedPlayer = squad.find(p => p.name === selectedPlayerName) || squad[0];
    const res = results[selectedPlayer?.name];

    return (
      <main className="min-h-screen bg-[#060608] text-gray-100 p-6 md:p-8 font-sans selection:bg-[#F472B6]">
        <div className="max-w-7xl mx-auto pb-24">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 mb-8 gap-4">
            <div>
              <span className="text-[10px] text-[#F472B6] uppercase tracking-widest font-bold">Coach Command Center</span>
              <h1 className="text-3xl font-black text-white">Squad Telemetry & Risk Intelligence</h1>
            </div>
            
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <button onClick={() => setRole('executive')} className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2.5 rounded-xl transition font-semibold">
                📊 Executive Briefings
              </button>
              <button onClick={() => setRole('login')} className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2.5 rounded-xl border border-white/10 transition">
                Log Out
              </button>
            </div>
          </div>

          {coachNavTab === 'roster' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Squad Roster ({squad.length})</h2>
                  <button onClick={() => setShowAddPlayerModal(true)} className="bg-[#F472B6] hover:opacity-90 text-black text-xs font-black px-4 py-2 rounded-xl transition uppercase tracking-wider">
                    + Add Athlete
                  </button>
                </div>

                <div className="space-y-3">
                  {squad.map(player => (
                    <div 
                      key={player.id}
                      onClick={() => setSelectedPlayerName(player.name)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedPlayerName === player.name ? 'bg-black/80 border-[#F472B6]' : 'bg-black/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-black border border-white/10 flex items-center justify-center font-black text-xs text-[#F472B6]">
                          #{player.squadNo}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{player.name}</p>
                          <p className="text-xs text-gray-400">{player.position} &bull; ACWR: <span className="font-mono text-white">{player.acwr}</span></p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); evaluatePlayer(player); }}
                        disabled={evaluating === player.name}
                        className="bg-[#F472B6] hover:opacity-90 text-black text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        {evaluating === player.name ? 'Analyzing...' : 'Run Analysis'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Imara-XAI Intelligence Corner */}
              <div className="bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-black text-white">Imara-XAI Intelligence</h2>
                    <span className="text-[10px] px-3 py-1 bg-[#F472B6]/10 text-[#F472B6] rounded-full border border-[#F472B6]/20 font-bold uppercase tracking-wider">
                      Random Forest v1
                    </span>
                  </div>

                  <div className="bg-black/60 border border-white/5 rounded-2xl p-5 mb-4">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Selected Athlete</p>
                    <h3 className="text-lg font-black text-white mb-4">{selectedPlayer?.name}</h3>

                    {res ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-black to-purple-950/40 border border-[#F472B6]/30 p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-[#F472B6] uppercase tracking-widest mb-1">Prescriptive Action</p>
                          <p className="text-xs text-gray-200 leading-relaxed">{res.prescription}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Model Explanation</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{res.xai_explanation}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-8">Click "Run Analysis" to generate model predictions and explainable AI insights.</p>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 text-center border-t border-white/5 pt-4 uppercase tracking-widest font-semibold">
                  Local-First Telemetry Service
                </div>
              </div>
            </div>
          )}

          {coachNavTab === 'sessions' && (
            <div className="bg-[#121218] border border-white/10 rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Active Pitch Sessions</h2>
                  <p className="text-xs text-gray-400">Real-time GPS spatial workload monitoring.</p>
                </div>
                <button onClick={() => setShowAddSessionModal(true)} className="bg-[#F472B6] hover:opacity-90 text-black text-xs font-black px-4 py-2.5 rounded-xl transition uppercase tracking-wider">
                  + Add Training Session
                </button>
              </div>

              <div className="space-y-4">
                {activeSessions.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No active training sessions running.</p>
                ) : (
                  activeSessions.map(s => (
                    <div key={s.id} className="bg-black/60 border border-white/5 p-5 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-bold">{s.category}</span>
                        <p className="text-sm font-bold text-white mt-1.5">{s.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Duration: {s.duration} mins &bull; Target Load: {s.targetLoad} AU &bull; HSR Target: {s.hsrDistance}m</p>
                      </div>
                      <button onClick={() => handleTerminateSession(s.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-4 py-2 rounded-xl transition">
                        Terminate Session
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {coachNavTab === 'settings' && (
            <div className="bg-[#121218] border border-white/10 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto">
              <h2 className="text-xl font-bold mb-2">System Settings</h2>
              <p className="text-xs text-gray-400 mb-6">Configure local service and telemetry node parameters.</p>
              
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Node Identifier</label>
                  <input type="text" value={nodeName} onChange={e => setNodeName(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Watch Sync Frequency</label>
                  <input type="text" value={syncInterval} onChange={e => setSyncInterval(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono" />
                </div>
                {settingsSavedMsg && <p className="text-emerald-400 text-center font-medium">{settingsSavedMsg}</p>}
                <button type="submit" className="w-full bg-[#F472B6] text-black font-black py-3 rounded-xl uppercase tracking-wider">Save Configuration</button>
              </form>
            </div>
          )}

          {/* Bottom Fixed Navigation Bar */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121218]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-10 z-40 text-xs font-semibold">
            <button onClick={() => setCoachNavTab('roster')} className={`flex items-center space-x-2 transition ${coachNavTab === 'roster' ? 'text-[#F472B6]' : 'text-gray-400 hover:text-white'}`}>
              <span>👥 Roster</span>
            </button>
            <button onClick={() => setCoachNavTab('sessions')} className={`flex items-center space-x-2 transition ${coachNavTab === 'sessions' ? 'text-[#F472B6]' : 'text-gray-400 hover:text-white'}`}>
              <span>📅 Sessions</span>
            </button>
            <button onClick={() => setCoachNavTab('settings')} className={`flex items-center space-x-2 transition ${coachNavTab === 'settings' ? 'text-[#F472B6]' : 'text-gray-400 hover:text-white'}`}>
              <span>⚙️ Settings</span>
            </button>
          </div>

        </div>

        {/* Add Player Modal */}
        {showAddPlayerModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#121218] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold mb-1">Add New Athlete</h3>
              <p className="text-xs text-gray-400 mb-4">Enroll player into squad telemetry monitoring.</p>
              <form onSubmit={handleAddPlayer} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Player Name</label>
                  <input type="text" required value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="e.g. Rodri" className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Position</label>
                  <input type="text" required value={newPlayerPos} onChange={e => setNewPlayerPos(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Squad Number</label>
                  <input type="number" required value={newPlayerSquadNo} onChange={e => setNewPlayerSquadNo(Number(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddPlayerModal(false)} className="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-[#F472B6] text-black font-black rounded-xl">Add Athlete</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Session Modal with Category Dropdown */}
        {showAddSessionModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#121218] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold mb-1">Create Training Session</h3>
              <p className="text-xs text-gray-400 mb-4">Schedule a new training drill.</p>
              <form onSubmit={handleAddSession} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Session Title</label>
                  <input type="text" required value={newSessionTitle} onChange={e => setNewSessionTitle(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">Training Category</label>
                  <select value={newSessionCategory} onChange={e => setNewSessionCategory(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white">
                    <option value="Tactical & High Speed">Tactical & High Speed</option>
                    <option value="Recovery & Regeneration">Recovery & Regeneration</option>
                    <option value="Strength & Power">Strength & Power</option>
                    <option value="Match-Day Simulation">Match-Day Simulation</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddSessionModal(false)} className="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-[#F472B6] text-black font-black rounded-xl">Schedule Session</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    );
  }

  // ================= 3. EXECUTIVE BRIEFING SUITE (RESTRUCTURED) =================
  if (role === 'executive') {
    return (
      <main className="min-h-screen bg-[#060608] text-gray-100 p-6 md:p-10 font-sans selection:bg-[#F472B6]">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8 print:hidden">
            <div>
              <span className="text-[10px] text-[#F472B6] uppercase tracking-widest font-bold">Executive Briefings</span>
              <h1 className="text-2xl font-black text-white">Stakeholder Intelligence Suite</h1>
            </div>
            <button onClick={() => setRole('coach')} className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition text-gray-300">
              &larr; Back to Coach Portal
            </button>
          </div>

          <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 mb-8 overflow-x-auto text-xs print:hidden">
            {["Sporting Director", "Club Head Doctor", "Head of Performance", "Lead Analyst"].map(r => (
              <button
                key={r}
                onClick={() => setExecRole(r)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition whitespace-nowrap ${
                  execRole === r ? 'bg-[#F472B6] text-black shadow-lg shadow-[#F472B6]/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Professional Printable Briefing Document */}
          <div className="bg-[#121218] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            
            <div className="space-y-6">
              
              {/* Document Header with Day */}
              <div className="border-b-2 border-[#F472B6] pb-6 print:border-black">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-[#F472B6] uppercase tracking-widest print:text-black">PROJECT IMARA &bull; SQUAD INTELLIGENCE BRIEFING</h3>
                    <h1 className="text-3xl font-black text-white mt-1 print:text-black">{execRole} Perspective</h1>
                  </div>
                  <div className="text-right text-xs text-gray-400 font-mono print:text-gray-600">
                    <p className="font-bold text-white print:text-black">Matchday Cycle: MD-2 (Training Day)</p>
                    <p>Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Squad Size</span>
                  <span className="text-xl font-black text-white font-mono print:text-black">{squad.length} Players</span>
                </div>
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Squad Availability</span>
                  <span className="text-xl font-black text-emerald-400 font-mono print:text-black">92.0%</span>
                </div>
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Absences Today</span>
                  <span className="text-xl font-black text-amber-400 font-mono print:text-black">0 Players</span>
                </div>
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Straining Flags</span>
                  <span className="text-xl font-black text-red-400 font-mono print:text-black">1 Player</span>
                </div>
              </div>

              {/* Detailed Breakdown: Absences & Straining */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/60 border border-white/5 p-5 rounded-2xl print:bg-gray-50 print:border-gray-300">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2 print:text-black">Absent from Training</h3>
                  <p className="text-xs text-emerald-400 font-medium print:text-emerald-700">✓ Full squad participation. Zero unexcused absences.</p>
                </div>
                <div className="bg-black/60 border border-white/5 p-5 rounded-2xl print:bg-gray-50 print:border-gray-300">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 print:text-red-600">Currently Straining / High Risk</h3>
                  <p className="text-xs text-gray-200 print:text-gray-800"><strong className="text-white print:text-black">Erling Haaland</strong> (ACWR: 1.68) — Acute workload spike detected above safety thresholds.</p>
                </div>
              </div>

              {/* What It Means (Plain English Explanation) */}
              <div className="bg-gradient-to-r from-black to-purple-950/30 border border-[#F472B6]/30 p-6 rounded-2xl print:bg-gray-50 print:border-gray-400">
                <h3 className="text-xs font-bold text-[#F472B6] uppercase tracking-widest mb-2 print:text-black">What This Means (Executive Translation)</h3>
                <p className="text-sm text-gray-200 leading-relaxed print:text-gray-800">
                  {execRole === "Sporting Director" && "Squad roster availability is optimal at 92%. Active soft-tissue injury risk exposure is isolated to a single player, allowing the technical team to manage capital asset preservation without compromising tactical depth."}
                  {execRole === "Club Head Doctor" && "One athlete is flagged under the Red tier due to acute workload spikes combined with insufficient sleep. Recommended immediate hydrotherapy and load-capping for today's tactical drill."}
                  {execRole === "Head of Performance" && "High-speed running volume is on target for MD-2. However, individual workload tapering is required for flagged athletes to prevent non-contact muscle strains before match day."}
                  {execRole === "Lead Analyst" && "Random Forest feature attribution confirms that Acute-to-Chronic Workload Ratio remains the primary predictive driver for fatigue accumulation in this training cycle."}
                </p>
              </div>

              {/* Print / Export Button */}
              <div className="flex justify-end pt-4 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="bg-[#F472B6] hover:opacity-90 text-black text-xs font-black px-6 py-3.5 rounded-xl transition uppercase tracking-wider shadow-lg flex items-center space-x-2"
                >
                  <span>🖨️ Export Clean Executive PDF</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    );
  }

  // ================= 4. ATHLETE PORTAL =================
  return (
    <main className="min-h-screen bg-[#060608] text-gray-100 p-6 md:p-10 font-sans selection:bg-[#F472B6]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center font-black text-lg text-[#F472B6]">
              #{currentAthlete.squadNo}
            </div>
            <div>
              <span className="text-[10px] text-[#F472B6] uppercase tracking-widest font-bold">Athlete Self-Management Hub</span>
              <h1 className="text-2xl font-black text-white">{currentAthlete.name}</h1>
            </div>
          </div>
          <button onClick={() => setRole('login')} className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 px-4 py-2.5 rounded-xl transition">
            Log Out
          </button>
        </div>

        <div className="bg-[#121218] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-lg font-bold mb-1">Pre-Training Wellness Check-In</h2>
          <p className="text-xs text-gray-400 mb-6">Log your physiological metrics (automatically synced with Polar AccessLink wearable baseline).</p>
          
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 uppercase block font-bold mb-1">Sleep (Hours)</label>
              <input type="number" step="0.5" value={checkInSleep} onChange={e => setCheckInSleep(parseFloat(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono" />
            </div>
            <button onClick={() => alert('Telemetry synchronized successfully.')} className="w-full bg-[#F472B6] text-black font-black py-3.5 rounded-xl uppercase tracking-wider">
              Submit Daily Telemetry & Sync Pipeline
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}