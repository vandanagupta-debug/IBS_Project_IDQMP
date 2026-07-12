import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiFileText, FiDownload, FiTrash2, FiEye, FiPlus, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { getReports, generateReport, deleteReport, downloadReport, getReportDetail } from '../../api/reportApi';
import { useToast } from '../../contexts/ToastContext';
import { useProcessedDatasets } from '../../hooks/useProcessedDatasets';
import '../../styles/page-layout.css';

const FORMAT_BADGE = {
  PDF: 'badge-danger',
  Excel: 'badge-success',
  CSV: 'badge-info',
};

const Reports = () => {
  const { showToast } = useToast();
  const { datasets, datasetsLoading, datasetsError, selectedId, setSelectedId } = useProcessedDatasets();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', format: 'PDF' },
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await getReports();
      setReports(data);
    } catch {
      showToast('Could not load report history.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const onGenerate = async (formData) => {
    try {
      await generateReport({ datasetId: selectedId, name: formData.name, format: formData.format });
      showToast('Report generated successfully.', 'success');
      reset({ name: '', format: 'PDF' });
      setModalOpen(false);
      fetchReports();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to generate report. Please try again.', 'danger');
    }
  };

  const handleDelete = async (id) => {
    await deleteReport(id);
    showToast('Report deleted.', 'info');
    setConfirmDeleteId(null);
    fetchReports();
  };

  const handlePreview = async (row) => {
    setPreviewLoading(true);
    setPreviewReport({ name: row.name });
    try {
      const { data } = await getReportDetail(row.id);
      setPreviewReport(data);
    } catch {
      showToast('Could not load report preview.', 'danger');
      setPreviewReport(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = (row) => {
    if (row.format !== 'PDF') {
      showToast('Only PDF reports currently support direct download.', 'info');
      return;
    }
    downloadReport(row.id, row.name);
  };

  const columns = [
    { key: 'name', label: 'Report Name', render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span> },
    { key: 'format', label: 'Format', render: (row) => <span className={`badge ${FORMAT_BADGE[row.format]}`}>{row.format}</span> },
    { key: 'generatedAt', label: 'Generated', render: (row) => new Date(row.generatedAt).toLocaleString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button className="table-action-btn" onClick={() => handlePreview(row)} title="Preview"><FiEye /></button>
          <button className="table-action-btn" onClick={() => handleDownload(row)} title="Download"><FiDownload /></button>
          <button className="table-action-btn danger" onClick={() => setConfirmDeleteId(row.id)} title="Delete"><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiFileText style={{ verticalAlign: 'middle' }} /> Reports</h1>
          <p className="page-subtitle">Generate and manage quality, validation, and anomaly reports for any uploaded dataset.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={datasets.length === 0}>
          <FiPlus /> Generate Report
        </button>
      </div>

      {datasetsError && <div className="upload-error-state"><FiAlertTriangle /><p>{datasetsError}</p></div>}

      {!datasetsLoading && !datasetsError && datasets.length === 0 && (
        <div className="profiling-empty">
          <div className="profiling-empty-icon"><FiInbox /></div>
          <h2>No processed datasets yet</h2>
          <p>Upload a CSV or XLSX file from the Upload page before generating a report.</p>
        </div>
      )}

      <div className="card panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Report History</h3>
            <span className="panel-subtitle">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</span>
          </div>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader label="Loading reports..." />
          </div>
        ) : (
          <Table columns={columns} data={reports} emptyMessage="No reports generated yet." />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate New Report"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit(onGenerate)} disabled={isSubmitting || !selectedId}>
              {isSubmitting ? 'Generating...' : 'Generate'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onGenerate)}>
          <div className="form-field">
            <label htmlFor="dataset">Dataset</label>
            <div className="form-input-wrap">
              <select id="dataset" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14.5, color: 'var(--color-gray-dark)' }}>
                {datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="name">Report Name</label>
            <div className={`form-input-wrap ${errors.name ? 'has-error' : ''}`}>
              <input id="name" placeholder="e.g. Weekly Quality Summary" {...register('name', { required: 'Report name is required.' })} />
            </div>
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="format">Export Format</label>
            <div className="form-input-wrap">
              <select id="format" {...register('format')} style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14.5, color: 'var(--color-gray-dark)' }}>
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete report?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger-outline" onClick={() => handleDelete(confirmDeleteId)}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--color-gray-dark)' }}>This report will be permanently removed from your history.</p>
      </Modal>

      <Modal
        isOpen={!!previewReport}
        onClose={() => setPreviewReport(null)}
        title={previewReport?.name ? `Preview — ${previewReport.name}` : 'Preview'}
        footer={<button className="btn btn-ghost" onClick={() => setPreviewReport(null)}>Close</button>}
      >
        {previewLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader label="Loading report..." /></div>
        ) : previewReport?.payload ? (
          <div style={{ fontSize: 14, color: 'var(--color-gray-dark)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p><strong>Dataset:</strong> {previewReport.payload.dataset.name}</p>
            <p><strong>Overall Quality Score:</strong> {previewReport.payload.quality.overall} / 100</p>
            <p><strong>Validation:</strong> {previewReport.payload.validation.passed}/{previewReport.payload.validation.totalChecks} checks passed</p>
            <p><strong>Anomalies:</strong> {previewReport.payload.anomalies.totalOutliers} flagged rows</p>
            <p><strong>Top Recommendations:</strong></p>
            <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {previewReport.payload.recommendations.slice(0, 5).map((r) => <li key={r.id}>{r.text}</li>)}
            </ul>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--color-gray-dark)' }}>No preview available for this report.</p>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
