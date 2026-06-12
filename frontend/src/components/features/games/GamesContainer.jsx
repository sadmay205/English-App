import { useState } from 'react';
import WordleGame from './WordleGame';
import ScrambleGame from './ScrambleGame';
import MatchingGame from './MatchingGame';
import { Gamepad2, Sparkles, HelpCircle } from 'lucide-react';

export default function GamesContainer() {
  const [activeGame, setActiveGame] = useState(null); // null, 'wordle', 'scramble', 'matching'

  if (activeGame === 'wordle') {
    return (
      <div className="game-wrapper animate-fade-in">
        <button className="back-to-menu-btn" onClick={() => setActiveGame(null)}>
          ← Quay lại danh sách trò chơi
        </button>
        <WordleGame />
        <style>{commonStyles}</style>
      </div>
    );
  }

  if (activeGame === 'scramble') {
    return (
      <div className="game-wrapper animate-fade-in">
        <button className="back-to-menu-btn" onClick={() => setActiveGame(null)}>
          ← Quay lại danh sách trò chơi
        </button>
        <ScrambleGame />
        <style>{commonStyles}</style>
      </div>
    );
  }

  if (activeGame === 'matching') {
    return (
      <div className="game-wrapper animate-fade-in">
        <button className="back-to-menu-btn" onClick={() => setActiveGame(null)}>
          ← Quay lại danh sách trò chơi
        </button>
        <MatchingGame />
        <style>{commonStyles}</style>
      </div>
    );
  }

  return (
    <div className="games-menu-container animate-fade-in">
      <div className="games-menu-header text-center">
        <h2 className="games-menu-title">🎮 Khu Vui Chơi Giải Trí Tiếng Anh</h2>
        <p className="games-menu-subtitle">
          Vừa chơi vừa học! Chọn một trò chơi bên dưới để ôn tập vốn từ vựng của bạn một cách thú vị nhất.
        </p>
      </div>

      <div className="games-grid">
        {/* Wordle Card */}
        <div className="game-card card glass hover-scale" onClick={() => setActiveGame('wordle')}>
          <div className="game-card-icon-wrapper wordle-icon">
            <span>W</span>
          </div>
          <h3 className="game-card-name">Wordle</h3>
          <p className="game-card-desc">
            Trò chơi đoán chữ 5 ký tự nổi tiếng toàn cầu. Bạn có 6 cơ hội để tìm ra từ bí ẩn.
          </p>
          <div className="game-card-tags">
            <span className="game-tag">Đoán chữ</span>
            <span className="game-tag">Logic</span>
            <span className="game-tag text-accent">5 Ký tự</span>
          </div>
          <button className="btn-play-game">Chơi Ngay</button>
        </div>

        {/* Scramble Card */}
        <div className="game-card card glass hover-scale" onClick={() => setActiveGame('scramble')}>
          <div className="game-card-icon-wrapper scramble-icon">
            <span>🔠</span>
          </div>
          <h3 className="game-card-name">Word Scramble</h3>
          <p className="game-card-desc">
            Sắp xếp các chữ cái bị xáo trộn thành từ hoàn chỉnh kèm gợi ý nghĩa tiếng Việt và từ điển.
          </p>
          <div className="game-card-tags">
            <span className="game-tag">Xáo trộn từ</span>
            <span className="game-tag text-error">Time Attack ⚡</span>
            <span className="game-tag">Từ vựng</span>
          </div>
          <button className="btn-play-game">Chơi Ngay</button>
        </div>

        {/* Matching Card */}
        <div className="game-card card glass hover-scale" onClick={() => setActiveGame('matching')}>
          <div className="game-card-icon-wrapper matching-icon">
            <span>🃏</span>
          </div>
          <h3 className="game-card-name">Memory Match</h3>
          <p className="game-card-desc">
            Lật các thẻ bài tiếng Anh và tiếng Việt để ghép cặp nghĩa đúng. Thách thức trí nhớ siêu đẳng của bạn.
          </p>
          <div className="game-card-tags">
            <span className="game-tag">Ghép cặp</span>
            <span className="game-tag text-accent">Trí nhớ</span>
            <span className="game-tag">Từ vựng</span>
          </div>
          <button className="btn-play-game">Chơi Ngay</button>
        </div>
      </div>

      <style>{menuStyles}</style>
      <style>{commonStyles}</style>
    </div>
  );
}

const commonStyles = `
  .game-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0.25rem 1rem;
  }
  
  .back-to-menu-btn {
    align-self: flex-start;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-secondary);
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.2s ease;
    margin-bottom: 0.5rem;
  }
  
  .back-to-menu-btn:hover {
    background: var(--color-accent-glow);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }
`;

const menuStyles = `
  .games-menu-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .games-menu-header {
    margin-bottom: 1rem;
  }

  .games-menu-title {
    font-size: 1.85rem;
    font-weight: 800;
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  .games-menu-subtitle {
    font-size: 0.95rem;
    color: var(--color-text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .game-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 2rem 1.5rem;
    cursor: pointer;
    background: white !important;
    border: 1px solid var(--color-border-default);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: var(--radius-lg);
    position: relative;
    overflow: hidden;
  }

  .game-card:hover {
    border-color: var(--color-accent-primary);
    box-shadow: var(--shadow-glow);
    transform: translateY(-4px);
  }

  .game-card-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 1.25rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  .wordle-icon {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .scramble-icon {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .matching-icon {
    background: linear-gradient(135deg, #ec4899, #d946ef);
    color: white;
  }

  .game-card-name {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
  }

  .game-card-desc {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 1.25rem;
    flex-grow: 1;
  }

  .game-card-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .game-tag {
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
  }

  .game-tag.text-accent {
    color: var(--color-accent-primary);
    background: var(--color-accent-glow);
  }

  .game-tag.text-error {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }

  .btn-play-game {
    width: 100%;
    padding: 0.75rem;
    border-radius: var(--radius-md);
    background: var(--gradient-accent);
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    cursor: pointer;
    box-shadow: var(--shadow-button);
    transition: all 0.2s;
  }

  .btn-play-game:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }
`;
