// Real API calls against the FastAPI /datasets/{id}/profile endpoint added in
// Phase 2. Replaces the old mock profilingApi.js — nothing here is simulated.
import axiosInstance from './axiosInstance';

/** Maps the FastAPI ProfilingSummaryOut shape onto what the existing UI expects. */
const normalizeProfile = (raw) => ({
  datasetId: raw.dataset_id,
  datasetName: raw.dataset_name,
  rows: raw.rows,
  columns: raw.columns,
  missingValues: raw.missing_values,
  duplicateRecords: raw.duplicate_records,
  uniqueValues: raw.unique_values,
  memoryUsage: `${(raw.memory_usage_bytes / (1024 * 1024)).toFixed(2)} MB`,
  numericStats: raw.numeric_stats
    ? {
        column: raw.numeric_stats.column,
        mean: raw.numeric_stats.mean,
        median: raw.numeric_stats.median,
        mode: raw.numeric_stats.mode,
        stdDev: raw.numeric_stats.std_dev,
        min: raw.numeric_stats.min,
        max: raw.numeric_stats.max,
      }
    : null,
  columnBreakdown: raw.column_breakdown.map((c) => ({
    column: c.column,
    type: c.type,
    missing: c.missing,
    unique: c.unique,
  })),
});

export const getProfilingSummary = (datasetId) =>
  axiosInstance
    .get(`/datasets/${datasetId}/profile`)
    .then((res) => ({ data: normalizeProfile(res.data) }));
