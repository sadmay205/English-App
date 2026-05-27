import { useState, useEffect } from 'react';
import { Brain, BookOpen, PenLine, ArrowRight, Loader, Sparkles, Clock, ListOrdered } from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';
import useVocabStore from '../../../store/useVocabStore';
import MultipleChoice from './MultipleChoice';
import FillInBlank from './FillInBlank';
import MatchingGame from './MatchingGame';

export default function QuizContainer() {
  const { questions, quizType, generateQuiz, resetQuiz, isLoading, error } = useQuizStore();
  const { vocabSets, fetchSets } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [selectedType, setSelectedType] = useState('multiple-choice');
  const [questionCount, setQuestionCount] = useState(10); // 5, 10, 20, 9999 (tất cả)
  const [timeLimit, setTimeLimit] = useState(null); // null (không giới hạn), 30, 60, 120, 300

  useEffect(() => {
    fetchSets();
  }, []);

  const handleStartQuiz = async () => {
    if (!selectedSetId) return;
    const selectedSet = vocabSets.find(s => s._id === selectedSetId);
    const totalWords = selectedSet ? (selectedSet.wordCount || 10) : 10;
    const count = questionCount === 9999 ? totalWords : questionCount;
    await generateQuiz(selectedSetId, selectedType, count, timeLimit);
  };

  // If quiz is in progress, show the quiz component
  if (questions.length > 0) {
    if (quizType === 'matching') {
      return <MatchingGame />;
    }
    return quizType === 'fill-blank' ? <FillInBlank /> : <MultipleChoice />;
  }


  return (
    <div className="quiz-setup animate-fade-in">
      <h2 className="quiz-setup-title">🧠 Kiểm tra Từ vựng</h2>
      <p className="quiz-setup-subtitle">Chọn bộ từ vựng và dạng bài kiểm tra</p>

      {/* Quiz Type Selection */}
      <div className="quiz-type-grid">
        <button
          className={`quiz-type-card ${selectedType === 'multiple-choice' ? 'active' : ''}`}
          onClick={() => setSelectedType('multiple-choice')}
        >
          <div className="quiz-type-icon">
            <Brain size={24} />
          </div>
          <h3>Trắc nghiệm</h3>
          <p>Chọn nghĩa tiếng Việt</p>
        </button>

        <button
          className={`quiz-type-card ${selectedType === 'fill-blank' ? 'active' : ''}`}
          onClick={() => setSelectedType('fill-blank')}
        >
          <div className="quiz-type-icon">
            <PenLine size={24} />
          </div>
          <h3>Điền từ</h3>
          <p>Gõ từ tiếng Anh</p>
        </button>

        <button
          className={`quiz-type-card ${selectedType === 'matching' ? 'active' : ''}`}
          onClick={() => setSelectedType('matching')}
        >
          <div className="quiz-type-icon">
            <Sparkles size={24} />
          </div>
          <h3>Ghép từ</h3>
          <p>Nối từ tiếng Anh - Việt</p>
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

      <style>{`
        .quiz-setup {
          max-width: 600px;
          margin: 0 auto;
        }

        .quiz-setup-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .quiz-setup-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 1.5rem;
        }

        .quiz-type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .quiz-options-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        @media (max-width: 480px) {
          .quiz-type-grid {
            grid-template-columns: 1fr;
          }
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
          padding: 0.5rem;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 0.75rem;
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
          padding: 1.25rem 0.5rem;
          background: var(--color-bg-card);
          border: 2px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
          font-family: inherit;
        }

        .quiz-type-card:hover {
          border-color: var(--color-border-accent);
        }

        .quiz-type-card.active {
          border-color: var(--color-accent-primary);
          background: var(--color-accent-glow);
        }

        .quiz-type-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--color-bg-tertiary);
          color: var(--color-accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.75rem;
        }

        .quiz-type-card.active .quiz-type-icon {
          background: var(--gradient-accent);
          color: white;
        }

        .quiz-type-card h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .quiz-type-card p {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .quiz-select-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.75rem;
        }

        .quiz-set-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin-bottom: 1.5rem;
          max-height: 240px;
          overflow-y: auto;
        }

        .quiz-set-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
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
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .quiz-set-count {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .quiz-set-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-accent-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .quiz-empty {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted);
        }

        .quiz-empty p {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .quiz-error {
          color: var(--color-error);
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .quiz-start-btn {
          width: 100%;
          justify-content: center;
          padding: 0.875rem;
          font-size: 1rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
