import { CalibrationProfile, RehabConfig } from './types';

export const DEFAULT_CONFIG: RehabConfig = {
  over_extension_angle_threshold: 45.0,
  grip_drop_percentage_threshold: 20.0,
  grip_drop_time_window_seconds: 2.0,
  min_grip_engagement_force_grams: 100.0,
  event_cooldown_seconds: 1.5,
  calibration_duration_seconds: 5.0,
  min_calibration_samples: 10,
  min_calibration_range_adc: 1.0,
  calibration_min_motion_adc: 50.0,
  adc_min_value: 0,
  adc_max_value: 4095,
  adc_sample_rate_hz: 50,
  flex_sensor_min_angle_deg: 0.0,
  flex_sensor_max_angle_deg: 90.0,
  fsr_min_force_grams: 0.0,
  fsr_max_force_grams: 1000.0,
  haptic_pulse_duration_ms: 150,
  haptic_cooldown_seconds: 1.0,
  live_buffer_max_samples: 500,
  sim_wrist_angle_min_deg: 5.0,
  sim_wrist_angle_max_deg: 35.0,
  sim_wrist_angle_drift_std: 1.2,
  sim_wrist_over_extension_prob: 0.05,
  sim_wrist_excursion_peak_deg: 55.0,
  sim_grip_force_min_grams: 250.0,
  sim_grip_force_max_grams: 600.0,
  sim_grip_force_drift_std: 8.0,
  sim_grip_drop_prob: 0.04,
  sim_grip_drop_magnitude_percent: 35.0,
  sim_adc_noise_std: 2.0,
  sim_flex2_correlation_factor: 0.92,
  sim_excursion_duration_seconds: 1.0,
  sim_grip_drop_duration_seconds: 0.8,
  sim_restoring_force_coefficient: 0.05,
  serial_baud_rate: 115200,
  serial_timeout_seconds: 1.0,
  default_serial_port: null,
  serial_read_max_retries: 3,
  serial_use_last_known_good: true,
  data_dir: "data/sessions"
};

export const DEFAULT_CALIBRATION_PROFILE: CalibrationProfile = {
  flex1_baseline_adc: 3019.0,
  flex1_scale: 0.22888,
  flex1_intercept: -691.0,
  flex1_std_adc: 324.5,
  flex1_observed_min: 2494.9,
  flex1_observed_max: 3412.2,
  flex2_baseline_adc: 2941.3,
  flex2_scale: 0.25006,
  flex2_intercept: -735.5,
  flex2_std_adc: 298.8,
  flex2_observed_min: 2457.4,
  flex2_observed_max: 3301.2,
  fsr_baseline_adc: 1659.8,
  fsr_scale: 2.4577,
  fsr_intercept: -4079.6,
  fsr_std_adc: 274.7,
  fsr_observed_min: 1225.8,
  fsr_observed_max: 2066.7,
  timestamp: new Date().toISOString(),
  duration_used: 5.0,
  sample_count: 250,
  disclaimer: "NOT CLINICALLY VALIDATED. For prototype demonstration and relative rehabilitation baseline tracking only."
};

const STORAGE_KEY_CONFIG = 'orthosync_config';
const STORAGE_KEY_CALIBRATION = 'orthosync_calibration';
const STORAGE_KEY_SESSIONS = 'orthosync_past_sessions';

export function loadStoredConfig(): RehabConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Failed to load config from storage:", e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: RehabConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save config:", e);
  }
}

export function loadStoredCalibration(): CalibrationProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALIBRATION);
    if (raw) {
      return { ...DEFAULT_CALIBRATION_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Failed to load calibration:", e);
  }
  return DEFAULT_CALIBRATION_PROFILE;
}

export function saveStoredCalibration(profile: CalibrationProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(profile));
  } catch (e) {
    console.warn("Failed to save calibration:", e);
  }
}

export function generateSessionId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `session_${y}${m}${day}_${h}${min}${s}`;
}
