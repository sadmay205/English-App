import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import { toast } from 'sonner';

export default function PdfImportZone({ vocabSetId }) {
  const { uploadPdf, isLoading } = useVocabStore();
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Chỉ chấp nhận file PDF');
      toast.error('Chỉ chấp nhận file PDF');
      return;
    }

    setError(null);
    setResult(null);

    const data = await uploadPdf(vocabSetId, file);
    if (data) {
      setResult(data);
      toast.success(data.message || 'Import từ PDF thành công!');
    } else {
      setError('Lỗi khi xử lý file PDF');
      toast.error('Lỗi khi xử lý file PDF');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="pdf-import-section">
      <h3 className="pdf-import-title">
        <FileText size={16} />
        Import từ PDF
      </h3>

      <div
        className={`pdf-drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="pdf-file-input"
        />

        {isLoading ? (
          <div className="pdf-drop-content">
            <Loader size={32} className="pdf-spinner" />
            <p>Đang xử lý file PDF...</p>
          </div>
        ) : (
          <div className="pdf-drop-content">
            <Upload size={32} />
            <p>Kéo thả file PDF vào đây hoặc nhấn để chọn file</p>
            <span>Hỗ trợ format: * Word: Meaning</span>
          </div>
        )}
      </div>

      {/* Success Result */}
      {result && (
        <div className="pdf-result success animate-scale-in">
          <CheckCircle size={18} />
          <div>
            <p className="pdf-result-text">{result.message}</p>
            {result.groups && result.groups.length > 0 && (
              <p className="pdf-result-groups">Nhóm: {result.groups.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="pdf-result error animate-shake">
          <AlertCircle size={18} />
          <p className="pdf-result-text">{error}</p>
        </div>
      )}

      <style>{`
        .pdf-import-section {
          margin-bottom: 1.5rem;
        }

        .pdf-import-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.75rem;
        }

        .pdf-drop-zone {
          border: 2px dashed var(--color-border-default);
          border-radius: var(--radius-lg);
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: var(--color-bg-tertiary);
        }

        .pdf-drop-zone:hover {
          border-color: var(--color-accent-primary);
          background: var(--color-accent-glow);
        }

        .pdf-drop-zone.dragging {
          border-color: var(--color-accent-primary);
          background: var(--color-accent-glow);
          box-shadow: var(--shadow-glow);
        }

        .pdf-drop-zone.loading {
          pointer-events: none;
          opacity: 0.7;
        }

        .pdf-drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
        }

        .pdf-drop-content p {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .pdf-drop-content span {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .pdf-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pdf-result {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.875rem;
          border-radius: var(--radius-md);
          margin-top: 0.75rem;
        }

        .pdf-result.success {
          background: var(--color-success-bg);
          color: var(--color-success);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .pdf-result.error {
          background: var(--color-error-bg);
          color: var(--color-error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .pdf-result-text {
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .pdf-result-groups {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
