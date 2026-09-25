import { RehabConfig, RehabEvent, SessionSummary, TelemetrySample } from './types';

const STORAGE_KEY_SESSIONS = 'orthosync_past_sessions';

export const INITIAL_PAST_SESSIONS: SessionSummary[] = [
  {
    session_id: 'session_20260921_093000',
    label: '2026-09-21 09:30',
    sample_count: 750,
    duration_seconds: 45.0,
    max_wrist_angle: 28.4,
    avg_wrist_angle: 18.2,
    max_grip_force: 310.5,
    avg_grip_force: 220.4,
    over_extension_count: 0,
    possible_slip_count: 2,
    haptic_warning_count: 2,
  },
  {
    session_id: 'session_20260922_111500',
    label: '2026-09-22 11:15',
    sample_count: 820,
    duration_seconds: 52.0,
    max_wrist_angle: 32.1,
    avg_wrist_angle: 21.6,
    max_grip_force: 345.0,
    avg_grip_force: 248.0,
    over_extension_count: 1,
    possible_slip_count: 1,
    haptic_warning_count: 2,
  },
  {
    session_id: 'session_20260923_154500',
    label: '2026-09-23 15:45',
    sample_count: 900,
    duration_seconds: 58.0,
    max_wrist_angle: 36.8,
    avg_wrist_angle: 24.3,
    max_grip_force: 395.2,
    avg_grip_force: 282.1,
    over_extension_count: 0,
    possible_slip_count: 1,
    haptic_warning_count: 1,
  },
  {
    session_id: 'session_20260924_102000',
    label: '2026-09-24 10:20',
    sample_count: 950,
    duration_seconds: 60.5,
    max_wrist_angle: 41.2,
    avg_wrist_angle: 27.5,
    max_grip_force: 440.0,
    avg_grip_force: 315.6,
    over_extension_count: 0,
    possible_slip_count: 0,
    haptic_warning_count: 0,
  }
];

export function loadPastSessions(): SessionSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load past sessions:", e);
  }
  return INITIAL_PAST_SESSIONS;
}

export function savePastSessions(sessions: SessionSummary[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.warn("Failed to save past sessions:", e);
  }
}

export function computeSummaryMetrics(
  sessionId: string,
  samples: TelemetrySample[],
  events: RehabEvent[],
  config: RehabConfig
): SessionSummary {
  const count = samples.length;
  if (count === 0) {
    return {
      session_id: sessionId,
      label: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sample_count: 0,
      duration_seconds: 0,
      max_wrist_angle: 0,
      avg_wrist_angle: 0,
      max_grip_force: 0,
      avg_grip_force: 0,
      over_extension_count: 0,
      possible_slip_count: 0,
      haptic_warning_count: 0,
    };
  }

  const startTs = samples[0].timestamp;
  const endTs = samples[count - 1].timestamp;
  const duration = Math.max(0, endTs - startTs) || (count / config.adc_sample_rate_hz);

  const angles = samples.map(s => s.wrist_angle);
  const forces = samples.map(s => s.grip_force);

  const maxAngle = Math.max(...angles);
  const avgAngle = angles.reduce((a, b) => a + b, 0) / count;

  const maxForce = Math.max(...forces);
  const avgForce = forces.reduce((a, b) => a + b, 0) / count;

  const overExtCount = events.filter(e => e.event === 'OVER_EXTENSION').length;
  const slipCount = events.filter(e => e.event === 'POSSIBLE_SLIP').length;

  // Count haptic transitions
  let hapticCount = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].motor_state && (i === 0 || !samples[i - 1].motor_state)) {
      hapticCount++;
    }
  }

  return {
    session_id: sessionId,
    label: new Date().toISOString().replace('T', ' ').substring(0, 16),
    sample_count: count,
    duration_seconds: Math.round(duration * 10) / 10,
    max_wrist_angle: Math.round(maxAngle * 10) / 10,
    avg_wrist_angle: Math.round(avgAngle * 10) / 10,
    max_grip_force: Math.round(maxForce * 10) / 10,
    avg_grip_force: Math.round(avgForce * 10) / 10,
    over_extension_count: overExtCount,
    possible_slip_count: slipCount,
    haptic_warning_count: Math.max(overExtCount + slipCount, hapticCount),
  };
}

export function generateExportCsv(samples: TelemetrySample[]): string {
  const headers = [
    'timestamp',
    'wrist_angle',
    'grip_force',
    'flex1_adc',
    'flex2_adc',
    'motor_state',
    'over_extension',
    'slip_detected',
  ];

  const rows = samples.map(s => [
    s.timestamp.toFixed(3),
    s.wrist_angle.toFixed(2),
    s.grip_force.toFixed(2),
    s.flex1_adc,
    s.flex2_adc,
    s.motor_state ? 1 : 0,
    s.over_extension ? 1 : 0,
    s.slip_detected ? 1 : 0,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function generateExportJson(
  sessionId: string,
  samples: TelemetrySample[],
  events: RehabEvent[],
  summary: SessionSummary
): string {
  const payload = {
    metadata: {
      session_id: sessionId,
      exported_at: new Date().toISOString(),
      format_version: '1.0.0',
      system: 'Orthosync Pro Clinical Biomechanics Monitor',
      disclaimer: 'Experimental prototype. Not certified as medical software.',
    },
    summary,
    events,
    samples,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
