import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { getQualityScore } from '../../api/qualityApi';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';
import './quality.css';

const CIRCUMFERENCE = 2 * Math.PI * 90;

const scoreColor = (score) => {
  if (score >= 90) return '#14B8A6';
  if (score >= 75) return '#2F6FED';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
};

const healthLabel = (score) => {
  if (score >= 90) return { text: 'Healthy', badge: 'badge-success' };
  if (score >= 75) return { text: 'Good', badge: 'badge-info' };
  if (score >= 60) return { text: 'Needs attention', badge: 'badge-warning' };
  return { text: 'At risk', badge: 'badge-danger' };
};

const QualityScore = () => {
  const { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId } = useProcessedDatasets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const { data } = await getQualityScore(selectedId);
        setData(data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Could not calculate a quality score for this dataset.');
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
          <p>Upload a CSV or XLSX file from the Upload page to calculate a quality score.</p>
        </div>
      );
    }
    if (loading || !data) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Calculating composite quality score..." size={40} /></div>;
    }
    if (error) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Couldn't score this dataset</h2>
          <p>{error}</p>
        </div>
      );
    }

    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * data.overall) / 100;
    const health = healthLabel(data.overall);

    return (
      <div className="grid-2-1">
        <div className="card panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Dimension Breakdown</h3>
              <span className="panel-subtitle">Each dimension contributes to the overall score</span>
            </div>
          </div>
          <div className="dim-list">
            {data.dimensions.map((dim, i) => (
              <div key={dim.name} className="dim-row">
                <div className="dim-row-top">
                  <span className="dim-name">{dim.name}</span>
                  <span className="numeric dim-score">{dim.score}%</span>
                </div>
                <div className="dim-track">
                  <motion.div
                    className="dim-fill"
                    style={{ background: scoreColor(dim.score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.score}%` }}
                    transition={{ duration: 1, delay: i * 0.08, ease: 'easeOut' }}
                  />
                </div>
                <p className="dim-desc">{dim.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card panel-card quality-gauge-panel">
          <div className="panel-card-header">
            <div>
              <h3>Overall Score</h3>
              <span className="panel-subtitle">Weighted composite</span>
            </div>
          </div>
          <div className="big-gauge-wrap">
            <svg viewBox="0 0 200 200" className="big-gauge">
              <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-border)" strokeWidth="16" />
              <motion.circle
                cx="100" cy="100" r="90" fill="none" stroke="url(#bigGaugeGrad)" strokeWidth="16"
                strokeLinecap="round" strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                transform="rotate(-90 100 100)"
              />
              <defs>
                <linearGradient id="bigGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2F6FED" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="big-gauge-center">
              <span className="numeric big-gauge-value">{data.overall}</span>
              <span className="big-gauge-suffix">/ 100</span>
              <span className={`badge ${health.badge}`} style={{ marginTop: 10 }}>{health.text}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiTarget style={{ verticalAlign: 'middle' }} /> Quality Score</h1>
          <p className="page-subtitle">Composite score across six weighted data quality dimensions.</p>
        </div>
        {datasets.length > 0 && (
          <select className="dataset-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {renderBody()}
    </div>
  );
};

export default QualityScore;
