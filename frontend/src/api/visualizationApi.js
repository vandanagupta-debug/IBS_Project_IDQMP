// Real API calls against the FastAPI /datasets/{id}/visualizations endpoint
// added in Phase 3.
import axiosInstance from './axiosInstance';

export const getVisualizations = (datasetId) =>
  axiosInstance.get(`/datasets/${datasetId}/visualizations`).then((res) => ({ data: res.data }));
