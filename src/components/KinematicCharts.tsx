import React, { useMemo } from 'react';
import { RehabConfig, TelemetrySample } from '../types';

interface Props {
  buffer: TelemetrySample[];
  config: RehabConfig;
}

export const KinematicCharts: React.FC<Props> = ({ buffer, config }) => {
  // Chart 1: Wrist ROM
  const angleChartData = useMemo(() => {
    if (buffer.length === 0) return { path: '', points: [], maxY: 65, minX: 0, maxX: 10 };
    const startTime = buffer[0].timestamp;
    const times = buffer.map(s => Math.max(0, s.timestamp - startTime));
    const angles = buffer.map(s => s.wrist_angle);

    const minX = 0;
    const maxX = Math.max(10, times[times.length - 1]);
    const maxAngle = Math.max(...angles);
    const maxY = Math.max(65, Math.ceil((maxAngle + 5) / 10) * 10);

    const width = 500;
    const height = 220;
    const padL = 45;
    const padR = 15;
    const padT = 20;
    const padB = 30;

    const scaleX = (t: number) => padL + ((t - minX) / (maxX - minX || 1)) * (width - padL - padR);
    const scaleY = (a: number) => height - padB - (a / maxY) * (height - padT - padB);

    let path = '';
    const points: Array<{ x: number; y: number; t: number; a: number }> = [];

    for (let i = 0; i < buffer.length; i++) {
      const x = scaleX(times[i]);
      const y = scaleY(angles[i]);
      points.push({ x, y, t: times[i], a: angles[i] });
      if (i === 0) path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    const safetyY = scaleY(config.over_extension_angle_threshold);

    return { path, points, maxY, minX, maxX, width, height, padL, padR, padT, padB, safetyY, scaleX, scaleY };
  }, [buffer, config.over_extension_angle_threshold]);

  // Chart 2: Grip Force
  const forceChartData = useMemo(() => {
    if (buffer.length === 0) return { path: '', points: [], maxY: 700, minX: 0, maxX: 10 };
    const startTime = buffer[0].timestamp;
    const times = buffer.map(s => Math.max(0, s.timestamp - startTime));
    const forces = buffer.map(s => s.grip_force);

    const minX = 0;
    const maxX = Math.max(10, times[times.length - 1]);
    const maxForce = Math.max(...forces);
    const maxY = Math.max(700, Math.ceil((maxForce + 50) / 100) * 100);

    const width = 500;
    const height = 220;
    const padL = 50;
    const padR = 15;
    const padT = 20;
    const padB = 30;

    const scaleX = (t: number) => padL + ((t - minX) / (maxX - minX || 1)) * (width - padL - padR);
    const scaleY = (f: number) => height - padB - (f / maxY) * (height - padT - padB);

    let path = '';
    const points: Array<{ x: number; y: number; t: number; f: number }> = [];

    for (let i = 0; i < buffer.length; i++) {
      const x = scaleX(times[i]);
      const y = scaleY(forces[i]);
      points.push({ x, y, t: times[i], f: forces[i] });
      if (i === 0) path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    return { path, points, maxY, minX, maxX, width, height, padL, padR, padT, padB, scaleX, scaleY };
  }, [buffer]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Chart 1: Wrist ROM Kinematics */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-900 text-sm">
            Wrist Range of Motion Kinematics
          </h4>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {buffer.length} samples
          </span>
        </div>

        <div className="w-full aspect-[25/11] relative">
          <svg
            viewBox="0 0 500 220"
            className="w-full h-full overflow-visible select-none"
            preserveAspectRatio="none"
          >
            {/* Grid lines horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
              const yVal = angleChartData.maxY * p;
              const yPos = 220 - 30 - (yVal / angleChartData.maxY) * (220 - 20 - 30);
              return (
                <g key={`y-grid-${idx}`}>
                  <line
                    x1="45"
                    y1={yPos}
                    x2="485"
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x="40"
                    y={yPos + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {Math.round(yVal)}°
                  </text>
                </g>
              );
            })}

            {/* Safety Limit line */}
            {angleChartData.safetyY !== undefined && (
              <g>
                <line
                  x1="45"
                  y1={angleChartData.safetyY}
                  x2="485"
                  y2={angleChartData.safetyY}
                  stroke="#dc2626"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                />
                <text
                  x="480"
                  y={angleChartData.safetyY - 5}
                  textAnchor="end"
                  fontSize="9.5"
                  fill="#dc2626"
                  fontWeight="bold"
                >
                  Safety Limit ({config.over_extension_angle_threshold.toFixed(0)}°)
                </text>
              </g>
            )}

            {/* Trace path */}
            {angleChartData.path && (
              <path
                d={angleChartData.path}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Current point highlight */}
            {angleChartData.points.length > 0 && (
              <circle
                cx={angleChartData.points[angleChartData.points.length - 1].x}
                cy={angleChartData.points[angleChartData.points.length - 1].y}
                r="4.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}

            {/* Axes */}
            <line x1="45" y1="190" x2="485" y2="190" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="45" y1="20" x2="45" y2="190" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Axis labels */}
            <text x="265" y="210" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
              Session Elapsed Time (s)
            </text>
            <text
              x="-105"
              y="12"
              textAnchor="middle"
              transform="rotate(-90)"
              fontSize="10"
              fill="#475569"
              fontWeight="600"
            >
              Estimated Wrist Angle (°)
            </text>
          </svg>
        </div>
      </div>

      {/* Chart 2: Isometric Grip Force Dynamics */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-900 text-sm">
            Isometric Grip Force Dynamics
          </h4>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {buffer.length} samples
          </span>
        </div>

        <div className="w-full aspect-[25/11] relative">
          <svg
            viewBox="0 0 500 220"
            className="w-full h-full overflow-visible select-none"
            preserveAspectRatio="none"
          >
            {/* Grid lines horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
              const yVal = forceChartData.maxY * p;
              const yPos = 220 - 30 - (yVal / forceChartData.maxY) * (220 - 20 - 30);
              return (
                <g key={`y-force-grid-${idx}`}>
                  <line
                    x1="50"
                    y1={yPos}
                    x2="485"
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x="45"
                    y={yPos + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {Math.round(yVal)}
                  </text>
                </g>
              );
            })}

            {/* Trace path */}
            {forceChartData.path && (
              <path
                d={forceChartData.path}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Current point highlight */}
            {forceChartData.points.length > 0 && (
              <circle
                cx={forceChartData.points[forceChartData.points.length - 1].x}
                cy={forceChartData.points[forceChartData.points.length - 1].y}
                r="4.5"
                fill="#0d9488"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}

            {/* Axes */}
            <line x1="50" y1="190" x2="485" y2="190" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="50" y1="20" x2="50" y2="190" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Axis labels */}
            <text x="267" y="210" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
              Session Elapsed Time (s)
            </text>
            <text
              x="-105"
              y="12"
              textAnchor="middle"
              transform="rotate(-90)"
              fontSize="10"
              fill="#475569"
              fontWeight="600"
            >
              Estimated Grip Force (N)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
