import { useState, useEffect } from 'react';
import { Volume2, Trophy, RefreshCw, AlertCircle, HelpCircle, BookOpen } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import { toast } from 'sonner';

const DEFAULT_WORDS = [
  { word: "about", phonetic: "/əˈbaʊt/", meaningVi: "Về, khoảng", englishDefinition: "On the subject of; concerning." },
  { word: "alert", phonetic: "/əˈlɜːrt/", meaningVi: "Cảnh giác, tỉnh táo", englishDefinition: "Quick to notice any unusual and potentially dangerous circumstances." },
  { word: "beach", phonetic: "/biːtʃ/", meaningVi: "Bãi biển", englishDefinition: "A pebbly or sandy shore, especially by the ocean." },
  { word: "brain", phonetic: "/breɪn/", meaningVi: "Bộ não, trí tuệ", englishDefinition: "An organ of soft nervous tissue contained in the skull." },
  { word: "bread", phonetic: "/bred/", meaningVi: "Bánh mì", englishDefinition: "Food made of flour, water, and yeast mixed together and baked." },
  { word: "clear", phonetic: "/klɪər/", meaningVi: "Trong suốt, rõ ràng", englishDefinition: "Easy to perceive, understand, or interpret." },
  { word: "earth", phonetic: "/ɜːrθ/", meaningVi: "Trái đất, mặt đất", englishDefinition: "The planet on which we live; the world." },
  { word: "event", phonetic: "/ɪˈvent/", meaningVi: "Sự kiện", englishDefinition: "A thing that happens, especially one of importance." },
  { word: "focus", phonetic: "/ˈfoʊkəs/", meaningVi: "Tập trung, tiêu điểm", englishDefinition: "The center of interest or activity." },
  { word: "giant", phonetic: "/ˈdʒaɪənt/", meaningVi: "Khổng lồ", englishDefinition: "An imaginary or mythical being of human form but of superhuman size." },
  { word: "green", phonetic: "/ɡriːn/", meaningVi: "Màu xanh lá cây", englishDefinition: "Of the color between blue and yellow in the spectrum; colored like grass." },
  { word: "house", phonetic: "/haʊs/", meaningVi: "Ngôi nhà", englishDefinition: "A building for human habitation." },
  { word: "image", phonetic: "/ˈɪmɪdʒ/", meaningVi: "Hình ảnh", englishDefinition: "A representation of the external form of a person or thing in art." },
  { word: "light", phonetic: "/laɪt/", meaningVi: "Ánh sáng, nhẹ", englishDefinition: "The natural agent that stimulates sight and makes things visible." },
  { word: "music", phonetic: "/ˈmjuːzɪk/", meaningVi: "Âm nhạc", englishDefinition: "Vocal or instrumental sounds combined in such a way as to produce beauty of form." },
  { word: "ocean", phonetic: "/ˈoʊʃn/", meaningVi: "Đại dương", englishDefinition: "A very large expanse of sea, in particular, each of the main areas of saltwater." },
  { word: "paper", phonetic: "/ˈpeɪpər/", meaningVi: "Giấy", englishDefinition: "Material manufactured in thin sheets from the pulp of wood or other fibrous substances." },
  { word: "plant", phonetic: "/plænt/", meaningVi: "Thực vật, cây cối", englishDefinition: "A living organism of the kind exemplified by trees, shrubs, herbs, grasses, ferns, and mosses." },
  { word: "smart", phonetic: "/smɑːrt/", meaningVi: "Thông minh", englishDefinition: "Having or showing a quick-witted intelligence." },
  { word: "smile", phonetic: "/smaɪl/", meaningVi: "Nụ cười", englishDefinition: "Form one's features into a pleased or kind or amused expression." },
  { word: "solid", phonetic: "/ˈsɑːlɪd/", meaningVi: "Chất rắn, vững chắc", englishDefinition: "Firm and stable in shape; not liquid or fluid." },
  { word: "solve", phonetic: "/sɑːlv/", meaningVi: "Giải quyết, tìm ra lời giải", englishDefinition: "Find an answer to, explanation for, or means of effectively dealing with." },
  { word: "sound", phonetic: "/saʊnd/", meaningVi: "Âm thanh", englishDefinition: "Vibrations traveling through the air or another medium." },
  { word: "space", phonetic: "/speɪs/", meaningVi: "Không gian, vũ trụ", englishDefinition: "A continuous area or expanse which is free, available, or unoccupied." },
  { word: "speak", phonetic: "/spiːk/", meaningVi: "Nói, phát biểu", englishDefinition: "Say something in order to convey information, an opinion, or a feeling." },
  { word: "stage", phonetic: "/steɪdʒ/", meaningVi: "Sân khấu, giai đoạn", englishDefinition: "A point, period, or step in a process or development." },
  { word: "stone", phonetic: "/stoʊn/", meaningVi: "Đá", englishDefinition: "Hard solid nonmetallic mineral matter of which rock is made." },
  { word: "table", phonetic: "/ˈteɪbl/", meaningVi: "Cái bàn", englishDefinition: "A piece of furniture with a flat top and one or more legs." },
  { word: "voice", phonetic: "/vɔɪs/", meaningVi: "Giọng nói", englishDefinition: "The sound produced in a person's larynx and uttered through the mouth." },
  { word: "water", phonetic: "/ˈwɔːtər/", meaningVi: "Nước", englishDefinition: "A colorless, transparent, odorless liquid that forms the seas, lakes, and rivers." },
];

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BACKSPACE']
];

export default function WordleGame() {
  const { vocabSets, fetchSets } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState('default');
  const [wordSourceList, setWordSourceList] = useState(DEFAULT_WORDS);
  const [targetWord, setTargetWord] = useState(null);
  
  // Game Play States
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [shakeRowIndex, setShakeRowIndex] = useState(null);

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
          
          // Filter 5 letter words
          const filtered = (data.vocabularies || [])
            .map(v => ({
              word: v.word.trim().toLowerCase(),
              phonetic: v.phonetic,
              meaningVi: v.meaningVi,
              englishDefinition: v.englishDefinition
            }))
            .filter(v => v.word.length === 5 && /^[a-z]+$/.test(v.word));
          
          if (filtered.length > 0) {
            setWordSourceList(filtered);
          } else {
            toast.warning('Bộ từ vựng này không chứa từ nào có đúng 5 chữ cái tiếng Anh! Hệ thống sẽ chuyển về danh sách từ mặc định.');
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

  // Start new game when list updates
  useEffect(() => {
    if (wordSourceList.length > 0) {
      startNewGame();
    }
  }, [wordSourceList]);

  const startNewGame = () => {
    const randomIndex = Math.floor(Math.random() * wordSourceList.length);
    setTargetWord(wordSourceList[randomIndex]);
    setGuesses(Array(6).fill(''));
    setCurrentGuessIndex(0);
    setGameStatus('playing');
    setShakeRowIndex(null);
  };

  // Keyboard controls
  useEffect(() => {
    const handlePhysicalKeyDown = (e) => {
      if (gameStatus !== 'playing') return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        removeLetter();
      } else if (/^[A-Z]$/.test(key) && key.length === 1) {
        addLetter(key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [guesses, currentGuessIndex, gameStatus, targetWord]);

  const addLetter = (letter) => {
    if (guesses[currentGuessIndex].length >= 5) return;
    setGuesses(prev => {
      const copy = [...prev];
      copy[currentGuessIndex] += letter;
      return copy;
    });
  };

  const removeLetter = () => {
    if (guesses[currentGuessIndex].length === 0) return;
    setGuesses(prev => {
      const copy = [...prev];
      copy[currentGuessIndex] = copy[currentGuessIndex].slice(0, -1);
      return copy;
    });
  };

  const submitGuess = () => {
    const currentGuess = guesses[currentGuessIndex];
    if (currentGuess.length < 5) {
      toast.error('Từ đoán phải có đúng 5 ký tự!');
      setShakeRowIndex(currentGuessIndex);
      setTimeout(() => setShakeRowIndex(null), 500);
      return;
    }

    if (currentGuess === targetWord.word) {
      setGameStatus('won');
      toast.success('Xuất sắc! Bạn đã đoán chính xác từ khóa.');
      return;
    }

    if (currentGuessIndex >= 5) {
      setGameStatus('lost');
      toast.error('Rất tiếc! Bạn đã hết lượt đoán.');
      return;
    }

    setCurrentGuessIndex(prev => prev + 1);
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  // Calculate status for virtual keyboard colors
  const getLetterStatuses = () => {
    const statuses = {};
    if (!targetWord) return statuses;
    
    guesses.slice(0, currentGuessIndex).forEach(guess => {
      for (let i = 0; i < guess.length; i++) {
        const char = guess[i];
        if (targetWord.word[i] === char) {
          statuses[char] = 'correct';
        } else if (targetWord.word.includes(char)) {
          if (statuses[char] !== 'correct') {
            statuses[char] = 'present';
          }
        } else {
          statuses[char] = 'absent';
        }
      }
    });
    return statuses;
  };

  const letterStatuses = getLetterStatuses();

  // Helper to color cells
  const getCellClassName = (char, index, isSubmitted) => {
    let base = "wordle-cell ";
    if (!isSubmitted) return base + "empty";

    if (targetWord.word[index] === char) {
      return base + "correct";
    } else if (targetWord.word.includes(char)) {
      return base + "present";
    } else {
      return base + "absent";
    }
  };

  return (
    <div className="wordle-container animate-fade-in">
      {/* Header section */}
      <div className="wordle-header">
        <div>
          <h2 className="wordle-title">🎮 Trò Chơi Wordle</h2>
          <p className="wordle-subtitle">Luyện đoán từ 5 chữ cái để ghi nhớ từ vựng</p>
          <div className="wordle-rules-strip" style={{ fontSize: '0.75rem', marginTop: '0.375rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--color-accent-glow)', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-accent-secondary)', fontWeight: 600 }}>
            <span>Luật: đoán từ 5 ký tự (6 lượt)</span>
            <span>🟩 Đúng chữ & vị trí</span>
            <span>🟨 Đúng chữ, sai vị trí</span>
            <span>⬜ Không có trong từ</span>
          </div>
        </div>
        
        {/* Actions & Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Set Selector */}
          <div className="wordle-selector-wrapper">
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
      </div>

      <div className="wordle-game-board">
        {/* Wordle grid enclosed in a container card */}
        <div className="wordle-grid-container card glass">
          <div className="wordle-grid">
            {guesses.map((guess, rowIndex) => {
              const isSubmitted = rowIndex < currentGuessIndex;
              const isActive = rowIndex === currentGuessIndex;
              const isShaking = shakeRowIndex === rowIndex;

              return (
                <div 
                  key={rowIndex} 
                  className={`wordle-row ${isShaking ? 'animate-shake' : ''}`}
                >
                  {Array(5).fill(0).map((_, colIndex) => {
                    const char = guess[colIndex] || '';
                    const cellClass = getCellClassName(char, colIndex, isSubmitted);
                    
                    return (
                      <div 
                        key={colIndex} 
                        className={cellClass}
                        style={{ animationDelay: `${colIndex * 0.1}s` }}
                      >
                        {char.toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Victory/Defeat Details Card */}
        {gameStatus !== 'playing' && targetWord && (
          <div className="wordle-result-card card animate-scale-in">
            <div className="wordle-result-icon">
              {gameStatus === 'won' ? (
                <Trophy size={48} style={{ color: '#eab308' }} />
              ) : (
                <AlertCircle size={48} style={{ color: '#ef4444' }} />
              )}
            </div>
            
            <h3 className="wordle-result-title">
              {gameStatus === 'won' ? 'Tuyệt Vời! Bạn đã chiến thắng' : 'Rất tiếc! Bạn chưa đoán trúng'}
            </h3>

            <div className="wordle-word-details">
              <div className="wordle-result-word-row">
                <span className="wordle-result-word">{targetWord.word}</span>
                {targetWord.phonetic && (
                  <span className="wordle-result-phonetic">{targetWord.phonetic}</span>
                )}
                <button 
                  onClick={() => handleSpeak(targetWord.word)}
                  className="wordle-speak-btn"
                  title="Nghe phát âm"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              
              <div className="wordle-result-meaning">
                <strong>Nghĩa: </strong> {targetWord.meaningVi}
              </div>
              
              {targetWord.englishDefinition && (
                <div className="wordle-result-def">
                  <strong>Định nghĩa: </strong> <em>{targetWord.englishDefinition}</em>
                </div>
              )}
            </div>

            <button onClick={startNewGame} className="btn-primary" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={16} /> Chơi tiếp
            </button>
          </div>
        )}
      </div>

      {/* Virtual Keyboard */}
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => {
              const status = letterStatuses[key];
              let keyClass = "keyboard-key ";
              if (key === 'ENTER' || key === 'BACKSPACE') {
                keyClass += "wide-key ";
              } else if (status) {
                keyClass += `key-${status} `;
              }

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (gameStatus !== 'playing') return;
                    if (key === 'ENTER') submitGuess();
                    else if (key === 'BACKSPACE') removeLetter();
                    else addLetter(key);
                  }}
                  className={keyClass}
                >
                  {key === 'BACKSPACE' ? 'DEL' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <style>{wordleStyles}</style>
    </div>
  );
}

const wordleStyles = `
  .wordle-container {
    max-width: 650px;
    margin: 0 auto;
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 0.75rem;
  }

  .wordle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .wordle-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .wordle-subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .wordle-selector-wrapper {
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

  .wordle-game-board {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
    justify-content: center;
  }

  @media (min-width: 600px) {
    .wordle-game-board {
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 2rem;
    }
  }

  .wordle-grid-container {
    padding: 1.5rem;
    background: var(--color-bg-glass);
    border: 1px solid var(--color-border-accent);
    box-shadow: var(--shadow-glow);
    border-radius: var(--radius-lg);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .wordle-grid {
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    gap: 6px;
    width: 260px;
    height: 310px;
  }

  .wordle-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }

  .wordle-cell {
    border: 2px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
    user-select: none;
    transition: all 0.1s ease;
  }

  .wordle-cell.empty {
    background: var(--color-bg-card);
    border-color: var(--color-border-default);
  }

  .wordle-cell.correct {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;
    animation: flipIn 0.5s ease forwards;
  }

  .wordle-cell.present {
    background: var(--color-warning);
    border-color: var(--color-warning);
    color: white;
    animation: flipIn 0.5s ease forwards;
  }

  .wordle-cell.absent {
    background: var(--color-text-muted);
    border-color: var(--color-text-muted);
    color: white;
    opacity: 0.75;
    animation: flipIn 0.5s ease forwards;
  }

  @keyframes flipIn {
    0% { transform: rotateX(0deg); }
    45% { transform: rotateX(90deg); }
    55% { transform: rotateX(90deg); }
    100% { transform: rotateX(0deg); }
  }

  .wordle-result-card {
    width: 280px;
    padding: 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid var(--color-border-accent);
    box-shadow: var(--shadow-glow);
  }

  .wordle-result-icon {
    margin-bottom: 0.5rem;
  }

  .wordle-result-title {
    font-size: 0.95rem;
    font-weight: 800;
    margin-bottom: 0.75rem;
  }

  .wordle-word-details {
    text-align: left;
    width: 100%;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .wordle-result-word-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .wordle-result-word {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--color-accent-primary);
    text-transform: uppercase;
  }

  .wordle-result-phonetic {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .wordle-speak-btn {
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

  .wordle-speak-btn:hover {
    color: var(--color-accent-primary);
    background: var(--color-accent-glow);
  }

  .wordle-result-meaning, .wordle-result-def {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .wordle-keyboard {
    margin-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    width: 100%;
  }

  .keyboard-row {
    display: flex;
    gap: 4px;
    justify-content: center;
    width: 100%;
  }

  .keyboard-key {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
    font-size: 0.85rem;
    font-weight: 700;
    height: 38px;
    width: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    text-transform: uppercase;
    transition: all 0.2s ease;
  }

  .keyboard-key.wide-key {
    width: 50px;
    font-size: 0.7rem;
  }

  .keyboard-key:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-accent);
  }

  .keyboard-key.key-correct {
    background: var(--color-success) !important;
    border-color: var(--color-success) !important;
    color: white !important;
  }

  .keyboard-key.key-present {
    background: var(--color-warning) !important;
    border-color: var(--color-warning) !important;
    color: white !important;
  }

  .keyboard-key.key-absent {
    background: var(--color-text-muted) !important;
    border-color: var(--color-text-muted) !important;
    color: white !important;
    opacity: 0.6;
  }
`;
