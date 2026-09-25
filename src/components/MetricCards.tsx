import React from 'react';
import { CalibrationProfile, RehabConfig, TelemetrySample } from '../types';

interface Props {
  sample: TelemetrySample | null;
  profile: CalibrationProfile;
  config: RehabConfig;
  isOverExtended: boolean;
  isSlipActive: boolean;
}

export const MetricCards: React.FC<Props> = ({
  sample,
  profile,
  config,
  isOverExtended,
  isSlipActive,
}) => {
  const angle = sample?.wrist_angle ?? 0;
  const force = sample?.grip_force ?? 0;
  const flexAdc = sample?.flex1_adc ?? profile.flex1_baseline_adc;

  let statusLabel = 'STANDBY';
  let statusColor = 'text-slate-600';
  let statusBorder = 'border-t-slate-500';
  let statusSub = 'Awaiting live telemetry stream';

  if (sample) {
    if (isOverExtended) {
      statusLabel = '🚨 WARNING';
      statusColor = 'text-red-600';
      statusBorder = 'border-t-red-600';
      statusSub = 'Over-extension threshold breached';
    } else if (isSlipActive) {
      statusLabel = '⚠️ CAUTION';
      statusColor = 'text-amber-600';
      statusBorder = 'border-t-amber-600';
      statusSub = 'Sudden grip slip / fatigue event';
    } else {
      statusLabel = '✓ NORMAL';
      statusColor = 'text-green-600';
      statusBorder = 'border-t-green-600';
      statusSub = 'Kinematics within safety boundaries';
    }
  }

  const angleDelta = angle - config.over_extension_angle_threshold;
  const angleSub = isOverExtended
    ? `+${angleDelta.toFixed(1)}° vs safety limit`
    : `Safety Limit: ${config.over_extension_angle_threshold.toFixed(0)}°`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* 1. Wrist ROM */}
      <div className="bg-white border border-slate-300 border-t-4 border-t-blue-600 rounded-lg p-4 shadow-xs flex flex-col justify-between min-h-[140px]">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Wrist ROM (Estimated)
        </div>
        <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono my-1">
          {angle.toFixed(1)}°
        </div>
        <div className={`text-xs font-semibold ${isOverExtended ? 'text-red-600' : 'text-slate-600'}`}>
          {angleSub}
        </div>
      </div>

      {/* 2. Grip Force */}
      <div className="bg-white border border-slate-300 border-t-4 border-t-teal-600 rounded-lg p-4 shadow-xs flex flex-col justify-between min-h-[140px]">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Grip Force (Estimated)
        </div>
        <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono my-1">
          {force.toFixed(1)} N
        </div>
        <div className="text-xs font-semibold text-slate-600">
          Drop Thresh: ≥{config.grip_drop_percentage_threshold.toFixed(0)}% / {config.grip_drop_time_window_seconds.toFixed(0)}s
        </div>
      </div>

      {/* 3. Flex Sensor ADC */}
      <div className="bg-white border border-slate-300 border-t-4 border-t-indigo-500 rounded-lg p-4 shadow-xs flex flex-col justify-between min-h-[140px]">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Flex Sensor ADC (Raw)
        </div>
        <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono my-1">
          {Math.round(flexAdc)}
        </div>
        <div className="text-xs font-semibold text-slate-600">
          Calibrated Base: {profile.flex1_baseline_adc.toFixed(0)} ADC
        </div>
      </div>

      {/* 4. Clinical Safety Status */}
      <div className={`bg-white border border-slate-300 border-t-4 ${statusBorder} rounded-lg p-4 shadow-xs flex flex-col justify-between min-h-[140px]`}>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Clinical Safety Status
        </div>
        <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight my-1 ${statusColor}`}>
          {statusLabel}
        </div>
        <div className="text-xs font-semibold text-slate-600">
          {statusSub}
        </div>
      </div>
    </div>
  );
};
