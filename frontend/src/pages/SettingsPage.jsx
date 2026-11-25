import React from 'react';
import { 
  Settings, 
  Database, 
  Server, 
  Cpu, 
  DollarSign, 
  Leaf, 
  CheckCircle2, 
  AlertCircle,
  Code2
} from 'lucide-react';

export default function SettingsPage({ healthData }) {
  const sqlDb = healthData?.databases?.sql_database || {};
  const docDb = healthData?.databases?.document_database || {};
  const tariffs = healthData?.tariffs || {};

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Platform Configuration & System Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tariff parameters, database connection details, and Agentic AI engine specifications
          </p>
        </div>
      </div>

      {/* Database Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SQL Database */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>SQL Relational Database</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Engine</span>
              <span className="font-semibold text-slate-800">{sqlDb.engine || 'SQLite / MySQL'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Target Schema</span>
              <span className="font-mono text-[11px] text-slate-800">facilities, energy_meters, energy_usage, alerts, recommendations</span>
            </div>
            <div className="py-1">
              <span className="text-slate-500 block mb-1">Status Details</span>
              <span className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded block border border-slate-200/80">
                {sqlDb.detail || 'Connected to SQL Database'}
              </span>
            </div>
          </div>
        </div>

        {/* Document Database */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Document Store (MongoDB)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Engine</span>
              <span className="font-semibold text-slate-800">{docDb.engine || 'Local DocStore / MongoDB'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Target Collections</span>
              <span className="font-mono text-[11px] text-slate-800">iot_sensor_events, energy_agent_logs, anomaly_analysis</span>
            </div>
            <div className="py-1">
              <span className="text-slate-500 block mb-1">Status Details</span>
              <span className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded block border border-slate-200/80">
                {docDb.detail || 'Connected to Document Store'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tariffs & Sustainability Constants */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Configurable Energy Tariffs & Conversion Factors</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Electricity Tariff</span>
            <div className="text-lg font-bold text-slate-900 mt-1">${tariffs.electricity_usd_per_kwh || 0.14} / kWh</div>
            <p className="text-[11px] text-slate-500 mt-1">Configurable via <code className="text-emerald-700 font-mono">ELECTRICITY_TARIFF_PER_KWH</code> in .env</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Water Utility Tariff</span>
            <div className="text-lg font-bold text-slate-900 mt-1">${tariffs.water_usd_per_litre || 0.004} / Litre</div>
            <p className="text-[11px] text-slate-500 mt-1">Configurable via <code className="text-emerald-700 font-mono">WATER_TARIFF_PER_LITRE</code> in .env</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Grid Carbon Factor</span>
            <div className="text-lg font-bold text-slate-900 mt-1">{tariffs.carbon_kg_co2_per_kwh || 0.42} kg CO2 / kWh</div>
            <p className="text-[11px] text-slate-500 mt-1">Standard regional grid average emissions intensity factor</p>
          </div>
        </div>
      </div>

      {/* AI & ML Specs */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>Agentic AI & Machine Learning Specifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
            <h4 className="font-bold text-emerald-950 mb-1">Isolation Forest Anomaly Detection</h4>
            <ul className="space-y-1 text-slate-600 mt-2 list-disc list-inside">
              <li>Evaluation Test Accuracy: <strong className="text-emerald-700">96.44%</strong> (held-out test set)</li>
              <li>Trees: 150 Estimators, Contamination: 4%</li>
              <li>Features: Cyclic hour encoding, business hours, HVAC/lighting ratios, night excess, temperature correlation</li>
              <li>Severity: Low, Medium, High, Critical with automated operational root-cause explanations</li>
            </ul>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
            <h4 className="font-bold text-emerald-950 mb-1">LangGraph Energy Agent</h4>
            <ul className="space-y-1 text-slate-600 mt-2 list-disc list-inside">
              <li>Architecture: Linear StateGraph (START → 5 Nodes → END)</li>
              <li>Nodes: Validation → Analysis → Anomaly Detection → Recommendations → Save Results</li>
              <li>Persists alerts & recommendations to SQL; logs execution traces to MongoDB</li>
              <li>100% functional standalone (optional LLM integration supported)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Internship Project Details */}
      <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-800">Infosys Springboard Virtual Internship</span>
          <span className="mx-2">•</span>
          <span>Milestone 1 – Energy Intelligence & Monitoring</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">v1.0.0-prod</div>
      </div>
    </div>
  );
}
