// Real API calls against the FastAPI /datasets/{id}/clean endpoint added in
// Phase 3. Replaces the old mock cleaningApi.js — nothing here is simulated.
import axiosInstance from './axiosInstance';

export const runCleaning = (datasetId) =>
  axiosInstance.post(`/datasets/${datasetId}/clean`).then((res) => ({ data: res.data }));
