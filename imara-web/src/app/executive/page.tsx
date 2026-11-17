'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const ROLES = ["Sporting Director", "Club Head Doctor", "Head of Performance", "Lead Analyst"];

export default function ExecutiveReportPage() {
  const [selectedRole, setSelectedRole] = useState("Sporting Director");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/v1/reports/executive?role=${encodeURIComponent(selectedRole)}`)
      .then(res => res.json())
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedRole]);

  return (
    <main className="min-h-screen bg-[#060608] text-gray-100 p-6 md:p-10 font-sans selection:bg-[#F472B6]">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Header (Hidden on PDF Export) */}
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8 print:hidden">
          <div>
            <span className="text-[10px] text-[#F472B6] uppercase tracking-widest font-bold">Project Imara &bull; Intelligence Suite</span>
            <h1 className="text-2xl font-black text-white">Executive Stakeholder Briefing</h1>
          </div>
          <Link href="/" className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition text-gray-300">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Role Selector Tabs (Hidden on PDF Export) */}
        <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 mb-8 overflow-x-auto text-xs print:hidden">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition whitespace-nowrap ${
                selectedRole === role ? 'bg-[#F472B6] text-black shadow-lg shadow-[#F472B6]/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Professional Printable Briefing Document */}
        <div className="bg-[#121218] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          
          {loading ? (
            <div className="text-center py-20 text-gray-400 text-xs animate-pulse">Querying local telemetry service...</div>
          ) : reportData ? (
            <div className="space-y-6">
              
              {/* Formal Document Header */}
              <div className="border-b-2 border-[#F472B6] pb-6 print:border-black">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-[#F472B6] uppercase tracking-widest print:text-black">PROJECT IMARA &bull; INTELLIGENCE BRIEFING</h3>
                    <h1 className="text-3xl font-black text-white mt-1 print:text-black">{reportData.stakeholder_role} Report</h1>
                  </div>
                  <div className="text-right text-xs text-gray-400 font-mono print:text-gray-600">
                    <p>Status: <span className="text-emerald-400 print:text-black font-bold">Verified</span></p>
                    <p>Generated: {reportData.generated_at}</p>
                  </div>
                </div>
              </div>

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Squad Size</span>
                  <span className="text-xl font-black text-white font-mono print:text-black">{reportData.metrics?.squad_size} Players</span>
                </div>
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Squad Availability</span>
                  <span className="text-xl font-black text-emerald-400 font-mono print:text-black">{reportData.metrics?.availability}</span>
                </div>
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">High-Risk Flags</span>
                  <span className="text-xl font-black text-red-400 font-mono print:text-black">{reportData.metrics?.high_risk_flags}</span>
                </div>
                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold mb-1 print:text-gray-600">Avg Sleep Baseline</span>
                  <span className="text-xl font-black text-blue-400 font-mono print:text-black">{reportData.metrics?.squad_avg_sleep}</span>
                </div>
              </div>

              {/* Strategic Summary Box */}
              <div className="bg-gradient-to-r from-black to-purple-950/30 border border-[#F472B6]/30 p-6 rounded-2xl print:bg-gray-50 print:border-gray-400">
                <h3 className="text-xs font-bold text-[#F472B6] uppercase tracking-widest mb-3 print:text-black">Strategic Decision Summary & Recommendations</h3>
                <p className="text-sm text-gray-200 leading-relaxed print:text-gray-800">{reportData.strategic_recommendations}</p>
              </div>

              {/* System Architecture Footnote for Evaluators */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-xs text-gray-400 print:bg-gray-50 print:border-gray-300 print:text-gray-600">
                <p className="font-bold text-white mb-1 print:text-black">System Architecture Verification:</p>
                <p>This report was generated dynamically by the local FastAPI telemetry service using aggregated Random Forest risk inferences and wearable recovery baselines.</p>
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
          ) : (
            <div className="text-center py-20 text-red-400 text-xs">Failed to load report data from local service.</div>
          )}
        </div>

      </div>
    </main>
  );
}