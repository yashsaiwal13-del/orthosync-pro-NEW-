export interface RehabConfig {
  over_extension_angle_threshold: number;
  grip_drop_percentage_threshold: number;
  grip_drop_time_window_seconds: number;
  min_grip_engagement_force_grams: number;
  event_cooldown_seconds: number;
  calibration_duration_seconds: number;
  min_calibration_samples: number;
  min_calibration_range_adc: number;
  calibration_min_motion_adc: number;
  adc_min_value: number;
  adc_max_value: number;
  adc_sample_rate_hz: number;
  flex_sensor_min_angle_deg: number;
  flex_sensor_max_angle_deg: number;
  fsr_min_force_grams: number;
  fsr_max_force_grams: number;
  haptic_pulse_duration_ms: number;
  haptic_cooldown_seconds: number;
  live_buffer_max_samples: number;
  sim_wrist_angle_min_deg: number;
  sim_wrist_angle_max_deg: number;
  sim_wrist_angle_drift_std: number;
  sim_wrist_over_extension_prob: number;
  sim_wrist_excursion_peak_deg: number;
  sim_grip_force_min_grams: number;
  sim_grip_force_max_grams: number;
  sim_grip_force_drift_std: number;
  sim_grip_drop_prob: number;
  sim_grip_drop_magnitude_percent: number;
  sim_adc_noise_std: number;
  sim_flex2_correlation_factor: number;
  sim_excursion_duration_seconds: number;
  sim_grip_drop_duration_seconds: number;
  sim_restoring_force_coefficient: number;
  serial_baud_rate: number;
  serial_timeout_seconds: number;
  default_serial_port: string | null;
  serial_read_max_retries: number;
  serial_use_last_known_good: boolean;
  data_dir: string;
}

export interface CalibrationProfile {
  flex1_baseline_adc: number;
  flex1_scale: number;
  flex1_intercept: number;
  flex1_std_adc: number;
  flex1_observed_min: number;
  flex1_observed_max: number;

  flex2_baseline_adc: number;
  flex2_scale: number;
  flex2_intercept: number;
  flex2_std_adc: number;
  flex2_observed_min: number;
  flex2_observed_max: number;

  fsr_baseline_adc: number;
  fsr_scale: number;
  fsr_intercept: number;
  fsr_std_adc: number;
  fsr_observed_min: number;
  fsr_observed_max: number;

  timestamp: string;
  duration_used: number;
  sample_count: number;
  disclaimer: string;
}

export interface TelemetrySample {
  timestamp: number;
  wrist_angle: number;
  grip_force: number;
  flex1_adc: number;
  flex2_adc: number;
  fsr_adc?: number;
  motor_state: boolean;
  over_extension: boolean;
  slip_detected: boolean;
  status?: string;
  error?: string | null;
}

export interface RehabEvent {
  id: string;
  time: number;
  event: 'OVER_EXTENSION' | 'POSSIBLE_SLIP';
  value: number;
  threshold?: number;
  reference_value?: number;
  severity_delta?: number;
  description: string;
}

export interface SessionSummary {
  session_id: string;
  label: string;
  sample_count: number;
  duration_seconds: number;
  max_wrist_angle: number;
  avg_wrist_angle: number;
  max_grip_force: number;
  avg_grip_force: number;
  over_extension_count: number;
  possible_slip_count: number;
  haptic_warning_count: number;
  samples?: TelemetrySample[];
  events?: RehabEvent[];
}
