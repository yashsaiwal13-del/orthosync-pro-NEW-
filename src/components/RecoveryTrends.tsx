import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, Info } from 'lucide-react';
import { RehabConfig, SessionSummary } from '../types';

interface Props {
  pastSessions: SessionSummary[];
  config: RehabConfig;
}

export const RecoveryTrends: React.FC<Props> = ({ pastSessions, config }) => {
  const [showHistoryTable, setShowHistoryTable] = useState(false);

  // SVG Chart Dimensions
  const width = 500;
  const height = 220;
  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  // Chart 1: Wrist ROM Trend
  const romMaxY = Math.max(60, ...pastSessions.map(s => s.max_wrist_angle + 10));
  const scaleX = (i: number) => {
    if (pastSessions.length <= 1) return padL + (width - padL - padR) / 2;
    return padL + (i / (pastSessions.length - 1)) * (width - padL - padR);
  };
  const scaleRomY = (val: number) => height - padB - (val / romMaxY) * (height - padT - padB);

  let romMaxPath = '';
  let romAvgPath = '';
  pastSessions.forEach((s, idx) => {
    const x = scaleX(idx);
    const yMax = scaleRomY(s.max_wrist_angle);
    const yAvg = scaleRomY(s.avg_wrist_angle);
    if (idx === 0) {
      romMaxPath += `M ${x.toFixed(1)} ${yMax.toFixed(1)}`;
      romAvgPath += `M ${x.toFixed(1)} ${yAvg.toFixed(1)}`;
    } else {
      romMaxPath += ` L ${x.toFixed(1)} ${yMax.toFixed(1)}`;
      romAvgPath += ` L ${x.toFixed(1)} ${yAvg.toFixed(1)}`;
    }
  });

  // Chart 2: Grip Force Trend
  const forceMaxY = Math.max(500, ...pastSessions.map(s => s.max_grip_force + 50));
  const scaleForceY = (val: number) => height - padB - (val / forceMaxY) * (height - padT - padB);

  let forceMaxPath = '';
  let forceAvgPath = '';
  pastSessions.forEach((s, idx) => {
    const x = scaleX(idx);
    const yMax = scaleForceY(s.max_grip_force);
    const yAvg = scaleForceY(s.avg_grip_force);
    if (idx === 0) {
      forceMaxPath += `M ${x.toFixed(1)} ${yMax.toFixed(1)}`;
      forceAvgPath += `M ${x.toFixed(1)} ${yAvg.toFixed(1)}`;
    } else {
      forceMaxPath += ` L ${x.toFixed(1)} ${yMax.toFixed(1)}`;
      forceAvgPath += ` L ${x.toFixed(1)} ${yAvg.toFixed(1)}`;
    }
  });

  return (
    <div className="mb-10">
      <div className="border-b border-slate-200 pb-2 mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          Section 05
        </div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Longitudinal Recovery Trends</span>
        </h3>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Objective cross-session range of motion and isometric grip force progression
        </p>
      </div>

      {pastSessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
          No past recorded sessions found. Complete and save a session to populate longitudinal trends.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ROM Trend Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Wrist ROM Progression
                  </h4>
                  <p className="text-[11px] text-slate-500">Peak vs average angle across recorded sessions</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-blue-600 rounded"></span> Max ROM
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-blue-400 border border-dashed border-blue-400"></span> Mean ROM
                  </span>
                </div>
              </div>

              <div className="w-full aspect-[25/11]">
                <svg viewBox="0 0 500 220" className="w-full h-full select-none" preserveAspectRatio="none">
                  {/* Grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const yVal = romMaxY * p;
                    const yPos = 220 - 30 - p * (220 - 20 - 30);
                    return (
                      <g key={`rom-grid-${idx}`}>
                        <line x1="45" y1={yPos} x2="480" y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="40" y={yPos + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                          {Math.round(yVal)}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Safety limit indicator */}
                  <line
                    x1="45"
                    y1={scaleRomY(config.over_extension_angle_threshold)}
                    x2="480"
                    y2={scaleRomY(config.over_extension_angle_threshold)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Paths */}
                  <path d={romMaxPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                  <path d={romAvgPath} fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3 3" />

                  {/* Nodes */}
                  {pastSessions.map((s, idx) => {
                    const x = scaleX(idx);
                    const yMax = scaleRomY(s.max_wrist_angle);
                    return (
                      <g key={`rom-node-${idx}`}>
                        <circle cx={x} cy={yMax} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <text x={x} y="210" textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="600">
                          S{idx + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axes */}
                  <line x1="45" y1="190" x2="480" y2="190" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="45" y1="20" x2="45" y2="190" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* Grip Force Trend Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Grip Force Progression
                  </h4>
                  <p className="text-[11px] text-slate-500">Peak vs average isometric force (N)</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-teal-600 rounded"></span> Max Force
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-teal-400 border border-dashed border-teal-400"></span> Mean Force
                  </span>
                </div>
              </div>

              <div className="w-full aspect-[25/11]">
                <svg viewBox="0 0 500 220" className="w-full h-full select-none" preserveAspectRatio="none">
                  {/* Grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const yVal = forceMaxY * p;
                    const yPos = 220 - 30 - p * (220 - 20 - 30);
                    return (
                      <g key={`force-grid-${idx}`}>
                        <line x1="45" y1={yPos} x2="480" y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="40" y={yPos + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                          {Math.round(yVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Paths */}
                  <path d={forceMaxPath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
                  <path d={forceAvgPath} fill="none" stroke="#5eead4" strokeWidth="2" strokeDasharray="3 3" />

                  {/* Nodes */}
                  {pastSessions.map((s, idx) => {
                    const x = scaleX(idx);
                    const yMax = scaleForceY(s.max_grip_force);
                    return (
                      <g key={`force-node-${idx}`}>
                        <circle cx={x} cy={yMax} r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                        <text x={x} y="210" textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="600">
                          S{idx + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axes */}
                  <line x1="45" y1="190" x2="480" y2="190" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="45" y1="20" x2="45" y2="190" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Historical Session Data Dropdown */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => setShowHistoryTable(!showHistoryTable)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Historical Sessions Table ({pastSessions.length} Recorded Runs)</span>
              </div>
              {showHistoryTable ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showHistoryTable && (
              <div className="p-3 border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Session ID</th>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3 text-right">Samples</th>
                      <th className="py-2 px-3 text-right">Duration (s)</th>
                      <th className="py-2 px-3 text-right">Max ROM</th>
                      <th className="py-2 px-3 text-right">Mean ROM</th>
                      <th className="py-2 px-3 text-right">Max Force</th>
                      <th className="py-2 px-3 text-right">Mean Force</th>
                      <th className="py-2 px-3 text-center">Over-Ext</th>
                      <th className="py-2 px-3 text-center">Slips</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastSessions.map((s, idx) => (
                      <tr key={s.session_id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono font-medium text-blue-600">{s.session_id}</td>
                        <td className="py-2 px-3 text-slate-600">{s.label}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">{s.sample_count}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">{s.duration_seconds.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{s.max_wrist_angle.toFixed(1)}°</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">{s.avg_wrist_angle.toFixed(1)}°</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{s.max_grip_force.toFixed(1)} N</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">{s.avg_grip_force.toFixed(1)} N</td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.over_extension_count > 0 ? 'bg-red-100 text-red-700' : 'text-slate-500'}`}>
                            {s.over_extension_count}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.possible_slip_count > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>
                            {s.possible_slip_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clinician Responsibility Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-800">Clinician Assessment Notice:</strong> Longitudinal recovery trends display objective physical telemetry measurements (range of motion and force production) recorded across sessions. No automated diagnosis, prognosis, or recovery conclusions are generated by this software. Clinical evaluation, interpretation, and rehabilitation progression remain the exclusive responsibility of the licensed attending clinician.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
