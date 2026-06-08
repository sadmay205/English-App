import { useState, useEffect } from 'react';
import { TrendingUp, Award, Calendar, CheckCircle2, RefreshCw, BarChart2, Loader, BookOpen, Headphones } from 'lucide-react';
import api from '../../../services/api';

const getQuizTypeLabel = (type) => {
  switch (type) {
    case 'multiple-choice':
    case 'multiple-choice-vie':
      return 'Trắc nghiệm Việt';
    case 'multiple-choice-en':
      return 'Trắc nghiệm Anh';
    case 'fill-blank':
      return 'Điền từ vựng';
    case 'listening-quiz':
      return 'Trắc nghiệm nghe';
    case 'listening-complete':
      return 'Nghe ghi chính tả';
    default:
      return type;
  }
};

export default function ProgressView() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/quiz/progress');
      setHistory(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Không thể tải lịch sử tiến độ học tập.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  // Compute stats
  const totalTests = history.length;
  
  const avgAccuracy = totalTests > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / totalTests * 100) 
    : 0;

  const highestScorePercentage = totalTests > 0
    ? Math.round(Math.max(...history.map(h => (h.score / h.totalQuestions))) * 100)
    : 0;

  const vocabTestsCount = history.filter(h => ['multiple-choice-vie', 'multiple-choice', 'multiple-choice-en', 'fill-blank'].includes(h.quizType)).length;
  const listeningTestsCount = history.filter(h => ['listening-quiz', 'listening-complete'].includes(h.quizType)).length;

  return (
    <div className="progress-container animate-fade-in">
      {/* Title */}
      <div className="prog-header">
        <div>
          <h2 className="prog-title">📈 Tiến độ Học tập</h2>
          <p className="prog-subtitle">Xem lại lịch sử làm bài kiểm tra và thống kê kết quả</p>
        </div>
        <button onClick={fetchProgress} className="btn-ghost prog-refresh-btn" title="Làm mới">
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="prog-stats-grid">
        <div className="prog-stat-card card">
          <div className="prog-stat-icon-wrapper blue">
            <BarChart2 size={22} />
          </div>
          <div className="prog-stat-info">
            <span className="prog-stat-label">Tổng bài đã làm</span>
            <span className="prog-stat-value">{totalTests}</span>
            <span className="prog-stat-sub">
              {vocabTestsCount} Quiz • {listeningTestsCount} Nghe
            </span>
          </div>
        </div>

        <div className="prog-stat-card card">
          <div className="prog-stat-icon-wrapper green">
            <CheckCircle2 size={22} />
          </div>
          <div className="prog-stat-info">
            <span className="prog-stat-label">Độ chính xác TB</span>
            <span className="prog-stat-value">{avgAccuracy}%</span>
            <span className="prog-stat-sub">Mục tiêu đề xuất: &gt;80%</span>
          </div>
        </div>

        <div className="prog-stat-card card">
          <div className="prog-stat-icon-wrapper purple">
            <Award size={22} />
          </div>
          <div className="prog-stat-info">
            <span className="prog-stat-label">Điểm cao nhất đạt được</span>
            <span className="prog-stat-value">{highestScorePercentage}%</span>
            <span className="prog-stat-sub">Excellent achievement!</span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="prog-history-section">
        <h3 className="prog-section-title">Lịch sử làm bài chi tiết</h3>

        {isLoading ? (
          <div className="prog-loading-state">
            <Loader className="spinning" size={24} />
            <p>Đang tải lịch sử tiến độ...</p>
          </div>
        ) : error ? (
          <p className="prog-error-text">{error}</p>
        ) : history.length === 0 ? (
          <div className="prog-empty-state card">
            <TrendingUp size={36} />
            <p>Bạn chưa hoàn thành bài kiểm tra nào. Kết quả làm bài thi trắc nghiệm và luyện nghe sẽ xuất hiện tại đây!</p>
          </div>
        ) : (
          <div className="prog-table-container">
            <table className="prog-table">
              <thead>
                <tr>
                  <th>Nội dung học tập</th>
                  <th>Dạng bài tập</th>
                  <th>Điểm số</th>
                  <th>Độ chính xác</th>
                  <th>Thời gian hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const title = item.vocabSetId?.title || item.listeningTaskId?.title || 'Bài tập tự tạo';
                  const isListening = ['listening-quiz', 'listening-complete'].includes(item.quizType);
                  const accuracy = Math.round((item.score / item.totalQuestions) * 100);
                  
                  let badgeClass = 'badge-error';
                  if (accuracy >= 80) badgeClass = 'badge-success';
                  else if (accuracy >= 50) badgeClass = 'badge-warning';

                  return (
                    <tr key={item._id} className="prog-row">
                      <td className="prog-td-title">
                        <div className="prog-title-flex">
                          {isListening ? (
                            <span className="prog-type-icon listening" title="Luyện nghe"><Headphones size={14} /></span>
                          ) : (
                            <span className="prog-type-icon vocab" title="Từ vựng"><BookOpen size={14} /></span>
                          )}
                          <span>{title}</span>
                        </div>
                      </td>
                      <td className="prog-td-label">{getQuizTypeLabel(item.quizType)}</td>
                      <td className="prog-td-score">{item.score} / {item.totalQuestions}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{accuracy}%</span>
                      </td>
                      <td className="prog-td-date">
                        <Calendar size={12} className="inline-icon" />{' '}
                        {new Date(item.completedAt).toLocaleString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .progress-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .prog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .prog-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .prog-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .prog-refresh-btn {
          font-size: 0.8125rem;
          padding: 0.5rem 0.875rem;
        }

        /* Stats grid */
        .prog-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .prog-stat-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
        }

        .prog-stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border-default);
        }

        .prog-stat-icon-wrapper.blue {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.2);
        }

        .prog-stat-icon-wrapper.green {
          background: var(--color-success-bg);
          color: var(--color-success);
          border-color: rgba(34, 197, 94, 0.2);
        }

        .prog-stat-icon-wrapper.purple {
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
          border-color: rgba(139, 92, 246, 0.2);
        }

        .prog-stat-info {
          display: flex;
          flex-direction: column;
        }

        .prog-stat-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }

        .prog-stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-text-primary);
          line-height: 1.2;
          margin: 0.125rem 0;
        }

        .prog-stat-sub {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        /* History */
        .prog-history-section {
          margin-top: 1rem;
        }

        .prog-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 1rem;
        }

        .prog-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
          gap: 0.75rem;
          color: var(--color-text-secondary);
        }

        .prog-empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: var(--color-text-muted);
        }

        .prog-empty-state p {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          line-height: 1.5;
        }

        .prog-error-text {
          color: var(--color-error);
          font-size: 0.875rem;
        }

        /* Table */
        .prog-table-container {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .prog-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8125rem;
        }

        .prog-table th {
          background: var(--color-bg-secondary);
          padding: 1rem 1.25rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-border-default);
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }

        .prog-row {
          border-bottom: 1px solid var(--color-border-default);
          transition: background 0.2s ease;
        }

        .prog-row:last-child {
          border-bottom: none;
        }

        .prog-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .prog-table td {
          padding: 1rem 1.25rem;
          color: var(--color-text-primary);
        }

        .prog-td-title {
          font-weight: 600;
        }

        .prog-title-flex {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .prog-type-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prog-type-icon.vocab {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-accent-primary);
        }

        .prog-type-icon.listening {
          background: rgba(129, 140, 248, 0.1);
          color: var(--color-accent-secondary);
        }

        .prog-td-label {
          color: var(--color-text-secondary);
        }

        .prog-td-score {
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .prog-td-date {
          color: var(--color-text-muted);
          white-space: nowrap;
        }

        .inline-icon {
          display: inline;
          vertical-align: middle;
          margin-right: 0.25rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
