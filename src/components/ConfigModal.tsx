import React, { useState } from 'react';
import { RehabConfig } from '../types';
import { RotateCcw, X } from 'lucide-react';
import { DEFAULT_CONFIG } from '../config';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: RehabConfig;
  onSave: (newConfig: RehabConfig) => void;
}

export const ConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<RehabConfig>({ ...config });

  if (!isOpen) return null;

  const handleChange = (key: keyof RehabConfig, val: number) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_CONFIG });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <h3 className="font-bold text-sm text-slate-900">
            Rehabilitation Safety Parameters
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Over-Extension Angle Threshold (°)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={formData.over_extension_angle_threshold}
                onChange={e => handleChange('over_extension_angle_threshold', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="w-12 text-right font-mono font-bold text-slate-900">
                {formData.over_extension_angle_threshold}°
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kinematic boundary at which haptic alert triggers.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Grip Drop Percentage Threshold (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="50"
                step="1"
                value={formData.grip_drop_percentage_threshold}
                onChange={e => handleChange('grip_drop_percentage_threshold', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="w-12 text-right font-mono font-bold text-slate-900">
                {formData.grip_drop_percentage_threshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Force plunge magnitude triggering a potential slip warning.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Grip Drop Sliding Time Window (s)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={formData.grip_drop_time_window_seconds}
                onChange={e => handleChange('grip_drop_time_window_seconds', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="w-12 text-right font-mono font-bold text-slate-900">
                {formData.grip_drop_time_window_seconds}s
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Event Debounce Cooldown (s)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={formData.event_cooldown_seconds}
                onChange={e => handleChange('event_cooldown_seconds', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="w-12 text-right font-mono font-bold text-slate-900">
                {formData.event_cooldown_seconds}s
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Refractory period preventing alert buzzing and sensor chatter.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Calibration Duration (s)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={formData.calibration_duration_seconds}
                onChange={e => handleChange('calibration_duration_seconds', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="w-12 text-right font-mono font-bold text-slate-900">
                {formData.calibration_duration_seconds}s
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-slate-700 border border-slate-200 hover:bg-slate-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
