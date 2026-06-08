import { useState, useEffect } from 'react';
import { Brain, BookOpen, PenLine, ArrowRight, ArrowLeft, Loader, Sparkles, Clock, ListOrdered, Sliders, CheckSquare, Square } from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';
import useVocabStore from '../../../store/useVocabStore';
import MultipleChoice from './MultipleChoice';
import FillInBlank from './FillInBlank';
import MatchingGame from './MatchingGame';
import CustomQuizRunner from './CustomQuizRunner';

export default function QuizContainer() {
  const { questions, quizType, generateQuiz, generateCustomQuiz, resetQuiz, isLoading, error } = useQuizStore();
  const { vocabSets, fetchSets, vocabularies, currentSet, fetchSetById, isLoading: vocabStoreLoading } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [selectedType, setSelectedType] = useState('multiple-choice-vie');
  const [questionCount, setQuestionCount] = useState(10); // 5, 10, 20, 9999 (tất cả)
  const [timeLimit, setTimeLimit] = useState(null); // null (không giới hạn), 30, 60, 120, 300
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  // State for Custom Quiz config
  const [customCounts, setCustomCounts] = useState({
    'multiple-choice-vie': 5,
    'multiple-choice-en': 0,
    'fill-blank': 5,
    'fill-blank-en': 0,
    'matching': 0,
    'matching-en': 0
  });
  const [selectedWordIds, setSelectedWordIds] = useState([]);

  useEffect(() => {
    fetchSets();
  }, []);

  // Fetch words list for custom configuration if custom type is chosen
  useEffect(() => {
    if (selectedSetId && selectedType === 'custom') {
      fetchSetById(selectedSetId);
    }
  }, [selectedSetId, selectedType]);

  // Pre-select all words when vocabulary list is loaded
  useEffect(() => {
    if (selectedType === 'custom' && vocabularies && vocabularies.length > 0 && currentSet?._id === selectedSetId) {
      setSelectedWordIds(vocabularies.map(v => v._id));
    } else {
      setSelectedWordIds([]);
    }
  }, [vocabularies, currentSet, selectedType, selectedSetId]);

  const handleStartQuiz = async () => {
    if (!selectedSetId) return;

    if (selectedType === 'custom') {
      const totalCount = Object.values(customCounts).reduce((sum, val) => sum + val, 0);
      if (totalCount <= 0) {
        useQuizStore.setState({ error: 'Vui lòng chọn ít nhất 1 câu hỏi cho bài kiểm tra tùy chỉnh' });
        return;
      }
      if (selectedWordIds.length === 0) {
        useQuizStore.setState({ error: 'Vui lòng chọn ít nhất 1 từ vựng muốn ôn tập' });
        return;
      }
      await generateCustomQuiz(selectedSetId, customCounts, selectedWordIds, timeLimit);
    } else {
      const selectedSet = vocabSets.find(s => s._id === selectedSetId);
      const totalWords = selectedSet ? (selectedSet.wordCount || 10) : 10;
      const count = questionCount === 9999 ? totalWords : questionCount;
      await generateQuiz(selectedSetId, selectedType, count, timeLimit);
    }
  };

  const handleCountChange = (type, value) => {
    setCustomCounts(prev => ({
      ...prev,
      [type]: Math.max(0, value)
    }));
  };

  const handleToggleWord = (wordId) => {
    setSelectedWordIds(prev => {
      if (prev.includes(wordId)) {
        return prev.filter(id => id !== wordId);
      } else {
        return [...prev, wordId];
      }
    });
  };

  const handleSelectAllWords = () => {
    setSelectedWordIds(vocabularies.map(v => v._id));
  };

  const handleDeselectAllWords = () => {
    setSelectedWordIds([]);
  };

  // If quiz is in progress, show the quiz component
  if (questions.length > 0) {
    if (quizType === 'custom') {
      return <CustomQuizRunner />;
    }
    if (quizType === 'matching' || quizType === 'matching-en') {
      return <MatchingGame />;
    }
    return (quizType === 'fill-blank' || quizType === 'fill-blank-en') ? <FillInBlank /> : <MultipleChoice />;
  }

  return (
    <div className="quiz-setup animate-fade-in">
      {showCustomConfig ? (
        <>
          <button
            onClick={() => {
              setShowCustomConfig(false);
              setSelectedType('multiple-choice-vie');
              useQuizStore.setState({ error: null });
            }}
            className="btn-ghost"
            style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft size={14} /> Quay lại chọn dạng bài
          </button>

          <h2 className="quiz-setup-title">⚙️ Thiết lập bài kiểm tra tùy chỉnh</h2>
          <p className="quiz-setup-subtitle" style={{ marginBottom: '1.25rem' }}>
            Tự do kết hợp các dạng bài kiểm tra, lựa chọn từ vựng cụ thể và giới hạn thời gian học tập.
          </p>

          {/* Step 1: Select vocab set */}
          <h3 className="quiz-select-label">Bước 1: Chọn bộ từ vựng:</h3>
          {vocabSets.length === 0 ? (
            <div className="quiz-empty">
              <BookOpen size={32} />
              <p>Chưa có bộ từ vựng. Hãy tạo bộ từ vựng trước!</p>
            </div>
          ) : (
            <div className="quiz-set-list" style={{ maxHeight: '180px', marginBottom: '1.25rem' }}>
              {vocabSets.map((set) => (
                <button
                  key={set._id}
                  className={`quiz-set-item ${selectedSetId === set._id ? 'active' : ''}`}
                  onClick={() => setSelectedSetId(set._id)}
                >
                  <BookOpen size={18} />
                  <div className="quiz-set-info">
                    <span className="quiz-set-name">{set.title}</span>
                    <span className="quiz-set-count">{set.wordCount || 0} từ</span>
                  </div>
                  {selectedSetId === set._id && <div className="quiz-set-check">✓</div>}
                </button>
              ))}
            </div>
          )}

          {/* Step 2-4: Custom config if set is selected */}
          {selectedSetId && (
            <div className="custom-config-card card animate-fade-in" style={{ marginBottom: '1.25rem' }}>
              <h3 className="quiz-select-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', marginBottom: '1rem' }}>
                <Sliders size={18} style={{ color: 'var(--color-accent-primary)' }} /> Cấu hình chi tiết
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Counts Config */}
                <div>
                  <label className="quiz-select-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Bước 2: Số câu hỏi mỗi loại:
                  </label>
                  <div className="custom-counts-grid">
                    <div className="custom-count-item">
                      <span>Trắc nghiệm Việt:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customCounts['multiple-choice-vie']}
                        onChange={(e) => handleCountChange('multiple-choice-vie', parseInt(e.target.value) || 0)}
                        className="custom-count-input"
                      />
                    </div>
                    <div className="custom-count-item">
                      <span>Trắc nghiệm Anh:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customCounts['multiple-choice-en']}
                        onChange={(e) => handleCountChange('multiple-choice-en', parseInt(e.target.value) || 0)}
                        className="custom-count-input"
                      />
                    </div>
                    <div className="custom-count-item">
                      <span>Điền từ Việt:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customCounts['fill-blank']}
                        onChange={(e) => handleCountChange('fill-blank', parseInt(e.target.value) || 0)}
                        className="custom-count-input"
                      />
                    </div>
                    <div className="custom-count-item">
                      <span>Điền từ Anh:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customCounts['fill-blank-en']}
                        onChange={(e) => handleCountChange('fill-blank-en', parseInt(e.target.value) || 0)}
                        className="custom-count-input"
                      />
                    </div>
                    <div className="custom-count-item">
                      <span>Ghép từ Việt:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customCounts['matching']}
                        onChange={(e) => handleCountChange('matching', parseInt(e.target.value) || 0)}
                        className="custom-count-input"
                      />
                    </div>
                    <div className="custom-count-item">
                      <span>Ghép từ Anh:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customCounts['matching-en']}
                        onChange={(e) => handleCountChange('matching-en', parseInt(e.target.value) || 0)}
                        className="custom-count-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="quiz-select-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <Clock size={14} /> Bước 3: Thời gian giới hạn:
                  </label>
                  <div className="quiz-options-buttons">
                    {[
                      { label: 'Vô hạn', value: null },
                      { label: '1p', value: 60 },
                      { label: '2p', value: 120 },
                      { label: '5p', value: 300 },
                      { label: '10p', value: 600 }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        className={`quiz-opt-btn ${timeLimit === opt.value ? 'active' : ''}`}
                        onClick={() => setTimeLimit(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vocab Selection */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="quiz-select-label" style={{ margin: 0, fontSize: '0.875rem' }}>
                      Bước 4: Từ vựng ôn tập ({selectedWordIds.length}/{vocabularies.length}):
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllWords}
                        className="btn-link"
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllWords}
                        className="btn-link"
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  </div>

                  {vocabStoreLoading ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      <Loader size={16} className="spinning" /> Đang tải từ vựng...
                    </div>
                  ) : vocabularies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      Không có từ vựng trong bộ này
                    </div>
                  ) : (
                    <div className="custom-vocab-scroll-list">
                      {vocabularies.map((vocab) => {
                        const isChecked = selectedWordIds.includes(vocab._id);
                        return (
                          <button
                            key={vocab._id}
                            type="button"
                            onClick={() => handleToggleWord(vocab._id)}
                            className={`custom-vocab-checkbox-item ${isChecked ? 'checked' : ''}`}
                          >
                            <div className="custom-checkbox-box">
                              {isChecked ? <CheckSquare size={16} style={{ color: 'var(--color-accent-primary)' }} /> : <Square size={16} />}
                            </div>
                            <div className="custom-vocab-item-text">
                              <span className="custom-vocab-item-word">{vocab.word}</span>
                              <span className="custom-vocab-item-meaning">{vocab.meaningVi}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="quiz-error">{error}</p>}

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            className="btn-primary quiz-start-btn"
            disabled={!selectedSetId || isLoading}
          >
            {isLoading ? (
              <><Loader size={16} className="spinning" /> Đang tạo...</>
            ) : (
              <>Bắt đầu kiểm tra <ArrowRight size={16} /></>
            )}
          </button>
        </>
      ) : (
        <>
          <h2 className="quiz-setup-title">🧠 Kiểm tra Từ vựng</h2>
          <p className="quiz-setup-subtitle">Chọn bộ từ vựng và dạng bài kiểm tra</p>

          {/* Quiz Type Selection */}
          <div className="quiz-type-grid">
            <button
              className={`quiz-type-card ${selectedType === 'multiple-choice-vie' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('multiple-choice-vie');
                setShowCustomConfig(false);
              }}
            >
              <div className="quiz-type-icon">
                <Brain size={18} />
              </div>
              <h3>Trắc nghiệm Việt</h3>
              <p>Chọn nghĩa tiếng Việt</p>
            </button>

            <button
              className={`quiz-type-card ${selectedType === 'multiple-choice-en' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('multiple-choice-en');
                setShowCustomConfig(false);
              }}
            >
              <div className="quiz-type-icon">
                <BookOpen size={18} />
              </div>
              <h3>Trắc nghiệm Anh</h3>
              <p>Chọn định nghĩa tiếng Anh</p>
            </button>

            <button
              className={`quiz-type-card ${selectedType === 'fill-blank' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('fill-blank');
                setShowCustomConfig(false);
              }}
            >
              <div className="quiz-type-icon">
                <PenLine size={18} />
              </div>
              <h3>Điền từ (Việt)</h3>
              <p>Dựa trên nghĩa tiếng Việt</p>
            </button>

            <button
              className={`quiz-type-card ${selectedType === 'fill-blank-en' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('fill-blank-en');
                setShowCustomConfig(false);
              }}
            >
              <div className="quiz-type-icon">
                <PenLine size={18} />
              </div>
              <h3>Điền từ (Định nghĩa)</h3>
              <p>Dựa trên định nghĩa Anh</p>
            </button>

            <button
              className={`quiz-type-card ${selectedType === 'matching' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('matching');
                setShowCustomConfig(false);
              }}
            >
              <div className="quiz-type-icon">
                <Sparkles size={18} />
              </div>
              <h3>Ghép từ (Việt)</h3>
              <p>Nối từ tiếng Anh - Việt</p>
            </button>

            <button
              className={`quiz-type-card ${selectedType === 'matching-en' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('matching-en');
                setShowCustomConfig(false);
              }}
            >
              <div className="quiz-type-icon">
                <Sparkles size={18} />
              </div>
              <h3>Ghép từ (Định nghĩa)</h3>
              <p>Nối từ - Định nghĩa Anh</p>
            </button>

            <button
              className={`quiz-type-card ${selectedType === 'custom' ? 'active' : ''}`}
              onClick={() => {
                setSelectedType('custom');
                setShowCustomConfig(true);
              }}
            >
              <div className="quiz-type-icon">
                <Sliders size={18} />
              </div>
              <h3>Kiểm tra Tùy chỉnh</h3>
              <p>Cấu hình dạng bài, số câu, từ vựng và thời gian</p>
            </button>
          </div>

          {/* Quiz Options */}
          <div className="quiz-options-container">
            <div className="quiz-option-group">
              <label className="quiz-select-label" style={{ marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ListOrdered size={14} /> Số lượng câu hỏi:
              </label>
              <div className="quiz-options-buttons">
                {[5, 10, 20, 9999].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`quiz-opt-btn ${questionCount === count ? 'active' : ''}`}
                    onClick={() => setQuestionCount(count)}
                  >
                    {count === 9999 ? 'Tất cả' : count}
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-option-group">
              <label className="quiz-select-label" style={{ marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Thời gian giới hạn:
              </label>
              <div className="quiz-options-buttons">
                {[
                  { label: 'Vô hạn', value: null },
                  { label: '1p', value: 60 },
                  { label: '2p', value: 120 },
                  { label: '5p', value: 300 },
                  { label: '10p', value: 600 }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={`quiz-opt-btn ${timeLimit === opt.value ? 'active' : ''}`}
                    onClick={() => setTimeLimit(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Set Selection */}
          <h3 className="quiz-select-label">Chọn bộ từ vựng:</h3>
          {vocabSets.length === 0 ? (
            <div className="quiz-empty">
              <BookOpen size={32} />
              <p>Chưa có bộ từ vựng. Hãy tạo bộ từ vựng trước!</p>
            </div>
          ) : (
            <div className="quiz-set-list">
              {vocabSets.map((set) => (
                <button
                  key={set._id}
                  className={`quiz-set-item ${selectedSetId === set._id ? 'active' : ''}`}
                  onClick={() => setSelectedSetId(set._id)}
                >
                  <BookOpen size={18} />
                  <div className="quiz-set-info">
                    <span className="quiz-set-name">{set.title}</span>
                    <span className="quiz-set-count">{set.wordCount || 0} từ</span>
                  </div>
                  {selectedSetId === set._id && <div className="quiz-set-check">✓</div>}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <p className="quiz-error">{error}</p>}

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            className="btn-primary quiz-start-btn"
            disabled={!selectedSetId || isLoading}
          >
            {isLoading ? (
              <><Loader size={16} className="spinning" /> Đang tạo...</>
            ) : (
              <>Bắt đầu kiểm tra <ArrowRight size={16} /></>
            )}
          </button>
        </>
      )}

      <style>{`
        .quiz-setup {
          max-width: 680px;
          margin: 0 auto;
        }

        .quiz-setup-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.25rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }

        .quiz-setup-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 1.5rem;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.6);
        }

        .quiz-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.625rem;
          margin-bottom: 1.25rem;
        }

        .quiz-options-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        @media (max-width: 480px) {
          .quiz-options-container {
            grid-template-columns: 1fr;
          }
        }

        .quiz-option-group {
          display: flex;
          flex-direction: column;
        }

        .quiz-options-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .quiz-opt-btn {
          flex: 1;
          min-width: 50px;
          padding: 0.45rem;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 0.725rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-opt-btn:hover {
          border-color: var(--color-border-accent);
          color: var(--color-text-primary);
        }

        .quiz-opt-btn.active {
          background: var(--color-accent-glow);
          border-color: var(--color-accent-primary);
          color: var(--color-accent-primary);
        }

        .quiz-type-card {
          padding: 0.875rem 0.5rem;
          background: var(--color-bg-card);
          border: 1.5px solid var(--color-border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 112px;
        }

        .quiz-type-card:hover {
          border-color: var(--color-border-accent);
          transform: translateY(-1px);
        }

        .quiz-type-card.active {
          border-color: var(--color-accent-primary);
          background: var(--color-accent-glow);
        }

        .quiz-type-icon {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-tertiary);
          color: var(--color-accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.5rem;
        }

        .quiz-type-card.active .quiz-type-icon {
          background: var(--gradient-accent);
          color: white;
        }

        .quiz-type-card h3 {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.125rem;
          line-height: 1.2;
        }

        .quiz-type-card p {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          line-height: 1.2;
        }

        .quiz-select-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        }

        .quiz-set-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin-bottom: 1.25rem;
          max-height: 180px;
          overflow-y: auto;
        }

        .quiz-set-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          text-align: left;
          width: 100%;
          color: var(--color-text-muted);
        }

        .quiz-set-item:hover {
          border-color: var(--color-border-accent);
        }

        .quiz-set-item.active {
          border-color: var(--color-accent-primary);
          background: var(--color-accent-glow);
        }

        .quiz-set-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .quiz-set-name {
          font-size: 0.78125rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .quiz-set-count {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }

        .quiz-set-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-accent-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .quiz-empty {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted);
        }

        .quiz-empty p {
          font-size: 0.8125rem;
          margin-top: 0.5rem;
        }

        .quiz-error {
          color: var(--color-error);
          font-size: 0.78125rem;
          margin-bottom: 1rem;
        }

        .quiz-start-btn {
          width: 100%;
          justify-content: center;
          padding: 0.75rem;
          font-size: 0.9375rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Custom Quiz CSS styling */
        .custom-config-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }

        .custom-counts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        @media (max-width: 480px) {
          .custom-counts-grid {
            grid-template-columns: 1fr;
          }
        }

        .custom-count-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }

        .custom-count-item span {
          font-size: 0.78125rem;
          color: var(--color-text-secondary);
          font-weight: 600;
        }

        .custom-count-input {
          width: 60px;
          padding: 0.375rem;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          color: var(--color-text-primary);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
        }

        .custom-count-input:focus {
          border-color: var(--color-accent-primary);
        }

        .custom-vocab-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          max-height: 180px;
          overflow-y: auto;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.5rem;
          margin-top: 0.25rem;
        }

        .custom-vocab-checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.75rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          font-family: inherit;
          text-align: left;
          color: var(--color-text-muted);
        }

        .custom-vocab-checkbox-item:hover {
          border-color: var(--color-border-accent);
          background: var(--color-bg-hover);
        }

        .custom-vocab-checkbox-item.checked {
          border-color: var(--color-accent-primary);
          background: var(--color-accent-glow);
          color: var(--color-text-primary);
        }

        .custom-checkbox-box {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .custom-vocab-checkbox-item.checked .custom-checkbox-box {
          color: var(--color-accent-primary);
        }

        .custom-vocab-item-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .custom-vocab-item-word {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .custom-vocab-item-meaning {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
