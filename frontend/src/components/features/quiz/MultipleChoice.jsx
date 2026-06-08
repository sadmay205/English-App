import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Volume2, ArrowLeft } from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';

export default function MultipleChoice() {
  const { questions, currentIndex, answers, score, isCompleted, showResult, submitAnswer, nextQuestion, submitQuiz, resetQuiz, timeLimit, quizType } = useQuizStore();
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const question = questions[currentIndex];

  useEffect(() => {
    setSelectedOption(null);
    setAnswered(false);
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


  const handleSelect = (optionIndex) => {
    if (answered) return;
    setSelectedOption(optionIndex);
    setAnswered(true);
    submitAnswer(optionIndex);
  };

  const handleNext = () => {
    nextQuestion();
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  if (!question) return null;

  // Results screen
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
      <div className="quiz-result animate-scale-in">
        <div className="quiz-result-icon">{grade.emoji}</div>
        <h2 className="quiz-result-title" style={{ color: grade.color }}>{grade.text}</h2>
        <div className="quiz-result-score">
          <span className="quiz-result-number" style={{ color: grade.color }}>{score}</span>
          <span className="quiz-result-total">/ {questions.length}</span>
        </div>
        <div className="quiz-result-bar-bg">
          <div className="quiz-result-bar" style={{ width: `${percentage}%`, background: grade.color }} />
        </div>
        <p className="quiz-result-percent">{percentage}% chính xác</p>
        <button onClick={resetQuiz} className="btn-primary" style={{ marginTop: '1.5rem' }}>
          <RotateCcw size={16} /> Quay lại chọn bộ từ
        </button>

        <style>{resultStyles}</style>
      </div>
    );
  }

  const currentAnswer = answers[currentIndex];
  const isCorrect = currentAnswer?.isCorrect;

  return (
    <div className="mc-quiz card glass animate-fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '680px', margin: '0 auto', background: 'rgba(22, 22, 37, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
      {/* Progress bar */}
      <div className="mc-progress">
        <div className="mc-progress-bar" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="mc-progress-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <button onClick={resetQuiz} className="btn-ghost mc-back-btn" style={{ padding: '0.375rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
          <ArrowLeft size={14} /> Quay lại
        </button>
        <span>Câu {currentIndex + 1} / {questions.length}</span>
        {timeLimit !== null && (
          <span className={`mc-timer ${timeLeft < 10 ? 'urgent' : ''}`} style={{ fontWeight: 'bold' }}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        )}
        <span className="mc-score">Điểm: {score}</span>
      </div>


      {/* Question Card */}
      <div className="mc-question-card card">
        <div className="mc-question-word">
          <span>{question.question}</span>
          <button onClick={() => handleSpeak(question.question)} className="mc-speak-btn">
            <Volume2 size={18} />
          </button>
        </div>
        {question.phonetic && (
          <p className="mc-question-phonetic">{question.phonetic}</p>
        )}
        <p className="mc-question-label">
          {quizType === 'multiple-choice-en' ? 'Chọn định nghĩa tiếng Anh đúng:' : 'Chọn nghĩa tiếng Việt đúng:'}
        </p>
      </div>

      {/* Options Grid */}
      <div className="mc-options">
        {question.options.map((option, index) => {
          let optionClass = 'mc-option';
          if (answered) {
            if (index === question.correctIndex) {
              optionClass += ' correct';
            } else if (index === selectedOption && !isCorrect) {
              optionClass += ' wrong';
            } else {
              optionClass += ' disabled';
            }
          }

          return (
            <button
              key={index}
              className={optionClass}
              onClick={() => handleSelect(index)}
              disabled={answered}
            >
              <span className="mc-option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="mc-option-text">{option}</span>
              {answered && index === question.correctIndex && (
                <CheckCircle size={18} className="mc-option-icon correct" />
              )}
              {answered && index === selectedOption && !isCorrect && (
                <XCircle size={18} className="mc-option-icon wrong" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`mc-feedback ${isCorrect ? 'correct' : 'wrong'} animate-scale-in`}>
          <span>{isCorrect ? '✅ Chính xác!' : `❌ Sai rồi! Đáp án đúng: ${question.correctAnswer}`}</span>
          <button onClick={handleNext} className="btn-primary">
            {currentIndex < questions.length - 1 ? (
              <>Câu tiếp <ArrowRight size={14} /></>
            ) : (
              <>Xem kết quả <Trophy size={14} /></>
            )}
          </button>
        </div>
      )}

      <style>{quizStyles}</style>
    </div>
  );
}

const quizStyles = `
  .mc-quiz {
    max-width: 640px;
    margin: 0 auto;
  }

  .mc-progress {
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .mc-progress-bar {
    height: 100%;
    background: var(--gradient-accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .mc-progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 1.5rem;
  }

  .mc-exit-btn {
    color: var(--color-text-muted);
    transition: color 0.2s;
  }

  .mc-exit-btn:hover {
    color: var(--color-error) !important;
  }

  .mc-score {
    font-weight: 700;
    color: var(--color-accent-secondary);
  }

  .mc-question-card {
    text-align: center;
    padding: 2rem;
    margin-bottom: 1.25rem;
  }

  .mc-question-word {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.375rem;
  }

  .mc-speak-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--color-border-default);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .mc-speak-btn:hover {
    background: var(--color-accent-glow);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .mc-question-phonetic {
    font-size: 0.875rem;
    color: var(--color-accent-secondary);
    font-style: italic;
    margin-bottom: 1rem;
  }

  .mc-question-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .mc-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .mc-option {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 1rem;
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-family: inherit;
    position: relative;
  }

  .mc-option:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-glow);
  }

  .mc-option.correct {
    border-color: var(--color-success);
    background: var(--color-success-bg);
  }

  .mc-option.wrong {
    border-color: var(--color-error);
    background: var(--color-error-bg);
    animation: shake 0.4s ease-in-out;
  }

  .mc-option.disabled {
    opacity: 0.4;
    cursor: default;
  }

  .mc-option-letter {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mc-option-text {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.4;
  }

  .mc-option-icon {
    flex-shrink: 0;
  }

  .mc-option-icon.correct { color: var(--color-success); }
  .mc-option-icon.wrong { color: var(--color-error); }

  .mc-feedback {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .mc-feedback.correct {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .mc-feedback.wrong {
    background: var(--color-error-bg);
    color: var(--color-error);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .mc-timer {
    font-weight: 700;
    color: var(--color-accent-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .mc-timer.urgent {
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.15);
    animation: mc-timer-pulse 1s infinite alternate;
  }

  @keyframes mc-timer-pulse {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
`;

const resultStyles = `
  .quiz-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    max-width: 440px;
    margin: 2rem auto;
    background: rgba(22, 22, 37, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }

  .quiz-result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .quiz-result-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
  }

  .quiz-result-score {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
  }

  .quiz-result-number {
    font-size: 3rem;
    font-weight: 800;
  }

  .quiz-result-total {
    font-size: 1.5rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .quiz-result-bar-bg {
    width: 100%;
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .quiz-result-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s ease;
  }

  .quiz-result-percent {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }
`;
