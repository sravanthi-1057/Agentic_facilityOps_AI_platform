import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Database, 
  X,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function AgentModal({ isOpen, onClose, agentResult, isRunning }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">LangGraph Energy Agent</h3>
              <p className="text-xs text-slate-300">Autonomous Facility Operations Intelligence Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isRunning ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4"></div>
              <h4 className="text-sm font-semibold text-slate-800">Executing LangGraph Workflow</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Sequencing through Data Validation, Analysis, Isolation Forest Inference, and Recommendations...
              </p>
            </div>
          ) : agentResult ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-center">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Run ID</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{agentResult.run_id}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Execution Time</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{agentResult.execution_time_ms} ms</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Anomalies Detected</div>
                  <div className="text-xs font-bold text-rose-600 mt-0.5">{agentResult.anomalies_detected}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Recommendations</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">{agentResult.recommendations_generated}</div>
                </div>
              </div>

              {/* Node Sequence Steps */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Workflow Execution Trace (5 Nodes)
                </h4>
                <div className="space-y-2.5">
                  {agentResult.steps?.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="mt-0.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{step.node}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{step.duration_ms} ms</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{agentResult.summary_message}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No recent agent execution results. Click "Execute Agent" to run.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
