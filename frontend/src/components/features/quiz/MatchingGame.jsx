import { useState, useEffect } from 'react';
import { 
  RotateCcw, Trophy, CheckCircle, Clock, LogOut, Volume2, VolumeX,
  Sparkles, BookOpen, Compass, Star, Zap, Smile, Heart, Flame,
  Globe, Sun, Moon, Feather, Award, Gift, Target, Shield, HelpCircle
} from 'lucide-react';
import useQuizStore from '../../../store/useQuizStore';
import { toast } from 'sonner';

// Sound synthesis using Web Audio API
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.isPlayingBgm = false;
    this.bgmTimeout = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlip() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playMatchSuccess() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      
      const playTone = (freq, delay, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        
        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + delay);
        osc.stop(now + delay + duration);
      };
      
      playTone(523.25, 0, 0.18); // C5
      playTone(659.25, 0.08, 0.3); // E5
    } catch (e) {}
  }

  playMatchFail() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.22);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }

  playWin() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch (e) {}
  }

  startBgm() {
    try {
      this.init();
      if (this.isPlayingBgm) return;
      this.isPlayingBgm = true;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);

      const playBeats = () => {
        if (!this.isPlayingBgm) return;
        const now = this.ctx.currentTime;
        
        const chords = [
          [220.00, 261.63, 329.63], // Am
          [174.61, 220.00, 261.63], // F
          [261.63, 329.63, 392.00], // C
          [196.00, 246.94, 293.66]  // G
        ];
        
        const chordDuration = 4.0;
        
        chords.forEach((chord, chordIdx) => {
          const chordStartTime = now + chordIdx * chordDuration;
          
          chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, chordStartTime);
            
            gain.gain.setValueAtTime(0, chordStartTime);
            gain.gain.linearRampToValueAtTime(0.015, chordStartTime + 0.5);
            gain.gain.linearRampToValueAtTime(0.015, chordStartTime + chordDuration - 0.5);
            gain.gain.linearRampToValueAtTime(0, chordStartTime + chordDuration);
            
            osc.connect(gain);
            gain.connect(this.bgmGain);
            
            osc.start(chordStartTime);
            osc.stop(chordStartTime + chordDuration);
          });
          
          const arpeggio = [0, 2, 1, 2];
          arpeggio.forEach((noteIdx, stepIdx) => {
            const stepTime = chordStartTime + stepIdx * 1.0;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(chord[noteIdx] * 2, stepTime);
            
            gain.gain.setValueAtTime(0, stepTime);
            gain.gain.linearRampToValueAtTime(0.025, stepTime + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.85);
            
            osc.connect(gain);
            gain.connect(this.bgmGain);
            
            osc.start(stepTime);
            osc.stop(stepTime + 0.9);
          });
        });
        
        this.bgmTimeout = setTimeout(playBeats, chordDuration * chords.length * 1000);
      };

      playBeats();
    } catch (e) {}
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch (e) {}
    }
  }
}

const sound = new SoundEffects();

const DECORATIVE_ICONS = [
  Sparkles, BookOpen, Compass, Star, Zap, Smile, Heart, Flame,
  Globe, Sun, Moon, Feather, Award, Gift, Target, Shield, HelpCircle
];

const ICON_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', 
  '#06b6d4', '#f43f5e', '#14b8a6', '#f59e0b', '#a855f7', '#6366f1'
];

const getCardIcon = (text, id) => {
  const str = (text || '') + (id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DECORATIVE_ICONS.length;
  const colorIndex = Math.abs(hash) % ICON_COLORS.length;
  const IconComponent = DECORATIVE_ICONS[index];
  const color = ICON_COLORS[colorIndex];
  
  return (
    <div className="card-decor-badge" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}>
      <IconComponent size={15} />
    </div>
  );
};

export default function MatchingGame() {
  const { questions, score, isCompleted, showResult, submitQuiz, resetQuiz, timeLimit, quizType } = useQuizStore();
  
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
  const [bgmMuted, setBgmMuted] = useState(true);

  // Shuffle array utility
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Sync background music state
  useEffect(() => {
    if (!bgmMuted && !gameFinished) {
      sound.startBgm();
    } else {
      sound.stopBgm();
    }
    return () => sound.stopBgm();
  }, [bgmMuted, gameFinished]);

  // Initialize cards
  useEffect(() => {
    if (questions.length > 0) {
      const eng = questions.map(q => ({ id: q.id, text: q.word, type: 'english' }));
      const isEnDef = quizType === 'matching-en';
      const rightSide = questions.map(q => ({
        id: q.id,
        text: isEnDef ? q.englishDefinition : q.meaningVi,
        type: isEnDef ? 'english-def' : 'vietnamese'
      }));
      setEnglishCards(shuffle(eng));
      setVietnameseCards(shuffle(rightSide));
    }
  }, [questions, quizType]);

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

    sound.playFlip();

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
      sound.playMatchSuccess();
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
      sound.playMatchFail();
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
    sound.stopBgm();
    if (!isTimeOut) {
      sound.playWin();
    }
    
    // Calculate final score
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
    <div className="match-game-container card glass animate-fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '720px', margin: '0 auto', background: 'rgba(22, 22, 37, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
      <div className="match-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={resetQuiz} className="match-exit-btn" title="Thoát trò chơi">
            <LogOut size={16} />
          </button>
          <h3>🧩 Trò chơi ghép từ</h3>
        </div>
        <div className="match-header-stats" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Audio toggle button */}
          <button 
            onClick={() => setBgmMuted(!bgmMuted)} 
            className="matching-audio-toggle-btn-quiz"
            title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
          >
            {bgmMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="beat-animation" />}
            <span>{bgmMuted ? "Nhạc" : "Nhạc"}</span>
          </button>

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
                <div
                  key={`eng-${card.id}`}
                  className={cardClass}
                  onClick={() => handleCardClick(card)}
                  style={{ pointerEvents: isMatched ? 'none' : 'auto' }}
                >
                  <div className="card-content-left">
                    {getCardIcon(card.text, card.id)}
                    <span className="card-word-text">{card.text}</span>
                  </div>
                  <div className="card-content-right">
                    <button 
                      type="button"
                      className="card-audio-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(card.text);
                      }}
                      title="Phát âm"
                    >
                      <Volume2 size={13} />
                    </button>
                    {isMatched && <CheckCircle size={14} className="match-check-icon" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vietnamese / English Definition Column */}
        <div className="match-column">
          <h4 className="column-title">
            {quizType === 'matching-en' ? 'Định nghĩa (Anh)' : 'Tiếng Việt'}
          </h4>
          <div className="cards-stack">
            {vietnameseCards.map((card) => {
              const isMatched = matchedIds.has(card.id);
              const isSelected = selectedCard?.id === card.id && selectedCard?.type === card.type;
              const isFailed = failedIds.has(card.id);

              let cardClass = "match-card";
              if (isMatched) cardClass += " matched";
              else if (isSelected) cardClass += " selected";
              else if (isFailed) cardClass += " failed";

              return (
                <div
                  key={`vie-${card.id}`}
                  className={cardClass}
                  onClick={() => handleCardClick(card)}
                  style={{ pointerEvents: isMatched ? 'none' : 'auto' }}
                >
                  <div className="card-content-left">
                    {getCardIcon(card.text, card.id)}
                    <span className="card-word-text">{card.text}</span>
                  </div>
                  <div className="card-content-right">
                    {isMatched && <CheckCircle size={14} className="match-check-icon" />}
                  </div>
                </div>
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

  .matching-audio-toggle-btn-quiz {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    padding: 2px 8px;
    color: var(--color-text-secondary);
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .matching-audio-toggle-btn-quiz:hover {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .beat-animation {
    animation: heartbeat 1s infinite alternate;
  }

  @keyframes heartbeat {
    from { transform: scale(1); }
    to { transform: scale(1.15); }
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
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: var(--radius-lg);
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    white-space: normal;
    word-break: break-word;
    line-height: 1.4;
    user-select: none;
  }

  .card-content-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .card-content-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .card-decor-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .card-word-text {
    font-weight: 600;
  }

  .card-audio-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .card-audio-btn:hover {
    background: var(--color-accent-glow);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    transform: scale(1.1);
  }

  .match-exit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-default);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .match-exit-btn:hover {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-error);
  }

  .match-card:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    background: rgba(45, 45, 75, 0.7);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }

  .match-card.selected {
    border-color: var(--color-accent-primary);
    background: rgba(16, 185, 129, 0.15);
    color: #ffffff;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.35);
    transform: translateY(-2px) scale(1.02);
  }

  .match-card.matched {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.12);
    color: var(--color-success);
    opacity: 0.5;
    text-decoration: line-through;
    box-shadow: none;
    transform: none;
  }

  .match-card.failed {
    border-color: var(--color-error);
    background: rgba(239, 68, 68, 0.2);
    color: #ffffff;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.35);
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
    background: rgba(22, 22, 37, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
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
