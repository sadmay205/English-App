import { BookOpen, Brain, Headphones, TrendingUp, GraduationCap, LogIn, LogOut, User, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { useState } from 'react';
import { toast } from 'sonner';

const navItems = [
  { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen, description: 'Quản lý bộ từ' },
  { id: 'study', label: 'Học thông minh', icon: GraduationCap, description: 'Lặp lại chủ động' },
  { id: 'quiz', label: 'Kiểm tra', icon: Brain, description: 'Trắc nghiệm & Điền từ' },
  { id: 'listening', label: 'Luyện nghe', icon: Headphones, description: 'Nghe & hoàn thành câu' },
  { id: 'progress', label: 'Tiến độ', icon: TrendingUp, description: 'Lịch sử học tập' },
];


export default function Sidebar() {
  const { activeView, setActiveView } = useAppStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất tài khoản!');
  };


  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap size={24} />
        </div>
        <div className="sidebar-logo-text">
          <h1>EnglishAI</h1>
          <span>Smart Learning</span>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className={`sidebar-nav-icon ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
              </div>
              <div className="sidebar-nav-content">
                <span className="sidebar-nav-label">{item.label}</span>
                <span className="sidebar-nav-desc">{item.description}</span>
              </div>
              {isActive && <div className="sidebar-nav-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <p className="sidebar-footer-title">💡 Mẹo hôm nay</p>
          <p className="sidebar-footer-text">
            Hãy học ít nhất 10 từ mới mỗi ngày để đạt hiệu quả tốt nhất!
          </p>
        </div>

        {/* User Auth Profile Area */}
        {user && (
          <div className="sidebar-profile-card animate-fade-in">
            <div className="sidebar-profile-avatar">
              <User size={16} />
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">{user.username}</span>
              <span className="sidebar-profile-email">{user.email}</span>
            </div>
            <button onClick={handleLogout} className="sidebar-logout-btn" title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`

        .sidebar {
          height: 100vh;
          background: linear-gradient(180deg, var(--color-bg-primary), var(--color-bg-secondary));
          border-right: 1px solid var(--color-border-default);
          display: flex;
          flex-direction: column;
          padding: 1.25rem 0.875rem;
          overflow-y: auto;
          animation: slideInLeft 0.4s ease-out;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 0.375rem;
          margin-bottom: 1.5rem;
        }

        .sidebar-logo-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: var(--gradient-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-button);
        }

        .sidebar-logo-text h1 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.2;
        }

        .sidebar-logo-text span {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--color-border-default);
          margin: 0 0.375rem 1rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex: 1;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          text-align: left;
          width: 100%;
          font-family: inherit;
        }

        .sidebar-nav-item:hover {
          background: var(--color-bg-hover);
          border-color: var(--color-border-default);
        }

        .sidebar-nav-item.active {
          background: var(--color-accent-glow);
          border-color: var(--color-border-accent);
        }

        .sidebar-nav-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .sidebar-nav-icon.active {
          background: var(--gradient-accent);
          color: white;
          box-shadow: var(--shadow-button);
        }

        .sidebar-nav-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sidebar-nav-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.3;
        }

        .sidebar-nav-desc {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          line-height: 1.3;
        }

        .sidebar-nav-indicator {
          position: absolute;
          right: -0.875rem;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          border-radius: 3px 0 0 3px;
          background: var(--gradient-accent);
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 1rem;
        }

        .sidebar-footer-card {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.875rem;
        }

        .sidebar-footer-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 0.375rem;
        }

        .sidebar-footer-text {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        /* User Profile & Auth Modal Styling */
        .sidebar-profile-card {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .sidebar-profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-accent-glow);
          color: var(--color-accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-profile-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .sidebar-profile-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sidebar-profile-email {
          font-size: 0.65rem;
          color: var(--color-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sidebar-logout-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .sidebar-logout-btn:hover {
          color: var(--color-error);
          background: var(--color-error-bg);
        }
        .sidebar-login-trigger-btn {
          width: 100%;
          margin-top: 0.5rem;
          justify-content: center;
          padding: 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
        }

        /* Modal Overlay */
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 20, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        .auth-modal-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-accent);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 380px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          position: relative;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .auth-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-modal-close:hover {
          color: var(--color-text-primary);
        }
        .auth-modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
          text-align: center;
        }
        .auth-modal-subtitle {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-bottom: 1.5rem;
          text-align: center;
          line-height: 1.4;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .auth-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .auth-form-group label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }
        .auth-error {
          color: var(--color-error);
          font-size: 0.75rem;
          text-align: center;
        }
        .auth-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 0.75rem;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        .auth-switch-prompt {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-align: center;
          margin-top: 1.25rem;
        }
        .auth-switch-link {
          color: var(--color-accent-secondary);
          background: transparent;
          border: none;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .auth-switch-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </aside>
  );
}
