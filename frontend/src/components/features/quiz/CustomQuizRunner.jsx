import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Volume2, ArrowLeft, Eye, Sparkles, Clock, LogOut } from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';
import { toast } from 'sonner';

export default function CustomQuizRunner() {
  const {
    questions,
    isCompleted,
    showResult,
    submitQuiz,
    resetQuiz,
    timeLimit,
  } = useQuizStore();

  // Separate question types
  const stepQuestions = questions.filter(q => q.type !== 'matching' && q.type !== 'matching-en');
  const matchingQuestions = questions.filter(q => q.type === 'matching' || q.type === 'matching-en');

  // Phase tracking: 'steps' | 'matching' | 'completed'
  const [currentPhase, setCurrentPhase] = useState(() => {
    if (stepQuestions.length > 0) return 'steps';
    if (matchingQuestions.length > 0) return 'matching';
    return 'completed';
  });

  // Timer state
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Local scores
  const [stepScore, setStepScore] = useState(0);
  const [matchingScore, setMatchingScore] = useState(0);

  // Phase 1 (Steps) states
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef(null);

  // Phase 2 (Matching) states
  const [englishCards, setEnglishCards] = useState([]);
  const [vietnameseCards, setVietnameseCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null); // { id, type, text }
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [failedIds, setFailedIds] = useState(new Set());
  const [attempts, setAttempts] = useState(0);

  const currentStepQuestion = stepQuestions[stepIndex];

  // Auto-focus input for fill-blank questions
  useEffect(() => {
    if (currentPhase === 'steps' && currentStepQuestion) {
      setSelectedOption(null);
      setUserInput('');
      setAnswered(false);
      setShowHint(false);
      setIsCorrect(false);

      if (currentStepQuestion.type === 'fill-blank' || currentStepQuestion.type === 'fill-blank-en') {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [stepIndex, currentPhase, currentStepQuestion]);

  // Shuffle helper
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialize matching cards in Phase 2
  useEffect(() => {
    if (currentPhase === 'matching' && matchingQuestions.length > 0) {
      const eng = matchingQuestions.map(q => ({
        id: q.id,
        uniqueId: `${q.id}-${q.type}`,
        text: q.word,
        type: 'english'
      }));
      const rightSide = matchingQuestions.map(q => {
        const isEnDef = q.type === 'matching-en';
        return {
          id: q.id,
          uniqueId: `${q.id}-${q.type}`,
          text: isEnDef ? q.englishDefinition : q.meaningVi,
          type: isEnDef ? 'english-def' : 'vietnamese'
        };
      });
      setEnglishCards(shuffle(eng));
      setVietnameseCards(shuffle(rightSide));
    }
  }, [currentPhase, questions]);

  // General Countdown Timer
  useEffect(() => {
    if (timeLimit === null) return;
    if (isCompleted || currentPhase === 'completed') return;

    const timer = setInterval(() => {
      // Track time spent
      setTimeSpent(Math.round((Date.now() - startTime) / 1000));

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, isCompleted, currentPhase]);

  // Track time spent if timeLimit is null
  useEffect(() => {
    if (timeLimit !== null) return;
    if (isCompleted || currentPhase === 'completed') return;

    const timer = setInterval(() => {
      setTimeSpent(Math.round((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, isCompleted, currentPhase]);

  // Handle timeout
  const handleTimeOut = async () => {
    toast.error('Hết thời gian làm bài!');
    let currentMatchingScore = 0;
    if (currentPhase === 'matching') {
      currentMatchingScore = matchedIds.size;
      setMatchingScore(currentMatchingScore);
    }

    useQuizStore.setState({
      score: stepScore + currentMatchingScore,
      isCompleted: true,
    });
    setCurrentPhase('completed');
    await submitQuiz();
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  // Submit step question answer
  const handleMCSelect = (optionIndex) => {
    if (answered) return;
    setSelectedOption(optionIndex);
    setAnswered(true);
    const correct = optionIndex === currentStepQuestion.correctIndex;
    setIsCorrect(correct);
    if (correct) {
      setStepScore(prev => prev + 1);
    }
  };

  const handleFillSubmit = () => {
    if (!userInput.trim() || answered) return;
    setAnswered(true);
    const correct = userInput.toLowerCase().trim() === currentStepQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    if (correct) {
      setStepScore(prev => prev + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (answered) {
        handleNextStepQuestion();
      } else {
        if (currentStepQuestion.type === 'fill-blank' || currentStepQuestion.type === 'fill-blank-en') {
          handleFillSubmit();
        }
      }
    }
  };

  const handleNextStepQuestion = async () => {
    if (stepIndex < stepQuestions.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      // Finished all step questions
      if (matchingQuestions.length > 0) {
        setCurrentPhase('matching');
      } else {
        // Submit quiz results
        useQuizStore.setState({
          score: stepScore,
          isCompleted: true,
        });
        setCurrentPhase('completed');
        await submitQuiz();
      }
    }
  };

  // Phase 2 (Matching Card Click)
  const handleCardClick = (card) => {
    if (matchedIds.has(card.uniqueId) || failedIds.has(card.uniqueId)) return;

    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    if (selectedCard.uniqueId === card.uniqueId && selectedCard.type === card.type) {
      setSelectedCard(null);
      return;
    }

    if (selectedCard.type === card.type) {
      setSelectedCard(card);
      return;
    }

    setAttempts(prev => prev + 1);

    if (selectedCard.uniqueId === card.uniqueId) {
      // Match success
      const newMatched = new Set(matchedIds);
      newMatched.add(card.uniqueId);
      setMatchedIds(newMatched);
      setSelectedCard(null);

      if (selectedCard.type === 'english') {
        handleSpeak(selectedCard.text);
      } else if (card.type === 'english') {
        handleSpeak(card.text);
      }

      // Check win condition
      if (newMatched.size === matchingQuestions.length) {
        finishMatchingGame(newMatched.size, attempts + 1);
      }
    } else {
      // Match failed
      const pair = [selectedCard.uniqueId, card.uniqueId];
      setFailedIds(new Set(pair));
      setSelectedCard(null);

      setTimeout(() => {
        setFailedIds(new Set());
      }, 800);
    }
  };

  const finishMatchingGame = async (matchedCount, totalAttempts) => {
    // Subtract 1 point for every 3 errors, minimum matching score is 1 (if matching count > 0)
    const errors = Math.max(0, totalAttempts - matchedCount);
    const finalMatchingScore = Math.max(1, matchingQuestions.length - Math.floor(errors / 3));
    setMatchingScore(finalMatchingScore);

    useQuizStore.setState({
      score: stepScore + finalMatchingScore,
      isCompleted: true,
    });
    setCurrentPhase('completed');
    await submitQuiz();
  };

  // Results screen
  if (currentPhase === 'completed' && showResult) {
    const totalScore = stepScore + matchingScore;
    const percentage = Math.round((totalScore / questions.length) * 100);
    const getGrade = () => {
      if (percentage >= 90) return { emoji: '🏆', text: 'Xuất sắc!', color: '#22c55e' };
      if (percentage >= 70) return { emoji: '🎉', text: 'Tốt lắm!', color: '#3b82f6' };
      if (percentage >= 50) return { emoji: '💪', text: 'Khá tốt!', color: '#f59e0b' };
      return { emoji: '📚', text: 'Cần ôn thêm!', color: '#ef4444' };
    };
    const grade = getGrade();

    return (
      <div className="custom-result animate-scale-in">
        <div className="custom-result-icon">{grade.emoji}</div>
        <h2 className="custom-result-title" style={{ color: grade.color }}>{grade.text}</h2>
        
        <div className="custom-stats-grid">
          <div className="custom-stat-card">
            <span className="custom-stat-val" style={{ color: grade.color }}>{totalScore}/{questions.length}</span>
            <span className="custom-stat-lbl">Tổng điểm</span>
          </div>
          <div className="custom-stat-card">
            <span className="custom-stat-val">{percentage}%</span>
            <span className="custom-stat-lbl">Tỷ lệ</span>
          </div>
          <div className="custom-stat-card">
            <span className="custom-stat-val">{formatTime(timeSpent)}</span>
            <span className="custom-stat-lbl">Thời gian</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="custom-breakdown card" style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-bg-tertiary)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, borderBottom: '1px solid var(--color-border-default)', paddingBottom: '0.5rem' }}>Chi tiết kết quả:</h4>
          {stepQuestions.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span>Phần 1: Trắc nghiệm & Điền từ</span>
              <strong>{stepScore}/{stepQuestions.length} câu</strong>
            </div>
          )}
          {matchingQuestions.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span>Phần 2: Ghép thẻ từ vựng</span>
              <strong>{matchingScore}/{matchingQuestions.length} điểm</strong>
            </div>
          )}
        </div>

        <div className="custom-result-bar-bg">
          <div className="custom-result-bar" style={{ width: `${percentage}%`, background: grade.color }} />
        </div>

        <button onClick={resetQuiz} className="btn-primary" style={{ marginTop: '2rem' }}>
          <RotateCcw size={16} /> Quay lại chọn bộ từ
        </button>
        <style>{resultStyles}</style>
      </div>
    );
  }

  return (
    <div className="custom-quiz card glass animate-fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '680px', margin: '0 auto', background: 'rgba(22, 22, 37, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
      {/* Quiz Progress header */}
      <div className="custom-progress">
        <div 
          className="custom-progress-bar" 
          style={{ 
            width: `${
              currentPhase === 'steps' 
                ? ((stepIndex + 1) / questions.length) * 100 
                : currentPhase === 'matching' 
                  ? ((stepQuestions.length + matchedIds.size) / questions.length) * 100 
                  : 100
            }%` 
          }} 
        />
      </div>

      <div className="custom-progress-text">
        <button onClick={resetQuiz} className="btn-ghost custom-back-btn">
          <ArrowLeft size={14} /> Thoát
        </button>
        <span>
          {currentPhase === 'steps' 
            ? `Câu ${stepIndex + 1} / ${questions.length}` 
            : `Đã ghép: ${matchedIds.size} / ${matchingQuestions.length} từ`
          }
        </span>
        {timeLimit !== null && (
          <span className={`custom-timer ${timeLeft < 10 ? 'urgent' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        )}
        <span className="custom-score">Điểm: {stepScore + (currentPhase === 'matching' ? matchedIds.size : matchingScore)}</span>
      </div>

      {/* Render Steps Phase */}
      {currentPhase === 'steps' && currentStepQuestion && (
        <div className="custom-question-container">
          {(currentStepQuestion.type === 'multiple-choice-vie' || currentStepQuestion.type === 'multiple-choice-en') ? (
            /* Multiple choice template */
            <div>
              <div className="mc-question-card card">
                <div className="mc-question-word">
                  <span>{currentStepQuestion.question}</span>
                  <button onClick={() => handleSpeak(currentStepQuestion.question)} className="mc-speak-btn">
                    <Volume2 size={18} />
                  </button>
                </div>
                {currentStepQuestion.phonetic && (
                  <p className="mc-question-phonetic">{currentStepQuestion.phonetic}</p>
                )}
                <p className="mc-question-label">
                  {currentStepQuestion.type === 'multiple-choice-en' ? 'Chọn định nghĩa tiếng Anh đúng:' : 'Chọn nghĩa tiếng Việt đúng:'}
                </p>
              </div>

              <div className="mc-options">
                {currentStepQuestion.options.map((option, index) => {
                  let optionClass = 'mc-option';
                  if (answered) {
                    if (index === currentStepQuestion.correctIndex) {
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
                      onClick={() => handleMCSelect(index)}
                      disabled={answered}
                    >
                      <span className="mc-option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="mc-option-text">{option}</span>
                      {answered && index === currentStepQuestion.correctIndex && (
                        <CheckCircle size={18} className="mc-option-icon correct" />
                      )}
                      {answered && index === selectedOption && !isCorrect && (
                        <XCircle size={18} className="mc-option-icon wrong" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Fill in blank template */
            <div>
              <div className="fill-question card">
                <p className="fill-meaning">
                  {currentStepQuestion.type === 'fill-blank-en' ? currentStepQuestion.englishDefinition : currentStepQuestion.meaningVi}
                </p>
                <p className="fill-hint-label">Gợi ý: <span className="fill-hint-text">{currentStepQuestion.hint}</span> ({currentStepQuestion.wordLength} ký tự)</p>
                {currentStepQuestion.phonetic && (
                  <p className="fill-phonetic">{currentStepQuestion.phonetic}</p>
                )}

                <button
                  className="fill-reveal-btn"
                  onClick={() => setShowHint(!showHint)}
                  style={{ marginTop: '0.5rem' }}
                >
                  <Eye size={14} />
                  {showHint ? currentStepQuestion.correctAnswer : 'Xem đáp án'}
                </button>
              </div>

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
                />
                {!answered && (
                  <button onClick={handleFillSubmit} className="btn-primary" disabled={!userInput.trim()}>
                    Kiểm tra
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Feedback bar */}
          {answered && (
            <div className={`custom-feedback ${isCorrect ? 'correct' : 'wrong'} animate-scale-in`}>
              <div className="custom-feedback-content">
                {isCorrect ? (
                  <><CheckCircle size={18} /> <span>Chính xác! 🎉</span></>
                ) : (
                  <><XCircle size={18} /> <span>Sai rồi! Đáp án: <strong>{currentStepQuestion.correctAnswer}</strong></span></>
                )}
              </div>
              <button onClick={handleNextStepQuestion} className="btn-primary">
                {stepIndex < stepQuestions.length - 1 ? (
                  <>Câu tiếp <ArrowRight size={14} /></>
                ) : matchingQuestions.length > 0 ? (
                  <>Giai đoạn ghép từ <Sparkles size={14} /></>
                ) : (
                  <>Xem kết quả <Trophy size={14} /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Render Matching Phase */}
      {currentPhase === 'matching' && (
        <div className="match-game-container animate-fade-in" style={{ marginTop: '1rem' }}>
          <div className="match-header" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} style={{ color: 'var(--color-accent-primary)' }} /> Nối các thẻ tương ứng
            </h3>
            <div className="match-tracker" style={{ fontSize: '0.75rem' }}>
              Lượt chơi: <strong>{attempts}</strong>
            </div>
          </div>

          <div className="match-grid" style={{ gap: '1rem' }}>
            {/* English Column */}
            <div className="match-column">
              <h4 className="column-title">English</h4>
              <div className="cards-stack">
                {englishCards.map((card) => {
                  const isMatched = matchedIds.has(card.uniqueId);
                  const isSelected = selectedCard?.uniqueId === card.uniqueId && selectedCard?.type === 'english';
                  const isFailed = failedIds.has(card.uniqueId);

                  let cardClass = "match-card";
                  if (isMatched) cardClass += " matched";
                  else if (isSelected) cardClass += " selected";
                  else if (isFailed) cardClass += " failed";

                  return (
                    <button
                      key={`eng-${card.uniqueId}`}
                      className={cardClass}
                      onClick={() => handleCardClick(card)}
                      disabled={isMatched}
                      style={{ padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                    >
                      {card.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meanings Column */}
            <div className="match-column">
              <h4 className="column-title">Nghĩa tiếng Việt / Anh</h4>
              <div className="cards-stack">
                {vietnameseCards.map((card) => {
                  const isMatched = matchedIds.has(card.uniqueId);
                  const isSelected = selectedCard?.uniqueId === card.uniqueId && selectedCard?.type === card.type;
                  const isFailed = failedIds.has(card.uniqueId);

                  let cardClass = "match-card";
                  if (isMatched) cardClass += " matched";
                  else if (isSelected) cardClass += " selected";
                  else if (isFailed) cardClass += " failed";

                  return (
                    <button
                      key={`vie-${card.uniqueId}`}
                      className={cardClass}
                      onClick={() => handleCardClick(card)}
                      disabled={isMatched}
                      style={{ padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                    >
                      {card.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{runnerStyles}</style>
    </div>
  );
}

const runnerStyles = `
  .custom-quiz {
    max-width: 640px;
    margin: 0 auto;
  }

  .custom-progress {
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .custom-progress-bar {
    height: 100%;
    background: var(--gradient-accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .custom-progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 1.5rem;
  }

  .custom-back-btn {
    padding: 0.375rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
  }

  .custom-timer {
    font-weight: 700;
    color: var(--color-accent-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .custom-timer.urgent {
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.15);
    animation: urgent-pulse 1s infinite alternate;
  }

  @keyframes urgent-pulse {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }

  .custom-score {
    font-weight: 700;
    color: var(--color-accent-secondary);
  }

  /* MC view styling */
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
    animation: runner-shake 0.4s ease-in-out;
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

  /* Fill blank view styling */
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

  .fill-input.correct {
    border-color: var(--color-success);
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .fill-input.wrong {
    border-color: var(--color-error);
    background: var(--color-error-bg);
    color: var(--color-error);
    animation: runner-shake 0.4s ease-in-out;
  }

  /* Feedback bar */
  .custom-feedback {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.8125rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .custom-feedback.correct {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .custom-feedback.wrong {
    background: var(--color-error-bg);
    color: var(--color-error);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .custom-feedback-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Matching game layout */
  .match-game-container {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
  }

  .match-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-default);
    padding-bottom: 0.75rem;
  }

  .match-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  .match-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .column-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cards-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .match-card {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: inherit;
    width: 100%;
    white-space: normal;
    word-break: break-word;
  }

  .match-card:hover:not(:disabled) {
    border-color: var(--color-border-accent);
    transform: translateY(-1px);
    background: var(--color-bg-hover);
  }

  .match-card.selected {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-glow);
    color: var(--color-accent-primary);
  }

  .match-card.matched {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.08);
    color: var(--color-success);
    opacity: 0.5;
    cursor: default;
    text-decoration: line-through;
  }

  .match-card.failed {
    border-color: var(--color-error);
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error);
    animation: runner-shake 0.4s ease-in-out;
  }

  @keyframes runner-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  }

  @media (max-width: 580px) {
    .mc-options, .match-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const resultStyles = `
  .custom-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    max-width: 480px;
    margin: 2rem auto;
    background: rgba(22, 22, 37, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }

  .custom-result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .custom-result-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
  }

  .custom-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .custom-stat-card {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 0.875rem 0.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .custom-stat-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .custom-stat-lbl {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }

  .custom-result-bar-bg {
    width: 100%;
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .custom-result-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s ease;
  }
`;
