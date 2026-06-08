import { useState, useEffect, useRef } from 'react';
import { BookOpen, Layers, RotateCcw, Volume2, AlertCircle, Sparkles, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import { toast } from 'sonner';

export default function FlashcardStudy() {
  const { vocabSets, fetchSets, vocabularies, fetchSetById, generateDefinitions, isLoading } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [studying, setStudying] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Study states
  const [queue, setQueue] = useState([]); // Remaining cards to study
  const [totalCount, setTotalCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState({}); // Track wrong attempts per card ID
  const [masteredList, setMasteredList] = useState([]);
  const [failedList, setFailedList] = useState([]); // List of card IDs that were marked "Chưa thuộc" at least once
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null

  useEffect(() => {
    fetchSets();
  }, []);

  // Refs to avoid stale closures in window event listener
  const isFlippedRef = useRef(isFlipped);
  const handleMarkWrongRef = useRef(null);
  const handleMarkCorrectRef = useRef(null);
  const handlePrevCardRef = useRef(null);
  const handleNextCardRef = useRef(null);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
    handleMarkWrongRef.current = handleMarkWrong;
    handleMarkCorrectRef.current = handleMarkCorrect;
    handlePrevCardRef.current = handlePrevCard;
    handleNextCardRef.current = handleNextCard;
  });

  // Keyboard controls
  useEffect(() => {
    if (!studying) return;

    const handleKeyDown = (e) => {
      // Ignore shortcut keys if typing in input/textarea (like the AI chatbot panel)
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCardRef.current();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCardRef.current();
      } else if (e.key === '1') {
        e.preventDefault();
        handleMarkWrongRef.current();
      } else if (e.key === '2') {
        e.preventDefault();
        handleMarkCorrectRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studying]);

  const handleStartFlashcard = async (setId) => {
    setSelectedSetId(setId);
    const data = await fetchSetById(setId);
    if (!data || !data.vocabularies || data.vocabularies.length === 0) {
      toast.error('Bộ từ vựng này không có từ nào để học!');
      return;
    }

    // Check if there are words missing English definitions
    const missingDefCount = data.vocabularies.filter(v => !v.englishDefinition).length;
    if (missingDefCount > 0) {
      // Stay on the AI generation setup screen
      return;
    }

    startSession(data.vocabularies);
  };

  const startSession = (wordsList) => {
    // Keep words in order (no shuffle)
    setQueue(wordsList);
    setTotalCount(wordsList.length);
    setCurrentIdx(0);
    setIsFlipped(false);
    setWrongAttempts({});
    setMasteredList([]);
    setFailedList([]);
    setStudying(true);
  };

  const handleGenerateAIDefinitions = async () => {
    setGeneratingAI(true);
    toast.info('AI đang bắt đầu soạn định nghĩa tiếng Anh cho bộ từ...');
    const result = await generateDefinitions(selectedSetId);
    setGeneratingAI(false);
    
    if (result) {
      toast.success(result.message || 'Đã tạo định nghĩa tiếng Anh bằng AI thành công!');
      startSession(result.vocabularies);
    } else {
      toast.error('Có lỗi xảy ra khi gọi AI soạn định nghĩa.');
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speaking
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const handlePrevCard = () => {
    if (swipeDirection) return;
    if (currentIdx > 0) {
      setSwipeDirection('prev');
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
        setIsFlipped(false);
        setSwipeDirection(null);
      }, 300);
    }
  };

  const handleNextCard = () => {
    if (swipeDirection) return;
    if (currentIdx < totalCount - 1) {
      setSwipeDirection('next');
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsFlipped(false);
        setSwipeDirection(null);
      }, 300);
    } else if (currentIdx === totalCount - 1) {
      setSwipeDirection('next');
      setTimeout(() => {
        setCurrentIdx(totalCount);
        setIsFlipped(false);
        setSwipeDirection(null);
      }, 300);
    }
  };

  const handleMarkCorrect = () => {
    if (swipeDirection) return; // Prevent double trigger
    const currentCard = queue[currentIdx];
    if (!currentCard) return;

    // If it was never marked failed, it is mastered perfectly
    if (!failedList.includes(currentCard._id)) {
      setMasteredList(prev => {
        if (prev.some(v => v._id === currentCard._id)) return prev;
        return [...prev, currentCard];
      });
    }
    
    setSwipeDirection('right');
    
    // Smooth delay to transition to next card after swipe animation completes
    setTimeout(() => {
      setCurrentIdx((prev) => prev + 1);
      setIsFlipped(false);
      setSwipeDirection(null);
    }, 300);
  };

  const handleMarkWrong = () => {
    if (swipeDirection) return; // Prevent double trigger
    const currentCard = queue[currentIdx];
    if (!currentCard) return;
    
    // Add to failedList if not already there
    if (!failedList.includes(currentCard._id)) {
      setFailedList(prev => [...prev, currentCard._id]);
    }
    setMasteredList(prev => prev.filter(v => v._id !== currentCard._id));

    // Increment wrong attempts for stats
    setWrongAttempts((prev) => ({
      ...prev,
      [currentCard._id]: (prev[currentCard._id] || 0) + 1,
    }));

    setSwipeDirection('left');
    
    setTimeout(() => {
      setCurrentIdx((prev) => prev + 1);
      setIsFlipped(false);
      setSwipeDirection(null);
    }, 300);
  };

  const handleStudyOnlyFailed = () => {
    const failedCards = vocabularies.filter(v => failedList.includes(v._id));
    if (failedCards.length === 0) {
      toast.success('Bạn đã thuộc hết ở lần học đầu tiên!');
      return;
    }
    startSession(failedCards);
  };

  const resetStudy = () => {
    setStudying(false);
    setSelectedSetId(null);
    setQueue([]);
    setTotalCount(0);
    setCurrentIdx(0);
    setIsFlipped(false);
    setMasteredList([]);
    setFailedList([]);
  };

  // Check if we are loading the selected set
  const currentSetVocab = vocabularies;
  const missingDefCount = currentSetVocab.filter(v => !v.englishDefinition).length;

  // View 1: Selector View
  if (!studying && !selectedSetId) {
    return (
      <div className="flashcard-setup animate-fade-in">
        <h2 className="setup-title">
          <Layers className="title-icon animate-pulse-glow" size={24} />
          <span>Học bằng thẻ Flashcard thông minh</span>
        </h2>
        <p className="setup-subtitle">
          Rèn luyện phản xạ nhớ từ thông qua **định nghĩa tiếng Anh** ở mặt trước và đoán từ ở mặt sau.
        </p>

        <h3 className="select-label">Chọn bộ từ vựng để bắt đầu học Flashcard:</h3>
        
        {vocabSets.length === 0 ? (
          <div className="setup-empty card">
            <BookOpen size={32} />
            <p>Chưa có bộ từ vựng nào. Hãy tạo bộ từ vựng trước!</p>
          </div>
        ) : (
          <div className="set-list-grid">
            {vocabSets.map((set) => (
              <button
                key={set._id}
                className="set-item-btn card"
                onClick={() => handleStartFlashcard(set._id)}
              >
                <div className="set-item-icon">
                  <Layers size={18} />
                </div>
                <div className="set-item-details">
                  <span className="set-item-name">{set.title}</span>
                  <span className="set-item-count">{set.wordCount || 0} từ vựng</span>
                </div>
                <div className="set-item-go">Học Flashcard →</div>
              </button>
            ))}
          </div>
        )}
        <style>{styles}</style>
      </div>
    );
  }

  // View 2: Missing English definitions & require AI compilation
  if (!studying && selectedSetId && missingDefCount > 0) {
    return (
      <div className="ai-generation-view card animate-scale-in">
        {generatingAI ? (
          <div className="ai-generating-container">
            <div className="ai-pulse-icon">
              <Sparkles size={40} className="glow-sparkles" />
            </div>
            <h3>AI đang soạn định nghĩa tiếng Anh...</h3>
            <p>Đang phân tích ngữ cảnh và dịch nghĩa của {missingDefCount} từ vựng trong bộ này. Việc này có thể mất vài giây...</p>
            <div className="ai-loading-bar-container">
              <div className="ai-loading-bar" />
            </div>
            <div className="ai-loading-tip">
              💡 Định nghĩa sẽ được biên soạn ngắn gọn và dễ hiểu nhất cho học viên.
            </div>
          </div>
        ) : (
          <div className="ai-prompt-container">
            <div className="ai-prompt-icon">✨</div>
            <h3>Cần biên soạn định nghĩa tiếng Anh</h3>
            <p>
              Bộ từ vựng này có <strong>{missingDefCount} / {currentSetVocab.length} từ</strong> chưa có định nghĩa tiếng Anh.
              Để tạo thẻ Flashcard chất lượng cao, hãy để AI của chúng tôi tự động soạn thảo định nghĩa tiếng Anh cho các từ này!
            </p>
            
            <div className="ai-prompt-preview">
              <div className="preview-item">
                <span className="preview-label">Từ vựng:</span>
                <span className="preview-val">Abundant (Nhiều, phong phú)</span>
              </div>
              <div className="preview-arrow">↓</div>
              <div className="preview-item expected">
                <span className="preview-label">Định nghĩa AI soạn:</span>
                <span className="preview-val">"Existing or available in large quantities; overflowing."</span>
              </div>
            </div>

            <div className="ai-prompt-actions">
              <button onClick={handleGenerateAIDefinitions} className="btn-primary start-ai-btn">
                <Sparkles size={16} /> Biên soạn định nghĩa bằng AI ✨
              </button>
              <button onClick={resetStudy} className="btn-ghost">
                Quay lại danh sách
              </button>
            </div>
          </div>
        )}
        <style>{styles}</style>
      </div>
    );
  }

  // View 3: Completed Session / Stats Summary
  if (studying && currentIdx >= totalCount && totalCount > 0) {
    const accuracy = totalCount > 0 
      ? Math.round(((totalCount - failedList.length) / totalCount) * 100)
      : 100;

    return (
      <div className="flashcard-completed card animate-scale-in">
        <div className="completed-trophy">🎉</div>
        <h2>Hoàn thành bộ thẻ Flashcard!</h2>
        <p className="completed-subtitle">
          Tuyệt vời! Bạn đã học và ghi nhớ toàn bộ từ vựng trong phiên học này.
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Tỉ lệ thuộc ngay</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">Tổng từ đã học</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{failedList.length}</span>
            <span className="stat-label">Số từ cần ôn lại</span>
          </div>
        </div>

        <div className="completed-word-list">
          <h4>Chi tiết tiến trình từ vựng:</h4>
          <div className="completed-words-container">
            {vocabularies.map((v) => {
              const isFailedOnce = failedList.includes(v._id);
              const wrongCount = wrongAttempts[v._id] || 0;
              return (
                <div key={v._id} className="completed-word-item">
                  <div className="completed-word-left">
                    <span className="word-txt">{v.word}</span>
                    <span className="word-mean">— {v.meaningVi}</span>
                  </div>
                  <div className="completed-word-right">
                    {isFailedOnce ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        Lặp lại {wrongCount} lần
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        Thuộc ngay
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="completed-actions">
          <button onClick={() => startSession(vocabularies)} className="btn-primary">
            <RotateCcw size={16} /> Học lại bộ này
          </button>
          {failedList.length > 0 && (
            <button onClick={handleStudyOnlyFailed} className="btn-ghost" style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
              <AlertCircle size={16} /> Ôn lại {failedList.length} từ chưa thuộc
            </button>
          )}
          <button onClick={resetStudy} className="btn-ghost">
            Thoát ra ngoài
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // View 4: Study Session view
  const currentCard = queue[currentIdx];
  const progressPercent = totalCount > 0 ? Math.round((currentIdx / totalCount) * 100) : 0;

  if (selectedSetId && isLoading) {
    return (
      <div className="vocab-loading card animate-scale-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div className="vocab-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Đang tải dữ liệu bộ từ vựng...</p>
        <style>{styles}</style>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="vocab-loading card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div className="vocab-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Đang chuẩn bị thẻ học...</p>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="flashcard-study-view animate-fade-in">
      {/* Header */}
      <div className="study-header">
        <button onClick={resetStudy} className="btn-exit-study">
          ← Thoát học
        </button>
        <div className="progress-details">
          <span>Đang học: <strong>{currentIdx + 1} / {totalCount}</strong></span>
          <span>Còn lại: <strong>{Math.max(0, totalCount - currentIdx)}</strong></span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="study-progress-bar-bg">
        <div className="study-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* 3D Flipping Card */}
      <div 
        key={currentCard._id}
        className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''} ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
        onClick={() => {
          if (!swipeDirection) {
            setIsFlipped(!isFlipped);
          }
        }}
      >
        <div className="flashcard-inner">
          {/* Front Side: English Definition */}
          <div className="flashcard-front">
            <div className="card-badge-side font-side">Mặt Trước: Định nghĩa</div>
            
            <div className="definition-box">
              <p className="english-definition-text">
                &ldquo;{currentCard.englishDefinition}&rdquo;
              </p>
            </div>

            <div className="flip-instruction">
              🖱️ Nhấn vào thẻ hoặc nhấn [SPACE] để xem từ vựng
            </div>
          </div>

          {/* Back Side: The Word details */}
          <div className="flashcard-back">
            <div className="card-badge-side back-side">Mặt Sau: Từ vựng</div>

            <div className="back-card-content">
              <div className="word-pronounce-row">
                <h2 className="word-text-back">{currentCard.word}</h2>
                <button 
                  className="btn-speak-back"
                  onClick={(e) => {
                    e.stopPropagation(); // Stop card flipping
                    speak(currentCard.word);
                  }}
                  title="Nghe phát âm"
                >
                  <Volume2 size={20} />
                </button>
              </div>

              {currentCard.phonetic && (
                <div className="phonetic-text-back">{currentCard.phonetic}</div>
              )}

              <div className="divider-back" />

              <div className="meaning-vi-back">
                <strong>Nghĩa:</strong> {currentCard.meaningVi}
              </div>

              {currentCard.exampleSentence && (
                <div className="example-box-back">
                  <p className="example-en">💡 {currentCard.exampleSentence}</p>
                  {currentCard.exampleMeaningVi && (
                    <p className="example-vi">{currentCard.exampleMeaningVi}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flip-instruction">
              🖱️ Nhấn để xem lại định nghĩa
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcut legend */}
      <div className="shortcut-legend">
        <span>⌨️ Phím tắt: <strong>[Space]</strong> Lật thẻ | <strong>[←]</strong> Quay lại | <strong>[→]</strong> Tiếp theo | <strong>[1]</strong> Chưa thuộc | <strong>[2]</strong> Đã thuộc</span>
      </div>

      {/* Control Buttons & Navigation */}
      <div className="study-controls-container">
        <div className="study-navigation-row">
          <button 
            onClick={handlePrevCard} 
            className="btn-nav" 
            disabled={currentIdx === 0}
            title="Quay lại thẻ trước (ArrowLeft)"
          >
            ← Quay lại
          </button>

          <div className="study-main-actions">
            {!isFlipped ? (
              <button onClick={() => setIsFlipped(true)} className="btn-primary btn-flip-action">
                Lật thẻ để xem từ
              </button>
            ) : (
              <div className="action-buttons-row animate-scale-in">
                <button onClick={handleMarkWrong} className="btn-wrong-action">
                  ❌ Chưa thuộc
                </button>
                <button onClick={handleMarkCorrect} className="btn-correct-action">
                  ✅ Đã thuộc
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleNextCard} 
            className="btn-nav"
            title="Thẻ tiếp theo (ArrowRight)"
          >
            Tiếp theo →
          </button>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .flashcard-setup, .ai-generation-view, .flashcard-completed, .flashcard-study-view {
    max-width: 600px;
    margin: 0 auto;
    font-family: var(--font-sans);
  }

  /* Selector Setup styling */
  .setup-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .title-icon {
    color: var(--color-accent-primary);
  }

  .setup-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .select-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  .setup-empty {
    text-align: center;
    padding: 3rem 1.5rem;
    color: var(--color-text-muted);
  }

  .setup-empty p {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .set-list-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .set-item-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    cursor: pointer;
    text-align: left;
    width: 100%;
    color: var(--color-text-muted);
    transition: all 0.2s ease;
  }

  .set-item-btn:hover {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-glow);
    transform: translateY(-2px);
  }

  .set-item-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .set-item-btn:hover .set-item-icon {
    background: var(--gradient-accent);
    color: white;
    box-shadow: var(--shadow-button);
  }

  .set-item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .set-item-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .set-item-count {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-top: 0.125rem;
  }

  .set-item-go {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  /* AI Generator styling */
  .ai-generation-view {
    padding: 2.5rem 2rem;
    text-align: center;
  }

  .ai-prompt-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .ai-generation-view h3 {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  .ai-generation-view p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .ai-prompt-preview {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }

  .preview-item.expected {
    color: var(--color-accent-secondary);
  }

  .preview-label {
    font-weight: 700;
    color: var(--color-text-muted);
  }

  .preview-arrow {
    font-size: 1rem;
    color: var(--color-text-muted);
  }

  .ai-prompt-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .start-ai-btn {
    box-shadow: 0 0 15px var(--color-accent-glow);
  }

  /* AI Loading */
  .ai-generating-container {
    padding: 2rem 0;
  }

  .ai-pulse-icon {
    margin-bottom: 1.5rem;
    display: inline-block;
  }

  .glow-sparkles {
    color: var(--color-accent-primary);
    filter: drop-shadow(0 0 10px var(--color-accent-primary));
    animation: pulse-glow 2s infinite ease-in-out;
  }

  .ai-loading-bar-container {
    width: 100%;
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    margin: 1.5rem 0;
  }

  .ai-loading-bar {
    width: 60%;
    height: 100%;
    background: var(--gradient-accent);
    border-radius: 2px;
    animation: loading-slide 1.5s infinite ease-in-out;
  }

  @keyframes loading-slide {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }

  .ai-loading-tip {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  /* Completed screen styling */
  .flashcard-completed {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3rem 2rem;
  }

  .completed-trophy {
    font-size: 4rem;
    margin-bottom: 0.75rem;
  }

  .flashcard-completed h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
  }

  .completed-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
    line-height: 1.5;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    width: 100%;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-accent-primary);
  }

  .stat-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }

  .completed-word-list {
    width: 100%;
    text-align: left;
    margin-bottom: 2rem;
  }

  .completed-word-list h4 {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.75rem;
    font-weight: 700;
  }

  .completed-words-container {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background: rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .completed-word-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-card);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-default);
  }

  .word-txt {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .word-mean {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-left: 0.5rem;
  }

  .completed-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
  }

  /* Study view styling */
  .study-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .btn-exit-study {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s;
    font-family: inherit;
  }

  .btn-exit-study:hover {
    color: var(--color-error);
  }

  .progress-details {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .study-progress-bar-bg {
    width: 100%;
    height: 6px;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .study-progress-bar {
    height: 100%;
    background: var(--gradient-accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  @keyframes cardEntrance {
    0% {
      opacity: 0;
      transform: scale(0.93) translateY(12px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes swipeLeft {
    0% {
      transform: translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateX(-150%) rotate(-15deg);
      opacity: 0;
    }
  }

  @keyframes swipeRight {
    0% {
      transform: translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateX(150%) rotate(15deg);
      opacity: 0;
    }
  }

  /* 3D Flashcard Animation Styles */
  .flashcard-wrapper {
    perspective: 1000px;
    width: 100%;
    height: 320px;
    margin-bottom: 1.5rem;
    cursor: pointer;
    animation: cardEntrance 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition: transform 0.2s ease;
  }

  .flashcard-wrapper.swipe-left {
    animation: swipeLeft 0.3s forwards cubic-bezier(0.25, 1, 0.5, 1);
    pointer-events: none;
  }

  .flashcard-wrapper.swipe-right {
    animation: swipeRight 0.3s forwards cubic-bezier(0.25, 1, 0.5, 1);
    pointer-events: none;
  }

  .flashcard-wrapper.swipe-prev {
    animation: swipeRight 0.3s forwards cubic-bezier(0.25, 1, 0.5, 1);
    pointer-events: none;
  }

  .flashcard-wrapper.swipe-next {
    animation: swipeLeft 0.3s forwards cubic-bezier(0.25, 1, 0.5, 1);
    pointer-events: none;
  }

  .flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }

  .flashcard-wrapper.flipped .flashcard-inner {
    transform: rotateY(180deg);
  }

  .flashcard-front, .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden; /* Safari */
    backface-visibility: hidden;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-default);
    display: flex;
    flex-direction: column;
    padding: 2.25rem 2rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
  }

  .flashcard-front {
    background: linear-gradient(145deg, #1b1b32, #111122);
    color: var(--color-text-primary);
    justify-content: center;
  }

  .flashcard-front:hover {
    border-color: var(--color-accent-secondary);
  }

  .flashcard-back {
    background: linear-gradient(145deg, #16162a, #0f0f1c);
    color: var(--color-text-primary);
    transform: rotateY(180deg);
    border-color: var(--color-border-accent);
    justify-content: space-between;
  }

  .card-badge-side {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .card-badge-side.font-side {
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .card-badge-side.back-side {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-accent-primary);
    border: 1px solid var(--color-border-accent);
  }

  .definition-box {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 0 1rem;
  }

  .english-definition-text {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.6;
    color: var(--color-text-primary);
    font-style: italic;
  }

  .flip-instruction {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-top: 1rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Back card content */
  .back-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 100%;
  }

  .word-pronounce-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .word-text-back {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #10b981, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .btn-speak-back {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-speak-back:hover {
    background: var(--color-accent-glow);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    transform: scale(1.05);
  }

  .phonetic-text-back {
    font-size: 0.9rem;
    color: var(--color-accent-secondary);
    font-style: italic;
    margin-bottom: 0.75rem;
  }

  .divider-back {
    height: 1px;
    background: var(--color-border-default);
    width: 60%;
    margin: 0.75rem 0;
  }

  .meaning-vi-back {
    font-size: 1.1rem;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  .meaning-vi-back strong {
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .example-box-back {
    background: rgba(255, 255, 255, 0.02);
    border-left: 3px solid var(--color-accent-secondary);
    padding: 0.5rem 0.75rem;
    border-radius: 0 6px 6px 0;
    max-width: 90%;
    text-align: left;
    margin-top: 0.25rem;
  }

  .example-en {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.4;
  }

  .example-vi {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-top: 0.125rem;
  }

  /* Control buttons styling */
  .shortcut-legend {
    text-align: center;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-bottom: 1.25rem;
  }

  .study-controls-container {
    width: 100%;
  }

  .study-navigation-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
  }

  .study-main-actions {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .btn-nav {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
    padding: 0.875rem 1.25rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
    font-family: inherit;
  }

  .btn-nav:hover:not(:disabled) {
    border-color: var(--color-accent-secondary);
    background: var(--color-accent-glow);
    color: var(--color-accent-secondary);
  }

  .btn-nav:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn-flip-action {
    width: 100%;
    justify-content: center;
    padding: 0.875rem;
    font-size: 0.9rem;
  }

  .action-buttons-row {
    display: flex;
    gap: 0.75rem;
    width: 100%;
  }

  .btn-wrong-action, .btn-correct-action {
    flex: 1;
    padding: 0.875rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-wrong-action {
    background: transparent;
    color: var(--color-error);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .btn-wrong-action:hover {
    background: var(--color-error-bg);
    border-color: var(--color-error);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);
  }

  .btn-correct-action {
    background: var(--gradient-accent);
    color: white;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
  }

  .btn-correct-action:hover {
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    transform: translateY(-1px);
  }
`;
