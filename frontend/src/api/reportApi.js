// Real API calls against the FastAPI /dq-reports endpoints added in Phase 3.
// Replaces the old mock reportApi.js — nothing here is simulated.
import axiosInstance from './axiosInstance';

/** Maps the FastAPI DQReportOut shape onto what the existing UI expects. */
const normalizeReport = (raw) => ({
  id: raw.id,
  datasetId: raw.dataset_id,
  name: raw.name,
  format: raw.format,
  generatedAt: raw.generated_at,
});

export const getReports = () =>
  axiosInstance.get('/dq-reports').then((res) => ({ data: res.data.map(normalizeReport) }));

export const generateReport = ({ datasetId, name, format }) =>
  axiosInstance
    .post('/dq-reports', { dataset_id: Number(datasetId), name, format })
    .then((res) => ({ data: normalizeReport(res.data) }));

export const getReportDetail = (id) =>
  axiosInstance.get(`/dq-reports/${id}`).then((res) => ({ data: res.data }));

export const deleteReport = (id) =>
  axiosInstance.delete(`/dq-reports/${id}`).then((res) => ({ data: res.data }));

/** Triggers a real file download via the backend's streaming response (PDF reports only). */
export const downloadReport = async (id, filename) => {
  const res = await axiosInstance.get(`/dq-reports/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ? `${filename}.pdf` : `report_${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
