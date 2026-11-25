import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import AgentModal from './components/AgentModal';
import MaintenanceAgentModal from './components/MaintenanceAgentModal';
import AssetDetailModal from './components/AssetDetailModal';
import CreateScheduleModal from './components/CreateScheduleModal';

// Milestone 1 Pages
import OverviewPage from './pages/OverviewPage';
import MonitoringPage from './pages/MonitoringPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AnomalyPage from './pages/AnomalyPage';
import RecommendationsPage from './pages/RecommendationsPage';
import DataManagementPage from './pages/DataManagementPage';
import SettingsPage from './pages/SettingsPage';

// Milestone 2 Pages
import AssetMonitoringPage from './pages/AssetMonitoringPage';
import PredictiveMaintenancePage from './pages/PredictiveMaintenancePage';
import MaintenanceAlertsPage from './pages/MaintenanceAlertsPage';
import MaintenanceSchedulePage from './pages/MaintenanceSchedulePage';

import { api } from './services/api';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedRange, setSelectedRange] = useState(30);
  const [selectedFloor, setSelectedFloor] = useState('all');

  // Milestone 1 Dashboard Data State
  const [summary, setSummary] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [healthData, setHealthData] = useState(null);

  // Milestone 2 Predictive Maintenance Data State
  const [maintenanceKPIs, setMaintenanceKPIs] = useState(null);
  const [maintenanceAssets, setMaintenanceAssets] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [maintenancePredictions, setMaintenancePredictions] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Energy Agent Modal State (M1)
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState(null);

  // Maintenance Agent Modal State (M2)
  const [isMaintAgentModalOpen, setIsMaintAgentModalOpen] = useState(false);
  const [isMaintAgentRunning, setIsMaintAgentRunning] = useState(false);
  const [maintAgentResult, setMaintAgentResult] = useState(null);

  // Asset Detail Modal State (M2)
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false);

  // Create Work Order Modal State (M2)
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [preselectedAssetId, setPreselectedAssetId] = useState('');

  // Available floors extracted from facilities or distribution
  const allFloors = Array.from(
    new Set(facilities.flatMap((f) => f.floors || []))
  ).sort();

  // Load Maintenance Data (M2)
  const loadMaintenanceData = useCallback(async () => {
    try {
      const [kpis, assets, alerts, preds] = await Promise.all([
        api.getMaintenanceKPIs({ facility_id: selectedFacility }),
        api.getMaintenanceAssets({ facility_id: selectedFacility }),
        api.getMaintenanceAlerts({ facility_id: selectedFacility }),
        api.getMaintenancePredictions({ facility_id: selectedFacility })
      ]);
      setMaintenanceKPIs(kpis);
      setMaintenanceAssets(assets || []);
      setMaintenanceAlerts(alerts || []);
      setMaintenancePredictions(preds || []);
    } catch (err) {
      console.warn('Could not load maintenance data:', err);
    }
  }, [selectedFacility]);

  // Load all dashboard telemetry (M1 + M2)
  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [
        healthRes,
        facRes,
        sumRes,
        hourlyRes,
        dailyRes,
        weeklyRes,
        distRes,
        anomRes,
        recRes,
      ] = await Promise.all([
        api.getHealth(),
        api.getFacilities(),
        api.getEnergySummary(selectedFacility, selectedRange),
        api.getEnergyConsumption(selectedFacility, selectedFloor, 'hourly', selectedRange),
        api.getEnergyConsumption(selectedFacility, selectedFloor, 'daily', selectedRange),
        api.getEnergyConsumption(selectedFacility, selectedFloor, 'weekly', selectedRange),
        api.getEnergyDistribution(selectedFacility, selectedRange),
        api.getAnomalies(selectedFacility, 'all', 100),
        api.getRecommendations('all', 20),
      ]);

      setHealthData(healthRes);
      setFacilities(facRes || []);
      setSummary(sumRes);
      setHourlyData(hourlyRes?.data || []);
      setDailyData(dailyRes?.data || []);
      setWeeklyData(weeklyRes?.data || []);
      setDistribution(distRes);
      setAnomalies(anomRes || []);
      setRecommendations(recRes || []);

      // Concurrently load M2 data
      await loadMaintenanceData();
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setErrorMessage(
        'Unable to communicate with the FastAPI backend. Please ensure the backend is running at http://localhost:8000.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFacility, selectedRange, selectedFloor, loadMaintenanceData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Execute LangGraph Energy Agent (M1)
  const handleRunEnergyAgent = async () => {
    setIsAgentModalOpen(true);
    setIsAgentRunning(true);
    setAgentResult(null);

    try {
      const result = await api.triggerAgent(selectedFacility, selectedRange);
      setAgentResult(result);
      loadDashboardData();
    } catch (err) {
      console.error('Energy agent execution error:', err);
      setAgentResult({
        run_id: 'ERROR',
        facility_id: selectedFacility,
        status: 'FAILED',
        execution_time_ms: 0,
        anomalies_detected: 0,
        recommendations_generated: 0,
        summary_message: 'Energy Agent execution failed: ' + (err.response?.data?.detail || err.message),
        steps: []
      });
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Execute LangGraph Maintenance Agent (M2)
  const handleRunMaintenanceAgent = async () => {
    setIsMaintAgentModalOpen(true);
    setIsMaintAgentRunning(true);
    setMaintAgentResult(null);

    try {
      const result = await api.triggerMaintenanceAgent(selectedFacility);
      setMaintAgentResult(result);
      await loadMaintenanceData();
    } catch (err) {
      console.error('Maintenance agent execution error:', err);
      setMaintAgentResult({
        run_id: 'ERROR',
        facility_id: selectedFacility,
        status: 'FAILED',
        execution_time_ms: 0,
        assets_monitored: 0,
        alerts_generated: 0,
        predictions_updated: 0,
        summary_message: 'Maintenance Agent execution failed: ' + (err.response?.data?.detail || err.message),
        steps: []
      });
    } finally {
      setIsMaintAgentRunning(false);
    }
  };

  // Simulate Real-Time IoT Telemetry Stream (M2)
  const handleRefreshTelemetry = async () => {
    setIsRefreshingTelemetry(true);
    try {
      await api.refreshAssetSensors(selectedFacility);
      await loadMaintenanceData();
    } catch (err) {
      console.error('Failed to refresh asset telemetry:', err);
      alert('Failed to simulate sensor stream: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsRefreshingTelemetry(false);
    }
  };

  // Open Asset Detail Modal
  const handleSelectAsset = async (assetId) => {
    try {
      const detail = await api.getAssetDetail(assetId);
      setSelectedAssetDetail(detail);
      setIsAssetDetailOpen(true);
    } catch (err) {
      console.error('Failed to load asset detail for', assetId, err);
      alert('Unable to load asset telemetry details.');
    }
  };

  // Open Create Schedule Modal
  const handleOpenCreateSchedule = (assetId = '') => {
    setPreselectedAssetId(assetId || '');
    setIsCreateScheduleOpen(true);
  };

  // Acknowledge Alert (M2)
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.acknowledgeMaintenanceAlert(alertId);
      await loadMaintenanceData();
      if (selectedAssetDetail) {
        const updatedDetail = await api.getAssetDetail(selectedAssetDetail.asset_id);
        setSelectedAssetDetail(updatedDetail);
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Resolve Alert (M2)
  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveMaintenanceAlert(alertId);
      await loadMaintenanceData();
      if (selectedAssetDetail) {
        const updatedDetail = await api.getAssetDetail(selectedAssetDetail.asset_id);
        setSelectedAssetDetail(updatedDetail);
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Active maintenance alerts count
  const activeMaintAlertCount = maintenanceAlerts.filter(a => a.status === 'New').length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        anomalyCount={anomalies.length}
        recCount={recommendations.length}
        maintAlertCount={activeMaintAlertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          facilities={facilities}
          selectedFacility={selectedFacility}
          setSelectedFacility={setSelectedFacility}
          selectedRange={selectedRange}
          setSelectedRange={setSelectedRange}
          onRefresh={() => loadDashboardData(true)}
          onRunAgent={handleRunEnergyAgent}
          onRunMaintenanceAgent={handleRunMaintenanceAgent}
          onRefreshTelemetry={handleRefreshTelemetry}
          isRefreshing={isRefreshing}
          isRefreshingTelemetry={isRefreshingTelemetry}
          healthData={healthData}
          anomalyCount={anomalies.length}
          maintAlertCount={activeMaintAlertCount}
          activeTab={activeTab}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadDashboardData(true)}
              className="font-semibold underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4"></div>
              <h3 className="text-sm font-bold text-slate-800">Loading FacilityOps AI Intelligence...</h3>
              <p className="text-xs text-slate-400 mt-1">Connecting to FastAPI and compiling telemetry models</p>
            </div>
          ) : (
            <>
              {/* MILESTONE 1 PAGES */}
              {activeTab === 'overview' && (
                <OverviewPage
                  summary={summary}
                  hourlyData={hourlyData}
                  distribution={distribution}
                  anomalies={anomalies}
                  recommendations={recommendations}
                  onNavigateTab={setActiveTab}
                  onRunAgent={handleRunEnergyAgent}
                />
              )}

              {activeTab === 'monitoring' && (
                <MonitoringPage
                  hourlyData={hourlyData}
                  dailyData={dailyData}
                  selectedFloor={selectedFloor}
                  setSelectedFloor={setSelectedFloor}
                  floors={allFloors}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsPage
                  weeklyData={weeklyData}
                  distribution={distribution}
                  summary={summary}
                />
              )}

              {activeTab === 'anomalies' && (
                <AnomalyPage
                  anomalies={anomalies}
                  onRunAgent={handleRunEnergyAgent}
                />
              )}

              {activeTab === 'recommendations' && (
                <RecommendationsPage
                  recommendations={recommendations}
                  onRunAgent={handleRunEnergyAgent}
                />
              )}

              {/* MILESTONE 2 PAGES */}
              {activeTab === 'assets' && (
                <AssetMonitoringPage
                  kpis={maintenanceKPIs}
                  assets={maintenanceAssets}
                  facilities={facilities}
                  selectedFacility={selectedFacility}
                  onSelectAsset={handleSelectAsset}
                  onRefreshTelemetry={handleRefreshTelemetry}
                  isRefreshingTelemetry={isRefreshingTelemetry}
                  onOpenCreateSchedule={handleOpenCreateSchedule}
                  onRunMaintenanceAgent={handleRunMaintenanceAgent}
                />
              )}

              {activeTab === 'predictions' && (
                <PredictiveMaintenancePage
                  predictions={maintenancePredictions}
                  assets={maintenanceAssets}
                  onOpenCreateSchedule={handleOpenCreateSchedule}
                  onSelectAsset={handleSelectAsset}
                  onRunMaintenanceAgent={handleRunMaintenanceAgent}
                />
              )}

              {activeTab === 'maintenance-alerts' && (
                <MaintenanceAlertsPage
                  alerts={maintenanceAlerts}
                  onReloadAlerts={loadMaintenanceData}
                  onOpenCreateSchedule={handleOpenCreateSchedule}
                  onSelectAsset={handleSelectAsset}
                />
              )}

              {activeTab === 'maintenance-schedule' && (
                <MaintenanceSchedulePage
                  facilityId={selectedFacility === 'all' ? 'FAC-001' : selectedFacility}
                  onSelectAsset={handleSelectAsset}
                  onOpenCreateSchedule={() => handleOpenCreateSchedule()}
                />
              )}

              {/* SYSTEM PAGES */}
              {activeTab === 'data' && (
                <DataManagementPage
                  onDataReloaded={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  healthData={healthData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Interactive LangGraph Energy Agent Modal (M1) */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        agentResult={agentResult}
        isRunning={isAgentRunning}
      />

      {/* Interactive LangGraph Maintenance Agent Modal (M2) */}
      <MaintenanceAgentModal
        isOpen={isMaintAgentModalOpen}
        onClose={() => setIsMaintAgentModalOpen(false)}
        agentResult={maintAgentResult}
        isRunning={isMaintAgentRunning}
      />

      {/* Equipment Asset Detail & Diagnostic Modal (M2) */}
      <AssetDetailModal
        isOpen={isAssetDetailOpen}
        onClose={() => {
          setIsAssetDetailOpen(false);
          setSelectedAssetDetail(null);
        }}
        assetDetail={selectedAssetDetail}
        onOpenCreateSchedule={(assetId) => {
          setIsAssetDetailOpen(false);
          handleOpenCreateSchedule(assetId);
        }}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onResolveAlert={handleResolveAlert}
      />

      {/* Create Maintenance Work Order Modal (M2) */}
      <CreateScheduleModal
        isOpen={isCreateScheduleOpen}
        onClose={() => setIsCreateScheduleOpen(false)}
        preselectedAssetId={preselectedAssetId}
        assets={maintenanceAssets}
        onScheduleCreated={loadMaintenanceData}
      />
    </div>
  );
}
