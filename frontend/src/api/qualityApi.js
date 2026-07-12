// Real API calls against the FastAPI /datasets/{id}/quality endpoint added
// in Phase 3. Replaces the old mock qualityApi.js — nothing here is simulated.
import axiosInstance from './axiosInstance';

export const getQualityScore = (datasetId) =>
  axiosInstance.get(`/datasets/${datasetId}/quality`).then((res) => ({ data: res.data }));
