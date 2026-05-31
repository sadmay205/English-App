import Sidebar from './Sidebar';
import ChatbotPanel from './ChatbotPanel';
import useAppStore from '../../store/useAppStore';
import VocabSetCreator from '../features/vocab/VocabSetCreator';
import QuizContainer from '../features/quiz/QuizContainer';
import ListeningContainer from '../features/listening/ListeningContainer';
import ProgressDashboard from '../features/progress/ProgressView';
import SmartStudy from '../features/vocab/SmartStudy';
import FlashcardStudy from '../features/vocab/FlashcardStudy';
import { Brain, Headphones, TrendingUp, Palette, Upload, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Vocabulary view uses real component
function VocabularyView() {
  return <VocabSetCreator />;
}

function StudyView() {
  return <SmartStudy />;
}

function FlashcardView() {
  return <FlashcardStudy />;
}

function QuizView() {
  return <QuizContainer />;
}

function ListeningView() {
  return <ListeningContainer />;
}

function ProgressView() {
  return <ProgressDashboard />;
}

const viewMap = {
  vocabulary: VocabularyView,
  study: StudyView,
  flashcard: FlashcardView,
  quiz: QuizView,
  listening: ListeningView,
  progress: ProgressView,
};


function BackgroundSelector({ currentBg, onSelectBg }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets = [
    { id: 'default', name: 'Mặc định', value: 'none', preview: 'linear-gradient(135deg, #0f0f1a, #161625)' },
    { id: 'study', name: 'Góc học tập', value: 'url(/study_bg.png)', preview: 'url(/study_bg.png)' },
    { id: 'cosmic', name: 'Vũ trụ huyền bí', value: 'url(/cosmic_bg.png)', preview: 'url(/cosmic_bg.png)' }
  ];

  const handleSelectPreset = (preset) => {
    onSelectBg({ type: 'preset', id: preset.id, value: preset.value });
    toast.success(`Đã đổi sang hình nền "${preset.name}"`);
    setIsOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng tải lên file ảnh (.jpg, .png, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG to keep size small for localStorage
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        onSelectBg({ type: 'custom', id: 'custom', value: `url(${compressedBase64})` });
        toast.success('Đã tải lên hình nền từ thiết bị của bạn!');
        setIsOpen(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-selector-container" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-selector-trigger-btn"
        title="Chọn hình nền"
      >
        <Palette size={16} />
        <span>Giao diện</span>
      </button>

      {isOpen && (
        <div className="bg-selector-dropdown animate-scale-in">
          <h4 className="bg-dropdown-title">Hình nền học tập</h4>
          
          <div className="bg-options-grid">
            {presets.map((preset) => {
              const isSelected = currentBg.id === preset.id;
              const bgStyle = preset.preview.includes('url') 
                ? { backgroundImage: preset.preview } 
                : { background: preset.preview };
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`bg-option-item ${isSelected ? 'selected' : ''}`}
                  style={bgStyle}
                >
                  <span className="bg-option-name">{preset.name}</span>
                  {isSelected && <span className="bg-option-check"><Check size={10} /></span>}
                </button>
              );
            })}
          </div>

          <div className="bg-dropdown-divider" />

          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-upload-btn"
          >
            <Upload size={14} />
            <span>Tải lên từ laptop</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
      )}
    </div>
  );
}

export default function MainLayout() {
  const activeView = useAppStore((s) => s.activeView);
  const ActiveComponent = viewMap[activeView] || VocabularyView;

  const [bg, setBg] = useState(() => {
    try {
      const saved = localStorage.getItem('app-bg-choice');
      return saved ? JSON.parse(saved) : { type: 'preset', id: 'default', value: 'none' };
    } catch {
      return { type: 'preset', id: 'default', value: 'none' };
    }
  });

  const handleSelectBg = (newBg) => {
    setBg(newBg);
    try {
      localStorage.setItem('app-bg-choice', JSON.stringify(newBg));
    } catch (e) {
      console.error('Failed to save background to localStorage:', e);
      toast.error('Không thể lưu hình nền tùy chỉnh do dung lượng ảnh quá lớn.');
    }
  };

  return (
    <div className="main-layout" style={{ backgroundImage: bg.value }}>
      <Sidebar />
      <main className="main-canvas">
        <div className="bg-selector-floating">
          <BackgroundSelector currentBg={bg} onSelectBg={handleSelectBg} />
        </div>
        <ActiveComponent />
      </main>
      <ChatbotPanel />

      <style>{`
        .main-layout {
          display: grid;
          grid-template-columns: 220px 1fr 300px;
          height: 100vh;
          overflow: hidden;
          background-color: var(--color-bg-primary);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: background-image 0.4s ease-in-out;
        }

        .main-canvas {
          height: 100vh;
          overflow-y: auto;
          background: transparent;
          padding: 1rem 1.25rem;
          position: relative;
        }

        /* Glassmorphism sidebar & chatbot panel styles when a background image is set */
        .main-layout[style*="url"] .sidebar {
          background: rgba(15, 15, 26, 0.75) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }

        .main-layout[style*="url"] .chatbot-panel {
          background: rgba(15, 15, 26, 0.75) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }

        /* Background Selector Floating */
        .bg-selector-floating {
          position: absolute;
          top: 1rem;
          right: 1.25rem;
          z-index: 200;
        }

        .bg-selector-container {
          position: relative;
        }

        .bg-selector-trigger-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(30, 30, 50, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--color-border-default);
          color: var(--color-text-secondary);
          padding: 0.5rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .bg-selector-trigger-btn:hover {
          color: var(--color-text-primary);
          border-color: var(--color-accent-primary);
          background: rgba(16, 185, 129, 0.15);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
        }

        .bg-selector-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: rgba(22, 22, 37, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--color-border-accent);
          border-radius: var(--radius-lg);
          padding: 1rem;
          width: 360px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          z-index: 210;
        }

        .bg-dropdown-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .bg-options-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
        }

        .bg-option-item {
          aspect-ratio: 16/10;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-default);
          cursor: pointer;
          position: relative;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          padding: 0.25rem;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .bg-option-item:hover {
          border-color: var(--color-accent-primary);
          transform: scale(1.02);
        }

        .bg-option-item.selected {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .bg-option-name {
          font-size: 0.65rem;
          font-weight: 600;
          color: white;
          background: rgba(0, 0, 0, 0.6);
          padding: 2px 4px;
          border-radius: 2px;
          width: 100%;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bg-option-check {
          position: absolute;
          top: 0.25rem;
          right: 0.25rem;
          background: var(--color-accent-primary);
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .bg-dropdown-divider {
          height: 1px;
          background: var(--color-border-default);
        }

        .bg-upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--color-bg-tertiary);
          border: 1px dashed var(--color-border-default);
          color: var(--color-text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .bg-upload-btn:hover {
          border-color: var(--color-accent-primary);
          color: var(--color-text-primary);
          background: rgba(16, 185, 129, 0.1);
        }

        .placeholder-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1rem;
          color: var(--color-text-muted);
        }

        .placeholder-icon {
          width: 96px;
          height: 96px;
          border-radius: var(--radius-xl);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent-primary);
        }

        .placeholder-view h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .placeholder-view p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
