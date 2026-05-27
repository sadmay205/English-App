import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import VocabList from './VocabList';
import { toast } from 'sonner';

export default function VocabSetCreator() {
  const { vocabSets, currentSet, isLoading, fetchSets, createSet, fetchSetById, deleteSet, clearCurrentSet } = useVocabStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const [setToDelete, setSetToDelete] = useState(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const result = await createSet(title.trim(), description.trim());
    if (result) {
      toast.success(`Đã tạo bộ từ vựng "${result.title}" thành công!`);
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
      // Immediately open/enter the newly created set
      await fetchSetById(result._id);
    }
  };

  const handleSelectSet = async (id) => {
    await fetchSetById(id);
  };

  const handleBack = () => {
    clearCurrentSet();
  };

  const handleDeleteClick = (e, setObj) => {
    e.stopPropagation();
    setSetToDelete(setObj);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;
    const success = await deleteSet(setToDelete._id);
    if (success) {
      toast.success(`Đã xóa bộ từ vựng "${setToDelete.title}" thành công!`);
    } else {
      toast.error('Lỗi khi xóa bộ từ vựng.');
    }
    setSetToDelete(null);
  };

  // If a set is selected, show its details
  if (currentSet) {
    return (
      <div className="vocab-detail animate-fade-in">
        <button onClick={handleBack} className="vocab-back-btn">
          ← Quay lại danh sách
        </button>

        <div className="vocab-detail-header">
          <div>
            <h2 className="vocab-detail-title">{currentSet.title}</h2>
            {currentSet.description && (
              <p className="vocab-detail-desc">{currentSet.description}</p>
            )}
            <span className="vocab-detail-count">
              {currentSet.wordCount || 0} từ vựng
            </span>
          </div>
        </div>

        {/* Vocabulary List */}
        <VocabList vocabSetId={currentSet._id} />

        <style>{detailStyles}</style>
      </div>
    );
  }

  // Show list of sets
  return (
    <div className="vocab-creator animate-fade-in">
      {/* Header */}
      <div className="vocab-header">
        <div>
          <h2 className="vocab-main-title">📚 Bộ Từ Vựng</h2>
          <p className="vocab-subtitle">Quản lý và học các bộ từ vựng của bạn</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
          id="create-set-btn"
        >
          <Plus size={18} />
          Tạo bộ mới
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="vocab-create-form card animate-scale-in">
          <h3>Tạo bộ từ vựng mới</h3>
          <div className="vocab-form-group">
            <label>Tên bộ từ vựng *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Tuần 1 - Full-stack & AI"
              className="input"
              id="set-title-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="vocab-form-group">
            <label>Mô tả (tùy chọn)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về bộ từ vựng"
              className="input"
              id="set-desc-input"
            />
          </div>
          <div className="vocab-form-actions">
            <button onClick={handleCreate} className="btn-primary" disabled={!title.trim()}>
              <Plus size={16} /> Tạo bộ
            </button>
            <button onClick={() => setShowCreateForm(false)} className="btn-ghost">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Sets Grid */}
      {isLoading && vocabSets.length === 0 ? (
        <div className="vocab-loading">
          <div className="vocab-spinner" />
          <p>Đang tải...</p>
        </div>
      ) : vocabSets.length === 0 ? (
        <div className="vocab-empty">
          <FolderOpen size={48} />
          <h3>Chưa có bộ từ vựng nào</h3>
          <p>Nhấn &quot;Tạo bộ mới&quot; để bắt đầu học từ vựng!</p>
        </div>
      ) : (
        <div className="vocab-grid">
          {vocabSets.map((set, index) => (
            <div
              key={set._id}
              className="vocab-set-card card"
              onClick={() => handleSelectSet(set._id)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="vocab-set-card-header">
                <div className="vocab-set-icon">
                  <BookOpen size={20} />
                </div>
                <button
                  className="vocab-set-delete"
                  onClick={(e) => handleDeleteClick(e, set)}
                  title="Xóa bộ từ vựng"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="vocab-set-title">{set.title}</h3>
              {set.description && (
                <p className="vocab-set-desc">{set.description}</p>
              )}
              <div className="vocab-set-footer">
                <span className="badge badge-success">
                  {set.wordCount || 0} từ
                </span>
                <span className="vocab-set-date">
                  <Clock size={12} />
                  {new Date(set.lastStudiedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="vocab-set-action">
                <span>Mở bộ từ</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {setToDelete && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card animate-scale-in">
            <h3 className="confirm-modal-title">Xác nhận xóa bộ từ?</h3>
            <p className="confirm-modal-text">
              Bạn có chắc chắn muốn xóa bộ từ vựng <strong>{setToDelete.title}</strong>? Hành động này sẽ xóa tất cả từ vựng bên trong và không thể hoàn tác.
            </p>
            <div className="confirm-modal-actions">
              <button onClick={() => setSetToDelete(null)} className="btn-ghost">
                Hủy bỏ
              </button>
              <button onClick={handleConfirmDelete} className="btn-primary confirm-delete-btn">
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{creatorStyles}</style>
    </div>
  );
}

const creatorStyles = `
  .vocab-creator {
    max-width: 900px;
    margin: 0 auto;
  }

  .vocab-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .vocab-main-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .vocab-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .vocab-create-form {
    margin-bottom: 1.5rem;
  }

  .vocab-create-form h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }

  .vocab-form-group {
    margin-bottom: 0.875rem;
  }

  .vocab-form-group label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 0.375rem;
  }

  .vocab-form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .vocab-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .vocab-set-card {
    cursor: pointer;
    position: relative;
  }

  .vocab-set-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .vocab-set-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--color-accent-glow);
    color: var(--color-accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vocab-set-delete {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0;
  }

  .vocab-set-card:hover .vocab-set-delete {
    opacity: 1;
  }

  .vocab-set-delete:hover {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-error);
  }

  .vocab-set-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .vocab-set-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .vocab-set-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .vocab-set-date {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .vocab-set-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-accent-secondary);
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border-default);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .vocab-set-card:hover .vocab-set-action {
    opacity: 1;
  }

  .vocab-loading, .vocab-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    color: var(--color-text-muted);
    gap: 0.75rem;
  }

  .vocab-empty h3 {
    font-size: 1rem;
    color: var(--color-text-secondary);
  }

  .vocab-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border-default);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Custom Confirmation Modal Styling */
  .confirm-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 10, 20, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }
  .confirm-modal-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 400px;
    padding: 1.75rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .confirm-modal-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }
  .confirm-modal-text {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  .confirm-modal-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }
  .confirm-delete-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626) !important;
    color: white !important;
  }
  .confirm-delete-btn:hover {
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4) !important;
  }
`;

const detailStyles = `
  .vocab-detail {
    max-width: 900px;
    margin: 0 auto;
  }

  .vocab-back-btn {
    background: transparent;
    border: none;
    color: var(--color-accent-secondary);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.375rem 0;
    margin-bottom: 1rem;
    font-family: inherit;
    transition: color 0.2s;
  }

  .vocab-back-btn:hover {
    color: var(--color-accent-primary);
  }

  .vocab-detail-header {
    margin-bottom: 1.5rem;
  }

  .vocab-detail-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .vocab-detail-desc {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .vocab-detail-count {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-accent-secondary);
  }
`;
