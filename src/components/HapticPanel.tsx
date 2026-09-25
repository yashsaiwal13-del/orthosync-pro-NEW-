import React from 'react';
import { RehabConfig } from '../types';

interface Props {
  isActive: boolean;
  isInCooldown: boolean;
  config: RehabConfig;
}

export const HapticPanel: React.FC<Props> = ({
  isActive,
  isInCooldown,
  config,
}) => {
  let panelClass = 'bg-green-50/70 border-green-300 text-green-900';
  let icon = '🟢';
  let title = 'HAPTIC ACTUATOR: ARMED & STANDBY';
  let desc = `Continuous background monitoring • Trigger: ROM > ${config.over_extension_angle_threshold.toFixed(0)}° or Grip Drop ≥ ${config.grip_drop_percentage_threshold.toFixed(0)}%`;

  if (isActive) {
    panelClass = 'bg-red-50 border-2 border-red-500 text-red-950 animate-pulse';
    icon = '📳';
    title = 'HAPTIC ACTUATOR: ACTIVE VIBRATION BURST';
    desc = 'Safety threshold exceeded — tactile alert pulse actively delivered to wearable device';
  } else if (isInCooldown) {
    panelClass = 'bg-amber-50 border border-amber-400 text-amber-950';
    icon = '⚡';
    title = `HAPTIC ACTUATOR: COOLDOWN RECOVERY (${config.event_cooldown_seconds.toFixed(1)}s Window)`;
    desc = 'Sensory refractory period active to prevent tactile habituation and actuator fatigue';
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border mb-5 shadow-xs transition-colors gap-2 ${panelClass}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">{icon}</span>
        <div>
          <div className="font-bold text-sm tracking-wide">{title}</div>
          <div className="text-xs font-medium opacity-90 mt-0.5">{desc}</div>
        </div>
      </div>
      <div className="self-end sm:self-center text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-white/70 rounded border border-slate-300 text-slate-800 shrink-0">
        ACTUATOR LOOP: ON
      </div>
    </div>
  );
};
