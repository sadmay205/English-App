import './Sidebar.css';
import { BookOpen, Brain, Headphones, TrendingUp, GraduationCap, LogIn, LogOut, User, X, Layers, Gamepad2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { useState } from 'react';
import { toast } from 'sonner';

const navItems = [
  { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen, description: 'Quản lý bộ từ' },
  { id: 'study', label: 'Học thông minh', icon: GraduationCap, description: 'Lặp lại chủ động' },
  { id: 'flashcard', label: 'Flashcard', icon: Layers, description: 'Định nghĩa & Từ vựng' },
  { id: 'quiz', label: 'Kiểm tra', icon: Brain, description: 'Trắc nghiệm & Điền từ' },
  { id: 'listening', label: 'Luyện nghe', icon: Headphones, description: 'Nghe & hoàn thành câu' },
  { id: 'games', label: 'Giải trí', icon: Gamepad2, description: 'Học qua trò chơi' },
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


    </aside>
  );
}
