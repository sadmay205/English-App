import { useState } from 'react';
import { Volume2, Plus, Search, Upload, Trash2 } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import PdfImportZone from './PdfImportZone';
import { toast } from 'sonner';

export default function VocabList({ vocabSetId }) {
  const { vocabularies, addWord, deleteWord } = useVocabStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, word }

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, word } = deleteConfirm;
    setDeleteConfirm(null);
    const success = await deleteWord(vocabSetId, id);
    if (success) {
      toast.success(`Đã xóa từ "${word}" thành công!`);
    } else {
      toast.error('Lỗi khi xóa từ vựng.');
    }
  };


  const handleAddWord = async () => {

    if (!newWord.trim() || !newMeaning.trim()) return;

    const result = await addWord(vocabSetId, {
      word: newWord.trim(),
      phonetic: newPhonetic.trim(),
      meaningVi: newMeaning.trim(),
    });

    if (result) {
      toast.success(`Đã thêm từ "${result.word}" thành công!`);
      setNewWord('');
      setNewPhonetic('');
      setNewMeaning('');
      setShowAddForm(false);
    } else {
      toast.error('Lỗi khi thêm từ vựng.');
    }
  };

  const filtered = vocabularies.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.word.toLowerCase().includes(q) || v.meaningVi.toLowerCase().includes(q);
  });

  return (
    <div className="vocab-list-section">
      {/* Header */}
      <div className="vocab-list-header">
        <h3>
          Danh sách từ vựng ({vocabularies.length})
        </h3>
        <div className="vocab-list-actions">
          <div className="vocab-search-box">
            <Search size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="vocab-search-input"
              id="vocab-search"
            />
          </div>
          <button
            onClick={() => {
              setShowPdfImport(!showPdfImport);
              setShowAddForm(false);
            }}
            className="btn-ghost"
            style={{ 
              padding: '0.5rem 0.875rem', 
              fontSize: '0.8rem', 
              marginRight: '0.25rem',
              borderColor: showPdfImport ? 'var(--color-accent-primary)' : '',
              background: showPdfImport ? 'var(--color-accent-glow)' : '',
              color: showPdfImport ? 'var(--color-accent-primary)' : ''
            }}
          >
            <Upload size={14} /> Nhập từ PDF
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowPdfImport(false);
            }}
            className="btn-primary"
            id="add-word-btn"
            style={{ 
              padding: '0.5rem 0.875rem', 
              fontSize: '0.8rem',
              background: showAddForm ? 'var(--color-accent-glow)' : '',
              color: showAddForm ? 'var(--color-accent-primary)' : '',
              border: showAddForm ? '1px solid var(--color-accent-primary)' : ''
            }}
          >
            <Plus size={14} /> Thêm từ
          </button>
        </div>
      </div>

      {/* PDF Import Zone */}
      {showPdfImport && (
        <div className="animate-scale-in" style={{ marginBottom: '1rem' }}>
          <PdfImportZone vocabSetId={vocabSetId} />
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="vocab-add-form card animate-scale-in">
          <div className="vocab-add-row">
            <div className="vocab-add-field">
              <label>Từ vựng *</label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Asset allocation"
                className="input"
                id="new-word-input"
              />
            </div>
            <div className="vocab-add-field" style={{ maxWidth: '150px' }}>
              <label>Phiên âm</label>
              <input
                type="text"
                value={newPhonetic}
                onChange={(e) => setNewPhonetic(e.target.value)}
                placeholder="/ˈæset/"
                className="input"
              />
            </div>
            <div className="vocab-add-field">
              <label>Nghĩa tiếng Việt *</label>
              <input
                type="text"
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder="Phân bổ tài sản"
                className="input"
                id="new-meaning-input"
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              />
            </div>
          </div>
          <div className="vocab-add-actions">
            <button onClick={handleAddWord} className="btn-primary" disabled={!newWord.trim() || !newMeaning.trim()}>
              Thêm từ
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-ghost">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Word List */}
      {filtered.length === 0 ? (
        <div className="vocab-empty-list">
          <p>{searchQuery ? 'Không tìm thấy từ vựng phù hợp' : 'Chưa có từ vựng nào. Hãy thêm từ hoặc import PDF!'}</p>
        </div>
      ) : (
        <div className="vocab-words">
          {filtered.map((vocab, index) => (
            <div
              key={vocab._id}
              className="vocab-word-item animate-fade-in"
              style={{ animationDelay: `${Math.min(index * 0.02, 0.5)}s` }}
            >
              <div className="vocab-word-number">{index + 1}</div>
              <div className="vocab-word-content">
                <div className="vocab-word-english" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.375rem' }}>
                  <span className="vocab-word-text">{vocab.word}</span>
                  {vocab.phonetic && (
                    <span className="vocab-word-phonetic">{vocab.phonetic}</span>
                  )}
                  <button
                    className="vocab-word-speak-inline"
                    onClick={() => handleSpeak(vocab.word)}
                    title="Phát âm"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
                <div className="vocab-word-meaning">{vocab.meaningVi}</div>
              </div>
              <button
                className="vocab-word-delete"
                onClick={() => setDeleteConfirm({ id: vocab._id, word: vocab.word })}
                title="Xóa từ"
              >
                <Trash2 size={14} />
              </button>
            </div>

          ))}
        </div>
      )}

      {/* Custom delete confirm modal */}
      {deleteConfirm && (
        <div className="custom-confirm-overlay animate-fade-in">
          <div className="custom-confirm-card animate-scale-in">
            <div className="custom-confirm-icon">⚠️</div>
            <h3>Xác nhận xóa từ vựng</h3>
            <p>Bạn có thực sự muốn xóa từ vựng <strong>"{deleteConfirm.word}"</strong> khỏi danh sách này không?</p>
            <div className="custom-confirm-actions">
              <button onClick={confirmDelete} className="btn-danger-confirm">Xóa từ</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost-confirm">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <style>{`

        .vocab-list-section {
          margin-top: 0.5rem;
        }

        .vocab-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .vocab-list-header h3 {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .vocab-list-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .vocab-search-box {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.375rem 0.625rem;
          color: var(--color-text-muted);
          transition: border-color 0.2s;
        }

        .vocab-search-box:focus-within {
          border-color: var(--color-accent-primary);
        }

        .vocab-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text-primary);
          font-size: 0.8rem;
          width: 120px;
          font-family: inherit;
        }

        .vocab-search-input::placeholder {
          color: var(--color-text-muted);
        }

        .vocab-add-form {
          margin-bottom: 1rem;
        }

        .vocab-add-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .vocab-add-field {
          flex: 1;
        }

        .vocab-add-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          margin-bottom: 0.25rem;
        }

        .vocab-add-actions {
          display: flex;
          gap: 0.5rem;
        }

        .vocab-empty-list {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .vocab-words {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .vocab-word-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .vocab-word-item:hover {
          border-color: var(--color-border-accent);
          background: var(--color-bg-hover);
        }

        .vocab-word-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-bg-tertiary);
          color: var(--color-text-muted);
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vocab-word-content {
          flex: 1;
          min-width: 0;
        }

        .vocab-word-english {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.125rem;
        }

        .vocab-word-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .vocab-word-phonetic {
          font-size: 0.75rem;
          color: var(--color-accent-secondary);
          font-style: italic;
        }

        .vocab-word-meaning {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .vocab-word-speak-inline {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .vocab-word-speak-inline:hover {
          color: var(--color-accent-primary);
          background: var(--color-accent-glow);
        }

        .vocab-word-delete {
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
          flex-shrink: 0;
        }

        .vocab-word-delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-error);
          border-color: rgba(239, 68, 68, 0.2);
        }

        /* Custom Delete Confirm Modal Styles */
        .custom-confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 20, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .custom-confirm-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-accent);
          border-radius: var(--radius-lg);
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .custom-confirm-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .custom-confirm-card h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .custom-confirm-card p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .custom-confirm-actions {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
        }

        .btn-danger-confirm {
          background: var(--color-error);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn-danger-confirm:hover {
          background: #dc2626;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
        }

        .btn-ghost-confirm {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          color: var(--color-text-secondary);
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn-ghost-confirm:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

      `}</style>
    </div>
  );
}
