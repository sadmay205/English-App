import { useState, useEffect } from 'react';
import { Headphones, BookOpen, Brain, PenLine, Plus, Trash2, ArrowRight, Loader, X, FileText } from 'lucide-react';
import useListeningStore from '../../../store/useListeningStore';
import AudioQuiz from './AudioQuiz';
import SentenceComplete from './SentenceComplete';
import { toast } from 'sonner';

export default function ListeningContainer() {
  const { tasks, currentTask, fetchTasks, fetchTaskById, processParagraph, deleteTask, clearCurrentTask, isLoading, error } = useListeningStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParagraph, setNewParagraph] = useState('');
  const [selectedMode, setSelectedMode] = useState(null); // 'quiz' | 'dictation' | null
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartTask = async (taskId, mode) => {
    const task = await fetchTaskById(taskId);
    if (task) {
      setSelectedMode(mode);
    }
  };

  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newParagraph.trim() || isProcessing) return;

    setIsProcessing(true);
    const result = await processParagraph(newTitle.trim(), newParagraph.trim());
    setIsProcessing(false);

    if (result) {
      toast.success(`Đã tạo bài nghe "${result.title}" thành công!`);
      setNewTitle('');
      setNewParagraph('');
      setShowAddForm(false);
    } else {
      toast.error('Lỗi khi tạo bài tập nghe.');
    }
  };

  const handleDeleteClick = (e, taskObj) => {
    e.stopPropagation(); // Avoid triggering selection
    setTaskToDelete(taskObj);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const success = await deleteTask(taskToDelete._id);
    if (success) {
      toast.success(`Đã xóa bài tập nghe "${taskToDelete.title}" thành công!`);
    } else {
      toast.error('Lỗi khi xóa bài tập nghe.');
    }
    setTaskToDelete(null);
  };

  const handleBackToList = () => {
    clearCurrentTask();
    setSelectedMode(null);
  };

  // If a task is active and a mode is selected, render the learning component
  if (currentTask && selectedMode) {
    if (selectedMode === 'quiz') {
      return <AudioQuiz task={currentTask} onBack={handleBackToList} />;
    }
    if (selectedMode === 'dictation') {
      return <SentenceComplete task={currentTask} onBack={handleBackToList} />;
    }
  }

  return (
    <div className="listening-hub animate-fade-in">
      {/* Page Title */}
      <div className="lh-header-row">
        <div>
          <h2 className="lh-title">🎧 Luyện Nghe Tiếng Anh</h2>
          <p className="lh-subtitle">Luyện nghe viết chính tả hoặc trắc nghiệm qua các đoạn văn bản</p>
        </div>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn-primary lh-add-btn">
            <Plus size={16} /> Tạo bài nghe mới
          </button>
        )}
      </div>

      {/* Add New Paragraph Form */}
      {showAddForm && (
        <div className="lh-form-card animate-scale-in">
          <div className="lh-form-header">
            <h3><FileText size={18} /> Tạo bài tập nghe từ đoạn văn</h3>
            <button onClick={() => setShowAddForm(false)} className="lh-close-btn">
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleCreateTask} className="lh-form">
            <div className="lh-form-group">
              <label htmlFor="task-title">Tiêu đề bài nghe:</label>
              <input
                id="task-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Daily English Conversation / Tin tức kinh tế..."
                className="input"
              />
            </div>
            
            <div className="lh-form-group">
              <label htmlFor="task-paragraph">Nội dung đoạn văn (tiếng Anh):</label>
              <textarea
                id="task-paragraph"
                required
                rows={5}
                value={newParagraph}
                onChange={(e) => setNewParagraph(e.target.value)}
                placeholder="Nhập đoạn văn bản tiếng Anh vào đây. Hệ thống sẽ tự động phân tách thành từng câu để bạn luyện nghe..."
                className="lh-textarea"
              />
            </div>

            {error && <p className="lh-error-text">{error}</p>}

            <div className="lh-form-actions">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="btn-ghost"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="btn-primary"
              >
                {isProcessing ? (
                  <><Loader className="spinning" size={16} /> Đang xử lý...</>
                ) : (
                  'Tạo và phân tách câu'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main List */}
      {isLoading && tasks.length === 0 ? (
        <div className="lh-loading-state">
          <Loader className="spinning" size={32} />
          <p>Đang tải danh sách bài tập nghe...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="lh-empty-state card">
          <div className="lh-empty-icon">
            <Headphones size={36} />
          </div>
          <h3>Chưa có bài tập nghe nào</h3>
          <p>Hãy nhập hoặc dán một đoạn văn bản tiếng Anh để tự động tạo bài nghe đầu tiên của bạn!</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            <Plus size={16} /> Tạo bài nghe ngay
          </button>
        </div>
      ) : (
        <div className="lh-grid">
          {tasks.map((task) => (
            <div key={task._id} className="lh-task-card card animate-scale-in">
              <div className="lh-task-header">
                <div className="lh-task-icon-wrapper">
                  <Headphones size={20} />
                </div>
                <button 
                  onClick={(e) => handleDeleteClick(e, task)}
                  className="lh-delete-btn"
                  title="Xóa bài tập này"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="lh-task-title">{task.title}</h3>
              <p className="lh-task-meta">{task.sentences?.length || 0} câu đã được phân tách</p>
              
              <div className="lh-task-preview">
                {task.paragraphText}
              </div>

              {/* Mode Select Buttons */}
              <div className="lh-action-row">
                <button 
                  onClick={() => handleStartTask(task._id, 'quiz')}
                  className="lh-mode-btn quiz"
                >
                  <div className="lh-mode-icon"><Brain size={14} /></div>
                  <div className="lh-mode-text">
                    <span>Nghe Trắc nghiệm</span>
                    <small>Chọn đáp án đúng</small>
                  </div>
                </button>

                <button 
                  onClick={() => handleStartTask(task._id, 'dictation')}
                  className="lh-mode-btn dictation"
                >
                  <div className="lh-mode-icon"><PenLine size={14} /></div>
                  <div className="lh-mode-text">
                    <span>Nghe ghi chính tả</span>
                    <small>Gõ lại toàn bộ câu</small>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {taskToDelete && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card animate-scale-in">
            <h3 className="confirm-modal-title">Xác nhận xóa bài nghe?</h3>
            <p className="confirm-modal-text">
              Bạn có chắc chắn muốn xóa bài tập nghe <strong>{taskToDelete.title}</strong>? Hành động này sẽ không thể hoàn tác.
            </p>
            <div className="confirm-modal-actions">
              <button onClick={() => setTaskToDelete(null)} className="btn-ghost">
                Hủy bỏ
              </button>
              <button onClick={handleConfirmDelete} className="btn-primary confirm-delete-btn">
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .listening-hub {
          max-width: 1000px;
          margin: 0 auto;
        }

        .lh-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .lh-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .lh-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .lh-add-btn {
          font-size: 0.8125rem;
          padding: 0.625rem 1rem;
        }

        /* Form styling */
        .lh-form-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-accent);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-glow);
        }

        .lh-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--color-border-default);
          padding-bottom: 0.75rem;
        }

        .lh-form-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lh-close-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color 0.2s;
        }

        .lh-close-btn:hover {
          color: var(--color-text-primary);
        }

        .lh-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .lh-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .lh-form-group label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .lh-textarea {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.75rem 0.875rem;
          color: var(--color-text-primary);
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          resize: vertical;
          transition: all 0.3s ease;
        }

        .lh-textarea:focus {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px var(--color-accent-glow);
        }

        .lh-error-text {
          font-size: 0.75rem;
          color: var(--color-error);
        }

        .lh-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        /* Empty state */
        .lh-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem 2rem;
          gap: 1rem;
          max-width: 500px;
          margin: 4rem auto;
        }

        .lh-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-accent-glow);
          color: var(--color-accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border-accent);
        }

        .lh-empty-state h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .lh-empty-state p {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }

        /* Loading state */
        .lh-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          gap: 1rem;
          color: var(--color-text-secondary);
        }

        /* Grid layout */
        .lh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 1.25rem;
        }

        .lh-task-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 250px;
        }

        .lh-task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .lh-task-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-tertiary);
          color: var(--color-accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border-default);
        }

        .lh-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .lh-delete-btn:hover {
          background: var(--color-error-bg);
          border-color: var(--color-error);
          color: var(--color-error);
        }

        .lh-task-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
          line-height: 1.3;
        }

        .lh-task-meta {
          font-size: 0.7rem;
          color: var(--color-accent-secondary);
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .lh-task-preview {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin-bottom: 1.25rem;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lh-action-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: auto;
          border-top: 1px solid var(--color-border-default);
          padding-top: 1rem;
        }

        .lh-mode-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-default);
          background: var(--color-bg-tertiary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          text-align: left;
        }

        .lh-mode-btn:hover {
          border-color: var(--color-border-accent);
          background: var(--color-bg-hover);
        }

        .lh-mode-icon {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lh-mode-btn.quiz .lh-mode-icon {
          background: var(--color-accent-glow);
          color: var(--color-accent-primary);
        }

        .lh-mode-btn.dictation .lh-mode-icon {
          background: rgba(129, 140, 248, 0.1);
          color: var(--color-accent-secondary);
        }

        .lh-mode-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .lh-mode-text span {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.2;
        }

        .lh-mode-text small {
          font-size: 0.6rem;
          color: var(--color-text-muted);
          line-height: 1.2;
        }

        .spinning {
          animation: spin 1s linear infinite;
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
      `}</style>
    </div>
  );
}
