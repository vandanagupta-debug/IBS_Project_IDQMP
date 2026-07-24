import { useEffect, useState } from 'react';
import { getDatasets } from '../api/datasetsApi';

/**
 * Loads the list of processed datasets once and tracks which one is
 * currently selected. Every analysis page (Profiling, Quality, Anomaly,
 * Validation, Visualization, Suggestions, Cleaning) uses this same hook so
 * there is a single, consistent way of choosing "the uploaded dataset" that
 * drives that page's results.
 */
export function useProcessedDatasets() {
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState(null);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    (async () => {
      setDatasetsLoading(true);
      setDatasetsError(null);
      try {
        const { data } = await getDatasets({ page: 1, pageSize: 100 });
        const processed = data.items.filter((d) => d.status === 'Processed');
        setDatasets(processed);
        if (processed.length > 0) setSelectedId(String(processed[0].id));
      } catch (_err) {
        setDatasetsError('Could not load your datasets. Please try again.');
      } finally {
        setDatasetsLoading(false);
      }
    })();
  }, []);

  return { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId };
}