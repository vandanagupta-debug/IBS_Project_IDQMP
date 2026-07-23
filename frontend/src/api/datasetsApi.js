// Real API calls against the FastAPI /datasets endpoints added in Phase 1.
// Replaces the old mock datasetApi.js — nothing here is simulated.
import axiosInstance from './axiosInstance';

const formatBytes = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_LABEL = {
  processing: 'Processing',
  processed: 'Processed',
  failed: 'Failed',
};

/** Maps the FastAPI DatasetOut shape onto what the existing UI expects. */
const normalizeDataset = (raw) => ({
  id: raw.id,
  name: raw.original_filename,
  size: formatBytes(raw.file_size_bytes),
  rows: raw.rows ?? 0,
  columns: raw.columns ?? 0,
  status: STATUS_LABEL[raw.status] || raw.status,
  errorMessage: raw.error_message,
  uploadedAt: raw.uploaded_at,
});

export const getDatasets = ({ search = '', page = 1, pageSize = 10 } = {}) =>
  axiosInstance.get('/datasets', { params: { search: search || undefined, page, page_size: pageSize } })
    .then((res) => ({
      data: {
        items: res.data.items.map(normalizeDataset),
        total: res.data.total,
        page: res.data.page,
        pageSize: res.data.page_size,
      },
    }));

export const uploadDataset = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return axiosInstance
    .post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    })
    .then((res) => ({ data: normalizeDataset(res.data) }));
};

export const getDatasetDetails = (id) =>
  axiosInstance.get(`/datasets/${id}`).then((res) => ({ data: normalizeDataset(res.data) }));

export const getDatasetSummary = () =>
  axiosInstance.get('/datasets/summary').then((res) => ({ data: res.data }));

export const deleteDataset = (id) =>
  axiosInstance.delete(`/datasets/${id}`).then((res) => ({ data: res.data }));

/** Triggers a real file download via the backend's streaming response. */
export const downloadDataset = async (id, filename) => {
  const res = await axiosInstance.get(`/datasets/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `dataset_${id}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
