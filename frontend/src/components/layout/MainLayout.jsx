import './MainLayout.css';
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


    </div>
  );
}
