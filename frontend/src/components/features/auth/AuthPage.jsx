import { useState, useEffect } from 'react';
import { GraduationCap, LogIn, UserPlus, Loader, ShieldCheck, HelpCircle } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { toast } from 'sonner';

export default function AuthPage() {
  const { login, register, error, isLoading, clearError } = useAuthStore();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear errors when changing tab
  useEffect(() => {
    clearError();
  }, [authMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success = false;
    if (authMode === 'login') {
      success = await login(email || username, password);
      if (success) {
        toast.success('Chào mừng bạn quay trở lại!');
      } else {
        const errMsg = useAuthStore.getState().error;
        toast.error(errMsg || 'Đăng nhập thất bại');
      }
    } else {
      if (!username.trim() || !email.trim() || !password.trim()) {
        toast.error('Vui lòng điền đầy đủ tất cả các trường!');
        return;
      }
      success = await register(username, email, password);
      if (success) {
        toast.success('Đăng ký tài khoản thành công!');
      } else {
        const errMsg = useAuthStore.getState().error;
        toast.error(errMsg || 'Đăng ký thất bại');
      }
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left side: Brand panel (Desktop only) */}
      <div className="auth-brand-panel">
        <div className="brand-panel-glow" />
        <div className="brand-header">
          <div className="brand-logo">
            <GraduationCap size={28} />
          </div>
          <span className="brand-name">EnglishAI</span>
        </div>
        
        <div className="brand-quote-container">
          <p className="brand-quote">
            "Language is the road map of a culture. It tells you where its people come from and where they are going."
          </p>
          <span className="brand-quote-author">— Rita Mae Brown</span>
        </div>

        <div className="brand-features">
          <div className="brand-feat-item">
            <ShieldCheck size={16} className="feat-icon" />
            <span>Học từ vựng thông minh qua phương pháp lặp lại chủ động</span>
          </div>
          <div className="brand-feat-item">
            <ShieldCheck size={16} className="feat-icon" />
            <span>Luyện nghe câu và cải thiện phát âm với trợ lý AI</span>
          </div>
        </div>

        <div className="brand-footer">
          <span>© 2026 EnglishAI Smart Learning Platform</span>
        </div>
      </div>

      {/* Right side: Interactive Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card animate-scale-in">
          <div className="auth-card-header">
            <h2>Chào mừng bạn đến với EnglishAI</h2>
            <p>Trải nghiệm phương pháp học tiếng Anh hiện đại tích hợp trí tuệ nhân tạo</p>
          </div>

          {/* Shadcn-like Tab triggers */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab-trigger ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
              type="button"
            >
              <LogIn size={15} />
              <span>Đăng nhập</span>
            </button>
            <button 
              className={`auth-tab-trigger ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
              type="button"
            >
              <UserPlus size={15} />
              <span>Đăng ký</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form-element">
            {authMode === 'register' && (
              <div className="form-field-group">
                <label htmlFor="reg-username">Tên người dùng:</label>
                <input
                  id="reg-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên tài khoản của bạn..."
                  className="form-input"
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-field-group">
              <label htmlFor="reg-email">
                {authMode === 'login' ? 'Email hoặc Tên đăng nhập:' : 'Địa chỉ Email:'}
              </label>
              <input
                id="reg-email"
                type={authMode === 'register' ? 'email' : 'text'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={authMode === 'login' ? "Email hoặc tên tài khoản..." : "example@gmail.com"}
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-field-group">
              <div className="label-row">
                <label htmlFor="reg-password">Mật khẩu:</label>
                {authMode === 'login' && (
                  <button type="button" className="forgot-password-link" onClick={() => toast.info('Vui lòng liên hệ quản trị viên để khôi phục mật khẩu!')}>
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="auth-error-banner">{error}</div>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary auth-submit-btn"
            >
              {isLoading ? (
                <><Loader className="spinning" size={16} /> Đang xử lý...</>
              ) : authMode === 'login' ? (
                'Đăng nhập tài khoản'
              ) : (
                'Tạo tài khoản mới'
              )}
            </button>
          </form>
          
          <div className="auth-card-footer">
            <HelpCircle size={13} />
            <span>Gặp sự cố? Hãy liên hệ với chúng tôi để được trợ giúp.</span>
          </div>
        </div>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
  .auth-page-container {
    display: grid;
    grid-template-columns: 450px 1fr;
    height: 100vh;
    width: 100vw;
    background-color: var(--color-bg-primary);
    overflow: hidden;
  }

  @media (max-width: 900px) {
    .auth-page-container {
      grid-template-columns: 1fr;
    }
    .auth-brand-panel {
      display: none !important;
    }
  }

  /* Left Panel styling */
  .auth-brand-panel {
    position: relative;
    background: linear-gradient(145deg, #0e0e1a, #16162a);
    border-right: 1px solid var(--color-border-default);
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .brand-panel-glow {
    position: absolute;
    top: -20%;
    left: -20%;
    width: 80%;
    height: 80%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .brand-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 10;
  }

  .brand-logo {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: var(--gradient-accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  }

  .brand-name {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
    letter-spacing: 0.5px;
  }

  .brand-quote-container {
    margin: 4rem 0;
    z-index: 10;
  }

  .brand-quote {
    font-size: 1.15rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-style: italic;
    margin-bottom: 0.75rem;
    position: relative;
  }

  .brand-quote::before {
    content: '"';
    font-size: 3rem;
    color: var(--color-accent-primary);
    position: absolute;
    top: -2rem;
    left: -1rem;
    opacity: 0.15;
  }

  .brand-quote-author {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    font-weight: 600;
    display: block;
  }

  .brand-features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 10;
  }

  .brand-feat-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .feat-icon {
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .brand-footer {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    z-index: 10;
  }

  /* Right Panel styling */
  .auth-form-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.03) 0%, transparent 60%);
  }

  .auth-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 420px;
    padding: 2.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }

  .auth-card-header {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  .auth-card-header h2 {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 0.375rem;
  }

  .auth-card-header p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  /* Tabs selection styling */
  .auth-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.375rem;
    background: var(--color-bg-tertiary);
    padding: 0.25rem;
    border-radius: var(--radius-md);
    margin-bottom: 1.5rem;
    border: 1px solid var(--color-border-default);
  }

  .auth-tab-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .auth-tab-trigger:hover {
    color: var(--color-text-primary);
  }

  .auth-tab-trigger.active {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  /* Form Elements styling */
  .auth-form-element {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-field-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-field-group label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .forgot-password-link {
    background: transparent;
    border: none;
    font-size: 0.7rem;
    color: var(--color-accent-secondary);
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
  }

  .forgot-password-link:hover {
    text-decoration: underline;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-family: inherit;
    outline: none;
    transition: all 0.2s ease;
  }

  .form-input:focus {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-card);
    box-shadow: 0 0 0 2px var(--color-accent-glow);
  }

  .form-input::placeholder {
    color: var(--color-text-muted);
    opacity: 0.6;
  }

  .auth-error-banner {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: var(--radius-md);
    color: var(--color-error);
    padding: 0.75rem;
    font-size: 0.75rem;
    text-align: center;
    font-weight: 600;
  }

  .auth-submit-btn {
    width: 100%;
    justify-content: center;
    padding: 0.8125rem;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    box-shadow: var(--shadow-button);
  }

  .spinning {
    animation: auth-spin 1s linear infinite;
  }

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }

  .auth-card-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-top: 1.5rem;
    text-align: center;
  }
`;
