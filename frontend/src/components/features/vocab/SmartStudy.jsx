import { useState, useEffect, useRef } from 'react';
import { BookOpen, GraduationCap, ArrowRight, CheckCircle2, XCircle, RotateCcw, Volume2, AlertCircle, Sparkles } from 'lucide-react';
import useVocabStore from '../../../store/useVocabStore';
import { toast } from 'sonner';

export default function SmartStudy() {
  const { vocabSets, fetchSets, vocabularies, fetchSetById, isLoading } = useVocabStore();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [studying, setStudying] = useState(false);
  
  // Study session state
  const [queue, setQueue] = useState([]); // Array of { vocab, phase: 1 | 2 } (1 = spell English, 2 = spell Vietnamese)
  const [totalInitialChallenges, setTotalInitialChallenges] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showOverride, setShowOverride] = useState(false);
  const [completedList, setCompletedList] = useState([]);
  
  const inputRef = useRef(null);

  useEffect(() => {
    fetchSets();
  }, []);

  const handleStartStudy = async (setId) => {
    setSelectedSetId(setId);
    const data = await fetchSetById(setId);
    if (!data || !data.vocabularies || data.vocabularies.length === 0) {
      toast.error('Bộ từ vựng này không có từ nào để học!');
      return;
    }

    // Build the initial queue: 2 challenges per word (Phase 1: English spelling, Phase 2: Vietnamese meaning)
    const challenges = [];
    data.vocabularies.forEach(vocab => {
      challenges.push({ vocab, phase: 1 }); // Spell English
      challenges.push({ vocab, phase: 2 }); // Spell Vietnamese
    });

    // Shuffle the queue initially
    const shuffled = shuffle(challenges);
    
    setQueue(shuffled);
    setTotalInitialChallenges(shuffled.length);
    setCurrentChallenge(shuffled[0]);
    setCompletedList([]);
    setWrongAttempts(0);
    setStudying(true);
    setUserInput('');
    setAnswered(false);
    setShowOverride(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const checkAnswer = () => {
    if (!userInput.trim() || answered) return;

    const phase = currentChallenge.phase;
    const vocab = currentChallenge.vocab;
    const inputCleaned = userInput.trim().toLowerCase();
    
    let correct = false;

    if (phase === 1) {
      // Type English
      correct = inputCleaned === vocab.word.toLowerCase();
    } else {
      // Type Vietnamese
      // Vietnamese can have multiple words/meanings. We check for exact match,
      // or if it's a substring match, or if it has matching keywords.
      const expectedCleaned = vocab.meaningVi.toLowerCase();
      correct = expectedCleaned.includes(inputCleaned) || inputCleaned.includes(expectedCleaned);
    }

    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      // Play speech
      if (phase === 1) {
        speak(vocab.word);
      }
    } else {
      setWrongAttempts(prev => prev + 1);
      setShowOverride(true);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleOverride = () => {
    // User claims they were correct (override system)
    setIsCorrect(true);
    setShowOverride(false);
    toast.success('Đã ghi nhận câu trả lời của bạn!');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNext = () => {
    const current = currentChallenge;
    const remainingQueue = [...queue];

    if (isCorrect) {
      // Remove from queue and add to completed
      remainingQueue.shift();
      setCompletedList(prev => [...prev, current]);
    } else {
      // Put at the end of the queue (Leitner repetition loop)
      const failedItem = remainingQueue.shift();
      remainingQueue.push(failedItem);
      
      // Shuffle the remaining queue slightly so they don't immediately get it again if queue is small
      if (remainingQueue.length > 2) {
        // Just rotate it or keep it at end
      }
    }

    setQueue(remainingQueue);
    setUserInput('');
    setAnswered(false);
    setShowOverride(false);

    if (remainingQueue.length > 0) {
      setCurrentChallenge(remainingQueue[0]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setCurrentChallenge(null);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (answered) {
        handleNext();
      } else {
        checkAnswer();
      }
    }
  };

  const resetStudy = () => {
    setStudying(false);
    setSelectedSetId(null);
    setQueue([]);
    setCurrentChallenge(null);
    setCompletedList([]);
  };

  // 1. Selector view
  if (!studying) {
    return (
      <div className="study-setup animate-fade-in">
        <h2 className="study-setup-title">🎓 Học thông minh (Smart Repetition)</h2>
        <p className="study-setup-subtitle">
          Chương trình rèn luyện chủ động gõ từ/nghĩa. Trả lời sai sẽ phải làm lại cho đến khi thuộc lòng.
        </p>

        <h3 className="study-select-label">Chọn bộ từ vựng để bắt đầu học thuộc:</h3>
        {vocabSets.length === 0 ? (
          <div className="study-empty">
            <BookOpen size={32} />
            <p>Chưa có bộ từ vựng. Hãy tạo bộ từ vựng trước!</p>
          </div>
        ) : (
          <div className="study-set-list">
            {vocabSets.map((set) => (
              <button
                key={set._id}
                className="study-set-item"
                onClick={() => handleStartStudy(set._id)}
              >
                <GraduationCap size={18} />
                <div className="study-set-info">
                  <span className="study-set-name">{set.title}</span>
                  <span className="study-set-count">{set.wordCount || 0} từ</span>
                </div>
                <div className="study-set-action-text">Học ngay →</div>
              </button>
            ))}
          </div>
        )}
        <style>{setupStyles}</style>
      </div>
    );
  }

  // 2. Completed view
  if (queue.length === 0 && studying) {
    const accuracy = totalInitialChallenges > 0 
      ? Math.round(((totalInitialChallenges) / (totalInitialChallenges + wrongAttempts)) * 100)
      : 100;

    return (
      <div className="study-completed card animate-scale-in">
        <div className="completed-icon">🎉</div>
        <h2 className="completed-title">Đã thuộc hết bài!</h2>
        <p className="completed-subtitle">Bạn đã hoàn thành xuất sắc tất cả các thẻ học trong bộ từ vựng.</p>

        <div className="completed-stats">
          <div className="completed-stat">
            <span className="completed-stat-val">{accuracy}%</span>
            <span className="completed-stat-lbl">Độ chính xác</span>
          </div>
          <div className="completed-stat">
            <span className="completed-stat-val">{wrongAttempts}</span>
            <span className="completed-stat-lbl">Số lỗi sai</span>
          </div>
          <div className="completed-stat">
            <span className="completed-stat-val">{totalInitialChallenges / 2}</span>
            <span className="completed-stat-lbl">Từ vựng đã thuộc</span>
          </div>
        </div>

        <div className="completed-actions">
          <button onClick={() => handleStartStudy(selectedSetId)} className="btn-primary">
            <RotateCcw size={16} /> Học lại bộ này
          </button>
          <button onClick={resetStudy} className="btn-ghost">
            Quay lại chọn bộ khác
          </button>
        </div>
        <style>{studyStyles}</style>
      </div>
    );
  }

  // 3. Studying view
  const progressPercent = totalInitialChallenges > 0
    ? Math.round((completedList.length / totalInitialChallenges) * 100)
    : 0;

  return (
    <div className="study-session animate-fade-in">
      {/* Progress */}
      <div className="study-progress-header">
        <button onClick={resetStudy} className="study-back-link">
          ← Thoát học
        </button>
        <div className="study-progress-details">
          <span>Tiến độ thuộc bài: <strong>{completedList.length} / {totalInitialChallenges}</strong></span>
          <span>Còn lại: <strong>{queue.length} câu</strong></span>
        </div>
      </div>
      
      <div className="study-progress-bar-bg">
        <div className="study-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Challenge Card */}
      <div className="study-card card">
        <div className="study-challenge-badge">
          {currentChallenge.phase === 1 ? '🔠 Gõ từ Tiếng Anh' : '🇻🇳 Gõ nghĩa Tiếng Việt'}
        </div>

        {currentChallenge.phase === 1 ? (
          // English Challenge: meaningVi -> word
          <div className="study-prompt-area">
            <p className="study-prompt-desc">Hãy gõ từ tiếng Anh mang nghĩa này:</p>
            <h2 className="study-prompt-text">{currentChallenge.vocab.meaningVi}</h2>
            {currentChallenge.vocab.phonetic && (
              <p className="study-prompt-phonetic">Phát âm gợi ý: {currentChallenge.vocab.phonetic}</p>
            )}
          </div>
        ) : (
          // Vietnamese Challenge: word -> meaningVi
          <div className="study-prompt-area">
            <p className="study-prompt-desc">Hãy gõ nghĩa tiếng Việt của từ này:</p>
            <div className="study-prompt-word-row">
              <h2 className="study-prompt-text">{currentChallenge.vocab.word}</h2>
              <button className="study-speak-btn" onClick={() => speak(currentChallenge.vocab.word)}>
                <Volume2 size={18} />
              </button>
            </div>
            {currentChallenge.vocab.phonetic && (
              <p className="study-prompt-phonetic">{currentChallenge.vocab.phonetic}</p>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="study-input-row">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentChallenge.phase === 1 ? "Gõ từ tiếng Anh..." : "Gõ nghĩa tiếng Việt..."}
            className={`study-input ${answered ? (isCorrect ? 'correct' : 'wrong') : ''}`}
            readOnly={answered}
            id="study-answer-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {!answered && (
            <button onClick={checkAnswer} className="btn-primary" disabled={!userInput.trim()}>
              Kiểm tra
            </button>
          )}
        </div>

        {/* Feedback Area */}
        {answered && (
          <div className={`study-feedback ${isCorrect ? 'correct' : 'wrong'} animate-scale-in`}>
            <div className="study-feedback-info">
              {isCorrect ? (
                <div className="feedback-result correct">
                  <CheckCircle2 size={20} />
                  <span>Chính xác! Rất tốt.</span>
                </div>
              ) : (
                <div className="feedback-result wrong">
                  <XCircle size={20} />
                  <div className="feedback-wrong-text">
                    <span>Sai rồi! Đáp án đúng là:</span>
                    <strong className="expected-ans-val">
                      {currentChallenge.phase === 1 ? currentChallenge.vocab.word : currentChallenge.vocab.meaningVi}
                    </strong>
                    {currentChallenge.vocab.phonetic && currentChallenge.phase === 1 && (
                      <span className="expected-phonetic">{currentChallenge.vocab.phonetic}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="feedback-actions">
              {showOverride && !isCorrect && (
                <button onClick={handleOverride} className="btn-ghost override-btn">
                  Tôi đã gõ đúng / Bỏ qua lỗi
                </button>
              )}
              <button onClick={handleNext} className="btn-primary">
                Tiếp tục <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Repeating tip */}
      <div className="study-tip-box card">
        <AlertCircle size={16} className="tip-icon" />
        <p>Từ nào trả lời sai sẽ tự động xuất hiện lại sau để giúp bạn ghi nhớ sâu sắc hơn.</p>
      </div>

      <style>{studyStyles}</style>
    </div>
  );
}

const setupStyles = `
  .study-setup {
    max-width: 600px;
    margin: 0 auto;
  }

  .study-setup-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .study-setup-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .study-select-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.75rem;
  }

  .study-empty {
    text-align: center;
    padding: 3rem 1.5rem;
    color: var(--color-text-muted);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .study-empty p {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .study-set-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .study-set-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    text-align: left;
    width: 100%;
    color: var(--color-text-muted);
  }

  .study-set-item:hover {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-glow);
    transform: translateY(-1px);
  }

  .study-set-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .study-set-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .study-set-count {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .study-set-action-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-accent-primary);
  }
`;

const studyStyles = `
  .study-session, .study-completed {
    max-width: 580px;
    margin: 0 auto;
  }

  .study-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .study-back-link {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s;
  }

  .study-back-link:hover {
    color: var(--color-error);
  }

  .study-progress-details {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .study-progress-bar-bg {
    width: 100%;
    height: 6px;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .study-progress-bar {
    height: 100%;
    background: var(--gradient-accent);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .study-card {
    padding: 2.25rem 2rem;
    position: relative;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .study-challenge-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: 12px;
    color: var(--color-text-secondary);
  }

  .study-prompt-area {
    text-align: center;
    margin-bottom: 2rem;
  }

  .study-prompt-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .study-prompt-text {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .study-prompt-word-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .study-speak-btn {
    width: 32px;
    height: 32px;
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

  .study-speak-btn:hover {
    background: var(--color-accent-glow);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .study-prompt-phonetic {
    font-size: 0.8125rem;
    color: var(--color-accent-secondary);
    font-style: italic;
    margin-top: 0.25rem;
  }

  .study-input-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .study-input {
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
  }

  .study-input:focus:not(.correct):not(.wrong) {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px var(--color-accent-glow);
  }

  .study-input.correct:focus,
  .study-input.wrong:focus {
    outline: none;
    box-shadow: none;
  }

  .study-input.correct {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.08);
    color: var(--color-success);
  }

  .study-input.wrong {
    border-color: var(--color-error);
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }

  .study-feedback {
    border-radius: var(--radius-md);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    animation: scaleIn 0.2s ease-out;
  }

  .study-feedback.correct {
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.15);
  }

  .study-feedback.wrong {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.15);
  }

  .feedback-result {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .feedback-result.correct {
    color: var(--color-success);
    align-items: center;
  }

  .feedback-result.wrong {
    color: var(--color-error);
  }

  .feedback-wrong-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .expected-ans-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
    letter-spacing: 0.5px;
  }

  .expected-phonetic {
    font-size: 0.8125rem;
    color: var(--color-accent-secondary);
    font-style: italic;
    font-weight: normal;
  }

  .feedback-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    align-items: center;
  }

  .override-btn {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
    color: var(--color-text-muted);
  }

  .override-btn:hover {
    color: var(--color-warning);
    background: rgba(245, 158, 11, 0.1);
  }

  .study-tip-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .tip-icon {
    color: var(--color-accent-secondary);
    flex-shrink: 0;
  }

  /* Completed Screen styling */
  .study-completed {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3rem 2rem;
  }

  .completed-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .completed-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
  }

  .completed-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 2rem;
    max-width: 320px;
    line-height: 1.5;
  }

  .completed-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    width: 100%;
    margin-bottom: 2rem;
  }

  .completed-stat {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .completed-stat-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-accent-primary);
  }

  .completed-stat-lbl {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }

  .completed-actions {
    display: flex;
    gap: 0.75rem;
  }
`;
