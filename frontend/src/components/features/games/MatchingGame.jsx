import { useState, useEffect, useRef } from 'react';
import { 
  Trophy, RefreshCw, BookOpen, Volume2, VolumeX, Sparkles,
  Zap, Compass, Star, Smile, Heart, Flame, Globe, Sun, Moon, Feather, Award, Gift, Target, Shield, HelpCircle
} from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
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
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
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
    } catch (e) {
      console.warn("BGM Error:", e);
    }
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

const DEFAULT_WORDS = [
  { word: "computer", phonetic: "/kəmˈpjuːtər/", meaningVi: "Máy tính" },
  { word: "developer", phonetic: "/dɪˈveləpər/", meaningVi: "Nhà phát triển" },
  { word: "language", phonetic: "/ˈlæŋɡwɪdʒ/", meaningVi: "Ngôn ngữ" },
  { word: "database", phonetic: "/ˈdeɪtəbeɪs/", meaningVi: "Cơ sở dữ liệu" },
  { word: "framework", phonetic: "/ˈfreɪmwɜːrk/", meaningVi: "Khung sườn" },
  { word: "application", phonetic: "/ˌæplɪˈkeɪʃn/", meaningVi: "Ứng dụng" },
  { word: "software", phonetic: "/ˈsɔːftwer/", meaningVi: "Phần mềm" },
  { word: "hardware", phonetic: "/ˈhɑːrdwer/", meaningVi: "Phần cứng" },
  { word: "network", phonetic: "/ˈnetwɜːrk/", meaningVi: "Mạng lưới" },
  { word: "algorithm", phonetic: "/ˈælɡərɪðəm/", meaningVi: "Thuật toán" },
  { word: "security", phonetic: "/sɪˈkjʊrəti/", meaningVi: "Bảo mật" },
  { word: "memory", phonetic: "/ˈmeməri/", meaningVi: "Bộ nhớ" },
  { word: "internet", phonetic: "/ˈɪntərnet/", meaningVi: "Mạng internet" },
  { word: "server", phonetic: "/ˈsɜːrvər/", meaningVi: "Máy chủ" },
  { word: "client", phonetic: "/ˈklaɪənt/", meaningVi: "Máy khách" },
  { word: "programming", phonetic: "/ˈprəʊɡræmɪŋ/", meaningVi: "Lập trình" },
  { word: "compiler", phonetic: "/kəmˈpaɪlər/", meaningVi: "Trình biên dịch" },
  { word: "debugger", phonetic: "/ˌdiːˈbʌɡər/", meaningVi: "Trình gỡ lỗi" },
  { word: "interface", phonetic: "/ˈɪntərfeɪs/", meaningVi: "Giao diện" },
  { word: "function", phonetic: "/ˈfʌŋkʃn/", meaningVi: "Hàm số" }
];

const DECORATIVE_ICONS = [
  Sparkles, Compass, Star, Zap, Smile, Heart, Flame,
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
    <div className="card-decor-badge-game" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}>
      <IconComponent size={14} />
    </div>
  );
};

export default function MatchingGame() {
  const { vocabSets, fetchSets } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState('default');
  const [wordSourceList, setWordSourceList] = useState(DEFAULT_WORDS);
  const [wordCountLimit, setWordCountLimit] = useState(6);
  const [bgmMuted, setBgmMuted] = useState(true);
  
  // Game states
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedWordIds, setMatchedWordIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('matching-best-score') || '999', 10);
  });

  useEffect(() => {
    fetchSets();
  }, []);

  // Sync background music state
  useEffect(() => {
    if (!bgmMuted) {
      sound.startBgm();
    } else {
      sound.stopBgm();
    }
    return () => sound.stopBgm();
  }, [bgmMuted]);

  // Fetch or filter vocabulary sets
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
              meaningVi: v.meaningVi
            }))
            .filter(v => v.word.length > 0 && v.meaningVi.length > 0);
          
          if (filtered.length >= 4) {
            setWordSourceList(filtered);
          } else {
            toast.warning('Bộ từ vựng này phải chứa ít nhất 4 từ! Đã chuyển về danh sách mặc định.');
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

  // Start/Restart game when source or limit changes
  useEffect(() => {
    if (wordSourceList.length > 0) {
      setupGame();
    }
  }, [wordSourceList, wordCountLimit]);

  const setupGame = () => {
    // Select up to wordCountLimit words randomly
    const shuffledSource = [...wordSourceList].sort(() => 0.5 - Math.random());
    const selectedCount = Math.min(wordCountLimit, shuffledSource.length);
    const selectedWords = shuffledSource.slice(0, selectedCount);

    if (shuffledSource.length < wordCountLimit && selectedSetId !== 'default') {
      toast.info(`Bộ từ vựng chỉ có ${shuffledSource.length} từ. Đang hiển thị tối đa.`);
    }

    // Create English and Vietnamese cards
    const cardPool = [];
    selectedWords.forEach((wordObj, index) => {
      cardPool.push({
        id: `en-${index}`,
        wordId: index,
        type: 'en',
        val: wordObj.word,
        rawObj: wordObj
      });
      cardPool.push({
        id: `vi-${index}`,
        wordId: index,
        type: 'vi',
        val: wordObj.meaningVi,
        rawObj: wordObj
      });
    });

    // Shuffle the final card pool
    const shuffledCards = cardPool.sort(() => 0.5 - Math.random());
    setCards(shuffledCards);
    setFlippedIndices([]);
    setMatchedWordIds([]);
    setMoves(0);
    setIsChecking(false);
    setGameCompleted(false);
  };

  const handleCardClick = (index) => {
    if (isChecking || gameCompleted) return;
    if (flippedIndices.includes(index) || matchedWordIds.includes(cards[index].wordId)) return;

    sound.playFlip();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);

      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.wordId === secondCard.wordId && firstCard.type !== secondCard.type) {
        // Correct Match!
        sound.playMatchSuccess();
        setTimeout(() => {
          setMatchedWordIds(prev => {
            const next = [...prev, firstCard.wordId];
            if (next.length === cards.length / 2) {
              setGameCompleted(true);
              sound.playWin();
              const finalMoves = moves + 1;
              if (finalMoves < bestScore) {
                setBestScore(finalMoves);
                localStorage.setItem('matching-best-score', finalMoves.toString());
              }
              toast.success('Xuất sắc! Bạn đã lật hết các cặp bài.');
            }
            return next;
          });
          setFlippedIndices([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No Match
        sound.playMatchFail();
        setTimeout(() => {
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="matching-game-container animate-fade-in">
      {/* Header */}
      <div className="matching-header">
        <div>
          <h2 className="matching-title">🃏 Ghép Cặp Từ Vựng</h2>
          <p className="matching-subtitle">Lật các quân bài để ghép đúng từ tiếng Anh và nghĩa tiếng Việt</p>
          <div className="matching-rules-strip">
            <span>Luật: Chọn 1 thẻ Anh & 1 thẻ Việt có nghĩa tương đồng</span>
            <span>🧠 Rèn luyện trí nhớ</span>
          </div>
        </div>

        {/* Configurations */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {/* Audio toggle button */}
          <button 
            onClick={() => setBgmMuted(!bgmMuted)} 
            className="matching-audio-toggle-btn"
            title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
          >
            {bgmMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="beat-animation" />}
            <span>{bgmMuted ? "Bật nhạc" : "Nhạc BGM"}</span>
          </button>

          {/* Set Selector */}
          <div className="matching-selector-wrapper">
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

          {/* Word Count Selector */}
          <div className="matching-selector-wrapper">
            <Sparkles size={16} style={{ color: 'var(--color-accent-primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Số từ:</span>
            <select
              value={wordCountLimit}
              onChange={(e) => setWordCountLimit(parseInt(e.target.value))}
              className="vocab-set-select"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, padding: 0 }}
            >
              {Array.from({ length: 17 }, (_, i) => i + 4).map(num => (
                <option key={num} value={num}>{num} từ ({num * 2} thẻ)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score and Stats */}
      <div className="matching-stats-board">
        <div className="stat-badge">
          Lượt lật: <strong>{moves}</strong>
        </div>
        <div className="stat-badge">
          Kỷ lục ít lượt nhất: <strong>{bestScore === 999 ? 'Chưa có' : bestScore}</strong>
        </div>
        <button className="matching-reset-btn" onClick={setupGame} title="Chơi lại">
          <RefreshCw size={14} /> Chơi lại
        </button>
      </div>

      {/* Game Canvas Board */}
      <div className="matching-game-board card glass">
        {gameCompleted ? (
          <div className="matching-win-card animate-scale-in">
            <span className="win-badge">🎉 Hoàn Thành!</span>
            <p className="win-message">Bạn đã vượt qua màn chơi trong <strong>{moves}</strong> lượt lật bài!</p>
            <button className="btn-primary" onClick={setupGame}>
              Chơi Lượt Mới <RefreshCw size={14} />
            </button>
          </div>
        ) : (
          <div className="matching-cards-grid">
            {cards.map((card, index) => {
              const isFlipped = flippedIndices.includes(index);
              const isMatched = matchedWordIds.includes(card.wordId);
              
              return (
                <div 
                  key={card.id} 
                  className={`matching-card-scene`}
                  onClick={() => handleCardClick(index)}
                >
                  <div className={`matching-card-inner ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}>
                    {/* Card Front (Face Down) */}
                    <div className="matching-card-front">
                      <div className="card-front-pattern-wrapper">
                        <Sparkles size={16} className="card-front-logo-pattern" />
                      </div>
                    </div>
                    {/* Card Back (Face Up) */}
                    <div className={`matching-card-back ${card.type}`}>
                      <div className="card-back-decor-container">
                        {getCardIcon(card.rawObj.word, card.wordId)}
                        <span className="card-value-text">{card.val}</span>
                      </div>
                      {card.type === 'en' && isMatched && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(card.val);
                          }} 
                          className="matching-speak-inline"
                          title="Phát âm"
                        >
                          <Volume2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{matchingStyles}</style>
    </div>
  );
}

const matchingStyles = `
  .matching-game-container {
    max-width: 760px;
    margin: 0 auto;
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 0.75rem;
  }

  .matching-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .matching-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .matching-subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .matching-rules-strip {
    font-size: 0.75rem;
    margin-top: 0.375rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    background: var(--color-accent-glow);
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: var(--color-accent-secondary);
    font-weight: 600;
  }

  .matching-selector-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    padding: 0.375rem 0.75rem;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .matching-audio-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    padding: 0.375rem 0.75rem;
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .matching-audio-toggle-btn:hover {
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

  .vocab-set-select {
    border: none;
    background: transparent;
    outline: none;
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
  }

  .vocab-set-select option {
    background: rgba(22, 22, 37, 0.95);
    color: #ffffff;
  }

  .matching-stats-board {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .stat-badge {
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  .stat-badge strong {
    color: var(--color-accent-primary);
    font-size: 0.9rem;
  }

  .matching-reset-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(30, 30, 50, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .matching-reset-btn:hover {
    background: var(--color-accent-glow);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .matching-game-board {
    padding: 1.5rem;
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(22, 22, 37, 0.6);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .matching-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
    gap: 0.65rem;
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
  }

  .matching-card-scene {
    aspect-ratio: 1;
    perspective: 800px;
    cursor: pointer;
  }

  .matching-card-inner {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .matching-card-inner.flipped {
    transform: rotateY(180deg);
  }

  .matching-card-front, .matching-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    padding: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    text-align: center;
    overflow: hidden;
  }

  .matching-card-front {
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(45, 45, 75, 0.95));
    color: var(--color-accent-primary);
  }

  .card-front-pattern-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
  }

  .card-front-logo-pattern {
    animation: pulse 2s infinite alternate;
  }

  @keyframes pulse {
    from { opacity: 0.6; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1.1); }
  }

  .matching-card-back {
    transform: rotateY(180deg);
    font-size: 0.8rem;
    line-height: 1.3;
    background: rgba(30, 30, 50, 0.95);
    color: #ffffff;
    border: 1.5px solid rgba(255, 255, 255, 0.15);
  }

  .card-back-decor-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    width: 100%;
  }

  .card-decor-badge-game {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    margin-bottom: 0.1rem;
  }

  .matching-card-back.en {
    border-color: var(--color-accent-primary);
    background: rgba(16, 185, 129, 0.08);
    box-shadow: inset 0 0 12px rgba(16, 185, 129, 0.15);
  }

  .matching-card-back.vi {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    box-shadow: inset 0 0 12px rgba(59, 130, 246, 0.15);
  }

  .card-value-text {
    font-weight: 600;
    max-height: 2.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: 0.75rem;
  }

  .matching-card-inner.matched {
    transform: rotateY(180deg) scale(0.95);
  }

  .matching-card-inner.matched .matching-card-back {
    border-style: solid;
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.15);
    opacity: 0.55;
  }

  .matching-speak-inline {
    position: absolute;
    bottom: 3px;
    right: 3px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    color: var(--color-accent-primary);
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .matching-speak-inline:hover {
    background: var(--color-accent-glow);
    border-color: var(--color-accent-primary);
    transform: scale(1.1);
  }

  .matching-win-card {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 300px;
  }

  .win-badge {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-success);
    background: rgba(16, 185, 129, 0.1);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
  }

  .win-message {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }
`;
