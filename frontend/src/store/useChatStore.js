import { create } from 'zustand';
import api from '../services/api';

const useChatStore = create((set, get) => ({
  // State
  messages: [
    {
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi là trợ lý AI Tutor giúp bạn học tiếng Anh. Bạn có thể hỏi tôi bất kỳ câu hỏi nào về từ vựng, giải thích ngữ pháp hoặc nhờ tôi sửa lỗi chính tả, đặt câu!',
    },
  ],
  isLoading: false,
  error: null,

  // Actions
  sendMessage: async (content) => {
    if (!content.trim()) return;

    const userMessage = { role: 'user', content: content.trim() };
    
    // Add user message to state immediately and set loading
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Get all messages currently in state to provide context to the AI (includes history)
      const currentMessages = get().messages;
      
      const { data } = await api.post('/ai/chat', {
        messages: currentMessages,
      });

      // Append assistant's response to messages list
      set((state) => ({
        messages: [...state.messages, data.message],
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error in chat request:', err);
      
      // Append an error message from assistant to chat history so user is notified
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: '❌ Rất tiếc, đã có lỗi xảy ra khi gửi tin nhắn của bạn. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
          },
        ],
        isLoading: false,
        error: err.response?.data?.message || 'Lỗi kết nối AI tutor',
      }));
    }
  },

  clearChat: () => {
    set({
      messages: [
        {
          role: 'assistant',
          content: 'Xin chào! 👋 Lịch sử trò chuyện đã được xóa sạch. Tôi đã sẵn sàng giúp bạn học tiếng Anh!',
        },
      ],
      error: null,
    });
  },
}));

export default useChatStore;
