import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import { FiPieChart, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { getVisualizations } from '../../api/visualizationApi';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';

const COLORS = ['#2F6FED', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];

const heatColor = (v) => {
  // -1..1 correlation -> blue (negative) to teal (positive), white near 0
  const intensity = Math.min(1, Math.abs(v));
  return v >= 0
    ? `rgba(47, 111, 237, ${0.15 + intensity * 0.7})`
    : `rgba(239, 68, 68, ${0.15 + intensity * 0.7})`;
};

const CorrelationHeatmap = ({ heatmap }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
      <thead>
        <tr>
          <th></th>
          {heatmap.columns.map((c) => (
            <th key={c} style={{ padding: 6, fontWeight: 600, color: 'var(--color-gray)' }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {heatmap.matrix.map((row, i) => (
          <tr key={heatmap.columns[i]}>
            <td style={{ padding: 6, fontWeight: 600, color: 'var(--color-gray)' }}>{heatmap.columns[i]}</td>
            {row.map((v, j) => (
              <td key={j} style={{ padding: 8, textAlign: 'center', background: heatColor(v), borderRadius: 4 }} className="numeric">
                {v.toFixed(2)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Visualization = () => {
  const { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId } = useProcessedDatasets();
  const [viz, setViz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      setError(null);
      setViz(null);
      try {
        const { data } = await getVisualizations(selectedId);
        setViz(data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Could not build visualizations for this dataset.');
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
          <p>Upload a CSV or XLSX file from the Upload page to generate visualizations.</p>
        </div>
      );
    }
    if (loading || !viz) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader label="Building charts from your dataset..." size={40} /></div>;
    }
    if (error) {
      return (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiAlertTriangle /></div>
          <h2>Couldn't visualize this dataset</h2>
          <p>{error}</p>
        </div>
      );
    }

    const dtypePie = viz.dtypeDistribution.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }));
    const validationPie = viz.validationBreakdown.map((d, i) => ({ ...d, fill: COLORS[(i + 2) % COLORS.length] }));

    return (
      <>
        <div className="grid-2">
          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Quality Score Gauge</h3><span className="panel-subtitle">Composite score for this dataset</span></div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: 'Score', value: viz.gaugeScore, fill: '#2F6FED' }]} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={20} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Data Type Distribution</h3><span className="panel-subtitle">Column types detected in this dataset</span></div>
            </div>
            {dtypePie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dtypePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {dtypePie.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="panel-subtitle">No columns to summarize.</p>}
          </div>
        </div>

        <div className="grid-2">
          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Missing Values by Column</h3><span className="panel-subtitle">Columns with the most missing data</span></div>
            </div>
            {viz.missingByColumn.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={viz.missingByColumn} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="column" stroke="var(--color-gray-light)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  <Bar dataKey="missing" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="panel-subtitle">No missing values in this dataset.</p>}
          </div>

          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Validation Issue Breakdown</h3><span className="panel-subtitle">Failed checks by category</span></div>
            </div>
            {validationPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={validationPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {validationPie.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="panel-subtitle">No validation issues found.</p>}
          </div>
        </div>

        <div className="grid-2">
          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Outlier Scatter Plot</h3><span className="panel-subtitle">Flagged vs. normal points across two numeric columns</span></div>
            </div>
            {viz.scatterOutliers.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" dataKey="x" stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="y" stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  <Scatter
                    data={viz.scatterOutliers}
                    shape={(props) => {
                      const { cx, cy, payload } = props;
                      return <circle cx={cx} cy={cy} r={payload.outlier ? 6 : 3.5} fill={payload.outlier ? '#EF4444' : '#2F6FED'} opacity={payload.outlier ? 0.9 : 0.45} />;
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : <p className="panel-subtitle">No numeric columns available for a scatter plot.</p>}
          </div>

          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Column Completeness</h3><span className="panel-subtitle">Percent non-missing per column</span></div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={viz.columnCompleteness} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="column" stroke="var(--color-gray-light)" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                <Bar dataKey="completeness" fill="#14B8A6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {viz.categoryFrequency && (
          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Category Frequency — {viz.categoryFrequency.column}</h3><span className="panel-subtitle">Most frequent values in this column</span></div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={viz.categoryFrequency.data} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-gray-light)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="var(--color-gray-light)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viz.correlationHeatmap && (
          <div className="card panel-card">
            <div className="panel-card-header">
              <div><h3>Correlation Heatmap</h3><span className="panel-subtitle">Pearson correlation between numeric columns</span></div>
            </div>
            <CorrelationHeatmap heatmap={viz.correlationHeatmap} />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiPieChart style={{ verticalAlign: 'middle' }} /> Visualizations</h1>
          <p className="page-subtitle">Charts auto-selected from your uploaded dataset's own column types.</p>
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

export default Visualization;
