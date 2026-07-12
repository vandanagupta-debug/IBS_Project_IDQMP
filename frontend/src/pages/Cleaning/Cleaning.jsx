import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTool, FiDownload, FiPlay, FiArrowRight, FiCheckCircle, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { runCleaning } from '../../api/cleaningApi';
import { downloadDataset } from '../../api/datasetsApi';
import { useToast } from '../../contexts/ToastContext';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';
import './cleaning.css';

const Cleaning = () => {
  const { showToast } = useToast();
  const { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId } = useProcessedDatasets();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const selectedName = datasets.find((d) => String(d.id) === String(selectedId))?.name;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await runCleaning(selectedId);
      setResult(data);
      showToast('Automated cleaning completed successfully.', 'success');
    } catch (err) {
      setError(err?.response?.data?.detail || 'The cleaning pipeline failed for this dataset.');
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = () => {
    if (!result?.cleanedDatasetId) return;
    downloadDataset(result.cleanedDatasetId, `${selectedName || 'dataset'}_cleaned.csv`);
    showToast('Downloading cleaned dataset...', 'info');
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiTool style={{ verticalAlign: 'middle' }} /> Automated Data Cleaning</h1>
          <p className="page-subtitle">
            {selectedName ? `Run the AI cleaning pipeline against ${selectedName}` : 'Run the AI cleaning pipeline against your uploaded dataset'}
          </p>
        </div>
        <div className="page-header-actions">
          {result && (
            <button className="btn btn-ghost" onClick={handleDownload}>
              <FiDownload /> Download Clean Dataset
            </button>
          )}
          {datasets.length > 0 && (
            <select className="dataset-select" value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}>
              {datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={handleRun} disabled={running || !selectedId}>
            <FiPlay /> {running ? 'Cleaning in progress...' : result ? 'Run Again' : 'Run Cleaning Pipeline'}
          </button>
        </div>
      </div>

      {datasetsLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Loading datasets..." size={40} /></div>
      )}

      {datasetsError && <div className="upload-error-state"><FiAlertTriangle /><p>{datasetsError}</p></div>}

      {!datasetsLoading && !datasetsError && datasets.length === 0 && (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiInbox /></div>
          <h2>No processed datasets yet</h2>
          <p>Upload a CSV or XLSX file from the Upload page to run the cleaning pipeline.</p>
        </div>
      )}

      {running && (
        <div className="card panel-card" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader label="Applying cleaning operations..." size={40} />
        </div>
      )}

      {error && !running && (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Cleaning failed</h2>
          <p>{error}</p>
        </div>
      )}

      <AnimatePresence>
        {!running && result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cleaning-results">
            <div className="grid-4">
              {result.operations.map((op) => (
                <div key={op.name} className="card cleaning-op-card">
                  <FiCheckCircle color="var(--color-success)" size={20} />
                  <div>
                    <p className="cleaning-op-name">{op.name}</p>
                    <span className="numeric cleaning-op-count">{op.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card panel-card">
              <div className="panel-card-header">
                <div>
                  <h3>Before vs After</h3>
                  <span className="panel-subtitle">Impact of the cleaning pipeline on dataset health</span>
                </div>
              </div>
              <div className="before-after-row">
                <div className="before-after-col">
                  <span className="before-after-label">Before</span>
                  <span className="numeric before-after-rows">{result.before.rows.toLocaleString()} rows</span>
                  <span className="badge badge-warning before-after-score">{result.before.qualityScore}% quality</span>
                </div>
                <FiArrowRight className="before-after-arrow" />
                <div className="before-after-col">
                  <span className="before-after-label">After</span>
                  <span className="numeric before-after-rows">{result.after.rows.toLocaleString()} rows</span>
                  <span className="badge badge-success before-after-score">{result.after.qualityScore}% quality</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!running && !result && !error && !datasetsLoading && datasets.length > 0 && (
        <div className="card panel-card cleaning-empty">
          <FiTool size={32} color="var(--color-primary)" />
          <h3>No cleaning run yet</h3>
          <p>Run the pipeline to automatically handle missing values, duplicates, type mismatches, and outliers.</p>
        </div>
      )}
    </div>
  );
};

export default Cleaning;
