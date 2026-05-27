import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowLeft, CheckCircle, XCircle, ArrowRight, RotateCcw, Award, Loader, HelpCircle } from 'lucide-react';
import useAudio from '../../../hooks/useAudio';
import api from '../../../services/api';
import { toast } from 'sonner';

// Helper to normalize and clean strings for comparison
const normalizeString = (str) => {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

// Helper to generate a word-masked hint (e.g. "Hello world" -> "H____ w____")
const getMaskedHint = (sentence) => {
  return sentence
    .split(/\s+/)
    .map(word => {
      if (word.length <= 1) return word;
      
      // Separate punctuation at the end of the word
      const match = word.match(/^([a-zA-Z0-9'-]+)([^a-zA-Z0-9'-]*)$/);
      if (!match) return word;
      
      const cleanWord = match[1];
      const punctuation = match[2];
      
      if (cleanWord.length <= 2) {
        return cleanWord[0] + '_'.repeat(cleanWord.length - 1) + punctuation;
      }
      
      // Show first letter, mask the rest
      return cleanWord[0] + '_'.repeat(cleanWord.length - 1) + punctuation;
    })
    .join(' ');
};

export default function SentenceComplete({ task, onBack }) {
  const { isPlaying, rate, setRate, speak, stop, togglePlay } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null); // null, true, false
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const inputRef = useRef(null);

  // Auto focus input on mount and question change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isCompleted]);

  // Speak sentence on question change
  useEffect(() => {
    if (task && task.sentences && task.sentences.length > 0 && currentIndex < task.sentences.length && !isCompleted) {
      const timer = setTimeout(() => {
        speak(task.sentences[currentIndex].text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isCompleted]);

  const handleCheckAnswer = () => {
    if (isCorrect !== null || !userInput.trim()) return;

    const correctText = task.sentences[currentIndex].text;
    const isAnswerCorrect = normalizeString(userInput) === normalizeString(correctText);
    
    setIsCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isCorrect === null) {
        handleCheckAnswer();
      } else {
        handleNext();
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < task.sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setIsCorrect(null);
      setShowHint(false);
    } else {
      setIsCompleted(true);
      stop();
    }
  };

  const handleSkip = () => {
    setIsCorrect(false); // Mark as wrong
  };

  const handleSubmitResult = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/quiz/submit', {
        listeningTaskId: task._id,
        quizType: 'listening-complete',
        score,
        totalQuestions: task.sentences.length
      });
      setSubmitSuccess(true);
      toast.success('Đã lưu kết quả học tập thành công!');
    } catch (err) {
      console.error('Error submitting quiz progress:', err);
      toast.error('Lỗi khi lưu kết quả học tập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setUserInput('');
    setIsCorrect(null);
    setShowHint(false);
    setScore(0);
    setIsCompleted(false);
    setSubmitSuccess(false);
  };

  if (!task || !task.sentences || task.sentences.length === 0) {
    return (
      <div className="dictation-loading">
        <Loader className="spinning" size={32} />
        <p>Không tìm thấy nội dung bài học...</p>
      </div>
    );
  }

  const currentSentenceText = task.sentences[currentIndex].text;

  return (
    <div className="dictation-container animate-fade-in">
      {/* Header */}
      <div className="dict-header">
        <button onClick={onBack} className="btn-ghost dict-back-btn">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <span className="dict-progress-text">
          Câu {currentIndex + 1} / {task.sentences.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="dict-progress-bar-bg">
        <div 
          className="dict-progress-bar-fill" 
          style={{ width: `${(currentIndex / task.sentences.length) * 100}%` }}
        />
      </div>

      {!isCompleted ? (
        <div className="dict-card animate-scale-in">
          {/* Audio Playback Zone */}
          <div className="dict-audio-zone">
            <button 
              onClick={() => togglePlay(currentSentenceText)}
              className={`dict-audio-play-btn ${isPlaying ? 'playing' : ''}`}
              title="Phát giọng đọc"
            >
              {isPlaying ? <VolumeX size={32} /> : <Volume2 size={32} />}
              {isPlaying && <div className="dict-wave-ring" />}
            </button>
            <p className="dict-audio-hint">Nhấn Enter để nộp bài, Space để dừng/phát âm thanh</p>

            {/* Speed Configuration */}
            <div className="dict-speed-controls">
              <span className="dict-speed-label">Tốc độ đọc:</span>
              <button 
                onClick={() => setRate(0.6)} 
                className={`dict-speed-btn ${rate === 0.6 ? 'active' : ''}`}
              >
                Chậm (0.6x)
              </button>
              <button 
                onClick={() => setRate(0.8)} 
                className={`dict-speed-btn ${rate === 0.8 ? 'active' : ''}`}
              >
                Vừa (0.8x)
              </button>
              <button 
                onClick={() => setRate(1.0)} 
                className={`dict-speed-btn ${rate === 1.0 ? 'active' : ''}`}
              >
                Thường (1x)
              </button>
            </div>
          </div>

          {/* Typing Area */}
          <div className="dict-input-section">
            <label className="dict-input-label">Viết lại câu bạn nghe được:</label>
            <div className="dict-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isCorrect !== null}
                placeholder="Nhập câu tiếng Anh..."
                className={`dict-input ${isCorrect === true ? 'correct' : isCorrect === false ? 'incorrect' : ''}`}
              />
              {isCorrect === null && (
                <button 
                  onClick={handleCheckAnswer} 
                  disabled={!userInput.trim()} 
                  className="btn-primary dict-check-btn"
                >
                  Kiểm tra
                </button>
              )}
            </div>

            {/* Hint Zone */}
            <div className="dict-hint-zone">
              {showHint ? (
                <div className="dict-hint-text animate-fade-in">
                  <span>Gợi ý:</span> <code>{getMaskedHint(currentSentenceText)}</code>
                </div>
              ) : (
                isCorrect === null && (
                  <button 
                    onClick={() => setShowHint(true)} 
                    className="dict-hint-toggle-btn"
                  >
                    <HelpCircle size={14} /> Hiện gợi ý ký tự
                  </button>
                )
              )}
            </div>
          </div>

          {/* Answer Feedback */}
          {isCorrect !== null && (
            <div className="dict-feedback-card animate-scale-in">
              <div className="dict-feedback-header">
                {isCorrect ? (
                  <span className="dict-feedback-title correct">
                    <CheckCircle size={18} /> Chính xác! (+1 điểm)
                  </span>
                ) : (
                  <span className="dict-feedback-title incorrect">
                    <XCircle size={18} /> Chưa chính xác!
                  </span>
                )}
              </div>

              <div className="dict-feedback-body">
                <div className="dict-sentence-comparison">
                  <p className="dict-label">Đáp án đúng:</p>
                  <p className="dict-correct-sentence">{currentSentenceText}</p>
                </div>
                {!isCorrect && userInput.trim() && (
                  <div className="dict-sentence-comparison">
                    <p className="dict-label">Bạn đã viết:</p>
                    <p className="dict-user-sentence">{userInput}</p>
                  </div>
                )}
              </div>

              <div className="dict-feedback-actions">
                <button onClick={handleNext} className="btn-primary dict-next-btn">
                  {currentIndex === task.sentences.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Action triggers when unanswered */}
          {isCorrect === null && (
            <div className="dict-unanswered-actions">
              <button onClick={handleSkip} className="btn-ghost dict-skip-btn">
                Bỏ qua câu này
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results screen */
        <div className="dict-result-card animate-scale-in">
          <div className="dict-result-icon">
            <Award size={48} />
          </div>
          <h2>Hoàn thành bài chính tả!</h2>
          <p className="dict-result-subtitle">{task.title}</p>
          
          <div className="dict-score-grid">
            <div className="dict-score-box">
              <span className="dict-score-val">{score} / {task.sentences.length}</span>
              <span className="dict-score-lbl">Đúng</span>
            </div>
            <div className="dict-score-box">
              <span className="dict-score-val">{Math.round((score / task.sentences.length) * 100)}%</span>
              <span className="dict-score-lbl">Hoàn thành</span>
            </div>
          </div>

          <div className="dict-result-actions">
            {!submitSuccess ? (
              <button 
                onClick={handleSubmitResult} 
                disabled={isSubmitting}
                className="btn-primary dict-submit-btn"
              >
                {isSubmitting ? (
                  <><Loader className="spinning" size={16} /> Đang lưu...</>
                ) : (
                  'Lưu kết quả học tập'
                )}
              </button>
            ) : (
              <div className="dict-save-success">
                ✓ Đã lưu kết quả thành công!
              </div>
            )}
            
            <div className="dict-result-subactions">
              <button onClick={handleRetry} className="btn-ghost dict-retry-btn">
                <RotateCcw size={16} /> Luyện lại
              </button>
              <button onClick={onBack} className="btn-ghost dict-back-list-btn">
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dictation-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 1rem 0;
        }

        .dict-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .dict-back-btn {
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
        }

        .dict-progress-text {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .dict-progress-bar-bg {
          height: 6px;
          background: var(--color-bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .dict-progress-bar-fill {
          height: 100%;
          background: var(--gradient-accent);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .dict-card, .dict-result-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-card);
        }

        .dict-audio-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
        }

        .dict-audio-play-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          background: var(--gradient-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          box-shadow: var(--shadow-button);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }

        .dict-audio-play-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
        }

        .dict-audio-play-btn.playing {
          background: var(--color-error);
        }

        .dict-wave-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid var(--color-accent-primary);
          border-radius: 50%;
          animation: pulse-glow 1.5s infinite;
        }

        .dict-audio-play-btn.playing .dict-wave-ring {
          border-color: var(--color-error);
        }

        .dict-audio-hint {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 0.75rem;
          font-weight: 500;
          text-align: center;
        }

        .dict-speed-controls {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 1rem;
          background: var(--color-bg-primary);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-default);
        }

        .dict-speed-label {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          margin: 0 0.5rem;
          font-weight: 600;
        }

        .dict-speed-btn {
          background: transparent;
          border: none;
          font-family: inherit;
          color: var(--color-text-secondary);
          font-size: 0.7rem;
          padding: 0.375rem 0.625rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .dict-speed-btn:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-tertiary);
        }

        .dict-speed-btn.active {
          background: var(--color-accent-primary);
          color: white;
        }

        .dict-input-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .dict-input-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-secondary);
        }

        .dict-input-wrapper {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }

        .dict-input {
          flex: 1;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.875rem 1rem;
          color: var(--color-text-primary);
          font-family: inherit;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .dict-input:focus {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px var(--color-accent-glow);
        }

        .dict-input.correct {
          border-color: var(--color-success);
          background: var(--color-success-bg);
        }

        .dict-input.incorrect {
          border-color: var(--color-error);
          background: var(--color-error-bg);
        }

        .dict-check-btn {
          padding: 0 1.5rem;
          flex-shrink: 0;
        }

        .dict-hint-zone {
          min-height: 24px;
        }

        .dict-hint-toggle-btn {
          background: transparent;
          border: none;
          color: var(--color-accent-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0;
          font-family: inherit;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .dict-hint-toggle-btn:hover {
          text-decoration: underline;
        }

        .dict-hint-text {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .dict-hint-text span {
          font-weight: 700;
          color: var(--color-accent-secondary);
          margin-right: 0.5rem;
        }

        .dict-hint-text code {
          background: var(--color-bg-primary);
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-sm);
          letter-spacing: 0.05em;
          border: 1px solid var(--color-border-default);
        }

        .dict-feedback-card {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .dict-feedback-header {
          margin-bottom: 0.75rem;
        }

        .dict-feedback-title {
          font-size: 0.9375rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }

        .dict-feedback-title.correct {
          color: var(--color-success);
        }

        .dict-feedback-title.incorrect {
          color: var(--color-error);
        }

        .dict-feedback-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .dict-sentence-comparison {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dict-label {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }

        .dict-correct-sentence {
          font-size: 0.9375rem;
          color: var(--color-success);
          font-weight: 600;
        }

        .dict-user-sentence {
          font-size: 0.9375rem;
          color: var(--color-error);
          font-weight: 500;
          text-decoration: line-through;
          opacity: 0.8;
        }

        .dict-feedback-actions {
          display: flex;
          justify-content: flex-end;
        }

        .dict-next-btn {
          padding: 0.75rem 1.25rem;
        }

        .dict-unanswered-actions {
          display: flex;
          justify-content: flex-start;
        }

        .dict-skip-btn {
          font-size: 0.8125rem;
          padding: 0.5rem 0.875rem;
        }

        /* Results CSS */
        .dict-result-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .dict-result-icon {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: var(--color-accent-glow);
          color: var(--color-accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border: 1px solid var(--color-border-accent);
          animation: pulse-glow 2s infinite;
        }

        .dict-result-card h2 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .dict-result-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 1.75rem;
        }

        .dict-score-grid {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          width: 100%;
          max-width: 360px;
        }

        .dict-score-box {
          flex: 1;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }

        .dict-score-val {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-accent-primary);
          line-height: 1.2;
        }

        .dict-score-lbl {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 600;
          margin-top: 0.25rem;
          text-transform: uppercase;
        }

        .dict-result-actions {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dict-submit-btn {
          width: 100%;
          padding: 0.875rem;
          justify-content: center;
          font-size: 0.9375rem;
        }

        .dict-save-success {
          background: var(--color-success-bg);
          color: var(--color-success);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .dict-result-subactions {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }

        .dict-retry-btn, .dict-back-list-btn {
          flex: 1;
          padding: 0.75rem;
          justify-content: center;
          font-size: 0.8125rem;
        }

        .dictation-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--color-text-secondary);
          gap: 0.75rem;
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
