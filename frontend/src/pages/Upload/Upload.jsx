import { useCallback, useEffect, useState } from 'react';
import { FiDownload, FiTrash2, FiEye, FiUploadCloud, FiAlertTriangle } from 'react-icons/fi';
import FileUploader from '../../components/common/FileUploader';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { getDatasets, uploadDataset, deleteDataset, getDatasetDetails, downloadDataset } from '../../api/datasetsApi';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/page-layout.css';
import './upload.css';

const STATUS_BADGE = {
  Processed: 'badge-success',
  Processing: 'badge-info',
  Failed: 'badge-danger',
};

const PAGE_SIZE = 6;

const Upload = () => {
  const { showToast } = useToast();
  const [datasets, setDatasets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await getDatasets({ search, page, pageSize: PAGE_SIZE });
      setDatasets(data.items);
      setTotal(data.total);
    } catch (err) {
      setLoadError(
        err?.response?.data?.detail ||
          'Could not reach the backend at ' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '. Is the FastAPI server running?'
      );
      setDatasets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleUploadComplete = (dataset) => {
    if (dataset?.status === 'Failed') {
      showToast(`Uploaded, but the file couldn't be parsed: ${dataset.errorMessage || 'unknown error'}`, 'warning');
    } else {
      showToast('Dataset uploaded and processed successfully.', 'success');
    }
    setSearch('');
    setPage(1);
    fetchDatasets();
  };

  const handleUploadError = (err) => {
    showToast(err?.response?.data?.detail || 'Upload failed. Please try again.', 'danger');
  };

  const handleDelete = async (id) => {
    try {
      await deleteDataset(id);
      showToast('Dataset deleted.', 'info');
      fetchDatasets();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Could not delete dataset.', 'danger');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleView = async (id) => {
    setSelected({ id });
    setDetailsLoading(true);
    try {
      const { data } = await getDatasetDetails(id);
      setSelected(data);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Could not load dataset details.', 'danger');
      setSelected(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownload = async (row) => {
    try {
      showToast(`Downloading ${row.name}...`, 'info');
      await downloadDataset(row.id, row.name);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Download failed.', 'danger');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = [
    { key: 'name', label: 'Dataset Name', render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span> },
    { key: 'size', label: 'Size' },
    { key: 'rows', label: 'Rows', render: (row) => <span className="numeric">{row.rows.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span> },
    { key: 'uploadedAt', label: 'Uploaded', render: (row) => new Date(row.uploadedAt).toLocaleString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button className="table-action-btn" onClick={() => handleView(row.id)} title="View details"><FiEye /></button>
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
          <h1>Dataset Upload</h1>
          <p className="page-subtitle">Upload CSV or Excel files for profiling, validation, and AI cleaning.</p>
        </div>
      </div>

      <div className="card panel-card">
        <div className="panel-card-header">
          <div>
            <h3><FiUploadCloud style={{ verticalAlign: 'middle' }} /> Upload a new dataset</h3>
            <span className="panel-subtitle">Supported formats: .csv, .xlsx, .xls</span>
          </div>
        </div>
        <FileUploader uploadFn={uploadDataset} onUploadComplete={handleUploadComplete} onUploadError={handleUploadError} />
      </div>

      <div className="card panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Your Datasets</h3>
            <span className="panel-subtitle">{total} dataset{total !== 1 ? 's' : ''} in your workspace</span>
          </div>
          <div style={{ width: 280 }}>
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search datasets..." />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader label="Loading datasets..." />
          </div>
        ) : loadError ? (
          <div className="upload-error-state">
            <FiAlertTriangle />
            <p>{loadError}</p>
            <button className="btn btn-ghost" onClick={fetchDatasets}>Retry</button>
          </div>
        ) : (
          <>
            <Table columns={columns} data={datasets} emptyMessage="No datasets uploaded yet. Upload one above to get started." />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Dataset Details"
        footer={<button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>}
      >
        {detailsLoading || !selected?.name ? (
          <Loader label="Loading details..." />
        ) : (
          <div className="dataset-details-grid">
            <div><span>Name</span><b>{selected.name}</b></div>
            <div><span>Size</span><b>{selected.size}</b></div>
            <div><span>Rows</span><b className="numeric">{selected.rows?.toLocaleString()}</b></div>
            <div><span>Status</span><b className={`badge ${STATUS_BADGE[selected.status]}`}>{selected.status}</b></div>
            {selected.errorMessage && <div><span>Error</span><b style={{ color: 'var(--color-danger)' }}>{selected.errorMessage}</b></div>}
            <div><span>Uploaded</span><b>{new Date(selected.uploadedAt).toLocaleString()}</b></div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete dataset?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger-outline" onClick={() => handleDelete(confirmDeleteId)}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--color-gray-dark)' }}>
          This will permanently remove the dataset and all associated profiling, validation, and cleaning history. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Upload;
