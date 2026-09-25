import { CalibrationProfile, RehabConfig, TelemetrySample } from './types';

function gaussianRandom(mean = 0, std = 1): number {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

export class SimulationEngine {
  private config: RehabConfig;
  private profile: CalibrationProfile;
  private currentTime: number;

  private wristAngle: number;
  private inExcursion: boolean = false;
  private excursionTicksRemaining: number = 0;

  private gripForce: number;
  private inGripDrop: boolean = false;
  private gripDropTicksRemaining: number = 0;
  private preDropForce: number = 0;
  private targetDropForce: number = 0;

  private motorActiveUntil: number = 0;
  private lastMotorTriggerTime: number = -9999;

  constructor(config: RehabConfig, profile: CalibrationProfile) {
    this.config = config;
    this.profile = profile;
    this.currentTime = Date.now() / 1000;

    this.wristAngle = (config.sim_wrist_angle_min_deg + config.sim_wrist_angle_max_deg) / 2.0;
    this.gripForce = (config.sim_grip_force_min_grams + config.sim_grip_force_max_grams) / 2.0;
  }

  public updateConfig(config: RehabConfig, profile: CalibrationProfile) {
    this.config = config;
    this.profile = profile;
  }

  private updateWristAngle(): { angle: number; overExtension: boolean } {
    const center = (this.config.sim_wrist_angle_min_deg + this.config.sim_wrist_angle_max_deg) / 2.0;

    if (!this.inExcursion) {
      if (Math.random() < this.config.sim_wrist_over_extension_prob) {
        this.inExcursion = true;
        this.excursionTicksRemaining = Math.max(
          1,
          Math.floor(this.config.sim_excursion_duration_seconds * this.config.adc_sample_rate_hz)
        );
      }
    }

    if (this.inExcursion) {
      const target = this.config.sim_wrist_excursion_peak_deg;
      const pull = (target - this.wristAngle) * 0.25;
      const noise = gaussianRandom(0, this.config.sim_wrist_angle_drift_std);
      this.wristAngle += pull + noise;
      this.excursionTicksRemaining -= 1;
      if (this.excursionTicksRemaining <= 0) {
        this.inExcursion = false;
      }
    } else {
      const restoring = (center - this.wristAngle) * this.config.sim_restoring_force_coefficient;
      const drift = restoring + gaussianRandom(0, this.config.sim_wrist_angle_drift_std);
      this.wristAngle += drift;
      this.wristAngle = Math.max(
        this.config.sim_wrist_angle_min_deg,
        Math.min(this.config.sim_wrist_angle_max_deg, this.wristAngle)
      );
    }

    const overExtension = this.wristAngle > this.config.over_extension_angle_threshold;
    return { angle: Math.max(0, this.wristAngle), overExtension };
  }

  private updateGripForce(): { force: number; slip: boolean } {
    const center = (this.config.sim_grip_force_min_grams + this.config.sim_grip_force_max_grams) / 2.0;
    let slipTriggered = false;

    if (!this.inGripDrop) {
      if (Math.random() < this.config.sim_grip_drop_prob) {
        this.inGripDrop = true;
        this.preDropForce = this.gripForce;
        const dropFraction = this.config.sim_grip_drop_magnitude_percent / 100.0;
        this.targetDropForce = Math.max(0.0, this.gripForce * (1.0 - dropFraction));
        this.gripDropTicksRemaining = Math.max(
          1,
          Math.floor(this.config.sim_grip_drop_duration_seconds * this.config.adc_sample_rate_hz)
        );
      }
    }

    if (this.inGripDrop) {
      const totalTicks = Math.max(
        1,
        Math.floor(this.config.sim_grip_drop_duration_seconds * this.config.adc_sample_rate_hz)
      );
      const halfway = Math.floor(totalTicks / 2.0);

      if (this.gripDropTicksRemaining > halfway) {
        // Plunge
        const pull = (this.targetDropForce - this.gripForce) * 0.5;
        const noise = gaussianRandom(0, this.config.sim_grip_force_drift_std * 0.5);
        this.gripForce += pull + noise;
        slipTriggered = true;
      } else {
        // Recovery
        const pull = (this.preDropForce - this.gripForce) * 0.2;
        const noise = gaussianRandom(0, this.config.sim_grip_force_drift_std * 0.5);
        this.gripForce += pull + noise;
      }

      this.gripDropTicksRemaining -= 1;
      if (this.gripDropTicksRemaining <= 0) {
        this.inGripDrop = false;
      }
    } else {
      const restoring = (center - this.gripForce) * this.config.sim_restoring_force_coefficient;
      const drift = restoring + gaussianRandom(0, this.config.sim_grip_force_drift_std);
      this.gripForce += drift;
      this.gripForce = Math.max(
        this.config.sim_grip_force_min_grams,
        Math.min(this.config.sim_grip_force_max_grams, this.gripForce)
      );
    }

    return { force: Math.max(0, this.gripForce), slip: slipTriggered };
  }

  private angleToFlexAdc(angle: number, isFlex2 = false): number {
    const scale = isFlex2 ? this.profile.flex2_scale : this.profile.flex1_scale;
    const intercept = isFlex2 ? this.profile.flex2_intercept : this.profile.flex1_intercept;
    const baseline = isFlex2 ? this.profile.flex2_baseline_adc : this.profile.flex1_baseline_adc;

    if (Math.abs(scale) < 1e-12) return baseline;
    const baseAdc = (angle - intercept) / scale;
    const noise = gaussianRandom(0, this.config.sim_adc_noise_std);
    return Math.max(this.config.adc_min_value, Math.min(this.config.adc_max_value, baseAdc + noise));
  }

  private forceToFsrAdc(force: number): number {
    const scale = this.profile.fsr_scale;
    const intercept = this.profile.fsr_intercept;
    const baseline = this.profile.fsr_baseline_adc;

    if (Math.abs(scale) < 1e-12) return baseline;
    const baseAdc = (force - intercept) / scale;
    const noise = gaussianRandom(0, this.config.sim_adc_noise_std);
    return Math.max(this.config.adc_min_value, Math.min(this.config.adc_max_value, baseAdc + noise));
  }

  public nextSample(): TelemetrySample {
    const dt = 1.0 / this.config.adc_sample_rate_hz;
    this.currentTime += dt;

    const { angle, overExtension } = this.updateWristAngle();
    const { force, slip } = this.updateGripForce();

    // Haptic motor pulse management
    let motorState = false;
    if (overExtension || slip) {
      if (this.currentTime - this.lastMotorTriggerTime >= this.config.haptic_cooldown_seconds) {
        this.lastMotorTriggerTime = this.currentTime;
        this.motorActiveUntil = this.currentTime + this.config.haptic_pulse_duration_ms / 1000.0;
      }
    }
    if (this.currentTime < this.motorActiveUntil) {
      motorState = true;
    }

    const flex1Adc = Math.round(this.angleToFlexAdc(angle, false));
    const flex2Angle = angle * this.config.sim_flex2_correlation_factor;
    const flex2Adc = Math.round(this.angleToFlexAdc(flex2Angle, true));
    const fsrAdc = Math.round(this.forceToFsrAdc(force));

    return {
      timestamp: Math.round(this.currentTime * 1000) / 1000,
      wrist_angle: Math.round(angle * 10) / 10,
      grip_force: Math.round(force * 10) / 10,
      flex1_adc: flex1Adc,
      flex2_adc: flex2Adc,
      fsr_adc: fsrAdc,
      motor_state: motorState,
      over_extension: overExtension,
      slip_detected: slip,
      status: 'OK',
    };
  }
}
