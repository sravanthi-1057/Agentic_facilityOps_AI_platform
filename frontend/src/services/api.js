import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // System Health & Info
  getHealth: async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  // Facilities & Meters
  getFacilities: async () => {
    const res = await axios.get(`${API_BASE}/facilities`);
    return res.data;
  },

  // Energy Summary KPIs
  getEnergySummary: async (facilityId = 'all', days = 30) => {
    const res = await axios.get(`${API_BASE}/energy/summary`, {
      params: { facility_id: facilityId, days }
    });
    return res.data;
  },

  // Timeseries Consumption
  getEnergyConsumption: async (facilityId = 'all', floor = 'all', interval = 'hourly', days = 30) => {
    const res = await axios.get(`${API_BASE}/energy/consumption`, {
      params: { facility_id: facilityId, floor, interval, days }
    });
    return res.data;
  },

  // Subsystem & Floor Distribution
  getEnergyDistribution: async (facilityId = 'all', days = 30) => {
    const res = await axios.get(`${API_BASE}/energy/distribution`, {
      params: { facility_id: facilityId, days }
    });
    return res.data;
  },

  // Detected Anomalies
  getAnomalies: async (facilityId = 'all', severity = 'all', limit = 50) => {
    const res = await axios.get(`${API_BASE}/energy/anomalies`, {
      params: { facility_id: facilityId, severity, limit }
    });
    return res.data;
  },

  // Recommendations
  getRecommendations: async (priority = 'all', limit = 20) => {
    const res = await axios.get(`${API_BASE}/energy/recommendations`, {
      params: { priority, limit }
    });
    return res.data;
  },

  // Baseline Forecast
  getForecast: async (facilityId = 'all', daysAhead = 7) => {
    const res = await axios.get(`${API_BASE}/energy/forecast`, {
      params: { facility_id: facilityId, days_ahead: daysAhead }
    });
    return res.data;
  },

  // Upload CSV Telemetry
  uploadCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/energy/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Seed / Re-simulate IoT Data
  seedData: async (days = 35) => {
    const res = await axios.post(`${API_BASE}/energy/seed`, null, {
      params: { days }
    });
    return res.data;
  },

  // Execute LangGraph Energy Agent
  triggerAgent: async (facilityId = 'all', lookbackDays = 14) => {
    const res = await axios.post(`${API_BASE}/energy/analyze`, {
      facility_id: facilityId,
      lookback_days: lookbackDays
    });
    return res.data;
  },

  // Agent Execution Logs
  getAgentLogs: async (limit = 20) => {
    const res = await axios.get(`${API_BASE}/energy/agent-logs`, {
      params: { limit }
    });
    return res.data;
  },

  // ==========================================
  // MILESTONE 2: PREDICTIVE MAINTENANCE APIS
  // ==========================================

  // Maintenance Fleet KPIs
  getMaintenanceKpis: async (facilityId = 'all') => {
    const res = await axios.get(`${API_BASE}/maintenance/kpis`, {
      params: { facility_id: facilityId }
    });
    return res.data;
  },

  // Assets List with Filters
  getAssets: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/maintenance/assets`, { params });
    return res.data;
  },

  // Asset Full Detail
  getAssetDetail: async (assetId) => {
    const res = await axios.get(`${API_BASE}/maintenance/assets/${assetId}`);
    return res.data;
  },

  // Asset Sensor Readings Time-Series
  getAssetReadings: async (assetId, limit = 50) => {
    const res = await axios.get(`${API_BASE}/maintenance/assets/${assetId}/readings`, {
      params: { limit }
    });
    return res.data;
  },

  // Predictive Maintenance Predictions
  getMaintenancePredictions: async (facilityId = 'all', riskLevel = 'all', limit = 50) => {
    const res = await axios.get(`${API_BASE}/maintenance/predictions`, {
      params: { facility_id: facilityId, risk_level: riskLevel, limit }
    });
    return res.data;
  },

  // Maintenance Alerts
  getMaintenanceAlerts: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/maintenance/alerts`, { params });
    return res.data;
  },

  // Acknowledge Alert
  acknowledgeAlert: async (alertId) => {
    const res = await axios.post(`${API_BASE}/maintenance/alerts/${alertId}/acknowledge`);
    return res.data;
  },

  // Resolve Alert
  resolveAlert: async (alertId) => {
    const res = await axios.post(`${API_BASE}/maintenance/alerts/${alertId}/resolve`);
    return res.data;
  },

  // Maintenance Work Orders / Schedules
  getMaintenanceSchedules: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/maintenance/schedules`, { params });
    return res.data;
  },

  // Create Work Order
  createMaintenanceSchedule: async (payload) => {
    const res = await axios.post(`${API_BASE}/maintenance/schedules`, payload);
    return res.data;
  },

  // Update Work Order
  updateMaintenanceSchedule: async (scheduleId, payload) => {
    const res = await axios.put(`${API_BASE}/maintenance/schedules/${scheduleId}`, payload);
    return res.data;
  },

  // Complete Work Order
  completeMaintenanceSchedule: async (scheduleId, notes = '') => {
    const res = await axios.post(`${API_BASE}/maintenance/schedules/${scheduleId}/complete`, { notes });
    return res.data;
  },

  // Refresh Sensor Telemetry
  refreshAssetTelemetry: async () => {
    const res = await axios.post(`${API_BASE}/maintenance/telemetry/refresh`);
    return res.data;
  },

  // Execute LangGraph Maintenance Agent
  triggerMaintenanceAgent: async (facilityId = 'all') => {
    const res = await axios.post(`${API_BASE}/maintenance/analyze`, null, {
      params: { facility_id: facilityId }
    });
    return res.data;
  },

  // Maintenance Agent Execution Logs
  getMaintenanceAgentLogs: async (limit = 20) => {
    const res = await axios.get(`${API_BASE}/maintenance/agent-logs`, {
      params: { limit }
    });
    return res.data;
  }
};
