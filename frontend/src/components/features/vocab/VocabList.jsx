import { useState } from 'react';
import { Volume2, Plus, Search, Upload, Trash2, Edit3, AlertCircle } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import PdfImportZone from './PdfImportZone';
import api from '../../../services/api';
import { toast } from 'sonner';

export default function VocabList({ vocabSetId }) {
  const { vocabularies, addWord, deleteWord, updateWord, splitSet } = useVocabStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newEnglishDefinition, setNewEnglishDefinition] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, word }
  const [isTranslating, setIsTranslating] = useState(false);

  // Split vocabulary states
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);

  const toggleWordSelect = (wordId) => {
    setSelectedWordIds((prev) =>
      prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId]
    );
  };

  const handleSplitSubmit = async () => {
    if (!newSetTitle.trim()) {
      toast.error('Vui lòng nhập tên bộ từ vựng mới!');
      return;
    }
    if (selectedWordIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một từ vựng để tách!');
      return;
    }

    setIsSplitting(true);
    const result = await splitSet(vocabSetId, selectedWordIds, newSetTitle.trim(), newSetDescription.trim());
    setIsSplitting(false);

    if (result) {
      toast.success(`Đã tách thành công ${selectedWordIds.length} từ vựng sang bộ từ "${result.newSet.title}"!`);
      setNewSetTitle('');
      setNewSetDescription('');
      setSelectedWordIds([]);
      setIsSplitMode(false);
      setShowSplitModal(false);
    } else {
      toast.error('Lỗi khi tách bộ từ vựng.');
    }
  };

  // Edit vocabulary states
  const [editingWord, setEditingWord] = useState(null);
  const [editWordText, setEditWordText] = useState('');
  const [editPhoneticText, setEditPhoneticText] = useState('');
  const [editMeaningText, setEditMeaningText] = useState('');
  const [editEnglishDefinitionText, setEditEnglishDefinitionText] = useState('');

  const startEdit = (vocab) => {
    setEditingWord(vocab);
    setEditWordText(vocab.word || '');
    setEditPhoneticText(vocab.phonetic || '');
    setEditMeaningText(vocab.meaningVi || '');
    setEditEnglishDefinitionText(vocab.englishDefinition || '');
  };

  const handleSaveEdit = async () => {
    if (!editWordText.trim()) {
      toast.error('Vui lòng nhập từ tiếng Anh!');
      return;
    }
    if (!editMeaningText.trim()) {
      toast.error('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }

    const result = await updateWord(vocabSetId, editingWord._id, {
      word: editWordText.trim(),
      phonetic: editPhoneticText.trim(),
      meaningVi: editMeaningText.trim(),
      englishDefinition: editEnglishDefinitionText.trim(),
    });

    if (result) {
      toast.success('Đã cập nhật từ vựng thành công!');
      setEditingWord(null);
    } else {
      toast.error('Lỗi khi cập nhật từ vựng.');
    }
  };

  // Single AI definition generator
  const [generatingSingleId, setGeneratingSingleId] = useState(null);

  const handleGenerateSingleDefinition = async (vocab) => {
    setGeneratingSingleId(vocab._id);
    toast.info(`AI đang tạo định nghĩa tiếng Anh cho từ "${vocab.word}"...`);
    try {
      const prompt = `You are a professional lexicographer. For the English word "${vocab.word}" with Vietnamese meaning "${vocab.meaningVi}", write a very concise and simple English definition (1 short sentence, max 15 words) suitable for Vietnamese students learning English.
Rules:
1. Do not use the word "${vocab.word}" itself in the definition.
2. Return ONLY the English definition itself as plain text. Do not include quotes, markdown wrappers, or explanation.`;

      const { data } = await api.post('/ai/chat', {
        messages: [{ role: 'user', content: prompt }]
      });

      const definition = data.message.content.trim();
      
      const result = await updateWord(vocabSetId, vocab._id, {
        word: vocab.word,
        phonetic: vocab.phonetic,
        meaningVi: vocab.meaningVi,
        exampleSentence: vocab.exampleSentence || '',
        exampleMeaningVi: vocab.exampleMeaningVi || '',
        englishDefinition: definition,
      });

      if (result) {
        toast.success(`Đã tạo định nghĩa cho từ "${vocab.word}" thành công!`);
      } else {
        toast.error('Lỗi khi lưu định nghĩa.');
      }
    } catch (err) {
      console.error('Error generating single definition:', err);
      toast.error('Không thể tạo định nghĩa bằng AI.');
    } finally {
      setGeneratingSingleId(null);
    }
  };

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
    if (!newWord.trim()) {
      toast.error('Vui lòng nhập từ tiếng Anh!');
      return;
    }
    if (!newMeaning.trim()) {
      toast.error('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }

    const result = await addWord(vocabSetId, {
      word: newWord.trim(),
      phonetic: newPhonetic.trim(),
      meaningVi: newMeaning.trim(),
      englishDefinition: newEnglishDefinition.trim(),
    });

    if (result) {
      toast.success(`Đã thêm từ "${result.word}" thành công!`);
      setNewWord('');
      setNewPhonetic('');
      setNewMeaning('');
      setNewEnglishDefinition('');
      setShowAddForm(false);
    } else {
      toast.error('Lỗi khi thêm từ vựng.');
    }
  };

  const handleAiAutoFill = async () => {
    if (!newWord.trim()) return;
    setIsTranslating(true);
    toast.info('AI đang dịch và soạn định nghĩa...');
    try {
      const prompt = `You are a professional English-Vietnamese dictionary. For the English word "${newWord.trim()}", translate it to Vietnamese, find its IPA phonetic spelling, and write a very concise, clear English definition (1 short sentence, max 15 words) for flashcards (DO NOT use the word itself in the definition).
Return ONLY a valid JSON object with keys: "meaningVi", "phonetic", and "englishDefinition". Do not include markdown code block backticks.
Example output format:
{"meaningVi": "Cơ sở dữ liệu", "phonetic": "/ˈdeɪtəbeɪs/", "englishDefinition": "A structured set of data held in a computer."}`;

      const { data } = await api.post('/ai/chat', {
        messages: [{ role: 'user', content: prompt }]
      });

      let text = data.message.content.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      const result = JSON.parse(text);
      if (result.meaningVi) setNewMeaning(result.meaningVi);
      if (result.phonetic) setNewPhonetic(result.phonetic);
      if (result.englishDefinition) setNewEnglishDefinition(result.englishDefinition);
      toast.success('AI đã tự động điền các trường thành công!');
    } catch (err) {
      console.error('Error in AI auto fill:', err);
      toast.error('Không thể dịch bằng AI. Vui lòng tự nhập nghĩa.');
    } finally {
      setIsTranslating(false);
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
          {!isSplitMode && vocabularies.length > 0 && (
            <button
              onClick={() => {
                setIsSplitMode(true);
                setSelectedWordIds([]);
                setShowAddForm(false);
                setShowPdfImport(false);
              }}
              className="btn-ghost"
              style={{ 
                padding: '0.5rem 0.875rem', 
                fontSize: '0.8rem', 
                marginRight: '0.25rem',
              }}
            >
              Tách bộ từ
            </button>
          )}
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

      {/* Split Mode Toolbar */}
      {isSplitMode && (
        <div className="vocab-add-form card animate-scale-in" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--color-accent-primary)', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Đã chọn <strong style={{ color: 'var(--color-accent-primary)' }}>{selectedWordIds.length}</strong> từ vựng để tách
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowSplitModal(true)}
              className="btn-primary"
              disabled={selectedWordIds.length === 0}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Tách sang bộ mới
            </button>
            <button
              onClick={() => {
                setIsSplitMode(false);
                setSelectedWordIds([]);
              }}
              className="btn-ghost"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

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
          <div className="vocab-add-row" style={{ marginTop: '0.75rem' }}>
            <div className="vocab-add-field">
              <label>Định nghĩa tiếng Anh (tùy chọn)</label>
              <input
                type="text"
                value={newEnglishDefinition}
                onChange={(e) => setNewEnglishDefinition(e.target.value)}
                placeholder="The process of dividing an investment portfolio among different asset categories."
                className="input"
                id="new-definition-input"
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              />
            </div>
          </div>
          <div className="vocab-add-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleAddWord} className="btn-primary" id="save-word-btn">
                Thêm từ
              </button>
              <button onClick={() => setShowAddForm(false)} className="btn-ghost">
                Hủy
              </button>
            </div>
            
            <button
              onClick={handleAiAutoFill}
              className="btn-ghost"
              disabled={!newWord.trim() || isTranslating}
              type="button"
              style={{
                borderColor: 'var(--color-accent-primary)',
                color: 'var(--color-accent-primary)',
                background: 'var(--color-accent-glow)',
                padding: '0.5rem 0.875rem',
                fontSize: '0.8rem',
              }}
            >
              {isTranslating ? 'Đang điền...' : '✨ Điền nhanh bằng AI'}
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
              onClick={() => {
                if (isSplitMode) {
                  toggleWordSelect(vocab._id);
                }
              }}
              style={{ 
                animationDelay: `${Math.min(index * 0.02, 0.5)}s`,
                cursor: isSplitMode ? 'pointer' : 'default',
                borderColor: isSplitMode && selectedWordIds.includes(vocab._id) ? 'var(--color-accent-primary)' : '',
                background: isSplitMode && selectedWordIds.includes(vocab._id) ? 'var(--color-accent-glow)' : ''
              }}
            >
              {isSplitMode ? (
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleWordSelect(vocab._id); }}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedWordIds.includes(vocab._id)}
                    onChange={() => toggleWordSelect(vocab._id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--color-accent-primary)',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ) : (
                <div className="vocab-word-number">{index + 1}</div>
              )}
              <div className="vocab-word-content">
                <div className="vocab-word-english" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.375rem' }}>
                  <span className="vocab-word-text">{vocab.word}</span>
                  {vocab.phonetic && (
                    <span className="vocab-word-phonetic">{vocab.phonetic}</span>
                  )}
                  <button
                    className="vocab-word-speak-inline"
                    onClick={(e) => { e.stopPropagation(); handleSpeak(vocab.word); }}
                    title="Phát âm"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
                <div className="vocab-word-meaning">{vocab.meaningVi}</div>
                {vocab.englishDefinition ? (
                  <div className="vocab-word-definition" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '0.125rem' }}>
                    Def: {vocab.englishDefinition}
                  </div>
                ) : (
                  <div className="vocab-word-no-definition" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#b45309', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      <AlertCircle size={10} /> Thiếu định nghĩa Anh
                    </span>
                    {!isSplitMode && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleGenerateSingleDefinition(vocab); }}
                        disabled={generatingSingleId !== null}
                        className="btn-ghost"
                        style={{ fontSize: '0.65rem', padding: '1px 6px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '2px', borderColor: 'var(--color-accent-primary)', color: 'var(--color-accent-primary)', background: 'var(--color-accent-glow)', cursor: 'pointer' }}
                      >
                        {generatingSingleId === vocab._id ? 'Đang tạo...' : '✨ Tạo nhanh bằng AI'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {!isSplitMode && (
                <>
                  <button
                    className="vocab-word-edit"
                    onClick={(e) => { e.stopPropagation(); startEdit(vocab); }}
                    title="Chỉnh sửa từ"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid transparent',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      marginRight: '0.25rem',
                      flexShrink: 0
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className="vocab-word-delete"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: vocab._id, word: vocab.word }); }}
                    title="Xóa từ"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
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

      {/* Edit Word Dialog */}
      {editingWord && (
        <div className="custom-confirm-overlay animate-fade-in" style={{ zIndex: 1001 }}>
          <div className="custom-confirm-card edit-vocab-card animate-scale-in" style={{ maxWidth: '520px', textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1.25rem' }}>✏️ Chỉnh sửa từ vựng</h3>
            
            <div className="vocab-edit-fields" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="vocab-add-field">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Từ vựng *</label>
                <input
                  type="text"
                  value={editWordText}
                  onChange={(e) => setEditWordText(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div className="vocab-add-field">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Phiên âm</label>
                <input
                  type="text"
                  value={editPhoneticText}
                  onChange={(e) => setEditPhoneticText(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="vocab-add-field">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  value={editMeaningText}
                  onChange={(e) => setEditMeaningText(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="vocab-add-field">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Định nghĩa tiếng Anh</label>
                <input
                  type="text"
                  value={editEnglishDefinitionText}
                  onChange={(e) => setEditEnglishDefinitionText(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="custom-confirm-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setEditingWord(null)} className="btn-ghost-confirm">Hủy</button>
              <button onClick={handleSaveEdit} className="btn-danger-confirm" style={{ background: 'var(--color-accent-primary)' }}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Split Modal */}
      {showSplitModal && (
        <div className="custom-confirm-overlay animate-fade-in" style={{ zIndex: 1002 }}>
          <div className="custom-confirm-card animate-scale-in" style={{ maxWidth: '450px', textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1.25rem' }}>📚 Tách bộ từ vựng mới</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
              Bạn đang tách <strong>{selectedWordIds.length}</strong> từ vựng sang một bộ mới.
            </p>
            
            <div className="vocab-edit-fields" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="vocab-add-field">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Tên bộ từ mới *</label>
                <input
                  type="text"
                  value={newSetTitle}
                  onChange={(e) => setNewSetTitle(e.target.value)}
                  placeholder="Ví dụ: Từ vựng IELTS nâng cao"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div className="vocab-add-field">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Mô tả (tùy chọn)</label>
                <input
                  type="text"
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  placeholder="Mô tả về bộ từ vựng mới này"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="custom-confirm-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowSplitModal(false)} className="btn-ghost-confirm">Hủy</button>
              <button
                onClick={handleSplitSubmit}
                className="btn-danger-confirm"
                disabled={!newSetTitle.trim() || isSplitting}
                style={{ background: 'var(--color-accent-primary)' }}
              >
                {isSplitting ? 'Đang tách...' : 'Xác nhận tách'}
              </button>
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

        .vocab-word-edit:hover {
          background: var(--color-accent-glow);
          color: var(--color-accent-primary);
          border-color: rgba(16, 185, 129, 0.2);
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
