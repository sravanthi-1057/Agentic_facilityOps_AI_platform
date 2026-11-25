import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  FileSpreadsheet,
  Download,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function DataManagementPage({ onDataReloaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setUploadError(null);
      setUploadResult(null);
    } else {
      setUploadError('Please select a valid .csv file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadCsv(file);
      setUploadResult(res);
      setFile(null);
      if (onDataReloaded) onDataReloaded();
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'CSV upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeedSimulation = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await api.seedData(35);
      setSeedResult(res);
      if (onDataReloaded) onDataReloaded();
    } catch (err) {
      setUploadError('Failed to generate simulated IoT dataset.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Data Management & IoT Ingestion Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Smart meter CSV telemetry validation, automated deduplication, and synthetic IoT simulation
          </p>
        </div>

        <button
          onClick={handleSeedSimulation}
          disabled={isSeeding}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Generating 35 Days Data...' : 'Re-Generate 35 Days Simulated Data'}</span>
        </button>
      </div>

      {seedResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Synthetic IoT Simulation Generated & Ingested!</div>
            <p className="mt-0.5 text-emerald-800">
              Generated {seedResult.total_records_inserted} telemetry records across {seedResult.facilities_created} facilities and {seedResult.meters_created} meters for {seedResult.days_simulated} days. Isolation Forest test accuracy: {seedResult.anomaly_evaluation?.test_accuracy_pct}%.
            </p>
          </div>
        </div>
      )}

      {/* CSV File Upload Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Ingest Utility & IoT Sensor CSV</h3>
        <p className="text-xs text-slate-500 mb-4">
          Upload telemetry feeds containing <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">meter_id</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">timestamp</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">electricity_usage</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">water_usage</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">hvac_usage</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">lighting_usage</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">equipment_usage</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">temperature</code>.
        </p>

        {/* Drag & Drop Area */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors bg-slate-50/50">
          <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Choose a CSV telemetry file to upload</p>
          <p className="text-[11px] text-slate-400 mt-1 mb-4">UTF-8 encoded CSV files up to 25MB</p>

          <label className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer shadow-xs transition-colors">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Select CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>

          {file && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-lg">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{file.name}</span>
              <span className="text-[10px] text-emerald-600">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {uploadError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Action */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Validating & Ingesting...' : 'Upload & Process Telemetry'}</span>
          </button>
        </div>

        {/* Upload Results Summary */}
        {uploadResult && (
          <div className="mt-6 border border-slate-200 rounded-xl p-5 bg-slate-50/70">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ingestion Complete: {uploadResult.filename}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Rows Processed</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{uploadResult.total_rows_processed}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Valid Inserted</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5">{uploadResult.valid_rows_inserted}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Duplicates Filtered</div>
                <div className="text-sm font-bold text-slate-600 mt-0.5">{uploadResult.duplicate_rows_skipped}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Anomalies Detected</div>
                <div className="text-sm font-bold text-rose-600 mt-0.5">{uploadResult.anomalies_detected}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ingestion & Simulation Specs */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Data Ingestion & Simulation Integrity</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <h4 className="font-bold text-slate-900 mb-1">Simulated IoT Telemetry Status</h4>
            <p className="leading-relaxed">
              Environment explicitly simulates smart commercial buildings (Main Tech Tower & Innovation Hub) with realistic diurnal occupancy curves, seasonal weather fluctuations, and controlled anomaly injections.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <h4 className="font-bold text-slate-900 mb-1">Dual-Database Architecture</h4>
            <p className="leading-relaxed">
              Structured time-series, meters, alerts, and recommendations are persisted in the SQL relational store, while raw sensor events and LangGraph execution traces are recorded in the document collection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
