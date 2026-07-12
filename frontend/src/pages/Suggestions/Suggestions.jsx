import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiZap, FiTool, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { getRecommendations } from '../../api/insightsApi';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';
import './suggestions.css';

const SEVERITY_BADGE = {
  low: 'badge-info',
  medium: 'badge-warning',
  high: 'badge-danger',
};

const Suggestions = () => {
  const { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId } = useProcessedDatasets();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getRecommendations(selectedId);
        setSuggestions(data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Could not generate recommendations for this dataset.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const renderBody = () => {
    if (datasetsLoading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Loading datasets..." size={40} /></div>;
    }
    if (datasetsError) {
      return <div className="upload-error-state"><FiAlertTriangle /><p>{datasetsError}</p></div>;
    }
    if (datasets.length === 0) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiInbox /></div>
          <h2>No processed datasets yet</h2>
          <p>Upload a CSV or XLSX file from the Upload page to generate AI suggestions.</p>
        </div>
      );
    }
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Generating recommendations from your dataset..." size={40} /></div>;
    }
    if (error) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Couldn't generate suggestions</h2>
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="suggestions-grid">
        {suggestions.map((rec) => (
          <motion.div
            key={rec.id}
            className="card suggestion-card"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="suggestion-card-top">
              <span className={`badge ${SEVERITY_BADGE[rec.severity]}`}>{rec.severity} severity</span>
              <span className="numeric suggestion-confidence">{rec.confidence}% confidence</span>
            </div>
            <p className="suggestion-text">{rec.text}</p>
            <div className="suggestion-confidence-track">
              <div className="suggestion-confidence-fill" style={{ width: `${rec.confidence}%` }} />
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiZap style={{ verticalAlign: 'middle', color: 'var(--color-primary)' }} /> AI Suggestion Engine</h1>
          <p className="page-subtitle">Automated recommendations to raise data quality, ranked by confidence.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/cleaning" className="btn btn-primary"><FiTool /> Run Cleaning Pipeline</Link>
          {datasets.length > 0 && (
            <select className="dataset-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {renderBody()}
    </div>
  );
};

export default Suggestions;
