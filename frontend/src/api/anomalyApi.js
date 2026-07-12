// Real API calls against the FastAPI /datasets/{id}/anomalies endpoint added
// in Phase 3. Replaces the old mock anomalyApi.js — nothing here is simulated.
import axiosInstance from './axiosInstance';

export const getAnomalySummary = (datasetId) =>
  axiosInstance.get(`/datasets/${datasetId}/anomalies`).then((res) => ({ data: res.data }));
