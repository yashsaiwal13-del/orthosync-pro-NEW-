import React from 'react';
import { RehabEvent } from '../types';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface Props {
  events: RehabEvent[];
}

export const EventTimeline: React.FC<Props> = ({ events }) => {
  // Sort reverse chronological
  const reversed = [...events].reverse();

  return (
    <div className="mb-8">
      <div className="border-b-2 border-slate-200 pb-2 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
          Section 02
        </div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>📋 Safety Event Timeline</span>
        </h3>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Chronological audit log of clinical boundary violations and grip fatigue alerts
        </p>
      </div>

      {reversed.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-500 shrink-0" />
          <span>No safety alerts or slip events detected in current session telemetry.</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-28">Time (s)</th>
                  <th className="py-2.5 px-3 w-40">Event Type</th>
                  <th className="py-2.5 px-3 w-28">Measured</th>
                  <th className="py-2.5 px-3">Clinical Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reversed.map(ev => {
                  const isOE = ev.event === 'OVER_EXTENSION';
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {ev.time.toFixed(2)}s
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isOE
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOE ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {ev.event}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                        {ev.value.toFixed(1)} {isOE ? '°' : 'N'}
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {ev.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
