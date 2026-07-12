import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { FiCheckCircle, FiXCircle, FiShield, FiActivity, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import StatCard from '../../components/cards/StatCard';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import { getValidationSummary } from '../../api/validationApi';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';

const COLORS = ['#2F6FED', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];

const STATUS_BADGE = {
  Passed: 'badge-success',
  Failed: 'badge-danger',
};

const Validation = () => {
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
        const { data } = await getValidationSummary(selectedId);
        setSummary(data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Validation checks failed for this dataset.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const columns = [
    { key: 'rule', label: 'Validation Rule', render: (row) => <span style={{ fontWeight: 600 }}>{row.rule}</span> },
    { key: 'column', label: 'Column' },
    { key: 'status', label: 'Status', render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status === 'Passed' ? <FiCheckCircle /> : <FiXCircle />} {row.status}</span> },
    { key: 'affectedRows', label: 'Affected Rows', render: (row) => <span className="numeric">{row.affectedRows.toLocaleString()}</span> },
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
          <p>Upload a CSV or XLSX file from the Upload page to run validation checks.</p>
        </div>
      );
    }
    if (loading || !summary) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Running validation checks..." size={40} /></div>;
    }
    if (error) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Couldn't validate this dataset</h2>
          <p>{error}</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid-4">
          <StatCard icon={<FiShield />} label="Total Checks" value={summary.totalChecks} accent="primary" />
          <StatCard icon={<FiCheckCircle />} label="Passed" value={summary.passed} accent="success" />
          <StatCard icon={<FiXCircle />} label="Failed" value={summary.failed} accent="danger" />
          <StatCard icon={<FiActivity />} label="Pass Rate" value={summary.totalChecks ? `${Math.round((summary.passed / summary.totalChecks) * 100)}%` : '—'} accent="primary" />
        </div>

        <div className="grid-2-1">
          <div className="card panel-card">
            <div className="panel-card-header">
              <div>
                <h3>Validation Details</h3>
                <span className="panel-subtitle">Result of each rule run against the dataset</span>
              </div>
            </div>
            <Table columns={columns} data={summary.details} emptyMessage="No validation rules applied to this dataset." />
          </div>

          <div className="card panel-card">
            <div className="panel-card-header">
              <div>
                <h3>Issue Breakdown</h3>
                <span className="panel-subtitle">Distribution of validation failures</span>
              </div>
            </div>
            {summary.breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={summary.breakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {summary.breakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  <Legend verticalAlign="bottom" height={50} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="panel-subtitle" style={{ padding: '20px 0' }}>No validation issues found — every check passed.</p>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Data Quality Validation</h1>
          <p className="page-subtitle">Rule-based checks across schema, ranges, formats, and freshness.</p>
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

export default Validation;
