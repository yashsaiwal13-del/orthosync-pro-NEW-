import React, { useState } from 'react';
import { CalibrationProfile, RehabConfig } from '../types';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Play,
  Pause,
  PlusCircle,
  Radio,
  Sliders,
  Square,
  Target,
  Zap,
} from 'lucide-react';

interface Props {
  connectionMode: 'simulation' | 'hardware';
  setConnectionMode: (mode: 'simulation' | 'hardware') => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onEndAndSave: () => void;
  onNewSession: () => void;
  sessionId: string;
  sampleCount: number;
  eventCount: number;
  profile: CalibrationProfile;
  onCalibrate: () => Promise<void>;
  isCalibrating: boolean;
  calibrationProgress: number;
  config: RehabConfig;
  onOpenConfig: () => void;
}

export const Sidebar: React.FC<Props> = ({
  connectionMode,
  setConnectionMode,
  isStreaming,
  onToggleStreaming,
  onEndAndSave,
  onNewSession,
  sessionId,
  sampleCount,
  eventCount,
  profile,
  onCalibrate,
  isCalibrating,
  calibrationProgress,
  config,
  onOpenConfig,
}) => {
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 space-y-6">
      {/* Title & System Control Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            System Controls
          </h2>
        </div>
        <button
          onClick={onOpenConfig}
          title="Configure Clinical Parameters"
          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Telemetry Link Configuration */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Telemetry Link Configuration
        </label>

        {/* Minimalist Segmented Radio */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setConnectionMode('simulation')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
              connectionMode === 'simulation'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simulation
          </button>
          <button
            onClick={() => setConnectionMode('hardware')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
              connectionMode === 'hardware'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ESP32 Wearable
          </button>
        </div>

        {/* Connection Status Box */}
        {connectionMode === 'simulation' ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-sky-200 bg-sky-50/60 text-sky-900">
            <Radio className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide">Simulation Active</div>
              <div className="text-[11px] text-sky-700">Bounded Synthetic Walk • 50 Hz</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide">ESP32 Hardware Ready</div>
              <div className="text-[11px] text-emerald-700">Baud: {config.serial_baud_rate} • USB UART Link</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Baseline Calibration Step */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Baseline Calibration
          </label>
          <span className="text-[10px] font-mono font-medium text-slate-400">
            {config.calibration_duration_seconds}s Window
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Captures a resting resting state to establish the empirical neutral zero-reference (0° ROM, 0 force).
        </p>

        {isCalibrating ? (
          <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 animate-spin text-blue-600" />
                Calibrating neutral baseline...
              </span>
              <span className="font-mono">{Math.round(calibrationProgress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-100 rounded-full"
                style={{ width: `${calibrationProgress * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <button
            onClick={onCalibrate}
            disabled={isStreaming}
            className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <Target className="w-4 h-4 text-blue-600" />
            <span>Start Neutral Calibration</span>
          </button>
        )}

        {/* Profile Metrics Drawer */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
          <button
            onClick={() => setShowProfileDetails(!showProfileDetails)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100/60 transition-colors"
          >
            <span>Active Calibration Profile</span>
            {showProfileDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showProfileDetails && (
            <div className="p-3 pt-0 border-t border-slate-100 text-[11px] text-slate-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Flex1 Baseline:</span>
                <span className="font-bold text-slate-900">{profile.flex1_baseline_adc.toFixed(1)} ADC</span>
              </div>
              <div className="flex justify-between">
                <span>Flex1 Scale:</span>
                <span>{profile.flex1_scale.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span>FSR Baseline:</span>
                <span className="font-bold text-slate-900">{profile.fsr_baseline_adc.toFixed(1)} ADC</span>
              </div>
              <div className="flex justify-between">
                <span>FSR Scale:</span>
                <span>{profile.fsr_scale.toFixed(5)}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 font-sans">
                Empirically derived. Not clinically certified.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Session Recording Controls */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Session Recording
        </label>
        <div className="text-xs text-slate-600">
          Active: <span className="font-mono font-bold text-slate-900">{sessionId}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggleStreaming}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              isStreaming
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Stream</span>
              </>
            )}
          </button>

          <button
            onClick={onEndAndSave}
            disabled={sampleCount === 0}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <Square className="w-3.5 h-3.5 text-red-500" />
            <span>End & Save</span>
          </button>
        </div>

        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
          <span>New Session</span>
        </button>

        <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between font-mono">
          <span>Buffer: {sampleCount} samples</span>
          <span>{eventCount} alerts</span>
        </div>
      </div>
    </aside>
  );
};
