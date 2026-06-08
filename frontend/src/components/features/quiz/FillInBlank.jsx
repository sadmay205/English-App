import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Eye, ArrowLeft } from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';

export default function FillInBlank() {
  const { questions, currentIndex, answers, score, isCompleted, showResult, submitAnswer, nextQuestion, submitQuiz, resetQuiz, timeLimit, quizType } = useQuizStore();
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const inputRef = useRef(null);

  const question = questions[currentIndex];

  useEffect(() => {
    setUserInput('');
    setAnswered(false);
    setShowHint(false);
    inputRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    if (timeLimit === null) return;
    if (isCompleted) return;

    setTimeLeft(timeLimit);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          useQuizStore.setState({ isCompleted: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, isCompleted]);

  useEffect(() => {
    if (isCompleted && !showResult) {
      submitQuiz();
    }
  }, [isCompleted]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };


  const handleSubmitAnswer = () => {
    if (!userInput.trim() || answered) return;
    setAnswered(true);
    submitAnswer(userInput);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (answered) {
        nextQuestion();
      } else {
        handleSubmitAnswer();
      }
    }
  };

  if (!question) return null;

  // Results screen (reused from MultipleChoice)
  if (isCompleted && showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const getGrade = () => {
      if (percentage >= 90) return { emoji: '🏆', text: 'Xuất sắc!', color: '#22c55e' };
      if (percentage >= 70) return { emoji: '🎉', text: 'Tốt lắm!', color: '#3b82f6' };
      if (percentage >= 50) return { emoji: '💪', text: 'Khá tốt!', color: '#f59e0b' };
      return { emoji: '📚', text: 'Cần ôn thêm!', color: '#ef4444' };
    };
    const grade = getGrade();

    return (
      <div className="fill-result card glass animate-scale-in" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', maxWidth: '440px', margin: '2rem auto', background: 'rgba(22, 22, 37, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{grade.emoji}</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: grade.color, marginBottom: '1rem' }}>{grade.text}</h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: 800, color: grade.color }}>{score}</span>
          <span style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>/ {questions.length}</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{percentage}% chính xác</p>
        <button onClick={resetQuiz} className="btn-primary" style={{ marginTop: '1.5rem' }}>
          <RotateCcw size={16} /> Quay lại chọn bộ từ
        </button>
      </div>
    );
  }

  const currentAnswer = answers[currentIndex];
  const isCorrect = currentAnswer?.isCorrect;

  return (
    <div className="fill-quiz card glass animate-fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '680px', margin: '0 auto', background: 'rgba(22, 22, 37, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
      {/* Progress */}
      <div className="fill-progress">
        <div className="fill-progress-bar" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="fill-progress-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <button onClick={resetQuiz} className="btn-ghost fill-back-btn" style={{ padding: '0.375rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
          <ArrowLeft size={14} /> Quay lại
        </button>
        <span>Câu {currentIndex + 1} / {questions.length}</span>
        {timeLimit !== null && (
          <span className={`fill-timer ${timeLeft < 10 ? 'urgent' : ''}`} style={{ fontWeight: 'bold' }}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        )}
        <span className="fill-score">Điểm: {score}</span>
      </div>


      {/* Question */}
      <div className="fill-question card">
        <p className="fill-meaning">
          {quizType === 'fill-blank-en' ? question.englishDefinition : question.meaningVi}
        </p>
        <p className="fill-hint-label">Gợi ý: <span className="fill-hint-text">{question.hint}</span> ({question.wordLength} ký tự)</p>
        {question.phonetic && (
          <p className="fill-phonetic">{question.phonetic}</p>
        )}

        <button
          className="fill-reveal-btn"
          onClick={() => setShowHint(!showHint)}
          style={{ marginTop: '0.5rem' }}
        >
          <Eye size={14} />
          {showHint ? question.correctAnswer : 'Xem đáp án'}
        </button>
      </div>

      {/* Input */}
      <div className="fill-input-area">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Gõ từ tiếng Anh..."
          className={`fill-input ${answered ? (isCorrect ? 'correct' : 'wrong') : ''}`}
          readOnly={answered}
          id="fill-answer-input"
        />
        {!answered && (
          <button onClick={handleSubmitAnswer} className="btn-primary" disabled={!userInput.trim()}>
            Kiểm tra
          </button>
        )}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`fill-feedback ${isCorrect ? 'correct' : 'wrong'} animate-scale-in`}>
          <div className="fill-feedback-content">
            {isCorrect ? (
              <><CheckCircle size={18} /> <span>Chính xác! 🎉</span></>
            ) : (
              <><XCircle size={18} /> <span>Sai rồi! Đáp án: <strong>{question.correctAnswer}</strong></span></>
            )}
          </div>
          <button onClick={() => nextQuestion()} className="btn-primary">
            {currentIndex < questions.length - 1 ? (
              <>Câu tiếp <ArrowRight size={14} /></>
            ) : (
              <>Xem kết quả <Trophy size={14} /></>
            )}
          </button>
        </div>
      )}

      <style>{`
        .fill-quiz, .fill-result {
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fill-quiz { align-items: stretch; }

        .fill-progress {
          height: 4px;
          background: var(--color-bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .fill-progress-bar {
          height: 100%;
          background: var(--gradient-accent);
          border-radius: 2px;
          transition: width 0.4s ease;
        }

        .fill-progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-bottom: 1.5rem;
        }

        .fill-exit-btn {
          color: var(--color-text-muted);
          transition: color 0.2s;
        }

        .fill-exit-btn:hover {
          color: var(--color-error) !important;
        }

        .fill-timer {
          font-weight: 700;
          color: var(--color-accent-secondary);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-tertiary);
          font-variant-numeric: tabular-nums;
        }

        .fill-timer.urgent {
          color: var(--color-error);
          background: rgba(239, 68, 68, 0.15);
          animation: fill-timer-pulse 1s infinite alternate;
        }

        @keyframes fill-timer-pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }


        .fill-score {
          font-weight: 700;
          color: var(--color-accent-secondary);
        }

        .fill-question {
          text-align: center;
          padding: 2rem;
          margin-bottom: 1.25rem;
        }

        .fill-meaning {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }

        .fill-hint-label {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .fill-hint-text {
          font-family: monospace;
          font-size: 1rem;
          color: var(--color-accent-secondary);
          letter-spacing: 2px;
          font-weight: 700;
        }

        .fill-phonetic {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-style: italic;
          margin-top: 0.375rem;
        }

        .fill-reveal-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: transparent;
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          padding: 0.375rem 0.75rem;
          color: var(--color-text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .fill-reveal-btn:hover {
          border-color: var(--color-warning);
          color: var(--color-warning);
        }

        .fill-input-area {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .fill-input {
          flex: 1;
          padding: 0.875rem 1rem;
          background: var(--color-bg-card);
          border: 2px solid var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: 1rem;
          font-weight: 600;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
          text-align: center;
          letter-spacing: 1px;
        }

        .fill-input:focus:not(.correct):not(.wrong) {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px var(--color-accent-glow);
        }

        .fill-input.correct:focus,
        .fill-input.wrong:focus {
          outline: none;
          box-shadow: none;
        }

        .fill-input.correct {
          border-color: var(--color-success);
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .fill-input.wrong {
          border-color: var(--color-error);
          background: var(--color-error-bg);
          color: var(--color-error);
          animation: shake 0.4s ease-in-out;
        }

        .fill-input::placeholder {
          color: var(--color-text-muted);
          font-weight: 400;
          letter-spacing: 0;
        }

        .fill-feedback {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .fill-feedback.correct {
          background: var(--color-success-bg);
          color: var(--color-success);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .fill-feedback.wrong {
          background: var(--color-error-bg);
          color: var(--color-error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .fill-feedback-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
