import React from 'react';
import { RehabConfig, SessionSummary } from '../types';

interface Props {
  summary: SessionSummary;
  config: RehabConfig;
}

export const ClinicianSummary: React.FC<Props> = ({ summary, config }) => {
  const overExtColor = summary.over_extension_count > 0 ? 'text-red-600' : 'text-slate-900';
  const slipColor = summary.possible_slip_count > 0 ? 'text-amber-600' : 'text-slate-900';
  const hapticColor = summary.haptic_warning_count > 0 ? 'text-red-600' : 'text-slate-900';

  return (
    <div className="mb-8">
      <div className="border-b-2 border-slate-200 pb-2 mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
          Section 03
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          🩺 Clinician Session Summary
        </h3>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Aggregated biomechanical metrics derived from {summary.sample_count} recorded telemetry samples (Session: {summary.session_id})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Session Duration
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {summary.duration_seconds.toFixed(1)} s
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Continuous recorded session window</div>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Over-Extension Events
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${overExtColor}`}>
              {summary.over_extension_count}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Threshold: &gt; {config.over_extension_angle_threshold.toFixed(0)}°
            </div>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Wrist ROM (Max / Avg)
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {summary.max_wrist_angle.toFixed(1)}° / {summary.avg_wrist_angle.toFixed(1)}°
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Estimated peak and mean angular extension</div>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Possible Grip Slips
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${slipColor}`}>
              {summary.possible_slip_count}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Sudden drop events &ge; {config.grip_drop_percentage_threshold.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grip Force (Max / Avg)
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {summary.max_grip_force.toFixed(1)} N / {summary.avg_grip_force.toFixed(1)} N
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Estimated peak and mean isometric force</div>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Haptic Interventions Delivered
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${hapticColor}`}>
              {summary.haptic_warning_count}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Tactile feedback pulses triggered</div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 italic mt-2">
        ⚠️ Clinical notice: Summary figures represent empirical relative values intended solely for clinician interpretation.
      </div>
    </div>
  );
};
