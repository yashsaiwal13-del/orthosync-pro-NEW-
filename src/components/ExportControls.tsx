import React from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { downloadFile, generateExportCsv, generateExportJson } from '../sessionManager';
import { RehabEvent, SessionSummary, TelemetrySample } from '../types';

interface Props {
  sessionId: string;
  samples: TelemetrySample[];
  events: RehabEvent[];
  summary: SessionSummary;
}

export const ExportControls: React.FC<Props> = ({
  sessionId,
  samples,
  events,
  summary,
}) => {
  const handleExportCsv = () => {
    if (samples.length === 0) return;
    const csvData = generateExportCsv(samples);
    downloadFile(csvData, `${sessionId}_samples.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportJson = () => {
    if (samples.length === 0) return;
    const jsonData = generateExportJson(sessionId, samples, events, summary);
    downloadFile(jsonData, `${sessionId}_full_session.json`, 'application/json;charset=utf-8;');
  };

  return (
    <div className="mb-8">
      <div className="border-b border-slate-200 pb-2 mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          Section 04
        </div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Session Data Export Controls</span>
        </h3>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Generate complete offline session archives directly in memory
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleExportCsv}
            disabled={samples.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Session CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={samples.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Download Combined JSON</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 text-right">
          Archive contains <span className="font-mono font-bold text-slate-900">{samples.length}</span> samples
          {' '}and <span className="font-mono font-bold text-slate-900">{events.length}</span> safety events
        </div>
      </div>
    </div>
  );
};
