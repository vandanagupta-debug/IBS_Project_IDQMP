import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  FiGrid, FiColumns, FiAlertCircle, FiCopy, FiHash, FiDatabase, FiInbox, FiAlertTriangle,
} from 'react-icons/fi';
import StatCard from '../../components/cards/StatCard';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import { getDatasets } from '../../api/datasetsApi';
import { getProfilingSummary } from '../../api/profilingApi';
import '../../styles/page-layout.css';
import './profiling.css';

const TYPE_BADGE = {
  string: 'badge-info',
  integer: 'badge-success',
  float: 'badge-success',
  datetime: 'badge-warning',
  category: 'badge-info',
  boolean: 'badge-info',
};

const EmptyPanel = ({ icon, title, subtitle }) => (
  <div className="profiling-empty">
    <div className="profiling-empty-icon">{icon}</div>
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
);

const Profiling = () => {
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load the dataset list once so the user can pick which one to profile.
  useEffect(() => {
    (async () => {
      setDatasetsLoading(true);
      try {
        const { data } = await getDatasets({ page: 1, pageSize: 100 });
        const processed = data.items.filter((d) => d.status === 'Processed');
        setDatasets(processed);
        if (processed.length > 0) setSelectedId(String(processed[0].id));
      } catch (err) {
        setError('Could not load your datasets. Please try again.');
      } finally {
        setDatasetsLoading(false);
      }
    })();
  }, []);

  // Re-profile whenever the selected dataset changes.
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      setError(null);
      setSummary(null);
      try {
        const { data } = await getProfilingSummary(selectedId);
        setSummary(data);
      } catch (err) {
        const message = err?.response?.data?.detail || 'This dataset could not be profiled.';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const renderBody = () => {
    if (datasetsLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Loader label="Loading datasets..." size={40} />
        </div>
      );
    }

    if (datasets.length === 0) {
      return (
        <EmptyPanel
          icon={<FiInbox />}
          title="No processed datasets yet"
          subtitle="Upload a CSV or XLSX file from the Upload page. Once it finishes processing, it'll show up here for profiling."
        />
      );
    }

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Loader label="Profiling dataset..." size={40} />
        </div>
      );
    }

    if (error) {
      return (
        <EmptyPanel
          icon={<FiAlertTriangle />}
          title="Couldn't profile this dataset"
          subtitle={error}
        />
      );
    }

    if (!summary) return null;

    const columnMissingData = summary.columnBreakdown.map((c) => ({ column: c.column, missing: c.missing }));

    const columns = [
      { key: 'column', label: 'Column', render: (row) => <span style={{ fontWeight: 600 }}>{row.column}</span> },
      { key: 'type', label: 'Type', render: (row) => <span className={`badge ${TYPE_BADGE[row.type] || 'badge-info'}`}>{row.type}</span> },
      { key: 'missing', label: 'Missing Values', render: (row) => <span className="numeric">{row.missing.toLocaleString()}</span> },
      { key: 'unique', label: 'Unique Values', render: (row) => <span className="numeric">{row.unique.toLocaleString()}</span> },
    ];

    return (
      <>
        <div className="grid-4">
          <StatCard icon={<FiGrid />} label="Rows" value={summary.rows.toLocaleString()} accent="primary" />
          <StatCard icon={<FiColumns />} label="Columns" value={summary.columns} accent="primary" />
          <StatCard icon={<FiAlertCircle />} label="Missing Values" value={summary.missingValues.toLocaleString()} accent="warning" />
          <StatCard icon={<FiCopy />} label="Duplicate Records" value={summary.duplicateRecords.toLocaleString()} accent="danger" />
        </div>

        <div className="grid-2-1">
          <div className="card panel-card">
            <div className="panel-card-header">
              <div>
                <h3>Missing Values by Column</h3>
                <span className="panel-subtitle">Count of nulls detected per column</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={columnMissingData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="column" stroke="var(--color-gray-light)" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                <Bar dataKey="missing" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card panel-card">
            <div className="panel-card-header">
              <div>
                <h3><FiHash style={{ verticalAlign: 'middle' }} /> Numeric Summary</h3>
                <span className="panel-subtitle">{summary.numericStats ? summary.numericStats.column : 'No numeric columns found'}</span>
              </div>
            </div>
            {summary.numericStats ? (
              <div className="stat-summary-list">
                {Object.entries(summary.numericStats)
                  .filter(([key]) => key !== 'column')
                  .map(([key, value]) => (
                    <div key={key} className="stat-summary-row">
                      <span className="stat-summary-key">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span>
                      <span className="numeric stat-summary-value">{value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="panel-subtitle" style={{ padding: '20px 0' }}>This dataset has no numeric columns to summarize.</p>
            )}
          </div>
        </div>

        <div className="card panel-card">
          <div className="panel-card-header">
            <div>
              <h3><FiDatabase style={{ verticalAlign: 'middle' }} /> Column Breakdown</h3>
              <span className="panel-subtitle">Memory usage: {summary.memoryUsage} · Unique values: {summary.uniqueValues.toLocaleString()}</span>
            </div>
          </div>
          <Table columns={columns} data={summary.columnBreakdown} />
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Data Profiling</h1>
          <p className="page-subtitle">Structural and statistical profile of your uploaded datasets</p>
        </div>
        {datasets.length > 0 && (
          <select
            className="dataset-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {renderBody()}
    </div>
  );
};

export default Profiling;
