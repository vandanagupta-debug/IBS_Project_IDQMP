import { useCallback, useRef, useState } from 'react';
import { FiUploadCloud, FiFile, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import './common.css';

const FileUploader = ({ onUploadComplete, onUploadError, uploadFn, accept = '.csv,.xlsx,.xls' }) => {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState([]); // { id, file, progress, status }
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList);
      files.forEach((file) => {
        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        setQueue((prev) => [...prev, { id, file, progress: 0, status: 'uploading' }]);

        uploadFn(file, (progress) => {
          setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, progress } : q)));
        })
          .then(({ data }) => {
            setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, progress: 100, status: 'done' } : q)));
            if (onUploadComplete) onUploadComplete(data);
          })
          .catch((err) => {
            setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'error' } : q)));
            if (onUploadError) onUploadError(err);
          });
      });
    },
    [uploadFn, onUploadComplete, onUploadError]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`uploader-dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <FiUploadCloud />
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop your file here</p>
        <p style={{ fontSize: 13, color: 'var(--color-gray)' }}>or click to browse — CSV and Excel supported</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="uploader-queue">
          {queue.map((item) => (
            <div key={item.id} className="uploader-queue-item">
              <span className="uploader-queue-icon">
                {item.status === 'done' && <FiCheckCircle color="var(--color-success)" />}
                {item.status === 'error' && <FiXCircle color="var(--color-danger)" />}
                {item.status === 'uploading' && <FiFile />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="uploader-queue-name">{item.file.name}</p>
                <div className="uploader-progress-track">
                  <div
                    className="uploader-progress-fill"
                    style={{ width: `${item.progress}%`, background: item.status === 'error' ? 'var(--color-danger)' : undefined }}
                  />
                </div>
              </div>
              <span className="numeric uploader-queue-pct">{item.status === 'error' ? 'Failed' : `${item.progress}%`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
