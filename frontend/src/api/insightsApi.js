// Real API calls against the FastAPI /datasets/{id}/insights and
// /datasets/{id}/recommendations endpoints added in Phase 3.
import axiosInstance from './axiosInstance';

export const getInsights = (datasetId) =>
  axiosInstance.get(`/datasets/${datasetId}/insights`).then((res) => ({ data: res.data }));

export const getRecommendations = (datasetId) =>
  axiosInstance.get(`/datasets/${datasetId}/recommendations`).then((res) => ({ data: res.data }));
