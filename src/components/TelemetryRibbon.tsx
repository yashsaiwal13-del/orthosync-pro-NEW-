import React from 'react';
import { CalibrationProfile } from '../types';
import { Activity, Cpu, Database, Radio } from 'lucide-react';

interface Props {
  sessionId: string;
  isStreaming: boolean;
  connectionMode: 'simulation' | 'hardware';
  profile: CalibrationProfile;
}

export const TelemetryRibbon: React.FC<Props> = ({
  sessionId,
  isStreaming,
  connectionMode,
  profile,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between bg-white border border-slate-300 rounded-lg px-4 py-2.5 mb-5 shadow-xs gap-3">
      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700">
        <Database className="w-4 h-4 text-blue-600" />
        <span>Session: <strong className="text-slate-900 font-bold">{sessionId}</strong></span>
      </div>

      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700">
        <Cpu className="w-4 h-4 text-sky-600" />
        <span>
          Source: <strong className="text-slate-900 font-bold">
            {connectionMode === 'hardware' ? 'ESP32 Hardware' : 'Synthetic Walk'}
          </strong> (50 Hz)
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700">
        <Radio className="w-4 h-4 text-indigo-600" />
        <span>
          Neutral Ref: <strong className="text-slate-900 font-bold">
            {profile.flex1_baseline_adc.toFixed(0)} ADC / {profile.fsr_baseline_adc.toFixed(0)} ADC
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700">
        <Activity className={`w-4 h-4 ${isStreaming ? 'text-green-600 animate-pulse' : 'text-slate-400'}`} />
        <span>
          State:{' '}
          <strong className={isStreaming ? 'text-green-700 font-bold' : 'text-slate-500 font-semibold'}>
            {isStreaming ? 'STREAMING (LIVE)' : 'IDLE / PAUSED'}
          </strong>
        </span>
      </div>
    </div>
  );
};
