import { useState, useEffect, useRef } from 'react';
import { Volume2, Trophy, RefreshCw, AlertCircle, Play, HelpCircle, BookOpen, SkipForward, Delete, RotateCcw } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import { toast } from 'sonner';

// Default vocabulary list for scramble (various lengths)
const DEFAULT_WORDS = [
  { word: "computer", phonetic: "/kəmˈpjuːtər/", meaningVi: "Máy tính", englishDefinition: "An electronic device for storing and processing data." },
  { word: "developer", phonetic: "/dɪˈveləpər/", meaningVi: "Nhà phát triển phần mềm", englishDefinition: "A person who writes computer software code." },
  { word: "intelligence", phonetic: "/ɪnˈtelɪdʒəns/", meaningVi: "Trí thông minh", englishDefinition: "The ability to acquire and apply knowledge and skills." },
  { word: "language", phonetic: "/ˈlæŋɡwɪdʒ/", meaningVi: "Ngôn ngữ", englishDefinition: "A system of communication used by a particular country or community." },
  { word: "database", phonetic: "/ˈdeɪtəbeɪs/", meaningVi: "Cơ sở dữ liệu", englishDefinition: "A structured set of data held in a computer." },
  { word: "framework", phonetic: "/ˈfreɪmwɜːrk/", meaningVi: "Khung sườn, cấu trúc", englishDefinition: "A basic structure underlying a system, concept, or text." },
  { word: "application", phonetic: "/ˌæplɪˈkeɪʃn/", meaningVi: "Ứng dụng", englishDefinition: "A program or piece of software designed for a particular purpose." },
  { word: "algorithm", phonetic: "/ˈælɡərɪðəm/", meaningVi: "Thuật toán", englishDefinition: "A process or set of rules to be followed in calculations." },
  { word: "vocabulary", phonetic: "/vəˈkæbjəleri/", meaningVi: "Từ vựng", englishDefinition: "The body of words used in a particular language." },
  { word: "education", phonetic: "/ˌedʒuˈkeɪʃn/", meaningVi: "Giáo dục", englishDefinition: "The process of receiving or giving systematic instruction." },
  { word: "technology", phonetic: "/tekˈnɑːlədʒi/", meaningVi: "Công nghệ", englishDefinition: "The application of scientific knowledge for practical purposes." },
  { word: "practice", phonetic: "/ˈpræktɪs/", meaningVi: "Luyện tập, thực hành", englishDefinition: "Perform an activity or exercise repeatedly to improve skill." },
  { word: "listening", phonetic: "/ˈlɪsənɪŋ/", meaningVi: "Luyện nghe", englishDefinition: "The action of explaining or paying attention to sound." },
  { word: "chatbot", phonetic: "/ˈtʃætˌbɒt/", meaningVi: "Trợ lý ảo đối thoại", englishDefinition: "A computer program designed to simulate conversation with human users." },
  { word: "progress", phonetic: "/ˈprɑːɡres/", meaningVi: "Tiến độ, tiến bộ", englishDefinition: "Forward or onward movement toward a destination." }
];

export default function ScrambleGame() {
  const { vocabSets, fetchSets } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState('default');
  const [wordSourceList, setWordSourceList] = useState(DEFAULT_WORDS);
  const [targetWord, setTargetWord] = useState(null);
  const [scrambledWord, setScrambledWord] = useState('');
  const [selectedIndices, setSelectedIndices] = useState([]);
  
  // Game Play States
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('scramble-high-score') || '0', 10);
  });
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'correct', 'timeout'
  
  // Timer States (60 seconds per word)
  const MAX_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const timerRef = useRef(null);

  // Sync selectedIndices with userAnswer
  useEffect(() => {
    if (scrambledWord) {
      const answer = selectedIndices.map(idx => scrambledWord[idx]).join('');
      setUserAnswer(answer);
    } else {
      setUserAnswer('');
    }
  }, [selectedIndices, scrambledWord]);

  // Click helpers
  const handleSelectLetter = (idx) => {
    if (gameStatus !== 'playing') return;
    if (selectedIndices.includes(idx)) return;
    setSelectedIndices([...selectedIndices, idx]);
  };

  const handleRemoveLetter = (selectedIndexInAnswerRow) => {
    if (gameStatus !== 'playing') return;
    const newSelected = [...selectedIndices];
    newSelected.splice(selectedIndexInAnswerRow, 1);
    setSelectedIndices(newSelected);
  };

  const handleClearAll = () => {
    if (gameStatus !== 'playing') return;
    setSelectedIndices([]);
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;
      const key = e.key.toLowerCase();
      
      if (key === 'backspace') {
        setSelectedIndices(prev => prev.slice(0, -1));
      } else if (key === 'enter') {
        handleSubmit();
      } else if (/^[a-z]$/.test(key)) {
        // Find first index in scrambledWord with this letter that is not yet selected
        const idx = scrambledWord.split('').findIndex((char, index) => 
          char.toLowerCase() === key && !selectedIndices.includes(index)
        );
        if (idx !== -1) {
          setSelectedIndices(prev => [...prev, idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, scrambledWord, selectedIndices]);

  useEffect(() => {
    fetchSets();
  }, []);

  // Set up word list depending on selection
  useEffect(() => {
    const loadWords = async () => {
      if (selectedSetId === 'default') {
        setWordSourceList(DEFAULT_WORDS);
      } else {
        try {
          const api = (await import('../../../services/api')).default;
          const { data } = await api.get(`/vocabulary/sets/${selectedSetId}`);
          
          const filtered = (data.vocabularies || [])
            .map(v => ({
              word: v.word.trim().toLowerCase(),
              phonetic: v.phonetic,
              meaningVi: v.meaningVi,
              englishDefinition: v.englishDefinition
            }))
            .filter(v => v.word.length >= 3 && /^[a-z]+$/.test(v.word));
          
          if (filtered.length > 0) {
            setWordSourceList(filtered);
          } else {
            toast.warning('Bộ từ vựng này không chứa từ nào hợp lệ! Hệ thống sẽ chuyển về danh sách mặc định.');
            setSelectedSetId('default');
            setWordSourceList(DEFAULT_WORDS);
          }
        } catch (err) {
          console.error(err);
          toast.error('Lỗi khi tải bộ từ vựng cá nhân.');
          setWordSourceList(DEFAULT_WORDS);
        }
      }
    };
    loadWords();
  }, [selectedSetId]);

  // Load new word
  useEffect(() => {
    if (wordSourceList.length > 0) {
      loadNewWord();
    }
  }, [wordSourceList]);

  // Handle timer
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameStatus('timeout');
            toast.error('Hết giờ rồi! Hãy xem đáp án nhé.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [gameStatus]);

  const scrambleString = (str) => {
    const arr = str.split('');
    let scrambled = '';
    
    // Keep scrambling until the scrambled word is actually different
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      scrambled = arr.join('');
    } while (scrambled === str && str.length > 1);

    return scrambled;
  };

  const loadNewWord = () => {
    const randomIndex = Math.floor(Math.random() * wordSourceList.length);
    const selected = wordSourceList[randomIndex];
    setTargetWord(selected);
    setScrambledWord(scrambleString(selected.word));
    setUserAnswer('');
    setSelectedIndices([]);
    setTimeLeft(MAX_TIME);
    setGameStatus('playing');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (gameStatus !== 'playing') return;

    if (userAnswer.trim().toLowerCase() === targetWord.word) {
      clearInterval(timerRef.current);
      setGameStatus('correct');
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('scramble-high-score', newScore.toString());
      }
      
      toast.success('Đoán từ chính xác! +1 Điểm');
    } else {
      toast.error('Sai rồi! Hãy suy nghĩ kỹ và thử lại nhé.');
    }
  };

  const handleSkip = () => {
    clearInterval(timerRef.current);
    setScore(0); // Reset streak on skip
    toast.info('Đã bỏ qua từ này. Chuỗi điểm của bạn đã được reset.');
    loadNewWord();
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const timerPercentage = (timeLeft / MAX_TIME) * 100;

  return (
    <div className="scramble-container animate-fade-in">
      {/* Header */}
      <div className="scramble-header">
        <div>
          <h2 className="scramble-title">🔠 Trò Chơi Xáo Trộn Từ</h2>
          <p className="scramble-subtitle">Sắp xếp các chữ cái bị trộn thành từ đúng</p>
          <div className="scramble-rules-strip" style={{ fontSize: '0.75rem', marginTop: '0.375rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--color-accent-glow)', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-accent-secondary)', fontWeight: 600 }}>
            <span>Luật: Sắp xếp chữ cái (60 giây)</span>
            <span>💡 Nhập đúng để ghi điểm</span>
            <span>🔥 Đoán đúng liên tục để lập kỷ lục</span>
          </div>
        </div>

        {/* Set Selector */}
        <div className="scramble-selector-wrapper">
          <BookOpen size={16} style={{ color: 'var(--color-accent-primary)' }} />
          <select
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
            className="vocab-set-select"
          >
            <option value="default">Mặc định (Từ vựng chung)</option>
            {vocabSets.map(set => (
              <option key={set._id} value={set._id}>{set.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Score Tracker */}
      <div className="scramble-score-board">
        <div className="score-badge">
          <span>Chuỗi thắng: </span>
          <strong>{score}</strong>
        </div>
        <div className="score-badge">
          <span>Kỷ lục: </span>
          <strong>{highScore}</strong>
        </div>
      </div>

      {/* Time Attack Progress Bar */}
      <div className="scramble-timer-wrapper">
        <div className="scramble-timer-text">
          <span>⏱️ Thời gian còn lại:</span>
          <strong style={{ color: timeLeft < 10 ? '#ef4444' : 'var(--color-accent-primary)' }}>{timeLeft}s</strong>
        </div>
        <div className="scramble-progress-track">
          <div 
            className="scramble-progress-fill" 
            style={{ 
              width: `${timerPercentage}%`,
              background: timeLeft < 10 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--gradient-accent)'
            }}
          />
        </div>
      </div>

      {/* Game Canvas Board */}
      <div className="scramble-game-board card glass">
        {targetWord && (
          <div className="scramble-play-zone">
            {/* Answer Slots Row with inline Actions */}
            <div className="scramble-answer-container">
              <div className="scramble-answer-row">
                {targetWord.word.split('').map((_, idx) => {
                  const isFilled = idx < selectedIndices.length;
                  const letterIdx = isFilled ? selectedIndices[idx] : null;
                  const letter = isFilled ? scrambledWord[letterIdx] : '';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => isFilled && handleRemoveLetter(idx)}
                      className={`scramble-answer-slot ${isFilled ? 'filled animate-scale-in' : 'empty'}`}
                      disabled={gameStatus !== 'playing' || !isFilled}
                      title={isFilled ? "Click để xóa chữ này" : ""}
                    >
                      {letter.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {gameStatus === 'playing' && (
                <div className="scramble-inline-utils">
                  <button 
                    type="button" 
                    onClick={() => setSelectedIndices(prev => prev.slice(0, -1))} 
                    className="scramble-icon-btn delete"
                    disabled={selectedIndices.length === 0}
                    title="Xóa chữ cuối"
                  >
                    <Delete size={20} />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleClearAll} 
                    className="scramble-icon-btn reset"
                    disabled={selectedIndices.length === 0}
                    title="Làm mới (Nhập lại từ đầu)"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Scrambled Pile (Clickable letters) */}
            {gameStatus === 'playing' && (
              <div className="scrambled-letters-pile">
                {scrambledWord.split('').map((letter, idx) => {
                  const isUsed = selectedIndices.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectLetter(idx)}
                      disabled={isUsed || gameStatus !== 'playing'}
                      className={`scrambled-pile-btn card ${isUsed ? 'used' : 'animate-scale-in'}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {letter.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Word Hint */}
            <div className="scramble-hint-box">
              <span className="hint-label">💡 Gợi ý:</span>
              <p className="hint-text">{targetWord.meaningVi}</p>
              {targetWord.englishDefinition && (
                <p className="hint-text-en"><em>({targetWord.englishDefinition})</em></p>
              )}
            </div>

            {/* Answer Actions */}
            {gameStatus === 'playing' ? (
              <div className="scramble-actions-wrapper">
                <div className="scramble-actions">
                  <button 
                    type="button" 
                    onClick={() => handleSubmit()} 
                    className="btn-primary"
                    disabled={selectedIndices.length < targetWord.word.length}
                    style={{ flex: 2 }}
                  >
                    Gửi đáp án
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSkip} 
                    className="btn-ghost" 
                    title="Bỏ qua từ này"
                    style={{ flex: 1 }}
                  >
                    <SkipForward size={14} /> Bỏ qua
                  </button>
                </div>
              </div>
            ) : (
              /* Reveal Card on Timeout or Correct Answer */
              <div className="scramble-reveal-card animate-scale-in">
                <div className="reveal-header">
                  {gameStatus === 'correct' ? (
                    <span className="badge badge-success">Chính Xác! 🎉</span>
                  ) : (
                    <span className="badge badge-error" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>Hết Giờ! ⏱️</span>
                  )}
                </div>

                <div className="reveal-word-row">
                  <span className="reveal-word-text">{targetWord.word}</span>
                  {targetWord.phonetic && (
                    <span className="reveal-word-phonetic">{targetWord.phonetic}</span>
                  )}
                  <button 
                    onClick={() => handleSpeak(targetWord.word)}
                    className="scramble-speak-btn"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div className="reveal-meanings">
                  <p><strong>Nghĩa: </strong>{targetWord.meaningVi}</p>
                  {targetWord.englishDefinition && (
                    <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Def: {targetWord.englishDefinition}
                    </p>
                  )}
                </div>

                <button onClick={loadNewWord} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                  Tiếp tục <Play size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{scrambleStyles}</style>
    </div>
  );
}

const scrambleStyles = `
  .scramble-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 0.75rem;
  }

  .scramble-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .scramble-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .scramble-subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .scramble-selector-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 0.375rem 0.75rem;
  }

  .vocab-set-select {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .scramble-score-board {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .score-badge {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  .score-badge strong {
    color: var(--color-accent-primary);
    font-size: 0.9rem;
  }

  .scramble-timer-wrapper {
    margin-bottom: 1rem;
  }

  .scramble-timer-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 0.375rem;
    color: var(--color-text-secondary);
  }

  .scramble-progress-track {
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 999px;
    overflow: hidden;
  }

  .scramble-progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 1s linear;
  }

  .scramble-game-board {
    padding: 2rem;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border-accent);
    box-shadow: var(--shadow-glow);
    border-radius: var(--radius-lg);
  }

  .scramble-play-zone {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .scramble-answer-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .scramble-answer-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    max-width: 100%;
  }

  .scramble-inline-utils {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .scramble-icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid var(--color-border-default);
    background: white !important;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .scramble-icon-btn:not(:disabled):hover {
    background: var(--color-accent-glow);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    transform: scale(1.05);
  }

  .scramble-icon-btn.delete:not(:disabled):hover {
    background: rgba(239, 68, 68, 0.08) !important;
    border-color: #ef4444;
    color: #ef4444;
  }

  .scramble-icon-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .scramble-answer-slot {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    font-weight: 800;
    border-radius: var(--radius-md);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: transparent;
  }

  .scramble-answer-slot.empty {
    border: 2px dashed var(--color-border-default);
    color: transparent;
    cursor: default;
  }

  .scramble-answer-slot.filled {
    border: 2px solid var(--color-accent-primary);
    background: var(--color-bg-card);
    color: var(--color-accent-primary);
    cursor: pointer;
    box-shadow: 0 2px 8px var(--color-accent-glow);
  }

  .scramble-answer-slot.filled:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  .scrambled-letters-pile {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    max-width: 100%;
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.02);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border-default);
  }

  .scrambled-pile-btn {
    min-width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--color-text-primary);
    background: white !important;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scrambled-pile-btn:not(.used):hover {
    transform: translateY(-2px);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    box-shadow: var(--shadow-glow);
  }

  .scrambled-pile-btn.used {
    opacity: 0.15;
    transform: scale(0.9);
    cursor: not-allowed;
    pointer-events: none;
    box-shadow: none;
    border-style: dashed;
  }

  .scramble-hint-box {
    text-align: center;
    background: var(--color-bg-secondary);
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-md);
    width: 100%;
    max-width: 450px;
    border: 1px solid var(--color-border-default);
  }

  .hint-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 0.25rem;
  }

  .hint-text {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .hint-text-en {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-top: 0.125rem;
  }

  .scramble-actions-wrapper {
    width: 100%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .scramble-utility-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .scramble-util-btn {
    flex: 1;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.35rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .scramble-util-btn:not(:disabled):hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
    border-color: var(--color-border-accent);
  }

  .scramble-util-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .scramble-actions {
    display: flex;
    gap: 0.5rem;
  }

  .scramble-actions button {
    justify-content: center;
  }

  .scramble-reveal-card {
    width: 100%;
    max-width: 450px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .reveal-word-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }

  .reveal-word-text {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--color-accent-primary);
    text-transform: uppercase;
  }

  .reveal-word-phonetic {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .scramble-speak-btn {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .scramble-speak-btn:hover {
    color: var(--color-accent-primary);
    background: var(--color-accent-glow);
  }

  .reveal-meanings {
    background: var(--color-bg-secondary);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    width: 100%;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-default);
    text-align: left;
  }
`;
