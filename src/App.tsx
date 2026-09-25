import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateSessionId,
  loadStoredCalibration,
  loadStoredConfig,
  saveStoredCalibration,
  saveStoredConfig,
} from './config';
import { DataProcessor, EventDetector } from './dataProcessor';
import {
  computeSummaryMetrics,
  loadPastSessions,
  savePastSessions,
} from './sessionManager';
import { SimulationEngine } from './simulation';
import {
  CalibrationProfile,
  RehabConfig,
  RehabEvent,
  SessionSummary,
  TelemetrySample,
} from './types';

// Components
import { ClinicianSummary } from './components/ClinicianSummary';
import { ConfigModal } from './components/ConfigModal';
import { EventTimeline } from './components/EventTimeline';
import { ExportControls } from './components/ExportControls';
import { HapticPanel } from './components/HapticPanel';
import { KinematicCharts } from './components/KinematicCharts';
import { MetricCards } from './components/MetricCards';
import { RecoveryTrends } from './components/RecoveryTrends';
import { Sidebar } from './components/Sidebar';
import { StatusBanner } from './components/StatusBanner';
import { TelemetryRibbon } from './components/TelemetryRibbon';
import { Activity, Check, Download, FileText, Sliders } from 'lucide-react';

export const App: React.FC = () => {
  // Config & Calibration Profile
  const [config, setConfig] = useState<RehabConfig>(loadStoredConfig);
  const [profile, setProfile] = useState<CalibrationProfile>(loadStoredCalibration);

  // Connection & Session State
  const [connectionMode, setConnectionMode] = useState<'simulation' | 'hardware'>('simulation');
  const [sessionId, setSessionId] = useState<string>(generateSessionId);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'timeline' | 'summary' | 'trends'>('monitor');

  // Telemetry buffer & current sample
  const [currentSample, setCurrentSample] = useState<TelemetrySample | null>(null);
  const [buffer, setBuffer] = useState<TelemetrySample[]>([]);
  const [sessionSamples, setSessionSamples] = useState<TelemetrySample[]>([]);
  const [sessionEvents, setSessionEvents] = useState<RehabEvent[]>([]);

  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);

  // Past Sessions for Longitudinal Trends
  const [pastSessions, setPastSessions] = useState<SessionSummary[]>(loadPastSessions);

  // Modals & Feedback
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Engine references
  const simEngineRef = useRef<SimulationEngine>(new SimulationEngine(config, profile));
  const processorRef = useRef<DataProcessor>(new DataProcessor(config, profile));
  const detectorRef = useRef<EventDetector>(new EventDetector(config));

  // Sync config / profile changes to engines
  useEffect(() => {
    simEngineRef.current.updateConfig(config, profile);
    processorRef.current.updateConfig(config);
    processorRef.current.updateProfile(profile);
    detectorRef.current.updateConfig(config);
  }, [config, profile]);

  // Calibration routine (5s window collection)
  const handleStartCalibration = async () => {
    if (isStreaming || isCalibrating) return;
    setIsCalibrating(true);
    setCalibrationProgress(0);

    const totalDurationMs = config.calibration_duration_seconds * 1000;
    const intervalMs = 1000 / config.adc_sample_rate_hz;
    const samplesNeeded = Math.floor(config.calibration_duration_seconds * config.adc_sample_rate_hz);

    const collectedSamples: TelemetrySample[] = [];
    const startTime = Date.now();

    const calInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / totalDurationMs);
      setCalibrationProgress(progress);

      const raw = simEngineRef.current.nextSample();
      collectedSamples.push(raw);

      if (elapsed >= totalDurationMs || collectedSamples.length >= samplesNeeded) {
        clearInterval(calInterval);

        // Derive empirical baseline from collected samples
        const flex1Values = collectedSamples.map(s => s.flex1_adc);
        const flex2Values = collectedSamples.map(s => s.flex2_adc);
        const fsrValues = collectedSamples.map(s => s.fsr_adc ?? 1600);

        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const std = (arr: number[], mean: number) =>
          Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / arr.length);

        const f1Base = avg(flex1Values);
        const f1Std = std(flex1Values, f1Base);
        const f2Base = avg(flex2Values);
        const f2Std = std(flex2Values, f2Base);
        const fsrBase = avg(fsrValues);
        const fsrStd = std(fsrValues, fsrBase);

        const newProfile: CalibrationProfile = {
          flex1_baseline_adc: Math.round(f1Base * 10) / 10,
          flex1_scale: profile.flex1_scale,
          flex1_intercept: -f1Base * profile.flex1_scale,
          flex1_std_adc: Math.round(f1Std * 10) / 10,
          flex1_observed_min: Math.min(...flex1Values),
          flex1_observed_max: Math.max(...flex1Values),

          flex2_baseline_adc: Math.round(f2Base * 10) / 10,
          flex2_scale: profile.flex2_scale,
          flex2_intercept: -f2Base * profile.flex2_scale,
          flex2_std_adc: Math.round(f2Std * 10) / 10,
          flex2_observed_min: Math.min(...flex2Values),
          flex2_observed_max: Math.max(...flex2Values),

          fsr_baseline_adc: Math.round(fsrBase * 10) / 10,
          fsr_scale: profile.fsr_scale,
          fsr_intercept: -fsrBase * profile.fsr_scale,
          fsr_std_adc: Math.round(fsrStd * 10) / 10,
          fsr_observed_min: Math.min(...fsrValues),
          fsr_observed_max: Math.max(...fsrValues),

          timestamp: new Date().toISOString(),
          duration_used: config.calibration_duration_seconds,
          sample_count: collectedSamples.length,
          disclaimer: profile.disclaimer,
        };

        setProfile(newProfile);
        saveStoredCalibration(newProfile);
        setIsCalibrating(false);
      }
    }, intervalMs);
  };

  // Streaming Loop
  useEffect(() => {
    if (!isStreaming) return;

    const intervalTimeMs = 1000 / 25; // 25 updates/sec batching
    const samplesPerTick = Math.max(1, Math.round(config.adc_sample_rate_hz / 25));

    const timer = setInterval(() => {
      let lastProcessed: TelemetrySample | null = null;
      const newBatch: TelemetrySample[] = [];
      const newEventsBatch: RehabEvent[] = [];

      for (let i = 0; i < samplesPerTick; i++) {
        const raw = simEngineRef.current.nextSample();
        const processed = processorRef.current.processSample(raw);
        const detected = detectorRef.current.detectEvents(processed);

        newBatch.push(processed);
        if (detected.length > 0) {
          newEventsBatch.push(...detected);
        }
        lastProcessed = processed;
      }

      if (lastProcessed) {
        setCurrentSample(lastProcessed);
        setBuffer(processorRef.current.getBuffer());
        setSessionSamples(prev => [...prev, ...newBatch]);
        if (newEventsBatch.length > 0) {
          setSessionEvents(prev => [...prev, ...newEventsBatch]);
        }
      }
    }, intervalTimeMs);

    return () => clearInterval(timer);
  }, [isStreaming, config.adc_sample_rate_hz]);

  // Session control handlers
  const handleToggleStreaming = () => {
    setIsStreaming(prev => !prev);
    setSavedNotice(null);
  };

  const handleEndAndSave = () => {
    setIsStreaming(false);
    if (sessionSamples.length === 0) return;

    const summary = computeSummaryMetrics(sessionId, sessionSamples, sessionEvents, config);
    const updated = [summary, ...pastSessions.filter(s => s.session_id !== sessionId)];
    setPastSessions(updated);
    savePastSessions(updated);

    setSavedNotice(`Clinical Session ${sessionId} saved with ${sessionSamples.length} telemetry samples.`);
  };

  const handleNewSession = () => {
    setIsStreaming(false);
    const newId = generateSessionId();
    setSessionId(newId);
    processorRef.current.clearBuffer();
    detectorRef.current.reset();
    setBuffer([]);
    setSessionSamples([]);
    setSessionEvents([]);
    setCurrentSample(null);
    setSavedNotice(null);
  };

  const handleSaveConfig = (newConfig: RehabConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  // Status heuristics
  const isOverExtended = Boolean(
    currentSample && currentSample.wrist_angle > config.over_extension_angle_threshold
  );

  const recentCutoff = (currentSample?.timestamp ?? 0) - 1.5;
  const isSlipActive = sessionEvents.some(
    e => e.event === 'POSSIBLE_SLIP' && e.time >= recentCutoff
  );

  const isInCooldown = Boolean(
    sessionEvents.length > 0 &&
      currentSample &&
      currentSample.timestamp - sessionEvents[sessionEvents.length - 1].time < config.event_cooldown_seconds
  );

  const activeSummary = computeSummaryMetrics(sessionId, sessionSamples, sessionEvents, config);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans">
      {/* =========================================================================
          TOP BAR CONTRACT: [Brand Wordmark] — [Nav Links] — [Actions]
          Pure Minimalist Blue & White Aesthetic
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        {/* Zone 1: Wordmark in Refined Clean Typography */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Orthosync Pro
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean text, no pill clutter) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`transition-colors hover:text-blue-600 pb-0.5 ${
              activeTab === 'monitor' ? 'text-blue-600 border-b-2 border-blue-600' : ''
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`transition-colors hover:text-blue-600 pb-0.5 ${
              activeTab === 'timeline' ? 'text-blue-600 border-b-2 border-blue-600' : ''
            }`}
          >
            Safety Timeline
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`transition-colors hover:text-blue-600 pb-0.5 ${
              activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : ''
            }`}
          >
            Clinician Summary
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`transition-colors hover:text-blue-600 pb-0.5 ${
              activeTab === 'trends' ? 'text-blue-600 border-b-2 border-blue-600' : ''
            }`}
          >
            Recovery Trends
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Parameters</span>
          </button>

          <button
            onClick={handleStartCalibration}
            disabled={isStreaming || isCalibrating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
          >
            <span>{isCalibrating ? 'Calibrating...' : 'Calibrate Baseline'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE LAYOUT (Sidebar + Viewport Console)
      ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar Controls */}
        <Sidebar
          connectionMode={connectionMode}
          setConnectionMode={setConnectionMode}
          isStreaming={isStreaming}
          onToggleStreaming={handleToggleStreaming}
          onEndAndSave={handleEndAndSave}
          onNewSession={handleNewSession}
          sessionId={sessionId}
          sampleCount={sessionSamples.length}
          eventCount={sessionEvents.length}
          profile={profile}
          onCalibrate={handleStartCalibration}
          isCalibrating={isCalibrating}
          calibrationProgress={calibrationProgress}
          config={config}
          onOpenConfig={() => setIsConfigOpen(true)}
        />

        {/* Main Telemetry & Analytics Canvas */}
        <main className="flex-1 p-5 lg:p-7 min-w-0 space-y-5">
          {/* Header Metadata Ribbon & Subtitle */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <span>Post-Operative Biomechanics</span>
              <span aria-hidden="true">·</span>
              <span>Model ORTHO-PRO-V1</span>
              <span aria-hidden="true">·</span>
              <span>Offline Local Protocol</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Post-Operative Wrist & Hand Rehabilitation Monitor
            </h1>
          </div>

          {/* Saved Notification */}
          {savedNotice && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs shadow-xs animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          {/* Telemetry ribbon */}
          <TelemetryRibbon
            sessionId={sessionId}
            isStreaming={isStreaming}
            connectionMode={connectionMode}
            profile={profile}
          />

          {/* Semantic Status Banner (Green / Amber / Red) */}
          <StatusBanner
            sample={currentSample}
            config={config}
            isOverExtended={isOverExtended}
            isSlipActive={isSlipActive}
          />

          {/* 4 Precision Metric Cards */}
          <MetricCards
            sample={currentSample}
            profile={profile}
            config={config}
            isOverExtended={isOverExtended}
            isSlipActive={isSlipActive}
          />

          {/* Dedicated Haptic Actuator Panel */}
          <HapticPanel
            isActive={currentSample?.motor_state ?? false}
            isInCooldown={isInCooldown}
            config={config}
          />

          {/* Real-time Kinematic Charts */}
          <KinematicCharts buffer={buffer} config={config} />

          {/* Section 02: Safety Event Timeline */}
          <div id="timeline-section">
            <EventTimeline events={sessionEvents} />
          </div>

          {/* Section 03: Clinician Session Summary */}
          <div id="summary-section">
            <ClinicianSummary summary={activeSummary} config={config} />
          </div>

          {/* Section 04: Session Data Export Controls */}
          <div id="export-section">
            <ExportControls
              sessionId={sessionId}
              samples={sessionSamples}
              events={sessionEvents}
              summary={activeSummary}
            />
          </div>

          {/* Section 05: Longitudinal Recovery Trends */}
          <div id="trends-section">
            <RecoveryTrends pastSessions={pastSessions} config={config} />
          </div>
        </main>
      </div>

      {/* Parameter Settings Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default App;
