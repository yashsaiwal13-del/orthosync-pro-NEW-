import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { RehabConfig, TelemetrySample } from '../types';

interface Props {
  sample: TelemetrySample | null;
  config: RehabConfig;
  isOverExtended: boolean;
  isSlipActive: boolean;
}

export const StatusBanner: React.FC<Props> = ({
  sample,
  config,
  isOverExtended,
  isSlipActive,
}) => {
  if (isOverExtended) {
    const angle = sample?.wrist_angle ?? 0;
    return (
      <div className="flex items-start gap-3 p-3.5 mb-5 rounded-lg border border-red-300 bg-red-50 text-red-900 shadow-xs animate-pulse">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-red-700">OVER-EXTENSION WARNING:</strong>{' '}
          Estimated wrist angle (<span className="font-mono font-bold">{angle.toFixed(1)}°</span>) exceeds anatomical
          safety threshold limit (<span className="font-mono">{config.over_extension_angle_threshold.toFixed(1)}°</span>).
          Haptic intervention active.
        </div>
      </div>
    );
  }

  if (isSlipActive) {
    return (
      <div className="flex items-start gap-3 p-3.5 mb-5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-700">POSSIBLE GRIP SLIP / FATIGUE CAUTION:</strong>{' '}
          Sudden force drop exceeded <span className="font-mono font-bold">{config.grip_drop_percentage_threshold.toFixed(0)}%</span>{' '}
          within {config.grip_drop_time_window_seconds.toFixed(1)}s window. Check patient grasp stability.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3.5 mb-5 rounded-lg border border-green-200 bg-green-50/80 text-green-900 shadow-xs">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <div>
        <strong className="font-bold text-green-800">CLINICAL STATUS: NORMAL</strong> — Wrist kinematics and grip force remain safely within defined rehabilitation parameters.
      </div>
    </div>
  );
};
