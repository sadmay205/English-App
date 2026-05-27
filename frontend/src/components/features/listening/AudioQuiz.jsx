import { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, CheckCircle, XCircle, ArrowRight, RotateCcw, Award, Loader } from 'lucide-react';
import useAudio from '../../../hooks/useAudio';
import api from '../../../services/api';
import { toast } from 'sonner';

// Helper to shuffle an array
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function AudioQuiz({ task, onBack }) {
  const { isPlaying, rate, setRate, speak, stop, togglePlay } = useAudio();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Generate all questions options on mount
  useEffect(() => {
    if (task && task.sentences && task.sentences.length > 0) {
      const generated = task.sentences.map((sentence, idx) => {
        const correctText = sentence.text;
        
        // Filter out the correct answer to get other options
        const otherTexts = task.sentences
          .filter((_, sIdx) => sIdx !== idx)
          .map(s => s.text);
          
        // Shuffle other texts
        let wrongOptions = shuffleArray(otherTexts).slice(0, 3);
        
        // Fallbacks if not enough sentences in the paragraph
        const fallbacks = [
          "This is an alternative option for listening practice.",
          "Please listen carefully to the sentence spoken by the teacher.",
          "Make sure to practice English spelling and pronunciation daily.",
          "Learning English with AI is interactive and fun."
        ];
        
        let fallbackIdx = 0;
        while (wrongOptions.length < 3) {
          const fb = fallbacks[fallbackIdx % fallbacks.length];
          if (!wrongOptions.includes(fb) && fb !== correctText) {
            wrongOptions.push(fb);
          }
          fallbackIdx++;
        }
        
        // Shuffle the options together
        const options = shuffleArray([...wrongOptions, correctText]);
        const correctIndex = options.indexOf(correctText);
        
        return {
          correctText,
          options,
          correctIndex
        };
      });
      
      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedOption(null);
      setScore(0);
      setIsCompleted(false);
      setSubmitSuccess(false);
    }
  }, [task]);

  // Speak the sentence when the current question changes
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length && !isCompleted) {
      // Small timeout to allow state to settle
      const timer = setTimeout(() => {
        speak(task.sentences[currentIndex].text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, questions, isCompleted]);

  const handleSelectOption = (optionIndex) => {
    if (selectedOption !== null) return; // Answered already
    
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
      stop();
    }
  };

  const handleSubmitResult = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/quiz/submit', {
        listeningTaskId: task._id,
        quizType: 'listening-quiz',
        score,
        totalQuestions: questions.length
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
    // Regenerate options
    if (task && task.sentences) {
      const generated = task.sentences.map((sentence, idx) => {
        const correctText = sentence.text;
        const otherTexts = task.sentences.filter((_, sIdx) => sIdx !== idx).map(s => s.text);
        let wrongOptions = shuffleArray(otherTexts).slice(0, 3);
        const fallbacks = [
          "This is an alternative option for listening practice.",
          "Please listen carefully to the sentence spoken by the teacher.",
          "Make sure to practice English spelling daily."
        ];
        let fIdx = 0;
        while (wrongOptions.length < 3) {
          wrongOptions.push(fallbacks[fIdx % fallbacks.length]);
          fIdx++;
        }
        const options = shuffleArray([...wrongOptions, correctText]);
        return {
          correctText,
          options,
          correctIndex: options.indexOf(correctText)
        };
      });
      setQuestions(generated);
    }
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsCompleted(false);
    setSubmitSuccess(false);
  };

  if (questions.length === 0) {
    return (
      <div className="audio-quiz-loading">
        <Loader className="spinning" size={32} />
        <p>Đang tải câu hỏi nghe...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const sentenceText = task.sentences[currentIndex].text;

  return (
    <div className="audio-quiz-container animate-fade-in">
      {/* Header */}
      <div className="aq-header">
        <button onClick={onBack} className="btn-ghost aq-back-btn">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <span className="aq-progress-text">
          Câu {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="aq-progress-bar-bg">
        <div 
          className="aq-progress-bar-fill" 
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      {!isCompleted ? (
        <div className="aq-card animate-scale-in">
          {/* Audio Controls */}
          <div className="aq-audio-zone">
            <button 
              onClick={() => togglePlay(sentenceText)} 
              className={`aq-audio-play-btn ${isPlaying ? 'playing' : ''}`}
              title="Phát giọng đọc"
            >
              {isPlaying ? <VolumeX size={32} /> : <Volume2 size={32} />}
              {isPlaying && <div className="aq-wave-ring" />}
            </button>
            <p className="aq-audio-hint">Nhấp để nghe lại câu đọc</p>

            {/* Speed selection */}
            <div className="aq-speed-controls">
              <span className="aq-speed-label">Tốc độ đọc:</span>
              <button 
                onClick={() => setRate(0.6)} 
                className={`aq-speed-btn ${rate === 0.6 ? 'active' : ''}`}
              >
                Chậm (0.6x)
              </button>
              <button 
                onClick={() => setRate(0.85)} 
                className={`aq-speed-btn ${rate === 0.85 ? 'active' : ''}`}
              >
                Vừa (0.85x)
              </button>
              <button 
                onClick={() => setRate(1.0)} 
                className={`aq-speed-btn ${rate === 1.0 ? 'active' : ''}`}
              >
                Thường (1x)
              </button>
            </div>
          </div>

          <h3 className="aq-question-title">Chọn câu bạn nghe được:</h3>

          {/* Options Grid */}
          <div className="aq-options-list">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              let optionClass = '';
              
              if (selectedOption !== null) {
                if (isCorrect) {
                  optionClass = 'correct'; // Show green for correct answer
                } else if (isSelected) {
                  optionClass = 'incorrect'; // Show red for wrong selection
                } else {
                  optionClass = 'disabled';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={selectedOption !== null}
                  className={`aq-option-btn ${optionClass}`}
                >
                  <span className="aq-option-letter">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="aq-option-text">{option}</span>
                  {selectedOption !== null && isCorrect && (
                    <CheckCircle className="aq-status-icon correct-icon" size={18} />
                  )}
                  {selectedOption !== null && isSelected && !isCorrect && (
                    <XCircle className="aq-status-icon incorrect-icon" size={18} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {selectedOption !== null && (
            <div className="aq-footer-action animate-fade-in">
              <div className="aq-explanation">
                <span className={`aq-result-label ${selectedOption === currentQuestion.correctIndex ? 'success' : 'error'}`}>
                  {selectedOption === currentQuestion.correctIndex ? 'Chính xác! 🎉' : 'Chưa chính xác! 😢'}
                </span>
              </div>
              <button onClick={handleNext} className="btn-primary aq-next-btn">
                {currentIndex === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results screen */
        <div className="aq-result-card animate-scale-in">
          <div className="aq-result-icon">
            <Award size={48} />
          </div>
          <h2>Hoàn thành bài luyện nghe!</h2>
          <p className="aq-result-subtitle">{task.title}</p>
          
          <div className="aq-score-grid">
            <div className="aq-score-box">
              <span className="aq-score-val">{score} / {questions.length}</span>
              <span className="aq-score-lbl">Đúng</span>
            </div>
            <div className="aq-score-box">
              <span className="aq-score-val">{Math.round((score / questions.length) * 100)}%</span>
              <span className="aq-score-lbl">Tỉ lệ chính xác</span>
            </div>
          </div>

          <div className="aq-result-actions">
            {!submitSuccess ? (
              <button 
                onClick={handleSubmitResult} 
                disabled={isSubmitting}
                className="btn-primary aq-submit-btn"
              >
                {isSubmitting ? (
                  <><Loader className="spinning" size={16} /> Đang lưu...</>
                ) : (
                  'Lưu kết quả học tập'
                )}
              </button>
            ) : (
              <div className="aq-save-success">
                ✓ Đã lưu kết quả vào tiến độ của bạn!
              </div>
            )}
            
            <div className="aq-result-subactions">
              <button onClick={handleRetry} className="btn-ghost aq-retry-btn">
                <RotateCcw size={16} /> Làm lại
              </button>
              <button onClick={onBack} className="btn-ghost aq-back-list-btn">
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .audio-quiz-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 1rem 0;
        }

        .aq-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .aq-back-btn {
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
        }

        .aq-progress-text {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .aq-progress-bar-bg {
          height: 6px;
          background: var(--color-bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .aq-progress-bar-fill {
          height: 100%;
          background: var(--gradient-accent);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .aq-card, .aq-result-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-card);
        }

        .aq-audio-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
        }

        .aq-audio-play-btn {
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

        .aq-audio-play-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
        }

        .aq-audio-play-btn.playing {
          background: var(--color-error);
        }

        .aq-wave-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid var(--color-accent-primary);
          border-radius: 50%;
          animation: pulse-glow 1.5s infinite;
        }

        .aq-audio-play-btn.playing .aq-wave-ring {
          border-color: var(--color-error);
          animation: pulse-glow 1.5s infinite;
        }

        .aq-audio-hint {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 0.75rem;
          font-weight: 500;
        }

        .aq-speed-controls {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 1rem;
          background: var(--color-bg-primary);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-default);
        }

        .aq-speed-label {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          margin: 0 0.5rem;
          font-weight: 600;
        }

        .aq-speed-btn {
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

        .aq-speed-btn:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-tertiary);
        }

        .aq-speed-btn.active {
          background: var(--color-accent-primary);
          color: white;
        }

        .aq-question-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 1rem;
        }

        .aq-options-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-bottom: 1.5rem;
        }

        .aq-option-btn {
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.875rem 1.25rem;
          color: var(--color-text-primary);
          font-family: inherit;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .aq-option-btn:hover:not(:disabled) {
          border-color: var(--color-border-accent);
          background: var(--color-bg-hover);
        }

        .aq-option-letter {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-primary);
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          margin-right: 0.875rem;
          flex-shrink: 0;
        }

        .aq-option-text {
          flex: 1;
          margin-right: 1.5rem;
          line-height: 1.4;
        }

        .aq-option-btn.correct {
          border-color: var(--color-success);
          background: var(--color-success-bg);
        }

        .aq-option-btn.correct .aq-option-letter {
          background: var(--color-success);
          color: white;
        }

        .aq-option-btn.incorrect {
          border-color: var(--color-error);
          background: var(--color-error-bg);
        }

        .aq-option-btn.incorrect .aq-option-letter {
          background: var(--color-error);
          color: white;
        }

        .aq-option-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .aq-status-icon {
          flex-shrink: 0;
        }

        .correct-icon {
          color: var(--color-success);
        }

        .incorrect-icon {
          color: var(--color-error);
        }

        .aq-footer-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border-default);
        }

        .aq-result-label {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .aq-result-label.success {
          color: var(--color-success);
        }

        .aq-result-label.error {
          color: var(--color-error);
        }

        .aq-next-btn {
          padding: 0.75rem 1.25rem;
        }

        /* Results CSS */
        .aq-result-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .aq-result-icon {
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

        .aq-result-card h2 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .aq-result-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 1.75rem;
        }

        .aq-score-grid {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          width: 100%;
          max-width: 360px;
        }

        .aq-score-box {
          flex: 1;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }

        .aq-score-val {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-accent-primary);
          line-height: 1.2;
        }

        .aq-score-lbl {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 600;
          margin-top: 0.25rem;
          text-transform: uppercase;
        }

        .aq-result-actions {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .aq-submit-btn {
          width: 100%;
          padding: 0.875rem;
          justify-content: center;
          font-size: 0.9375rem;
        }

        .aq-save-success {
          background: var(--color-success-bg);
          color: var(--color-success);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .aq-result-subactions {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }

        .aq-retry-btn, .aq-back-list-btn {
          flex: 1;
          padding: 0.75rem;
          justify-content: center;
          font-size: 0.8125rem;
        }

        .audio-quiz-loading {
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
