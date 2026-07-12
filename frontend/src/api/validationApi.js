// Real API calls against the FastAPI /datasets/{id}/validation endpoint
// added in Phase 3. Replaces the old mock validationApi.js — nothing here is
// simulated.
import axiosInstance from './axiosInstance';

export const getValidationSummary = (datasetId) =>
  axiosInstance.get(`/datasets/${datasetId}/validation`).then((res) => ({ data: res.data }));
