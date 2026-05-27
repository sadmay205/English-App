import { useState, useEffect } from 'react';
import { RotateCcw, Trophy, CheckCircle, Clock } from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';
import { toast } from 'sonner';

export default function MatchingGame() {
  const { questions, score, isCompleted, showResult, submitQuiz, resetQuiz, timeLimit } = useQuizStore();
  
  const [englishCards, setEnglishCards] = useState([]);
  const [vietnameseCards, setVietnameseCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null); // { id, type, text }
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [failedIds, setFailedIds] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameFinished, setGameFinished] = useState(false);

  // Shuffle array utility
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialize cards
  useEffect(() => {
    if (questions.length > 0) {
      const eng = questions.map(q => ({ id: q.id, text: q.word, type: 'english' }));
      const vie = questions.map(q => ({ id: q.id, text: q.meaningVi, type: 'vietnamese' }));
      setEnglishCards(shuffle(eng));
      setVietnameseCards(shuffle(vie));
    }
  }, [questions]);

  // Game timer & Countdown
  useEffect(() => {
    if (gameFinished) return;

    const timer = setInterval(() => {
      // Track elapsed time
      setTimeSpent(Math.round((Date.now() - startTime) / 1000));

      // Handle countdown timer if timeLimit is set
      if (timeLimit !== null) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, gameFinished]);

  const handleTimeOut = async () => {
    toast.warning('Hết thời gian ghép từ!');
    finishGame(true);
  };

  const handleCardClick = (card) => {
    if (matchedIds.has(card.id) || failedIds.has(card.id)) return;

    // If no card is selected, select it
    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    // If clicking the same card, deselect
    if (selectedCard.id === card.id && selectedCard.type === card.type) {
      setSelectedCard(null);
      return;
    }

    // If clicking a card of the same type, switch selection
    if (selectedCard.type === card.type) {
      setSelectedCard(card);
      return;
    }

    // Match checking
    setAttempts(prev => prev + 1);

    if (selectedCard.id === card.id) {
      // Match success!
      const newMatched = new Set(matchedIds);
      newMatched.add(card.id);
      setMatchedIds(newMatched);
      setSelectedCard(null);

      // Play subtle feedback
      if ('speechSynthesis' in window && selectedCard.type === 'english') {
        speak(selectedCard.text);
      } else if ('speechSynthesis' in window && card.type === 'english') {
        speak(card.text);
      }

      // Check win condition
      if (newMatched.size === questions.length) {
        finishGame(false);
      }
    } else {
      // Match failed
      const pair = [selectedCard.id, card.id];
      setFailedIds(new Set(pair));
      setSelectedCard(null);

      setTimeout(() => {
        setFailedIds(new Set());
      }, 800);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const finishGame = async (isTimeOut = false) => {
    setGameFinished(true);
    // Calculate final score
    // Max score is questions.length. Subtract 1 point for every 3 errors, down to a minimum score of 1.
    const errors = Math.max(0, attempts - matchedIds.size);
    const finalScore = isTimeOut 
      ? Math.max(1, matchedIds.size) 
      : Math.max(1, questions.length - Math.floor(errors / 3));

    useQuizStore.setState({
      score: finalScore,
      isCompleted: true,
    });

    await submitQuiz();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Results screen
  if (gameFinished && showResult) {
    const finalScore = useQuizStore.getState().score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    const getGrade = () => {
      if (percentage >= 90) return { emoji: '🏆', text: 'Tuyệt vời!', color: '#22c55e' };
      if (percentage >= 70) return { emoji: '🎉', text: 'Rất tốt!', color: '#3b82f6' };
      if (percentage >= 50) return { emoji: '💪', text: 'Cố gắng lên!', color: '#f59e0b' };
      return { emoji: '📚', text: 'Hãy ôn tập lại nhé!', color: '#ef4444' };
    };
    const grade = getGrade();

    return (
      <div className="match-result animate-scale-in">
        <div className="match-result-icon">{grade.emoji}</div>
        <h2 className="match-result-title" style={{ color: grade.color }}>{grade.text}</h2>
        
        <div className="match-stats-grid">
          <div className="match-stat-card">
            <span className="match-stat-val" style={{ color: grade.color }}>{finalScore}/{questions.length}</span>
            <span className="match-stat-lbl">Điểm số</span>
          </div>
          <div className="match-stat-card">
            <span className="match-stat-val">{formatTime(timeSpent)}</span>
            <span className="match-stat-lbl">Thời gian</span>
          </div>
          <div className="match-stat-card">
            <span className="match-stat-val">{attempts}</span>
            <span className="match-stat-lbl">Số lượt chọn</span>
          </div>
        </div>

        <button onClick={resetQuiz} className="btn-primary" style={{ marginTop: '2rem' }}>
          <RotateCcw size={16} /> Quay lại chọn bộ từ
        </button>
        <style>{resultStyles}</style>
      </div>
    );
  }

  return (
    <div className="match-game-container animate-fade-in">
      <div className="match-header">
        <h3>🧩 Trò chơi ghép từ</h3>
        <div className="match-header-stats">
          {timeLimit !== null && (
            <div className={`match-timer ${timeLeft < 10 ? 'urgent' : ''}`}>
              ⏱️ Hạn giờ: {formatTime(timeLeft)}
            </div>
          )}
          <div className="match-tracker">
            Đã ghép: <strong>{matchedIds.size} / {questions.length}</strong>
          </div>
        </div>
      </div>

      <div className="match-grid">
        {/* English Column */}
        <div className="match-column">
          <h4 className="column-title">English</h4>
          <div className="cards-stack">
            {englishCards.map((card) => {
              const isMatched = matchedIds.has(card.id);
              const isSelected = selectedCard?.id === card.id && selectedCard?.type === 'english';
              const isFailed = failedIds.has(card.id);
              
              let cardClass = "match-card";
              if (isMatched) cardClass += " matched";
              else if (isSelected) cardClass += " selected";
              else if (isFailed) cardClass += " failed";

              return (
                <button
                  key={`eng-${card.id}`}
                  className={cardClass}
                  onClick={() => handleCardClick(card)}
                  disabled={isMatched}
                >
                  {card.text}
                  {isMatched && <CheckCircle size={14} className="match-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vietnamese Column */}
        <div className="match-column">
          <h4 className="column-title">Tiếng Việt</h4>
          <div className="cards-stack">
            {vietnameseCards.map((card) => {
              const isMatched = matchedIds.has(card.id);
              const isSelected = selectedCard?.id === card.id && selectedCard?.type === 'vietnamese';
              const isFailed = failedIds.has(card.id);

              let cardClass = "match-card";
              if (isMatched) cardClass += " matched";
              else if (isSelected) cardClass += " selected";
              else if (isFailed) cardClass += " failed";

              return (
                <button
                  key={`vie-${card.id}`}
                  className={cardClass}
                  onClick={() => handleCardClick(card)}
                  disabled={isMatched}
                >
                  {card.text}
                  {isMatched && <CheckCircle size={14} className="match-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{gameStyles}</style>
    </div>
  );
}

const gameStyles = `
  .match-game-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 1rem 0;
  }

  .match-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 0.75rem 1.25rem;
  }

  .match-header h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .match-header-stats {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    font-size: 0.8125rem;
  }

  .match-timer {
    font-weight: 700;
    color: var(--color-accent-secondary);
    padding: 2px 8px;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .match-timer.urgent {
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.15);
    animation: flash 1s infinite alternate;
  }

  @keyframes flash {
    from { opacity: 0.5; }
    to { opacity: 1; }
  }

  .match-tracker {
    color: var(--color-text-secondary);
  }

  .match-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .match-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .column-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-left: 0.25rem;
  }

  .cards-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .match-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: inherit;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
  }

  .match-card.matched {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.08);
    color: var(--color-success);
    opacity: 0.6;
    cursor: default;
    text-decoration: line-through;
  }

  .match-card.failed {
    border-color: var(--color-error);
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-error);
    animation: shake 0.4s ease-in-out;
  }

  .match-check-icon {
    color: var(--color-success);
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  }
`;

const resultStyles = `
  .match-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    max-width: 460px;
    margin: 2rem auto;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-lg);
  }

  .match-result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .match-result-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
  }

  .match-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    width: 100%;
  }

  .match-stat-card {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 0.875rem 0.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .match-stat-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .match-stat-lbl {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }
`;
