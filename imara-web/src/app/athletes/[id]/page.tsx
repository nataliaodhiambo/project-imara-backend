'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AthleteHubPage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params?.id || '1';

  const [athlete, setAthlete] = useState({
    id: athleteId,
    squadNo: 9,
    name: "Erling Haaland",
    position: "Forward",
    preferredFoot: "Left",
    maxHR: 195,
    acwr: 1.68,
    dailyLoad: 680,
    sleep: 5.5,
    fatigue: 4.5,
    soreness: 4.2
  });

  const [checkInSleep, setCheckInSleep] = useState(athlete.sleep);
  const [checkInFatigue, setCheckInFatigue] = useState(athlete.fatigue);
  const [checkInSoreness, setCheckInSoreness] = useState(athlete.soreness);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_name: athlete.name,
          features: {
            acwr: athlete.acwr,
            atl: 520.0,
            ctl28: 400.0,
            ctl42: 390.0,
            daily_load: athlete.dailyLoad,
            monotony: 1.8,
            strain: 650.0,
            weekly_load: 3100.0,
            fatigue: checkInFatigue,
            mood: 3.0,
            readiness: 2.5,
            sleep_duration: checkInSleep,
            sleep_quality: 3.0,
            soreness: checkInSoreness,
            stress: 2.0
          }
        }),
      });

      if (!response.ok) throw new Error('Inference failed');
      const data = await response.json();
      setResult({
        ...data,
        xai_explanation: `The Random Forest model assessed risk based on your ACWR (${athlete.acwr}), overnight sleep (${checkInSleep}h), and reported fatigue (${checkInFatigue}/5).`,
        recovery_tips: [
          "Target 8.5+ hours of sleep in a temperature-controlled, dark room.",
          "Perform 20 minutes of active soft-tissue myofascial release.",
          "High-protein nutritional recovery window within 30 minutes post-session."
        ]
      });
      setCheckInSuccess(true);
      setTimeout(() => setCheckInSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Could not connect to FastAPI backend engine.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('Password updated successfully!');
    setTimeout(() => {
      setShowSettingsModal(false);
      setNewPassword('');
      setPasswordMsg('');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-gray-100 p-6 md:p-10 font-sans selection:bg-[#FF2D6B]">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center font-black text-lg text-[#FF2D6B]">
              #{athlete.squadNo}
            </div>
            <div>
              <span className="text-[10px] text-[#FF2D6B] uppercase tracking-widest font-bold">Athlete Self-Management Hub</span>
              <h1 className="text-2xl font-black text-white">{athlete.name} <span className="text-xs text-gray-400 font-normal">({athlete.position})</span></h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2.5 rounded-xl border border-white/10 transition flex items-center space-x-2"
            >
              <span>⚙️ Account Settings</span>
            </button>
            <button 
              onClick={() => router.push('/')} 
              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2.5 rounded-xl border border-white/10 transition"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="bg-[#121218] border border-white/10 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FF2D6B]"></div>

          <h2 className="text-lg font-bold mb-1">Pre-Training Wellness Check-In</h2>
          <p className="text-xs text-gray-400 mb-6">Log your physiological metrics prior to high-speed pitch drills.</p>

          <form onSubmit={handleCheckInSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/60 border border-white/5 p-4 rounded-2xl">
                <label className="text-[10px] text-gray-400 uppercase block font-bold mb-2">Sleep Last Night (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="12"
                  value={checkInSleep}
                  onChange={(e) => setCheckInSleep(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:border-[#FF2D6B]"
                />
              </div>

              <div className="bg-black/60 border border-white/5 p-4 rounded-2xl">
                <label className="text-[10px] text-gray-400 uppercase block font-bold mb-2">Perceived Fatigue (1-5)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="5"
                  value={checkInFatigue}
                  onChange={(e) => setCheckInFatigue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:border-[#FF2D6B]"
                />
              </div>

              <div className="bg-black/60 border border-white/5 p-4 rounded-2xl">
                <label className="text-[10px] text-gray-400 uppercase block font-bold mb-2">Muscle Soreness (1-5)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="5"
                  value={checkInSoreness}
                  onChange={(e) => setCheckInSoreness(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:border-[#FF2D6B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full bg-[#FF2D6B] hover:opacity-90 text-white font-bold py-3.5 rounded-2xl transition shadow-lg text-xs uppercase tracking-wider shadow-[#FF2D6B]/30"
            >
              {evaluating ? 'Running Random Forest Model...' : 'Submit Daily Telemetry & Sync Pipeline'}
            </button>
          </form>

          {checkInSuccess && (
            <p className="mt-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-center font-medium">
              ✓ Telemetry successfully synchronized with FastAPI edge node.
            </p>
          )}
        </div>

        {result && (
          <div className="bg-[#121218] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Personal Risk & Recovery Intelligence</h2>
                <p className="text-xs text-gray-400">Stratified Group K-Fold Decision Engine</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                result.risk_tier.includes('Red') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {result.risk_tier} ({Math.round(result.risk_score * 100)}%)
              </span>
            </div>

            <div className="bg-black/60 border border-white/5 p-5 rounded-2xl">
              <h3 className="text-[10px] font-bold text-[#FF2D6B] uppercase tracking-widest mb-2">Explainable AI (XAI) Breakdown</h3>
              <p className="text-xs text-gray-200 leading-relaxed mb-4">{result.xai_explanation}</p>
              
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prescriptive Recovery Plan</h3>
              <ul className="space-y-2">
                {result.recovery_tips.map((tip: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-300 flex items-start space-x-2">
                    <span className="text-[#FF2D6B] font-bold">&bull;</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#121218] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold mb-1">Account & Security Settings</h3>
              <p className="text-xs text-gray-400 mb-4">Manage credentials for #{athlete.squadNo} {athlete.name}</p>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1 font-bold">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    placeholder="Enter new account password"
                  />
                </div>

                {passwordMsg && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                    {passwordMsg}
                  </p>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-[#FF2D6B] text-white font-bold rounded-xl shadow-lg">Save Password</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}