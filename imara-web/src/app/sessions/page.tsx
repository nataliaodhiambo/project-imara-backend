'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ActiveSessionsPage() {
  const [activeSessions, setActiveSessions] = useState([
    { id: 's1', title: 'MD-2 High-Speed Tactical Prep', category: 'Tactical', duration: 90, targetLoad: 550, hsrDistance: 1200, participants: 5 }
  ]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-gray-100 p-6 md:p-10 font-sans selection:bg-[#FF2D6B]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
          <div>
            <span className="text-[10px] text-[#FF2D6B] uppercase tracking-widest font-bold">Pitch-Side Operations</span>
            <h1 className="text-2xl font-black">Active Training Sessions</h1>
          </div>
          <Link href="/" className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeSessions.map(session => (
            <div key={session.id} className="bg-[#121218] border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF2D6B]"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Live Session</span>
                  <h3 className="text-lg font-black mt-2 text-white">{session.title}</h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">{session.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-4 rounded-2xl border border-white/5 mb-4">
                <div>
                  <span className="text-gray-500 block">Duration</span>
                  <strong className="text-white font-mono">{session.duration} mins</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Target Load</span>
                  <strong className="text-white font-mono">{session.targetLoad} AU</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">HSR Target</span>
                  <strong className="text-white font-mono">{session.hsrDistance} m</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Enrolled Squad</span>
                  <strong className="text-[#FF2D6B] font-mono">{session.participants} Athletes</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ActiveSessionsPage() {
  const [activeSessions, setActiveSessions] = useState([
    { id: 's1', title: 'MD-2 High-Speed Tactical Prep', category: 'Tactical', duration: 90, targetLoad: 550, hsrDistance: 1200, participants: 5 }
  ]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-gray-100 p-6 md:p-10 font-sans selection:bg-[#FF2D6B]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
          <div>
            <span className="text-[10px] text-[#FF2D6B] uppercase tracking-widest font-bold">Pitch-Side Operations</span>
            <h1 className="text-2xl font-black">Active Training Sessions</h1>
          </div>
          <Link href="/" className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeSessions.map(session => (
            <div key={session.id} className="bg-[#121218] border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF2D6B]"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Live Session</span>
                  <h3 className="text-lg font-black mt-2 text-white">{session.title}</h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">{session.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-4 rounded-2xl border border-white/5 mb-4">
                <div>
                  <span className="text-gray-500 block">Duration</span>
                  <strong className="text-white font-mono">{session.duration} mins</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Target Load</span>
                  <strong className="text-white font-mono">{session.targetLoad} AU</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">HSR Target</span>
                  <strong className="text-white font-mono">{session.hsrDistance} m</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Enrolled Squad</span>
                  <strong className="text-[#FF2D6B] font-mono">{session.participants} Athletes</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}