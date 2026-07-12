import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { FiCpu, FiTarget as FiTargetIcon, FiCircle, FiHash, FiAlertTriangle, FiInbox } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import { getAnomalySummary } from '../../api/anomalyApi';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';
import './anomaly.css';

const SEVERITY_BADGE = {
  low: 'badge-info',
  medium: 'badge-warning',
  high: 'badge-danger',
};

const ALGO_ICONS = [<FiCpu />, <FiTargetIcon />, <FiCircle />, <FiHash />];

const Anomaly = () => {
  const { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId } = useProcessedDatasets();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      setError(null);
      setSummary(null);
      try {
        const { data } = await getAnomalySummary(selectedId);
        setSummary(data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Anomaly detection failed for this dataset.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const columns = [
    { key: 'id', label: 'Row ID', render: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.id}</span> },
    { key: 'column', label: 'Column' },
    { key: 'value', label: 'Value', render: (row) => <span className="numeric">{String(row.value)}</span> },
    { key: 'expectedRange', label: 'Expected Range' },
    { key: 'method', label: 'Detected By' },
    { key: 'severity', label: 'Severity', render: (row) => <span className={`badge ${SEVERITY_BADGE[row.severity]}`}>{row.severity}</span> },
  ];

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
          <p>Upload a CSV or XLSX file from the Upload page to run anomaly detection.</p>
        </div>
      );
    }
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Running anomaly detection models..." size={40} /></div>;
    }
    if (error) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Couldn't run anomaly detection</h2>
          <p>{error}</p>
        </div>
      );
    }
    if (!summary) return null;

    if (summary.message) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Anomaly detection unavailable</h2>
          <p>{summary.message}</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid-3">
          {summary.algorithms.map((algo, i) => (
            <div key={algo.name} className="card algo-card">
              <div className="algo-card-icon">{ALGO_ICONS[i % ALGO_ICONS.length]}</div>
              <div style={{ flex: 1 }}>
                <h3>{algo.name}</h3>
                <p className="algo-card-desc">{algo.description}</p>
                <div className="algo-card-count numeric">{algo.outliers}<span> outliers found</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="card panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Outlier Distribution</h3>
              <span className="panel-subtitle">Red points indicate flagged anomalies across two dataset columns</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" dataKey="x" name="Feature A" stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="y" name="Feature B" stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
              <Scatter
                data={summary.scatter}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  return <circle cx={cx} cy={cy} r={payload.outlier ? 6 : 3.5} fill={payload.outlier ? '#EF4444' : '#2F6FED'} opacity={payload.outlier ? 0.9 : 0.45} />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="card panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Flagged Rows</h3>
              <span className="panel-subtitle">Individual records identified as abnormal</span>
            </div>
          </div>
          <Table columns={columns} data={summary.outlierRows} emptyMessage="No anomalies detected in this dataset." />
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>AI Anomaly Detection</h1>
          <p className="page-subtitle">Ensemble of unsupervised models flagging statistically unusual records.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {summary && !summary.message && (
            <span className="badge badge-danger"><FiAlertTriangle /> {summary.totalOutliers} total outliers</span>
          )}
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

export default Anomaly;
