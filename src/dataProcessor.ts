import { CalibrationProfile, RehabConfig, RehabEvent, TelemetrySample } from './types';

export class DataProcessor {
  private config: RehabConfig;
  private profile: CalibrationProfile;
  private buffer: TelemetrySample[] = [];

  constructor(config: RehabConfig, profile: CalibrationProfile) {
    this.config = config;
    this.profile = profile;
  }

  public updateProfile(profile: CalibrationProfile) {
    this.profile = profile;
  }

  public updateConfig(config: RehabConfig) {
    this.config = config;
  }

  public processSample(rawSample: TelemetrySample): TelemetrySample {
    const angle = rawSample.wrist_angle !== undefined 
      ? rawSample.wrist_angle 
      : Math.round((this.profile.flex1_scale * rawSample.flex1_adc + this.profile.flex1_intercept) * 10) / 10;

    const force = rawSample.grip_force !== undefined 
      ? rawSample.grip_force 
      : Math.max(0, Math.round((this.profile.fsr_scale * (rawSample.fsr_adc ?? rawSample.flex1_adc) + this.profile.fsr_intercept) * 10) / 10);

    const processed: TelemetrySample = {
      ...rawSample,
      wrist_angle: Math.max(0, angle),
      grip_force: Math.max(0, force),
      over_extension: angle > this.config.over_extension_angle_threshold,
    };

    this.buffer.push(processed);
    if (this.buffer.length > this.config.live_buffer_max_samples) {
      this.buffer.shift();
    }

    return processed;
  }

  public getBuffer(): TelemetrySample[] {
    return [...this.buffer];
  }

  public clearBuffer(): void {
    this.buffer = [];
  }
}

export class EventDetector {
  private config: RehabConfig;
  private forceWindow: Array<{ time: number; force: number }> = [];
  private inOverExtension = false;
  private lastOverExtAlertTime = -9999;
  private lastSlipAlertTime = -9999;
  private events: RehabEvent[] = [];

  constructor(config: RehabConfig) {
    this.config = config;
  }

  public updateConfig(config: RehabConfig) {
    this.config = config;
  }

  public reset(): void {
    this.forceWindow = [];
    this.inOverExtension = false;
    this.lastOverExtAlertTime = -9999;
    this.lastSlipAlertTime = -9999;
    this.events = [];
  }

  public detectEvents(sample: TelemetrySample): RehabEvent[] {
    const triggered: RehabEvent[] = [];
    const timestamp = sample.timestamp;
    const angle = sample.wrist_angle;
    const force = sample.grip_force;
    const angleLimit = this.config.over_extension_angle_threshold;

    // 1. Over-Extension Detection
    if (angle > angleLimit) {
      const timeSinceLast = timestamp - this.lastOverExtAlertTime;
      if (!this.inOverExtension || timeSinceLast >= this.config.event_cooldown_seconds) {
        const overshoot = Math.round((angle - angleLimit) * 10) / 10;
        const ev: RehabEvent = {
          id: `ev_oe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          time: timestamp,
          event: 'OVER_EXTENSION',
          value: angle,
          threshold: angleLimit,
          reference_value: angleLimit,
          severity_delta: overshoot,
          description: `Wrist angle (${angle.toFixed(1)}°) exceeded safe threshold (${angleLimit.toFixed(1)}°) by ${overshoot.toFixed(1)}°.`,
        };
        triggered.push(ev);
        this.events.push(ev);
        this.lastOverExtAlertTime = timestamp;
        this.inOverExtension = true;
      }
    } else {
      this.inOverExtension = false;
    }

    // 2. Grip Drop / Possible Slip Detection
    this.forceWindow.push({ time: timestamp, force });
    const cutoff = timestamp - this.config.grip_drop_time_window_seconds;
    while (this.forceWindow.length > 0 && this.forceWindow[0].time < cutoff) {
      this.forceWindow.shift();
    }

    if (this.forceWindow.length > 1) {
      const peakForce = Math.max(...this.forceWindow.map(f => f.force));
      if (peakForce >= this.config.min_grip_engagement_force_grams) {
        const dropPct = ((peakForce - force) / peakForce) * 100.0;
        const dropThresh = this.config.grip_drop_percentage_threshold;

        if (dropPct >= dropThresh) {
          const timeSinceSlip = timestamp - this.lastSlipAlertTime;
          if (timeSinceSlip >= this.config.event_cooldown_seconds) {
            const ev: RehabEvent = {
              id: `ev_slip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              time: timestamp,
              event: 'POSSIBLE_SLIP',
              value: force,
              threshold: dropThresh,
              reference_value: Math.round(peakForce * 10) / 10,
              severity_delta: Math.round(dropPct * 10) / 10,
              description: `Rapid grip drop of ${dropPct.toFixed(1)}% detected from peak ${peakForce.toFixed(1)} N (threshold: ${dropThresh.toFixed(0)}%).`,
            };
            triggered.push(ev);
            this.events.push(ev);
            this.lastSlipAlertTime = timestamp;
          }
        }
      }
    }

    return triggered;
  }

  public getEvents(): RehabEvent[] {
    return [...this.events];
  }
}
